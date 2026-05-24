import { useEffect, useRef, useState } from "react";
import { pointer } from "d3";
import DOMPurify from "dompurify";
import type { RectData } from "../../VerticalStackBarChart";
import { setupCanvas } from "../canvas/setupCanvas";
import { resolveMarkColors, makeSimpleProbe } from "../canvas/resolveMarkColors";

// Opt-in Canvas 2D renderer for VerticalStackBarChart (Phase 4 of the
// performance overhaul). Draws the stacked rounded-corner bars and the series
// abbreviation labels onto a single <canvas> instead of one retained <rect>
// per (date × series × key) — the DOM node count is what makes the SVG chart
// jank on large datasets. Axes, title, the HTML tooltip and loading/no-data
// overlays stay in the SVG/HTML layered above the canvas.

interface DataPoint {
  date: string | null;
  [key: string]: string | null | undefined;
}

const RECT_RADIUS = 2;
const RECT_STROKE = "#fff";
const OPACITY_NOT_HIGHLIGHTED = 0.2;
const LABEL_FONT_SIZE_PX = 12;
const LABEL_FILL = "#000";

interface DrawParams {
  width: number;
  height: number;
  margin: { top: number; right: number; bottom: number; left: number };
  // The chart's existing prepareStackedData() output, keyed by stacking key.
  stackedRectData: { [key: string]: RectData[] };
  keys: string[];
  highlightItems: string[];
  hoveredKey: string | null;
  colorCallbackFn?: (key: string, d: RectData) => string;
  // Per-key fill colour resolved from the DOM (honours consumer CSS such as
  // skipColorMappingDispatch's injected `.bar[data-label-safe] { fill }`).
  resolvedColors: Map<string, string>;
  // Font family used for the series-key abbreviation labels under each group.
  // Sourced from MichiVzProvider context so a host app's theme font is used
  // instead of the generic "sans-serif" fallback.
  fontFamily: string;
}

// Pure draw routine — clears the canvas and repaints every stacked rect plus
// the series abbreviation labels. Kept at module scope (no React closure) so
// both the redraw effect and the hover handler can call it.
const drawChart = (canvas: HTMLCanvasElement | null, p: DrawParams): void => {
  // setupCanvas handles devicePixelRatio scaling and clears the frame; it
  // returns null in jsdom (no 2D context), so we must early-return on null.
  const setup = setupCanvas(canvas, p.width, p.height);
  if (!setup) return;
  const { ctx } = setup;

  const highlightSet = new Set(p.highlightItems);
  if (p.hoveredKey) highlightSet.add(p.hoveredKey);
  const anyHighlight = highlightSet.size > 0;

  // Track which (seriesKey + label-x) abbreviation labels have been drawn so
  // each group's label is painted once, not once per stacked segment.
  const drawnLabels = new Set<string>();

  for (const key of p.keys) {
    const rects = p.stackedRectData[key];
    if (!rects || rects.length === 0) continue;

    for (const d of rects) {
      // SVG renderer: opacity 1 unless highlightItems is non-empty and this
      // key is not in it. Hover adds the hovered key to the highlight set.
      ctx.globalAlpha = anyHighlight && !highlightSet.has(key) ? OPACITY_NOT_HIGHLIGHTED : 1;

      // colorCallbackFn (consumer-supplied) takes precedence, then the
      // DOM-resolved colour (consumer CSS), then the raw data colour fallback.
      const fill =
        p.colorCallbackFn?.(key, d) ?? p.resolvedColors.get(key) ?? d.fill ?? "transparent";
      ctx.fillStyle = fill;
      ctx.strokeStyle = RECT_STROKE;
      ctx.lineWidth = 1;

      ctx.beginPath();
      // roundRect mirrors the SVG <rect rx={2}>. Guard for older engines.
      if (typeof ctx.roundRect === "function") {
        ctx.roundRect(d.x, d.y, d.width, d.height, RECT_RADIUS);
      } else {
        ctx.rect(d.x, d.y, d.width, d.height);
      }
      ctx.fill();
      ctx.stroke();

      // Series abbreviation label below each group — drawn once per group.
      if (d.seriesKeyAbbreviation) {
        const labelX = d.x + d.width / 2;
        const labelKey = `${d.seriesKey}@${Math.round(labelX)}`;
        if (!drawnLabels.has(labelKey)) {
          drawnLabels.add(labelKey);
          ctx.save();
          ctx.globalAlpha = 1;
          ctx.fillStyle = LABEL_FILL;
          ctx.font = `${LABEL_FONT_SIZE_PX}px ${p.fontFamily}`;
          ctx.textAlign = "center";
          ctx.textBaseline = "alphabetic";
          ctx.fillText(d.seriesKeyAbbreviation, labelX, p.height - p.margin.bottom + 15);
          ctx.restore();
        }
      }
    }
  }
  ctx.globalAlpha = 1;
};

export interface VerticalStackBarCanvasOptions {
  enabled: boolean;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  svgRef: React.RefObject<SVGSVGElement>;
  tooltipRef: React.RefObject<HTMLDivElement>;
  tooltipContentRef: React.RefObject<HTMLDivElement>;
  width: number;
  height: number;
  margin: { top: number; right: number; bottom: number; left: number };
  stackedRectData: { [key: string]: RectData[] };
  keys: string[];
  highlightItems: string[];
  colorCallbackFn?: (key: string, d: RectData) => string;
  // Font family for canvas-rendered text; flows through from MichiVzProvider.
  fontFamily: string;
  // Produces the tooltip HTML string (showCombined logic lives inside it).
  generateTooltipContent: (
    key: string,
    seriesKey: string,
    data: DataPoint,
    series: DataPoint[],
    isMissing?: boolean
  ) => string;
  onHighlightItem?: (labels: string[]) => void;
}

const useVerticalStackBarChartCanvasRendering = (
  opts: VerticalStackBarCanvasOptions
): { isSticky: boolean } => {
  const {
    enabled,
    canvasRef,
    svgRef,
    width,
    height,
    margin,
    stackedRectData,
    keys,
    highlightItems,
    colorCallbackFn,
    fontFamily,
  } = opts;

  // Latest options for the once-bound hover listener (avoids stale closures).
  const optsRef = useRef(opts);
  optsRef.current = opts;

  // Currently hovered stacking key — drives the dim/highlight on redraw.
  const hoveredRef = useRef<string | null>(null);

  // Sticky tooltip: a click on a bar pins the tooltip; a click off it unpins.
  const [isSticky, setIsSticky] = useState(false);
  const isStickyRef = useRef(false);
  isStickyRef.current = isSticky;

  // Per-key fill colours resolved from the DOM (honouring consumer CSS), reused
  // by the hover redraw so it doesn't re-probe the DOM on every hover.
  const resolvedColorsRef = useRef<Map<string, string>>(new Map());

  // Redraw on EVERY render (intentionally not a dep-gated effect). A <canvas>
  // — unlike SVG nodes — does not auto-repaint when props change, so we
  // redraw each render to stay in sync with stacking, colors and highlights.
  // Consumer CSS colouring (skipColorMappingDispatch) also arrives a render or
  // two after mount, so re-resolving each render keeps the canvas in sync.
  useEffect(() => {
    if (!enabled) return;
    // The data colour each rect carries today — used as the probe's fallback
    // and the final fallback when no consumer CSS rule matches.
    const fallbackFor = (key: string): string => {
      const rects = stackedRectData[key];
      const withFill = rects?.find(r => r.fill);
      return withFill?.fill ?? "transparent";
    };
    const resolvedColors = resolveMarkColors(
      svgRef.current,
      keys,
      fallbackFor,
      // Probe replicates the real bar mark: <rect class="bar" data-label
      // data-label-safe> with the data colour pre-set on `fill`.
      makeSimpleProbe("rect", "bar", "fill"),
      "fill"
    );
    resolvedColorsRef.current = resolvedColors;
    drawChart(canvasRef.current, {
      width,
      height,
      margin,
      stackedRectData,
      keys,
      highlightItems,
      hoveredKey: hoveredRef.current,
      colorCallbackFn,
      resolvedColors,
      fontFamily,
    });
  });

  // Hover + click-to-pin: point-in-rect hit-test against the stacked rects,
  // drive the HTML tooltip + highlight. Bound once on the SVG (which sits
  // above the canvas and receives the events).
  useEffect(() => {
    if (!enabled) return undefined;
    const svg = svgRef.current;
    if (!svg) return undefined;

    const redraw = () => {
      const o = optsRef.current;
      drawChart(o.canvasRef.current, {
        width: o.width,
        height: o.height,
        margin: o.margin,
        stackedRectData: o.stackedRectData,
        keys: o.keys,
        highlightItems: o.highlightItems,
        hoveredKey: hoveredRef.current,
        colorCallbackFn: o.colorCallbackFn,
        resolvedColors: resolvedColorsRef.current,
        fontFamily: o.fontFamily,
      });
    };

    const hideTooltip = () => {
      const tip = optsRef.current.tooltipRef.current;
      if (tip) tip.style.visibility = "hidden";
    };

    const setHovered = (key: string | null) => {
      if (hoveredRef.current === key) return;
      hoveredRef.current = key;
      redraw();
    };

    // The topmost stacked rect whose box contains the cursor, with its key.
    const hitTest = (mx: number, my: number): { key: string; rect: RectData } | null => {
      const o = optsRef.current;
      // Iterate keys last-to-first so a visually-on-top segment wins ties.
      for (let ki = o.keys.length - 1; ki >= 0; ki--) {
        const key = o.keys[ki];
        const rects = o.stackedRectData[key];
        if (!rects) continue;
        for (const rect of rects) {
          if (
            mx >= rect.x &&
            mx <= rect.x + rect.width &&
            my >= rect.y &&
            my <= rect.y + rect.height
          ) {
            return { key, rect };
          }
        }
      }
      return null;
    };

    // Fill the HTML tooltip content for a hit (preserves showCombined logic,
    // which lives inside generateTooltipContent).
    const fillTooltip = (key: string, rect: RectData) => {
      const o = optsRef.current;
      const tip = o.tooltipRef.current;
      const contentEl = o.tooltipContentRef.current;
      if (!tip || !contentEl) return;
      tip.style.visibility = "visible";
      const series = (o.stackedRectData[key] || [])
        .filter(item => item.seriesKey === rect.seriesKey)
        .map(item => ({
          label: item.key,
          value: item.value ?? null,
          date: item.date,
          code: item.code,
        })) as unknown as DataPoint[];
      // Sanitize the consumer's tooltipFormatter HTML before injecting it
      // (the SVG renderer does the same — see VerticalStackBarChart).
      const safeHtml = DOMPurify.sanitize(
        o.generateTooltipContent(
          rect.key,
          rect.seriesKey,
          rect.data as DataPoint,
          series,
          rect.isMissing
        )
      );
      contentEl.innerHTML = safeHtml;
    };

    // Position the HTML tooltip centred above the cursor — mirrors the SVG
    // renderer's updateTooltipPosition.
    const positionTooltip = (mx: number, my: number) => {
      const tip = optsRef.current.tooltipRef.current;
      if (!tip) return;
      const tipRect = tip.getBoundingClientRect();
      tip.style.left = `${mx - tipRect.width / 2}px`;
      tip.style.top = `${my - tipRect.height - 10}px`;
    };

    const handleMove = (event: MouseEvent) => {
      // A pinned tooltip is not moved or dismissed by the pointer.
      if (isStickyRef.current) return;
      const [mx, my] = pointer(event, svg);
      const hit = hitTest(mx, my);
      if (hit) {
        setHovered(hit.key);
        optsRef.current.onHighlightItem?.([hit.key]);
        fillTooltip(hit.key, hit.rect);
        positionTooltip(mx, my);
      } else if (hoveredRef.current) {
        setHovered(null);
        optsRef.current.onHighlightItem?.([]);
        hideTooltip();
      }
    };

    const handleLeave = () => {
      // A pinned tooltip survives the cursor leaving the chart.
      if (isStickyRef.current) return;
      setHovered(null);
      optsRef.current.onHighlightItem?.([]);
      hideTooltip();
    };

    // Click on a bar pins the tooltip there; click on empty area unpins.
    const handleClick = (event: MouseEvent) => {
      const [mx, my] = pointer(event, svg);
      const hit = hitTest(mx, my);
      if (hit) {
        isStickyRef.current = true;
        setIsSticky(true);
        setHovered(hit.key);
        optsRef.current.onHighlightItem?.([hit.key]);
        fillTooltip(hit.key, hit.rect);
        positionTooltip(mx, my);
      } else {
        isStickyRef.current = false;
        setIsSticky(false);
        setHovered(null);
        optsRef.current.onHighlightItem?.([]);
        hideTooltip();
      }
    };

    // A click anywhere outside the chart and the tooltip unpins it (the SVG
    // renderer uses a 100ms-deferred unpin; the canvas hover binding has no
    // such race, so it unpins immediately).
    const handleDocClick = (event: MouseEvent) => {
      if (!isStickyRef.current) return;
      const target = event.target as Node | null;
      const tip = optsRef.current.tooltipRef.current;
      if (target && (svg.contains(target) || (tip && tip.contains(target)))) return;
      isStickyRef.current = false;
      setIsSticky(false);
      setHovered(null);
      hideTooltip();
    };

    svg.addEventListener("mousemove", handleMove);
    svg.addEventListener("mouseleave", handleLeave);
    svg.addEventListener("click", handleClick);
    document.addEventListener("click", handleDocClick);
    return () => {
      svg.removeEventListener("mousemove", handleMove);
      svg.removeEventListener("mouseleave", handleLeave);
      svg.removeEventListener("click", handleClick);
      document.removeEventListener("click", handleDocClick);
    };
  }, [enabled, svgRef]);

  return { isSticky };
};

export default useVerticalStackBarChartCanvasRendering;

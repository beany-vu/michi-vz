import { useEffect, useRef, useState } from "react";
import { pointer } from "d3";
import type { ScaleBand, ScaleLinear } from "d3";
import DOMPurify from "dompurify";
import { resolveMarkColors, makeSimpleProbe } from "../canvas/resolveMarkColors";
import { computeCircleDodgeOffsets } from "./computeCircleDodge";

// Opt-in Canvas 2D renderer for BarBellChart (Phase 4 of the performance
// overhaul). Draws the cumulative key bars and their end-cap "bell" circles
// onto a single <canvas> instead of one retained SVG node per segment plus a
// <foreignObject> per cap. Axes, title, the HTML tooltip and the loading /
// no-data overlays stay in the SVG/HTML layer above the canvas.

// A single row of the chart — keyed by `date`, one numeric field per key.
type DataRow = { [key: string]: number | string | undefined };

const BAR_HEIGHT = 4;
const CIRCLE_RADIUS = 6;
// Opacity values mirror the SVG renderer's inline opacity logic.
const OPACITY_FULL = 0.9;
const OPACITY_DIMMED = 0.3;
const OPACITY_DISABLED = 0.1;

// A drawn segment, kept after the paint pass so the hover handler can hit-test
// without re-deriving the cumulative layout.
interface SegmentHit {
  row: DataRow;
  key: string;
  value: number;
  // Bar rect (CSS px).
  barX: number;
  barY: number;
  barW: number;
  // End-cap circle centre (CSS px).
  cx: number;
  cy: number;
}

interface DrawParams {
  width: number;
  height: number;
  dataSet: DataRow[];
  keys: string[];
  xScale: ScaleLinear<number, number>;
  yScale: ScaleBand<string>;
  margin: { top: number; right: number; bottom: number; left: number };
  colorsMapping: { [key: string]: string };
  // Per-key fill colour resolved from the DOM (honours consumer CSS); the raw
  // `colorsMapping` value is only the fallback when no probe colour is usable.
  resolvedColors: Map<string, string>;
  disabledItems: string[];
  highlightItems: string[];
  hoveredKey: string | null;
}

// Resolve the opacity for one segment, mirroring the SVG renderer's inline
// logic: a disabled key is always faint; otherwise an active highlight dims
// everything not highlighted.
const segmentOpacity = (
  key: string,
  disabled: boolean,
  highlightSet: Set<string>
): number => {
  if (disabled) return OPACITY_DISABLED;
  if (highlightSet.size === 0) return OPACITY_FULL;
  return highlightSet.has(key) ? OPACITY_FULL : OPACITY_DIMMED;
};

// Pure draw routine — clears the canvas, repaints every row and returns the
// drawn segments for hit-testing. Kept at module scope (no React closure) so
// both the redraw effect and the hover handler can call it.
const drawChart = (
  canvas: HTMLCanvasElement | null,
  p: DrawParams
): SegmentHit[] => {
  if (!canvas) return [];
  const ctx = canvas.getContext("2d");
  // jsdom has no canvas 2D context — getContext returns null there.
  if (!ctx) return [];

  const dpr = window.devicePixelRatio || 1;
  const pxW = Math.round(p.width * dpr);
  const pxH = Math.round(p.height * dpr);
  if (canvas.width !== pxW || canvas.height !== pxH) {
    canvas.width = pxW;
    canvas.height = pxH;
    canvas.style.width = `${p.width}px`;
    canvas.style.height = `${p.height}px`;
  }
  // Draw in CSS pixels; the dpr transform keeps marks crisp on retina screens.
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, p.width, p.height);

  const highlightSet = new Set(p.highlightItems);
  if (p.hoveredKey) highlightSet.add(p.hoveredKey);
  const activeKeys = p.keys.filter(k => !p.disabledItems.includes(k));

  // Build the cumulative layout once, so both draw passes and the hit-test
  // share identical geometry.
  const segments: SegmentHit[] = [];
  for (const row of p.dataSet) {
    let cumulativeX = p.margin.left;
    const rowMid = (p.yScale(`${row.date}`) || 0) + p.yScale.bandwidth() / 2;
    const rowSegs: SegmentHit[] = [];
    for (const key of activeKeys) {
      const value = Number(row[key] ?? 0);
      const barW = p.xScale(value);
      rowSegs.push({
        row,
        key,
        value,
        barX: cumulativeX,
        barY: rowMid - BAR_HEIGHT / 2,
        barW,
        cx: cumulativeX + barW,
        cy: rowMid,
      });
      cumulativeX += barW;
    }
    // Dodge end-cap circles that would overlap (near-equal cx, e.g. zero-value
    // segments) vertically into a column centred on the row line.
    const dodge = computeCircleDodgeOffsets(
      rowSegs.map(s => s.cx),
      CIRCLE_RADIUS
    );
    rowSegs.forEach((s, i) => {
      s.cy = rowMid + dodge[i];
    });
    segments.push(...rowSegs);
  }

  // Pass 1 — cumulative key bars (the SVG renderer skips zero-value bars).
  for (const seg of segments) {
    if (seg.value === 0) continue;
    const color =
      p.resolvedColors.get(seg.key) || p.colorsMapping[seg.key] || "transparent";
    ctx.globalAlpha = segmentOpacity(
      seg.key,
      p.disabledItems.includes(seg.key),
      highlightSet
    );
    ctx.fillStyle = color;
    ctx.fillRect(seg.barX, seg.barY, seg.barW, BAR_HEIGHT);
  }

  // Pass 2 — end-cap "bell" circles, drawn after every bar so they sit on top
  // (the SVG renderer raises `.bar-data-point` post-render for the same Z-order).
  for (const seg of segments) {
    const color =
      p.resolvedColors.get(seg.key) || p.colorsMapping[seg.key] || "transparent";
    ctx.globalAlpha = segmentOpacity(
      seg.key,
      p.disabledItems.includes(seg.key),
      highlightSet
    );
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(seg.cx, seg.cy, CIRCLE_RADIUS, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 1;
  return segments;
};

export interface BarBellCanvasRenderingOptions {
  enabled: boolean;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  svgRef: React.RefObject<SVGSVGElement | null>;
  tooltipRef: React.RefObject<HTMLDivElement | null>;
  tooltipContentRef: React.RefObject<HTMLDivElement | null>;
  dataSet: DataRow[];
  keys: string[];
  width: number;
  height: number;
  margin: { top: number; right: number; bottom: number; left: number };
  xScale: ScaleLinear<number, number>;
  yScale: ScaleBand<string>;
  colorsMapping: { [key: string]: string };
  disabledItems: string[];
  highlightItems: string[];
  tooltipFormatter: (
    row: DataRow,
    key: string,
    value: string | number
  ) => string;
  onHighlightItem?: (labels: string[]) => void;
}

const useBarBellChartCanvasRendering = (
  opts: BarBellCanvasRenderingOptions
): { isSticky: boolean } => {
  const {
    enabled,
    canvasRef,
    svgRef,
    width,
    height,
    dataSet,
    keys,
    margin,
    xScale,
    yScale,
    colorsMapping,
    disabledItems,
    highlightItems,
  } = opts;

  // Latest options for the once-bound hover listener (avoids stale closures).
  const optsRef = useRef(opts);
  optsRef.current = opts;

  // Currently hovered key — drives the dim/highlight on redraw.
  const hoveredRef = useRef<string | null>(null);

  // Segments drawn by the last paint, reused by the hover handler's hit-test.
  const segmentsRef = useRef<SegmentHit[]>([]);

  // Sticky tooltip: a click on a segment pins the tooltip; a click off unpins.
  const [isSticky, setIsSticky] = useState(false);
  const isStickyRef = useRef(false);
  isStickyRef.current = isSticky;

  // Per-key fill colours resolved from the DOM (honouring consumer CSS), reused
  // by the hover redraw so it doesn't re-probe the DOM on every hover.
  const resolvedColorsRef = useRef<Map<string, string>>(new Map());

  // Probe replicating the real bar mark — same SVG tag (`rect`) and `class`
  // (`bar-data`) plus `data-label`/`data-label-safe`, with the data-colour
  // fallback pre-set on `fill` — so consumer CSS selectors targeting the bars
  // match it and getComputedStyle returns the CSS-applied colour.
  const buildProbe = makeSimpleProbe("rect", "bar-data", "fill");

  // Redraw on EVERY render (intentionally not a dep-gated effect). Consumer CSS
  // colouring (skipColorMappingDispatch) arrives a render or two after mount,
  // and a <canvas> — unlike retained SVG nodes — does not auto-repaint when its
  // inputs change. Re-resolving + redrawing each render keeps it in sync;
  // drawChart is cheap and the colour probe is a single batched style recalc.
  useEffect(() => {
    if (!enabled) return;
    const resolvedColors = resolveMarkColors(
      svgRef.current,
      keys,
      key => colorsMapping[key] || "transparent",
      buildProbe,
      "fill"
    );
    resolvedColorsRef.current = resolvedColors;
    segmentsRef.current = drawChart(canvasRef.current, {
      width,
      height,
      dataSet,
      keys,
      xScale,
      yScale,
      margin,
      colorsMapping,
      resolvedColors,
      disabledItems,
      highlightItems,
      hoveredKey: hoveredRef.current,
    });
  });

  // Hover + click-to-pin: hit-test against the drawn segments, drive the HTML
  // tooltip + highlight. Bound once on the SVG (which sits above the canvas and
  // receives the pointer events).
  useEffect(() => {
    if (!enabled) return undefined;
    const svg = svgRef.current;
    if (!svg) return undefined;

    const redraw = () => {
      const o = optsRef.current;
      segmentsRef.current = drawChart(o.canvasRef.current, {
        width: o.width,
        height: o.height,
        dataSet: o.dataSet,
        keys: o.keys,
        xScale: o.xScale,
        yScale: o.yScale,
        margin: o.margin,
        colorsMapping: o.colorsMapping,
        resolvedColors: resolvedColorsRef.current,
        disabledItems: o.disabledItems,
        highlightItems: o.highlightItems,
        hoveredKey: hoveredRef.current,
      });
    };

    const hideTooltip = () => {
      const tip = optsRef.current.tooltipRef.current;
      if (tip) {
        tip.style.opacity = "0";
        tip.style.visibility = "hidden";
      }
    };

    const setHovered = (key: string | null) => {
      if (hoveredRef.current === key) return;
      hoveredRef.current = key;
      redraw();
      optsRef.current.onHighlightItem?.(key ? [key] : []);
    };

    // The segment under the cursor: a bar rect hit, or — checked first, since
    // the cap sits on top — the nearest end-cap circle within its radius.
    const hitTest = (mx: number, my: number): SegmentHit | null => {
      const segments = segmentsRef.current;
      // Circles first (Z-order: they paint on top of the bars).
      let circleHit: SegmentHit | null = null;
      let bestDist = CIRCLE_RADIUS;
      for (const seg of segments) {
        const dist = Math.hypot(seg.cx - mx, seg.cy - my);
        if (dist <= bestDist) {
          bestDist = dist;
          circleHit = seg;
        }
      }
      if (circleHit) return circleHit;
      // Then the bar rects (skip zero-value bars — not painted, not hoverable).
      for (const seg of segments) {
        if (seg.value === 0) continue;
        if (
          mx >= seg.barX &&
          mx <= seg.barX + seg.barW &&
          my >= seg.barY &&
          my <= seg.barY + BAR_HEIGHT
        ) {
          return seg;
        }
      }
      return null;
    };

    // Position + fill the HTML tooltip for a hit at pixel (mx, my).
    const showTooltip = (mx: number, my: number, seg: SegmentHit) => {
      const o = optsRef.current;
      const tip = o.tooltipRef.current;
      if (!tip) return;
      tip.style.left = `${mx}px`;
      tip.style.top = `${my}px`;
      tip.style.opacity = "1";
      tip.style.visibility = "visible";
      const contentEl = o.tooltipContentRef.current;
      if (contentEl) {
        // Sanitize the consumer's tooltipFormatter HTML before injecting it.
        const safeHtml = DOMPurify.sanitize(
          o.tooltipFormatter(seg.row, seg.key, seg.value)
        );
        contentEl.replaceChildren();
        contentEl.insertAdjacentHTML("afterbegin", safeHtml);
      }
    };

    const handleMove = (event: MouseEvent) => {
      const [mx, my] = pointer(event, svg);
      const hit = hitTest(mx, my);
      if (hit) {
        setHovered(hit.key);
        // A pinned tooltip is not moved or replaced by the pointer.
        if (!isStickyRef.current) showTooltip(mx, my, hit);
      } else if (hoveredRef.current) {
        setHovered(null);
        if (!isStickyRef.current) hideTooltip();
      }
    };

    const handleLeave = () => {
      setHovered(null);
      // A pinned tooltip survives the cursor leaving the chart.
      if (!isStickyRef.current) hideTooltip();
    };

    // Click on a segment pins the tooltip there; click on empty area unpins.
    const handleClick = (event: MouseEvent) => {
      const [mx, my] = pointer(event, svg);
      const hit = hitTest(mx, my);
      if (hit) {
        isStickyRef.current = true;
        setIsSticky(true);
        setHovered(hit.key);
        showTooltip(mx, my, hit);
      }
    };

    // A click anywhere outside the chart and the tooltip unpins it.
    const handleDocClick = (event: MouseEvent) => {
      if (!isStickyRef.current) return;
      const target = event.target as HTMLElement | null;
      if (target && target.closest(".tooltip")) return;
      hideTooltip();
      // Match the SVG renderer's 100ms unpin delay.
      setTimeout(() => {
        isStickyRef.current = false;
        setIsSticky(false);
      }, 100);
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

export default useBarBellChartCanvasRendering;

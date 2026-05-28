import { useEffect, useRef, useState } from "react";
import type { ReactNode, ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { pointer } from "d3";
import type { ScaleLinear, ScaleTime } from "d3";
import DOMPurify from "dompurify";

// Opt-in Canvas 2D renderer for ComparableHorizontalBarChart (Phase 4 of the
// performance overhaul). Draws the two comparative bars per item (`valueBased`,
// `valueCompared`) onto a single <canvas> instead of two retained <rect> nodes
// per item wrapped in a <g>. Axes (grid, zero-line, divider, y-labels), title,
// the HTML tooltip and the loading / no-data overlays stay in the SVG/HTML
// layer above the canvas.

import { setupCanvas } from "../canvas/setupCanvas";
import { resolveMarkColors, ColorProbe } from "../canvas/resolveMarkColors";
import { sanitizeForClassName } from "../lineChart/lineChartUtils";

// Build a probe that mimics one of the chart's two sub-bar rects so consumer
// CSS like `.bar[data-label-safe="X"] .value-based { fill: ... }` resolves. The
// probe's root is a `<g class="bar" data-label data-label-safe>` (the selector
// ancestor) containing a single `<rect class={subBarClass} fill={fallback}>`;
// the target whose computed `fill` we read is that child rect.
const makeSubBarProbe =
  (subBarClass: "value-based" | "value-compared") =>
  (label: string, labelSafe: string, fallback: string): ColorProbe => {
    const NS = "http://www.w3.org/2000/svg";
    const g = document.createElementNS(NS, "g") as SVGGElement;
    g.setAttribute("class", "bar");
    g.setAttribute("data-label", label);
    g.setAttribute("data-label-safe", labelSafe);
    const rect = document.createElementNS(NS, "rect") as SVGRectElement;
    rect.setAttribute("class", subBarClass);
    rect.setAttribute("fill", fallback);
    rect.setAttribute("visibility", "hidden");
    g.appendChild(rect);
    return { root: g, target: rect };
  };

// --- Pattern fills -----------------------------------------------------------
// Cache of pattern-image sources (URL / data-URI) -> decoded HTMLImageElement,
// shared across chart instances. Images load asynchronously; one source maps to
// one Image and one decode.
const patternImageCache = new Map<string, HTMLImageElement>();

// Returns the decoded image for `src`, or null while it is still loading (or in
// jsdom, which has no Image constructor). Starts the load on first request;
// `onLoad` fires once a freshly loaded image is ready so the caller can repaint.
const getPatternImage = (src: string, onLoad: () => void): HTMLImageElement | null => {
  const ready = (img: HTMLImageElement) => img.complete && img.naturalWidth > 0;
  const cached = patternImageCache.get(src);
  if (cached) return ready(cached) ? cached : null;
  if (typeof Image === "undefined") return null;
  const img = new Image();
  img.onload = onLoad;
  img.src = src;
  patternImageCache.set(src, img);
  return ready(img) ? img : null;
};

type XScale = ScaleLinear<number, number> | ScaleTime<number, number>;

// One row of the dataset — mirrors ComparableHorizontalBarChart's DataPoint.
export interface CHBCDataPoint {
  label: string;
  color?: string;
  valueBased: number;
  valueCompared: number;
}

// Which of the two bars a hit landed on — mirrors the SVG renderer's `type`.
type BarType = "based" | "compared";

const BAR_HEIGHT = 30;
const MIN_BAR_WIDTH = 3;
const BAR_RX = 5;
// Opacity values mirror the SVG renderer's inline opacity logic.
const OPACITY_BASED = 0.45;
const OPACITY_COMPARED = 0.9;
const OPACITY_DIMMED = 0.3;
const BAR_STROKE = "#fff";

// A drawn bar, kept after the paint pass so the hover handler can hit-test
// without re-deriving the bar layout.
interface BarHit {
  item: CHBCDataPoint;
  type: BarType;
  x: number;
  y: number;
  w: number;
  h: number;
}

interface DrawParams {
  width: number;
  height: number;
  drawData: CHBCDataPoint[];
  xScale: XScale;
  yScale: { (label: string): number | undefined; bandwidth: () => number };
  padding: { top: number; right: number; bottom: number; left: number };
  // Per-label resolved fill for the `valueBased` sub-bar — honours consumer CSS
  // (skipColorMappingDispatch); falls back to the data colour when no rule hits.
  resolvedBasedColors: Map<string, string>;
  // Per-label resolved fill for the `valueCompared` sub-bar — same resolution.
  resolvedComparedColors: Map<string, string>;
  // Per-label decoded pattern image for the `valueBased` bar (from
  // `patternsMapping`). When present the bar is filled with the tiled image
  // instead of a solid colour. Labels still loading are absent from the map.
  patterns: Map<string, HTMLImageElement>;
  highlightItems: string[];
  hoveredLabel: string | null;
}

// Stroke a rounded rectangle path. We build the path manually so the canvas
// renderer matches the SVG `rx`/`ry` exactly and works regardless of the
// browser's roundRect availability.
const roundRectPath = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void => {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
};

// Pure draw routine — clears the canvas, repaints every item's bar pair and
// returns the drawn bars for hit-testing. Kept at module scope (no React
// closure) so both the redraw effect and the hover handler can call it.
const drawChart = (canvas: HTMLCanvasElement | null, p: DrawParams): BarHit[] => {
  const setup = setupCanvas(canvas, p.width, p.height);
  // jsdom has no canvas 2D context — setupCanvas returns null there.
  if (!setup) return [];
  const { ctx } = setup;

  const highlightSet = new Set(p.highlightItems);
  if (p.hoveredLabel) highlightSet.add(p.hoveredLabel);
  const anyHighlight = p.highlightItems.length > 0;

  const x0 = p.xScale(0);
  const hits: BarHit[] = [];

  for (const item of p.drawData) {
    const yBand = p.yScale(item.label) || 0;
    const y = yBand + (p.yScale.bandwidth() - BAR_HEIGHT) / 2;

    // Negative-aware x/width per bar — each bar starts at xScale(min(0, value))
    // and is |xScale(value) - xScale(0)| wide. Mirrors the SVG renderer.
    const x1 = p.xScale(Math.min(0, item.valueBased)) + p.padding.left;
    const x2 = p.xScale(Math.min(0, item.valueCompared)) + p.padding.left;
    const width1 = Math.abs(p.xScale(item.valueBased) - x0);
    const width2 = Math.abs(p.xScale(item.valueCompared) - x0);

    // Resolved (CSS-honouring) colours; the resolver already falls back to the
    // data colour, but keep `item.color` as a final guard for unmapped labels.
    const basedColor =
      p.resolvedBasedColors.get(item.label) ??
      p.resolvedComparedColors.get(item.label) ??
      item.color ??
      "transparent";
    const comparedColor =
      p.resolvedComparedColors.get(item.label) ?? item.color ?? "transparent";

    // The item-level opacity (highlight dimming) — applied to both bars.
    const itemAlpha =
      anyHighlight && !highlightSet.has(item.label) ? OPACITY_DIMMED : 1;

    // Per-bar draw closure — bar-level opacity 0.9 multiplies the item alpha,
    // matching the SVG renderer (`<g>` opacity * `<rect>` opacity 0.9).
    const drawBar = (
      bx: number,
      bw: number,
      color: string,
      type: BarType
    ): void => {
      const w = Math.max(bw, MIN_BAR_WIDTH);
      ctx.globalAlpha = itemAlpha * (type === "based" ? OPACITY_BASED : OPACITY_COMPARED);
      roundRectPath(ctx, bx, y, w, BAR_HEIGHT, BAR_RX);
      // The `valueBased` bar uses a tiled pattern fill when one is supplied for
      // this label (via `patternsMapping`) and its image has finished loading;
      // otherwise — and always for `valueCompared` — a solid colour.
      const patternImg = type === "based" ? p.patterns.get(item.label) : undefined;
      const pattern = patternImg ? ctx.createPattern(patternImg, "repeat") : null;
      ctx.fillStyle = pattern || color;
      ctx.fill();
      ctx.lineWidth = 1;
      // Border: the `valueBased` bar is outlined in its own resolved colour so a
      // pattern-filled (striped) bar still reads as a bounded bar — mirrors the
      // SVG renderer, where consumer CSS sets `.value-based { stroke: <colour> }`.
      // `valueCompared` keeps the white separator stroke.
      ctx.strokeStyle = type === "based" ? color : BAR_STROKE;
      ctx.stroke();
      hits.push({ item, type, x: bx, y, w, h: BAR_HEIGHT });
    };

    // Conditional z-order: draw the larger (wider) bar first so the smaller
    // one sits on top — exactly mirrors the SVG renderer's branch.
    if (width1 < width2) {
      drawBar(x2, width2, comparedColor, "compared");
      drawBar(x1, width1, basedColor, "based");
    } else {
      drawBar(x1, width1, basedColor, "based");
      drawBar(x2, width2, comparedColor, "compared");
    }
  }

  ctx.globalAlpha = 1;
  return hits;
};

export interface CHBCCanvasRenderingOptions {
  enabled: boolean;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  svgRef: React.RefObject<SVGSVGElement | null>;
  tooltipRef: React.RefObject<HTMLDivElement | null>;
  drawData: CHBCDataPoint[];
  // The complete (unfiltered-by-visibility) dataset — used to build the
  // tooltip's `dataSet` argument so it matches the SVG renderer.
  fullDataSet: CHBCDataPoint[];
  width: number;
  height: number;
  margin: { top: number; right: number; bottom: number; left: number };
  padding: { top: number; right: number; bottom: number; left: number };
  xScale: XScale;
  yScale: { (label: string): number | undefined; bandwidth: () => number };
  finalColorsMapping: { [key: string]: string };
  colorsBasedMapping: { [key: string]: string };
  // Optional per-label pattern image source (URL / data-URI) for the
  // `valueBased` bar. Tiled as the bar's fill once loaded; absent labels and
  // the `valueCompared` bar stay solid-coloured.
  patternsMapping?: { [key: string]: string };
  highlightItems: string[];
  // May return an HTML string OR a React node — ComparableHorizontalBarChart's
  // public `tooltipFormatter` is typed `=> React.ReactNode`. A node is rendered
  // to static markup before being injected into the HTML tooltip overlay.
  tooltipFormatter?: (
    d: CHBCDataPoint | undefined,
    dataSet?: CHBCDataPoint[],
    type?: BarType
  ) => string | ReactNode;
  onHighlightItem?: (labels: string[]) => void;
}

const useComparableHorizontalBarChartCanvasRendering = (
  opts: CHBCCanvasRenderingOptions
): { isSticky: boolean } => {
  const {
    enabled,
    canvasRef,
    svgRef,
    width,
    height,
    drawData,
    padding,
    xScale,
    yScale,
    finalColorsMapping,
    colorsBasedMapping,
    highlightItems,
  } = opts;

  // Latest options for the once-bound hover listener (avoids stale closures).
  const optsRef = useRef(opts);
  optsRef.current = opts;

  // Currently hovered item label — drives the dim/highlight on redraw.
  const hoveredRef = useRef<string | null>(null);

  // Bars drawn by the last paint, reused by the hover handler's hit-test.
  const barsRef = useRef<BarHit[]>([]);

  // Sub-bar fills resolved from the DOM (honouring consumer CSS), reused by the
  // hover redraw so it doesn't re-probe the DOM on every hover.
  const resolvedBasedColorsRef = useRef<Map<string, string>>(new Map());
  const resolvedComparedColorsRef = useRef<Map<string, string>>(new Map());

  // Decoded pattern images by label, reused by the hover redraw without
  // re-resolving. Bumped via setPatternTick when an image finishes loading so
  // the every-render redraw effect repaints with the now-ready pattern.
  const patternsRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const [, setPatternTick] = useState(0);

  // Sticky tooltip: a click on a bar pins the tooltip; a click off it unpins.
  const [isSticky, setIsSticky] = useState(false);
  const isStickyRef = useRef(false);
  isStickyRef.current = isSticky;

  // Redraw on EVERY render (intentionally not a dep-gated effect). Consumer CSS
  // colouring (skipColorMappingDispatch) arrives a render or two after mount,
  // and a <canvas> — unlike retained SVG nodes — does not auto-repaint when its
  // inputs change. Re-drawing each render keeps it in sync; drawChart is cheap.
  useEffect(() => {
    if (!enabled) return;
    // Resolve each sub-bar's fill from the DOM every render: consumer CSS
    // (skipColorMappingDispatch) arrives a render or two after mount and a
    // <canvas> does not auto-repaint on CSS change. The two sub-bars can be
    // coloured by different rules, so resolve two independent maps.
    const labels = drawData.map(d => d.label);
    const resolvedBasedColors = resolveMarkColors(
      svgRef.current,
      labels,
      label => colorsBasedMapping[label] ?? drawData.find(d => d.label === label)?.color
        ?? "transparent",
      makeSubBarProbe("value-based"),
      // Consumer CSS may paint the bar `fill` with an SVG <pattern> (which
      // canvas cannot render) while putting the real colour on `stroke` —
      // try fill first, fall back to stroke.
      ["fill", "stroke"]
    );
    const resolvedComparedColors = resolveMarkColors(
      svgRef.current,
      labels,
      label => finalColorsMapping[label] ?? drawData.find(d => d.label === label)?.color
        ?? "transparent",
      makeSubBarProbe("value-compared"),
      ["fill", "stroke"]
    );
    resolvedBasedColorsRef.current = resolvedBasedColors;
    resolvedComparedColorsRef.current = resolvedComparedColors;

    // Resolve pattern fills for the valueBased bar. Images load asynchronously;
    // getPatternImage triggers a repaint via setPatternTick once a freshly
    // loaded image is ready, so a late-decoded pattern still gets painted.
    const patterns = new Map<string, HTMLImageElement>();
    if (opts.patternsMapping) {
      const pm = opts.patternsMapping;
      for (const label of labels) {
        // Accept the mapping keyed by either the raw label or its class-safe
        // form — external colour systems (the same ones that drive
        // skipColorMappingDispatch) commonly key everything by the sanitized
        // `data-label-safe` value, not the raw label.
        const src = pm[label] ?? pm[sanitizeForClassName(label)];
        if (!src) continue;
        const img = getPatternImage(src, () => setPatternTick(t => t + 1));
        if (img) patterns.set(label, img);
      }
    }
    patternsRef.current = patterns;

    barsRef.current = drawChart(canvasRef.current, {
      width,
      height,
      drawData,
      xScale,
      yScale,
      padding,
      resolvedBasedColors,
      resolvedComparedColors,
      patterns,
      highlightItems,
      hoveredLabel: hoveredRef.current,
    });
  });

  // Hover + click-to-pin: hit-test against the drawn bars, drive the HTML
  // tooltip + highlight. Bound once on the SVG (which sits above the canvas and
  // receives the pointer events).
  useEffect(() => {
    if (!enabled) return undefined;
    const svg = svgRef.current;
    if (!svg) return undefined;

    const redraw = () => {
      const o = optsRef.current;
      barsRef.current = drawChart(o.canvasRef.current, {
        width: o.width,
        height: o.height,
        drawData: o.drawData,
        xScale: o.xScale,
        yScale: o.yScale,
        padding: o.padding,
        resolvedBasedColors: resolvedBasedColorsRef.current,
        resolvedComparedColors: resolvedComparedColorsRef.current,
        patterns: patternsRef.current,
        highlightItems: o.highlightItems,
        hoveredLabel: hoveredRef.current,
      });
    };

    const hideTooltip = () => {
      const tip = optsRef.current.tooltipRef.current;
      if (tip) tip.style.visibility = "hidden";
    };

    const setHovered = (label: string | null) => {
      if (hoveredRef.current === label) return;
      hoveredRef.current = label;
      redraw();
      optsRef.current.onHighlightItem?.(label ? [label] : []);
    };

    // The bar under the cursor — point-in-rect. Bars are pushed in draw order
    // (larger first, smaller last), so iterating in reverse picks the bar that
    // visually sits on top, matching the SVG renderer's Z-order.
    const hitTest = (mx: number, my: number): BarHit | null => {
      const bars = barsRef.current;
      for (let i = bars.length - 1; i >= 0; i--) {
        const b = bars[i];
        if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) {
          return b;
        }
      }
      return null;
    };

    // Position + fill the HTML tooltip for a hit at pixel (mx, my).
    const showTooltip = (mx: number, my: number, hit: BarHit) => {
      const o = optsRef.current;
      const tip = o.tooltipRef.current;
      if (!tip) return;
      tip.style.visibility = "visible";
      tip.style.left = `${mx}px`;
      tip.style.top = `${my}px`;
      const contentEl = tip.querySelector(".tooltip-content");
      if (contentEl && o.tooltipFormatter) {
        const result = o.tooltipFormatter(hit.item, o.fullDataSet, hit.type);
        // `tooltipFormatter` may return an HTML string or a React node. The
        // canvas tooltip is an HTML overlay, so a node is rendered to static
        // markup first (otherwise it stringifies to "[object Object]").
        const html =
          typeof result === "string" ? result : renderToStaticMarkup(result as ReactElement);
        // Sanitize before injecting it (the LineChart canvas renderer does the
        // same — DOMPurify guards against XSS from consumer-supplied markup).
        contentEl.innerHTML = DOMPurify.sanitize(html);
      }
    };

    const handleMove = (event: MouseEvent) => {
      const [mx, my] = pointer(event, svg);
      const hit = hitTest(mx, my);
      if (hit) {
        setHovered(hit.item.label);
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

    // Click on a bar pins the tooltip there; click on empty area unpins.
    const handleClick = (event: MouseEvent) => {
      const [mx, my] = pointer(event, svg);
      const hit = hitTest(mx, my);
      if (hit) {
        isStickyRef.current = true;
        setIsSticky(true);
        setHovered(hit.item.label);
        showTooltip(mx, my, hit);
      } else {
        isStickyRef.current = false;
        setIsSticky(false);
        setHovered(null);
        hideTooltip();
      }
    };

    // A click anywhere outside the chart and the tooltip unpins it.
    const handleDocClick = (event: MouseEvent) => {
      if (!isStickyRef.current) return;
      const target = event.target as HTMLElement | null;
      const tip = optsRef.current.tooltipRef.current;
      if (target && (svg.contains(target) || target.closest(".tooltip"))) return;
      if (target && tip && tip.contains(target)) return;
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


export default useComparableHorizontalBarChartCanvasRendering;

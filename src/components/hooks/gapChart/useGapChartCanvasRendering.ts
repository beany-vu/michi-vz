import { useEffect, useRef, useState } from "react";
import { pointer } from "d3";
import type { ScaleBand, ScaleLinear, ScaleTime } from "d3";
import DOMPurify from "dompurify";
import { setupCanvas } from "../canvas/setupCanvas";
import { resolveMarkColors, makeSimpleProbe } from "../canvas/resolveMarkColors";

// Opt-in Canvas 2D renderer for GapChart (Phase 4 of the performance overhaul).
// Draws the 8px gap bars, their connector lines and the value1/value2 shape
// markers onto a single <canvas> instead of one retained SVG <g> + <rect> +
// <line> + two markers per item. Axes, the title, the YaxisBand HTML category
// labels, the foreignObject legend, the HTML tooltip and the loading / no-data
// overlays all stay in the SVG/HTML layer above the canvas — canvas cannot host
// HTML, so those layers are intentionally NOT ported.

type XScale = ScaleLinear<number, number> | ScaleTime<number, number>;

interface DataItem {
  label: string;
  code?: string;
  value1: number;
  value2: number;
  difference: number;
  date: string;
}

type Shape = "circle" | "square" | "triangle";

// One entry of useGapChartRenderer's `elements` array — the renderer-agnostic
// per-item layout the SVG renderer also consumes.
interface RenderElement {
  d: DataItem;
  i: number;
  y: number;
  barHeight: number;
  gapColor: string;
  value1Color: string;
  value2Color: string;
  x1: number;
  x2: number;
  barWidth: number;
  barOpacity: number;
  markerOpacity: number;
}

// The gap bar is a fixed 8px tall (matches the SVG `<rect height={8}>`).
const BAR_HEIGHT = 8;
// Marker hit-test radius (CSS px) around a value1/value2 marker centre.
const MARKER_HIT_RADIUS = 9;

interface ShadowConfig {
  blur?: number;
  dx?: number;
  dy?: number;
  opacity?: number;
  color?: string;
}

// A drawn marker, kept after the paint pass so the hover handler can hit-test
// without re-deriving geometry.
interface MarkerHit {
  d: DataItem;
  cx: number;
  cy: number;
}

// Parse an "#rrggbb" colour + opacity into an rgba() string so the shadow can
// honour `shadowConfig.opacity` (canvas shadowColor takes the alpha from the
// colour itself, there is no separate shadow-opacity property).
const shadowRgba = (color: string, opacity: number): string => {
  const hex = color.replace("#", "");
  if (hex.length === 6) {
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  return color;
};

// Per-label colours resolved off the DOM (honouring consumer CSS). Each map is
// keyed by the DataItem label; a missing entry means "use the element's data
// colour fallback".
interface ResolvedColors {
  gap: Map<string, string>;
  value1: Map<string, string>;
  value2: Map<string, string>;
}

interface DrawParams {
  width: number;
  height: number;
  elements: RenderElement[];
  xScale: XScale;
  shapeValue1: Shape;
  shapeValue2: Shape;
  squareRadius: number;
  enableShadow: boolean;
  shadowConfig: ShadowConfig;
  hoveredLabel: string | null;
  // Resolved per-label mark colours; the element's own *Color fields are the
  // fallback when a label is absent here (e.g. jsdom / pre-mount).
  resolvedColors: ResolvedColors;
}

// Draw one shape marker (circle / square / triangle) centred at (cx, cy). The
// sizes mirror useGapChartShapes: d3.symbolCircle uses size (0.8*14)^2 and
// d3.symbolTriangle uses size 14^2 — both yield roughly a 14px box.
const drawMarker = (
  ctx: CanvasRenderingContext2D,
  shape: Shape,
  cx: number,
  cy: number,
  color: string,
  squareRadius: number
): void => {
  ctx.fillStyle = color;
  ctx.beginPath();
  if (shape === "square") {
    const size = 14;
    const half = size / 2;
    // roundRect honours squareRadius, matching the SVG `<rect rx ry>`.
    ctx.roundRect(cx - half, cy - half, size, size, squareRadius);
  } else if (shape === "triangle") {
    // d3.symbolTriangle with size = 14*14: an upward equilateral triangle whose
    // area equals 196. Side s satisfies (sqrt(3)/4) s^2 = area.
    const area = 14 * 14;
    const s = Math.sqrt((4 * area) / Math.sqrt(3));
    const h = (s * Math.sqrt(3)) / 2;
    // Centroid at (cx, cy): apex up, base down.
    ctx.moveTo(cx, cy - (2 / 3) * h);
    ctx.lineTo(cx + s / 2, cy + (1 / 3) * h);
    ctx.lineTo(cx - s / 2, cy + (1 / 3) * h);
    ctx.closePath();
  } else {
    // d3.symbolCircle with size = (0.8*14)^2 = area; radius = sqrt(area/PI).
    const area = 0.8 * 14 * (0.8 * 14);
    const r = Math.sqrt(area / Math.PI);
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
  }
  ctx.fill();
};

// Pure draw routine — clears the canvas, repaints every item and returns the
// drawn markers for hit-testing. Kept at module scope (no React closure) so
// both the redraw effect and the hover handler can call it.
const drawChart = (
  canvas: HTMLCanvasElement | null,
  p: DrawParams
): MarkerHit[] => {
  // setupCanvas sizes the backing store for devicePixelRatio, applies the dpr
  // transform and clears the frame. It returns null in jsdom (no 2D context),
  // so we early-return there.
  const setup = setupCanvas(canvas, p.width, p.height);
  if (!setup) return [];
  const { ctx } = setup;

  const markers: MarkerHit[] = [];

  // Pass 1 — gap bars + connector lines.
  for (const el of p.elements) {
    const dimmed = p.hoveredLabel != null && p.hoveredLabel !== el.d.label;
    const barAlpha = dimmed ? 0.3 : el.barOpacity;
    const lineAlpha = dimmed ? 0.3 : el.markerOpacity;
    const barY = el.y + el.barHeight / 2 - BAR_HEIGHT / 2;

    // Gap bar — use the DOM-resolved colour (consumer CSS honoured), falling
    // back to the data colour when the label was not resolved.
    ctx.globalAlpha = barAlpha;
    ctx.fillStyle = p.resolvedColors.gap.get(el.d.label) ?? el.gapColor;
    ctx.fillRect(el.x1, barY, el.barWidth, BAR_HEIGHT);

    // Connector line — dashed exactly when difference < 0, solid otherwise.
    ctx.globalAlpha = lineAlpha;
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    if (el.d.difference < 0) {
      ctx.setLineDash([4, 2]);
    } else {
      ctx.setLineDash([]);
    }
    const lineY = el.y + el.barHeight / 2;
    ctx.beginPath();
    ctx.moveTo(el.x1, lineY);
    ctx.lineTo(el.x2, lineY);
    ctx.stroke();
    // Reset dashing so it never leaks into the next item.
    ctx.setLineDash([]);
  }

  // Pass 2 — value1/value2 shape markers, drawn after every bar so they sit on
  // top. Shadow is applied around the marker draws then reset, so it never
  // bleeds onto the bars.
  for (const el of p.elements) {
    const dimmed = p.hoveredLabel != null && p.hoveredLabel !== el.d.label;
    ctx.globalAlpha = dimmed ? 0.3 : el.markerOpacity;

    if (p.enableShadow) {
      ctx.shadowColor = shadowRgba(
        p.shadowConfig.color ?? "#000000",
        p.shadowConfig.opacity ?? 0.3
      );
      ctx.shadowBlur = p.shadowConfig.blur ?? 3;
      ctx.shadowOffsetX = p.shadowConfig.dx ?? 0;
      ctx.shadowOffsetY = p.shadowConfig.dy ?? 2;
    }

    const cx1 = p.xScale(el.d.value1);
    const cx2 = p.xScale(el.d.value2);
    const cy = el.y + el.barHeight / 2;
    // DOM-resolved marker colours (consumer CSS honoured), data colour fallback.
    const c1 = p.resolvedColors.value1.get(el.d.label) ?? el.value1Color;
    const c2 = p.resolvedColors.value2.get(el.d.label) ?? el.value2Color;
    drawMarker(ctx, p.shapeValue1, cx1, cy, c1, p.squareRadius);
    drawMarker(ctx, p.shapeValue2, cx2, cy, c2, p.squareRadius);

    // Reset the shadow before the next item / before returning.
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    markers.push({ d: el.d, cx: cx1, cy });
    markers.push({ d: el.d, cx: cx2, cy });
  }

  ctx.globalAlpha = 1;
  return markers;
};

// Resolve the gap-bar / value1-marker / value2-marker colours for every drawn
// item off the live DOM, so consumer CSS (skipColorMappingDispatch external
// styling) is honoured — canvas pixels cannot be CSS-styled, so we read the
// colour the browser computed for a hidden probe that mimics the real SVG mark.
//
// Probe shapes mirror GapChart.tsx's SVG marks:
//   - gap bar:       <rect class="gap-bar" data-label data-label-safe fill=…>
//   - value1 marker: <rect class="gap-marker value1-marker" …> (path for
//                    circle/triangle, but CSS selectors key off the class +
//                    data-attrs, not the tag, so a <rect> probe still matches)
//   - value2 marker: <rect class="gap-marker value2-marker" …>
//
// The element's own *Color fields are the fallback. In colorMode "shape" those
// fallbacks are already real colours (from shapeColorsMapping), so the probe
// only overrides them when a consumer CSS rule actually matches; in "label"
// mode the fallback is the "transparent" placeholder and the probe supplies the
// real colour. Either way `resolveMarkColors` returns the fallback when no CSS
// rule matches, so both modes work without branching on colorMode here.
const resolveColors = (
  svgEl: SVGSVGElement | null,
  elements: RenderElement[]
): ResolvedColors => {
  const labels = elements.map(el => el.d.label);
  const byLabel = new Map(elements.map(el => [el.d.label, el]));
  const fallback = (field: "gapColor" | "value1Color" | "value2Color") => (label: string) =>
    byLabel.get(label)?.[field] ?? "transparent";

  return {
    gap: resolveMarkColors(
      svgEl,
      labels,
      fallback("gapColor"),
      makeSimpleProbe("rect", "gap-bar", "fill"),
      "fill"
    ),
    value1: resolveMarkColors(
      svgEl,
      labels,
      fallback("value1Color"),
      makeSimpleProbe("rect", "gap-marker value1-marker", "fill"),
      "fill"
    ),
    value2: resolveMarkColors(
      svgEl,
      labels,
      fallback("value2Color"),
      makeSimpleProbe("rect", "gap-marker value2-marker", "fill"),
      "fill"
    ),
  };
};

export interface GapChartCanvasRenderingOptions {
  enabled: boolean;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  svgRef: React.RefObject<SVGSVGElement | null>;
  // The HTML tooltip div rendered by GapChart in canvas mode; its
  // `.tooltip-content` child receives the sanitized tooltip HTML.
  tooltipRef: React.RefObject<HTMLDivElement | null>;
  width: number;
  height: number;
  margin: { top: number; right: number; bottom: number; left: number };
  elements: RenderElement[];
  xScale: XScale;
  // yScale is reused only for hit-testing the per-row band extent.
  yScale: ScaleBand<string>;
  shapeValue1: Shape;
  shapeValue2: Shape;
  squareRadius: number;
  enableShadow: boolean;
  shadowConfig: ShadowConfig;
  // "label" → all three marks of an item share the per-label colour (and that
  // colour is the "transparent" placeholder under skipColorMappingDispatch, so
  // the DOM probe is essential). "shape" → the data path already supplies real
  // per-shape colours; the probe then acts purely as a CSS-override fallback.
  colorMode: "label" | "shape";
  tooltipFormatter?: (data: DataItem) => string;
  onHighlightItem?: (item: DataItem) => void;
}

const useGapChartCanvasRendering = (
  opts: GapChartCanvasRenderingOptions
): { isSticky: boolean } => {
  const {
    enabled,
    canvasRef,
    svgRef,
    width,
    height,
    elements,
    xScale,
    shapeValue1,
    shapeValue2,
    squareRadius,
    enableShadow,
    shadowConfig,
  } = opts;

  // Latest options for the once-bound hover listener (avoids stale closures).
  const optsRef = useRef(opts);
  optsRef.current = opts;

  // Currently hovered item label — drives the dim/highlight on redraw.
  const hoveredRef = useRef<string | null>(null);

  // Markers drawn by the last paint, reused by the hover handler's hit-test.
  const markersRef = useRef<MarkerHit[]>([]);

  // Per-label mark colours resolved from the DOM (honouring consumer CSS),
  // reused by the hover redraw so it does not re-probe the DOM on every move.
  const resolvedColorsRef = useRef<ResolvedColors>({
    gap: new Map(),
    value1: new Map(),
    value2: new Map(),
  });

  // Sticky tooltip: a click on a mark pins the tooltip; a click off it unpins.
  const [isSticky, setIsSticky] = useState(false);
  const isStickyRef = useRef(false);
  isStickyRef.current = isSticky;

  // Redraw on EVERY render (intentionally not a dep-gated effect). Consumer CSS
  // colouring (skipColorMappingDispatch) arrives a render or two after mount,
  // and a <canvas> — unlike retained SVG nodes — does not auto-repaint when its
  // inputs change. Re-drawing each render keeps it in sync; drawChart is cheap.
  useEffect(() => {
    if (!enabled) return;
    resolvedColorsRef.current = resolveColors(svgRef.current, elements);
    markersRef.current = drawChart(canvasRef.current, {
      width,
      height,
      elements,
      xScale,
      shapeValue1,
      shapeValue2,
      squareRadius,
      enableShadow,
      shadowConfig,
      hoveredLabel: hoveredRef.current,
      resolvedColors: resolvedColorsRef.current,
    });
  });

  // Hover + click-to-pin: hit-test against the drawn marks, drive the HTML
  // tooltip + highlight. Bound once on the SVG (which sits above the canvas and
  // receives the pointer events).
  useEffect(() => {
    if (!enabled) return undefined;
    const svg = svgRef.current;
    if (!svg) return undefined;

    const redraw = () => {
      const o = optsRef.current;
      markersRef.current = drawChart(o.canvasRef.current, {
        width: o.width,
        height: o.height,
        elements: o.elements,
        xScale: o.xScale,
        shapeValue1: o.shapeValue1,
        shapeValue2: o.shapeValue2,
        squareRadius: o.squareRadius,
        enableShadow: o.enableShadow,
        shadowConfig: o.shadowConfig,
        hoveredLabel: hoveredRef.current,
        resolvedColors: resolvedColorsRef.current,
      });
    };

    const setHovered = (label: string | null, item: DataItem | null) => {
      if (hoveredRef.current === label) return;
      hoveredRef.current = label;
      redraw();
      if (item) optsRef.current.onHighlightItem?.(item);
    };

    // The item under the cursor: nearest value marker within MARKER_HIT_RADIUS,
    // else the gap bar rect the pointer falls inside.
    const hitTest = (mx: number, my: number): DataItem | null => {
      // Markers first (Z-order: they paint on top of the bars).
      let markerHit: DataItem | null = null;
      let bestDist = MARKER_HIT_RADIUS;
      for (const m of markersRef.current) {
        const dist = Math.hypot(m.cx - mx, m.cy - my);
        if (dist <= bestDist) {
          bestDist = dist;
          markerHit = m.d;
        }
      }
      if (markerHit) return markerHit;
      // Then the gap bar rects.
      for (const el of optsRef.current.elements) {
        const barY = el.y + el.barHeight / 2 - BAR_HEIGHT / 2;
        if (
          mx >= el.x1 &&
          mx <= el.x2 &&
          my >= barY &&
          my <= barY + BAR_HEIGHT
        ) {
          return el.d;
        }
      }
      return null;
    };

    const hideTooltip = () => {
      const tip = optsRef.current.tooltipRef.current;
      if (tip) tip.style.visibility = "hidden";
    };

    // Position + fill the HTML tooltip for a hit at pixel (mx, my).
    const showTooltip = (mx: number, my: number, item: DataItem) => {
      const o = optsRef.current;
      const tip = o.tooltipRef.current;
      if (!tip) return;
      tip.style.visibility = "visible";
      tip.style.left = `${mx + 10}px`;
      tip.style.top = `${my - 10}px`;
      const contentEl = tip.querySelector(".tooltip-content");
      if (contentEl) {
        const html = o.tooltipFormatter
          ? o.tooltipFormatter(item)
          : `<div><strong>${item.label}</strong><br/>Value 1: ${item.value1}<br/>Value 2: ${item.value2}<br/>Difference: ${item.difference}</div>`;
        // Sanitize the consumer's tooltipFormatter HTML before injecting it
        // (canvas mode injects raw HTML, so DOMPurify guards against XSS — the
        // SVG renderer relies on React's escaping for the same safety).
        contentEl.innerHTML = DOMPurify.sanitize(html);
      }
    };

    const handleMove = (event: MouseEvent) => {
      // A pinned tooltip is not moved or replaced by the pointer.
      if (isStickyRef.current) return;
      const [mx, my] = pointer(event, svg);
      const hit = hitTest(mx, my);
      if (hit) {
        setHovered(hit.label, hit);
        showTooltip(mx, my, hit);
      } else if (hoveredRef.current) {
        setHovered(null, null);
        hideTooltip();
      }
    };

    const handleLeave = () => {
      // A pinned tooltip survives the cursor leaving the chart.
      if (isStickyRef.current) return;
      setHovered(null, null);
      hideTooltip();
    };

    // Click on a mark pins the tooltip there; click on empty area unpins.
    const handleClick = (event: MouseEvent) => {
      const [mx, my] = pointer(event, svg);
      const hit = hitTest(mx, my);
      if (hit) {
        isStickyRef.current = true;
        setIsSticky(true);
        setHovered(hit.label, hit);
        showTooltip(mx, my, hit);
      } else {
        isStickyRef.current = false;
        setIsSticky(false);
        setHovered(null, null);
        hideTooltip();
      }
    };

    // A click anywhere outside the chart and the tooltip unpins it.
    const handleDocClick = (event: MouseEvent) => {
      if (!isStickyRef.current) return;
      const target = event.target as Node | null;
      const tip = optsRef.current.tooltipRef.current;
      if (target && (svg.contains(target) || (tip && tip.contains(target)))) return;
      isStickyRef.current = false;
      setIsSticky(false);
      setHovered(null, null);
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

export default useGapChartCanvasRendering;

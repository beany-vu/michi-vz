import { useEffect, useRef, useState } from "react";
import type React from "react";
import { pointer } from "d3";
import type { ScaleLinear, ScaleTime, ScaleBand } from "d3";
import DOMPurify from "dompurify";
import { setupCanvas } from "../canvas/setupCanvas";
import { resolveMarkColors, ColorProbe } from "../canvas/resolveMarkColors";

// Opt-in Canvas 2D renderer for ScatterPlotChart. ScatterPlotChart is the
// biggest canvas win in the performance overhaul — the SVG renderer emits one
// <g.data-point> DOM node per point, which janks badly on large point clouds.
// This hook paints every point imperatively onto a single <canvas>. Axes,
// title, the d-scale legend, the HTML tooltip and loading/no-data overlays
// stay in the SVG/HTML layered above the canvas.

type XScale =
  | ScaleLinear<number, number>
  | ScaleTime<number, number>
  | ScaleBand<string>;
type YScale = ScaleLinear<number, number>;
type DScale = ScaleLinear<number, number>;

// Minimal shape of a scatter point — matches ScatterPlotChart's DataPoint.
export interface ScatterDataPoint {
  x: number;
  y: number;
  label: string;
  color?: string;
  d: number;
  shape?: "square" | "circle" | "triangle";
  date?: string;
}

const POINT_STROKE = "#fff";
const POINT_STROKE_WIDTH = 2;
const POINT_OPACITY = 0.9;
const OPACITY_NOT_HIGHLIGHTED = 0.1;

// Resolve a point's pixel x — mirrors ScatterPlotChart's getXValue accessor,
// including the half-bandwidth offset for band scales.
const projectX = (d: ScatterDataPoint, xScale: XScale, xAxisDataType: string): number => {
  if (xAxisDataType === "band") {
    const band = xScale as ScaleBand<string>;
    const offset = band.bandwidth ? band.bandwidth() / 2 : 0;
    return (band(d.label) ?? 0) + offset;
  }
  return (xScale as ScaleLinear<number, number>)(d.x);
};

// Per-point radius — mirrors ScatterPlotChart's `size = band ? d.d/2 : dScale(d.d)`,
// then `radius = size / 2`.
const projectRadius = (
  d: ScatterDataPoint,
  dScale: DScale,
  xAxisDataType: string
): number => {
  const size = xAxisDataType === "band" ? d.d / 2 : dScale(d.d);
  return size / 2;
};

interface DrawParams {
  width: number;
  height: number;
  // Points already sorted by descending d (large behind small).
  renderData: ScatterDataPoint[];
  xScale: XScale;
  yScale: YScale;
  dScale: DScale;
  xAxisDataType: string;
  disabledItems: string[];
  highlightItems: string[];
  getColor: (mappedColor?: string, dataColor?: string) => string;
  colorsMapping: { [key: string]: string };
  // Per-label fill colour resolved from the DOM (honours consumer CSS).
  resolvedColors: Map<string, string>;
  hoveredLabel: string | null;
  stickyLabel: string | null;
  showCrosshair: boolean;
  crosshairLabels: boolean;
  pinIcon: string | undefined;
  margin: { top: number; right: number; bottom: number; left: number };
}

// Build a probe that mirrors ScatterPlotChart's real SVG mark so consumer CSS
// selectors (which target `.data-point[data-label-safe="X"]` and may set `fill`
// on the group) match it. The shape `fill` is what canvas needs; CSS `fill`
// inherits to the child shape, so the fallback is pre-set on the child probe
// (a <circle>, the chart's default shape) which is what we read back.
const buildScatterProbe = (
  label: string,
  labelSafe: string,
  fallback: string
): ColorProbe => {
  const group = document.createElementNS("http://www.w3.org/2000/svg", "g") as SVGGElement;
  group.setAttribute("class", "data-point");
  group.setAttribute("data-label", label);
  group.setAttribute("data-label-safe", labelSafe);
  group.setAttribute("fill", fallback);
  group.setAttribute("visibility", "hidden");
  const circle = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "circle"
  ) as SVGCircleElement;
  circle.setAttribute("fill", fallback);
  group.appendChild(circle);
  return { root: group, target: circle };
};

// Pure draw routine — clears the canvas and repaints every point. Kept at
// module scope (no React closure) so both the redraw effect and the hover
// handler can call it.
const drawChart = (canvas: HTMLCanvasElement | null, p: DrawParams): void => {
  const setup = setupCanvas(canvas, p.width, p.height);
  // setupCanvas returns null in jsdom (no 2D context) — early-return there.
  if (!setup) return;
  const { ctx } = setup;

  const highlightSet = new Set(p.highlightItems);
  if (p.hoveredLabel) highlightSet.add(p.hoveredLabel);
  const anyHighlight = highlightSet.size > 0;

  // renderData is pre-sorted by descending d, so large points draw first and
  // small points draw on top — matching the SVG renderer's layering.
  for (const d of p.renderData) {
    if (p.disabledItems.includes(d.label)) continue;

    const cx = projectX(d, p.xScale, p.xAxisDataType);
    const cy = p.yScale(d.y);
    const r = projectRadius(d, p.dScale, p.xAxisDataType);

    // Cull off-viewport points (a fully off-screen point can't be hovered or
    // seen — skip the draw work entirely).
    if (cx + r < 0 || cx - r > p.width || cy + r < 0 || cy - r > p.height) continue;

    // Prefer the DOM-resolved colour (honours consumer CSS); fall back to the
    // raw data colour when no probe match was made (e.g. jsdom / pre-mount).
    const color =
      p.resolvedColors.get(d.label) ?? p.getColor(p.colorsMapping[d.label], d.color);
    const dimmed = anyHighlight && !highlightSet.has(d.label);

    // Ring behind the main shape for the pinned point — matches the bubble's shape.
    if (d.label === p.stickyLabel) {
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.45;
      ctx.beginPath();
      if (d.shape === "square") {
        ctx.rect(cx - r - 5, cy - r - 5, (r + 5) * 2, (r + 5) * 2);
      } else if (d.shape === "triangle") {
        ctx.moveTo(cx, cy - r - 5);
        ctx.lineTo(cx + r + 5, cy + r + 5);
        ctx.lineTo(cx - r - 5, cy + r + 5);
        ctx.closePath();
      } else {
        ctx.arc(cx, cy, r + 5, 0, Math.PI * 2);
      }
      ctx.stroke();
      ctx.restore();
    }

    ctx.globalAlpha = dimmed ? OPACITY_NOT_HIGHLIGHTED : POINT_OPACITY;

    ctx.beginPath();
    if (d.shape === "square") {
      ctx.rect(cx - r, cy - r, r * 2, r * 2);
    } else if (d.shape === "triangle") {
      // Vertices [0,-r] / [r,r] / [-r,r] — identical to the SVG <path>.
      ctx.moveTo(cx, cy - r);
      ctx.lineTo(cx + r, cy + r);
      ctx.lineTo(cx - r, cy + r);
      ctx.closePath();
    } else {
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
    }
    ctx.fillStyle = color;
    ctx.fill();
    ctx.lineWidth = POINT_STROKE_WIDTH;
    ctx.strokeStyle = POINT_STROKE;
    ctx.stroke();

    // Pin icon text above the pinned bubble (strings only; React nodes can't be drawn to canvas).
    if (p.pinIcon && d.label === p.stickyLabel) {
      ctx.save();
      ctx.font = "12px sans-serif";
      ctx.globalAlpha = 1;
      ctx.fillText(p.pinIcon, cx + r + 2, cy - r - 2);
      ctx.restore();
    }
  }
  ctx.globalAlpha = 1;

  // Crosshair lines drawn after all points so they render on top.
  // Pinned (sticky) crosshair always shown; hover crosshair only when showCrosshair=true.
  const crosshairLabel = p.stickyLabel ?? (p.showCrosshair ? p.hoveredLabel : null);
  if (crosshairLabel) {
    const cp = p.renderData.find(d => d.label === crosshairLabel);
    if (cp) {
      const cx = projectX(cp, p.xScale, p.xAxisDataType);
      const cy = p.yScale(cp.y);
      const color = p.resolvedColors.get(cp.label) ?? p.getColor(p.colorsMapping[cp.label], cp.color);
      const isSticky = p.stickyLabel !== null;
      ctx.save();
      ctx.strokeStyle = color;
      ctx.globalAlpha = isSticky ? 0.75 : 0.6;
      ctx.lineWidth = 1.5;
      if (!isSticky) ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx, p.height - p.margin.bottom);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(p.margin.left, cy);
      ctx.lineTo(cx, cy);
      ctx.stroke();
      ctx.restore();

      if (p.crosshairLabels) {
        const xText = String(cp.x);
        const yText = String(cp.y);
        const h = 18;
        const pad = 8;
        ctx.save();
        ctx.font = "10px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        // Y-axis badge
        const yW = Math.max(28, ctx.measureText(yText).width + pad * 2);
        ctx.globalAlpha = 0.92;
        ctx.fillStyle = "#fff";
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(p.margin.left - yW / 2, cy - h / 2, yW, h, 4);
        ctx.fill();
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.fillStyle = color;
        ctx.fillText(yText, p.margin.left, cy);
        // X-axis badge
        const xW = Math.max(28, ctx.measureText(xText).width + pad * 2);
        ctx.globalAlpha = 0.92;
        ctx.fillStyle = "#fff";
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(cx - xW / 2, p.height - p.margin.bottom - h / 2, xW, h, 4);
        ctx.fill();
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.fillStyle = color;
        ctx.fillText(xText, cx, p.height - p.margin.bottom);
        ctx.restore();
      }
    }
  }
};

export interface ScatterCanvasRenderingOptions {
  enabled: boolean;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  svgRef: React.RefObject<SVGSVGElement | null>;
  tooltipRef: React.RefObject<HTMLDivElement | null>;
  tooltipContentRef: React.RefObject<HTMLDivElement | null>;
  // Points sorted by descending d (paint order). Hit-testing walks this in
  // reverse so the topmost (smallest) point under the cursor wins.
  renderData: ScatterDataPoint[];
  width: number;
  height: number;
  margin: { top: number; right: number; bottom: number; left: number };
  xScale: XScale;
  yScale: YScale;
  dScale: DScale;
  xAxisDataType: string;
  disabledItems: string[];
  highlightItems: string[];
  getColor: (mappedColor?: string, dataColor?: string) => string;
  colorsMapping: { [key: string]: string };
  tooltipFormatter?: (d: ScatterDataPoint) => string;
  xAxisFormat?: (d: number | string) => string;
  yAxisFormat?: (d: number | string) => string;
  onHighlightItem?: (labels: string[]) => void;
  showCrosshair?: boolean;
  crosshairLabels?: boolean;
  pinIcon?: string | React.ReactNode;
}

const useScatterPlotChartCanvasRendering = (
  opts: ScatterCanvasRenderingOptions
): { isSticky: boolean } => {
  const {
    enabled,
    canvasRef,
    svgRef,
    width,
    height,
    renderData,
    xScale,
    yScale,
    dScale,
    xAxisDataType,
    disabledItems,
    highlightItems,
    getColor,
    colorsMapping,
  } = opts;

  // Latest options for the once-bound hover listener (avoids stale closures).
  const optsRef = useRef(opts);
  optsRef.current = opts;

  // Currently hovered point label — drives the dim/highlight on redraw.
  const hoveredRef = useRef<string | null>(null);

  // Per-label fill colours resolved from the DOM (honouring consumer CSS),
  // reused by the hover redraw so it doesn't re-probe the DOM on every hover.
  const resolvedColorsRef = useRef<Map<string, string>>(new Map());

  // Sticky tooltip: a click on a point pins the tooltip; a click off it unpins.
  const [isSticky, setIsSticky] = useState(false);
  const isStickyRef = useRef(false);
  isStickyRef.current = isSticky;

  // Redraw on EVERY render (intentionally not a dep-gated effect). A <canvas> —
  // unlike retained SVG nodes — does not auto-repaint when props/CSS change, so
  // every render must repaint. Consumer CSS colouring (skipColorMappingDispatch)
  // also arrives a render or two after mount, so the colours are re-resolved
  // from the DOM each render too. drawChart is a single cheap pass over the
  // points and the colour probe is one batched style recalc.
  useEffect(() => {
    if (!enabled) return;
    const resolvedColors = resolveMarkColors(
      svgRef.current,
      renderData.map(d => d.label),
      label => {
        const d = renderData.find(p => p.label === label);
        return getColor(colorsMapping[label], d?.color);
      },
      buildScatterProbe,
      "fill"
    );
    resolvedColorsRef.current = resolvedColors;
    drawChart(canvasRef.current, {
      width,
      height,
      renderData,
      xScale,
      yScale,
      dScale,
      xAxisDataType,
      disabledItems,
      highlightItems,
      getColor,
      colorsMapping,
      resolvedColors,
      hoveredLabel: hoveredRef.current,
      stickyLabel: isStickyRef.current ? hoveredRef.current : null,
      showCrosshair: opts.showCrosshair ?? false,
      crosshairLabels: opts.crosshairLabels ?? false,
      pinIcon: typeof opts.pinIcon === "string" ? opts.pinIcon : undefined,
      margin: opts.margin,
    });
  });

  // Hover + click-to-pin: hit-test against the projected points, drive the
  // HTML tooltip + highlight. Bound once on the SVG (which sits above the
  // canvas and receives the pointer events).
  useEffect(() => {
    if (!enabled) return undefined;
    const svg = svgRef.current;
    if (!svg) return undefined;

    const redraw = () => {
      const o = optsRef.current;
      drawChart(o.canvasRef.current, {
        width: o.width,
        height: o.height,
        renderData: o.renderData,
        xScale: o.xScale,
        yScale: o.yScale,
        dScale: o.dScale,
        xAxisDataType: o.xAxisDataType,
        disabledItems: o.disabledItems,
        highlightItems: o.highlightItems,
        getColor: o.getColor,
        colorsMapping: o.colorsMapping,
        resolvedColors: resolvedColorsRef.current,
        hoveredLabel: hoveredRef.current,
        stickyLabel: isStickyRef.current ? hoveredRef.current : null,
        showCrosshair: o.showCrosshair ?? false,
        crosshairLabels: o.crosshairLabels ?? false,
        pinIcon: typeof o.pinIcon === "string" ? o.pinIcon : undefined,
        margin: o.margin,
      });
    };

    const hideTooltip = () => {
      const tip = optsRef.current.tooltipRef.current;
      if (tip) tip.style.display = "none";
    };

    const setHovered = (label: string | null) => {
      if (hoveredRef.current === label) return;
      hoveredRef.current = label;
      redraw();
      optsRef.current.onHighlightItem?.(label ? [label] : []);
    };

    // Nearest point whose body contains the cursor. renderData is sorted by
    // descending d; walking it in reverse means the topmost (smallest) point
    // under the cursor wins — matching the SVG stacking order.
    const hitTest = (mx: number, my: number): ScatterDataPoint | null => {
      const o = optsRef.current;
      let best: ScatterDataPoint | null = null;
      let bestDist = Infinity;
      for (let i = o.renderData.length - 1; i >= 0; i--) {
        const d = o.renderData[i];
        if (o.disabledItems.includes(d.label)) continue;
        const cx = projectX(d, o.xScale, o.xAxisDataType);
        const cy = o.yScale(d.y);
        const r = projectRadius(d, o.dScale, o.xAxisDataType);
        // Cull off-viewport points.
        if (cx + r < 0 || cx - r > o.width || cy + r < 0 || cy - r > o.height) continue;
        const dist = Math.hypot(cx - mx, cy - my);
        if (dist <= r && dist < bestDist) {
          bestDist = dist;
          best = d;
        }
      }
      return best;
    };

    // Position + fill the HTML tooltip for a hit at pixel (mx, my).
    const showTooltip = (mx: number, my: number, d: ScatterDataPoint) => {
      const o = optsRef.current;
      const tip = o.tooltipRef.current;
      const content = o.tooltipContentRef.current;
      if (!tip || !content) return;
      let html: string;
      if (o.tooltipFormatter) {
        html = o.tooltipFormatter(d);
      } else {
        html = `
          <div>
            <div>${d.label}</div>
            <div>${o.xAxisFormat ? o.xAxisFormat(d.x) : d.x}</div>
            <div>${o.yAxisFormat ? o.yAxisFormat(d.y) : d.y}</div>
          </div>
        `;
      }
      // Sanitize the consumer's tooltipFormatter HTML before injecting it
      // (the SVG renderer does the same).
      content.innerHTML = DOMPurify.sanitize(html);
      tip.style.left = `${mx + 10}px`;
      tip.style.top = `${my - 10}px`;
      tip.style.display = "block";
    };

    const handleMove = (event: MouseEvent) => {
      // A pinned tooltip is not moved or dismissed by the pointer.
      if (isStickyRef.current) return;
      const [mx, my] = pointer(event, svg);
      const hit = hitTest(mx, my);
      if (hit) {
        setHovered(hit.label);
        showTooltip(mx, my, hit);
      } else if (hoveredRef.current) {
        setHovered(null);
        hideTooltip();
      }
    };

    const handleLeave = () => {
      // A pinned tooltip survives the cursor leaving the chart.
      if (isStickyRef.current) return;
      setHovered(null);
      hideTooltip();
    };

    // Click on a point pins the tooltip; click on empty chart area unpins.
    const handleClick = (event: MouseEvent) => {
      const [mx, my] = pointer(event, svg);
      const hit = hitTest(mx, my);
      if (hit) {
        isStickyRef.current = true;
        setIsSticky(true);
        setHovered(hit.label);
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

export default useScatterPlotChartCanvasRendering;

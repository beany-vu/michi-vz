import { useEffect, useRef, useState } from "react";
import { line as d3line, pointer } from "d3";
import { resolveCurveFactory } from "../../../utils/curve";
import type { ScaleLinear, ScaleTime } from "d3";
import DOMPurify from "dompurify";
import { DataPoint, LineChartDataItem } from "../../../types/data";
import type { SeriesRun } from "./useLineChartGeometry";
import { sanitizeForClassName } from "./lineChartUtils";

// Opt-in Canvas 2D renderer for LineChart. Draws the line geometry and points
// onto a single <canvas> instead of thousands of retained SVG nodes — the DOM
// node count is what makes the SVG path jank on large datasets. Axes, title,
// mouse-line and the HTML tooltip stay in the SVG/HTML layered above.

type XScale = ScaleLinear<number, number> | ScaleTime<number, number>;
type YScale = ScaleLinear<number, number>;

const OPACITY_NOT_HIGHLIGHTED = 0.05;
const POINT_CIRCLE_RADIUS = 5;
const POINT_SQUARE_HALF = 6;
const POINT_TRIANGLE_SIZE = 16;
const POINT_STROKE = "#fdfdfd";
// How close (px, vertical) to a line the cursor must be to count as a hover.
const HIT_VERTICAL_TOLERANCE = 20;

// Project a data point to its pixel x — mirrors useLineChartGeometry's accessor.
const projectXValue = (d: DataPoint, xScale: XScale, xAxisDataType: string): number => {
  if (xAxisDataType === "number") return xScale(Number(d.date));
  if (xAxisDataType === "date_annual") return xScale(new Date(`${d.date}-01-01`));
  return xScale(new Date(d.date));
};

// Resolve each series' stroke colour the way the SVG renderer ends up coloured,
// honouring consumer CSS. In skipColorMappingDispatch / external-CSS setups the
// data colour is the "transparent" placeholder and the real colour is applied by
// a rule like `.line[data-label-safe="X"] { stroke: ...!important }`. Canvas
// pixels can't be styled by CSS, so we read the colour off a probe <path> via
// getComputedStyle. Probes are appended as a batch, then read, so the browser
// does a single style recalc for the whole batch.
const resolveSeriesColors = (
  svgEl: SVGSVGElement | null,
  drawData: LineChartDataItem[],
  colorsMapping: { [key: string]: string },
  getColor: (color?: string, fallback?: string) => string
): Map<string, string> => {
  const resolved = new Map<string, string>();
  if (!svgEl) {
    drawData.forEach(item =>
      resolved.set(item.label, getColor(colorsMapping[item.label], item.color))
    );
    return resolved;
  }
  const probes: Array<{ label: string; node: SVGPathElement; fallback: string }> = [];
  drawData.forEach(item => {
    const fallback = getColor(colorsMapping[item.label], item.color);
    const node = document.createElementNS("http://www.w3.org/2000/svg", "path");
    node.setAttribute("class", "line");
    node.setAttribute("data-label-safe", sanitizeForClassName(item.label));
    node.setAttribute("stroke", fallback);
    svgEl.appendChild(node);
    probes.push({ label: item.label, node, fallback });
  });
  probes.forEach(({ label, node, fallback }) => {
    const computed = window.getComputedStyle(node).stroke;
    resolved.set(label, computed && computed !== "none" ? computed : fallback);
  });
  probes.forEach(({ node }) => svgEl.removeChild(node));
  return resolved;
};

interface DrawParams {
  width: number;
  height: number;
  drawData: LineChartDataItem[];
  xScale: XScale;
  yScale: YScale;
  xAxisDataType: string;
  // Per-series stroke colour, already resolved (honours consumer CSS).
  resolvedColors: Map<string, string>;
  getRuns: (series: DataPoint[]) => SeriesRun[];
  highlightItems: string[];
  showDataPoints: boolean;
  hoveredLabel: string | null;
}

// Pure draw routine — clears the canvas and repaints every series. Kept at
// module scope (no React closure) so both the redraw effect and the hover
// handler can call it.
const drawChart = (canvas: HTMLCanvasElement | null, p: DrawParams): void => {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const dpr = window.devicePixelRatio || 1;
  const pxW = Math.round(p.width * dpr);
  const pxH = Math.round(p.height * dpr);
  if (canvas.width !== pxW || canvas.height !== pxH) {
    canvas.width = pxW;
    canvas.height = pxH;
    canvas.style.width = `${p.width}px`;
    canvas.style.height = `${p.height}px`;
  }
  // Draw in CSS pixels; the dpr transform keeps lines crisp on retina screens.
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, p.width, p.height);

  const px = (d: DataPoint) => projectXValue(d, p.xScale, p.xAxisDataType);
  const py = (d: DataPoint) => p.yScale(d.value);

  const highlightSet = new Set(p.highlightItems);
  if (p.hoveredLabel) highlightSet.add(p.hoveredLabel);
  const anyHighlight = highlightSet.size > 0;

  for (const item of p.drawData) {
    if (!item.series || item.series.length === 0) continue;
    const color = p.resolvedColors.get(item.label) || "transparent";
    ctx.globalAlpha = anyHighlight && !highlightSet.has(item.label) ? OPACITY_NOT_HIGHLIGHTED : 1;

    // --- line: one sub-path per certainty run (solid vs 4,4 dashed) ---
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    // Reuse d3's curve generators with a canvas context so curveMonotoneX /
    // curveBumpX / curveLinear are pixel-identical to the SVG renderer.
    const curve = resolveCurveFactory(item.curve);
    const lineGen = d3line<DataPoint>().x(px).y(py).curve(curve).context(ctx);
    for (const run of p.getRuns(item.series)) {
      ctx.setLineDash(run.certain ? [] : [4, 4]);
      ctx.beginPath();
      lineGen(run.points);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // --- points (opt-in) ---
    if (p.showDataPoints) {
      const shape = item.shape || "circle";
      for (const d of item.series) {
        const x = px(d);
        const y = py(d);
        ctx.beginPath();
        if (shape === "square") {
          ctx.rect(
            x - POINT_SQUARE_HALF,
            y - POINT_SQUARE_HALF,
            POINT_SQUARE_HALF * 2,
            POINT_SQUARE_HALF * 2
          );
        } else if (shape === "triangle") {
          const h = (POINT_TRIANGLE_SIZE * Math.sqrt(3)) / 2;
          ctx.moveTo(x, y - h * 0.7);
          ctx.lineTo(x + POINT_TRIANGLE_SIZE / 2, y + h * 0.3);
          ctx.lineTo(x - POINT_TRIANGLE_SIZE / 2, y + h * 0.3);
          ctx.closePath();
        } else {
          ctx.arc(x, y, POINT_CIRCLE_RADIUS, 0, Math.PI * 2);
        }
        ctx.fillStyle = color;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = POINT_STROKE;
        ctx.stroke();
      }
    }
  }
  ctx.globalAlpha = 1;
};

export interface CanvasRenderingOptions {
  enabled: boolean;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  svgRef: React.RefObject<SVGSVGElement | null>;
  tooltipRef: React.RefObject<HTMLDivElement | null>;
  // drawData is decimated (for painting); fullData is the complete data set
  // (for hit-testing, so the tooltip always lands on a real point).
  drawData: LineChartDataItem[];
  fullData: LineChartDataItem[];
  width: number;
  height: number;
  margin: { top: number; right: number; bottom: number; left: number };
  xScale: XScale;
  yScale: YScale;
  xAxisDataType: "number" | "date_annual" | "date_monthly";
  colorsMapping: { [key: string]: string };
  getColor: (color?: string, fallback?: string) => string;
  getRuns: (series: DataPoint[]) => SeriesRun[];
  highlightItems: string[];
  showDataPoints: boolean;
  tooltipFormatter: (point: DataPoint, series: DataPoint[], dataset: LineChartDataItem[]) => string;
  onHighlightItem?: (labels: string[]) => void;
}

const useLineChartCanvasRendering = (opts: CanvasRenderingOptions): { isSticky: boolean } => {
  const {
    enabled,
    canvasRef,
    svgRef,
    width,
    height,
    drawData,
    xScale,
    yScale,
    xAxisDataType,
    colorsMapping,
    getColor,
    getRuns,
    highlightItems,
    showDataPoints,
  } = opts;

  // Latest options for the once-bound hover listener (avoids stale closures).
  const optsRef = useRef(opts);
  optsRef.current = opts;

  // Currently hovered series label — drives the dim/highlight on redraw.
  const hoveredRef = useRef<string | null>(null);

  // Sticky tooltip: a click on a line pins the tooltip; a click off it unpins.
  const [isSticky, setIsSticky] = useState(false);
  const isStickyRef = useRef(false);
  isStickyRef.current = isSticky;

  // Per-series colours resolved from the DOM (honouring consumer CSS), reused by
  // the hover redraw so it doesn't re-probe the DOM on every hover.
  const resolvedColorsRef = useRef<Map<string, string>>(new Map());

  // Redraw on EVERY render (intentionally not a dep-gated effect). Consumer CSS
  // colouring (skipColorMappingDispatch) arrives a render or two after mount via
  // the metadata round-trip, and a <canvas> — unlike an SVG <path> — does not
  // auto-repaint when CSS changes. Re-resolving + redrawing each render keeps it
  // in sync. drawChart works on decimated data and the colour probe is a single
  // batched style recalc, so this stays cheap.
  useEffect(() => {
    if (!enabled) return;
    const resolvedColors = resolveSeriesColors(svgRef.current, drawData, colorsMapping, getColor);
    resolvedColorsRef.current = resolvedColors;
    drawChart(canvasRef.current, {
      width,
      height,
      drawData,
      xScale,
      yScale,
      xAxisDataType,
      resolvedColors,
      getRuns,
      highlightItems,
      showDataPoints,
      hoveredLabel: hoveredRef.current,
    });
  });

  // Hover + click-to-pin: hit-test against the full data, drive the HTML
  // tooltip + highlight. Bound once on the SVG (which sits above the canvas
  // and receives the events).
  useEffect(() => {
    if (!enabled) return undefined;
    const svg = svgRef.current;
    if (!svg) return undefined;

    const redraw = () => {
      const o = optsRef.current;
      drawChart(o.canvasRef.current, {
        width: o.width,
        height: o.height,
        drawData: o.drawData,
        xScale: o.xScale,
        yScale: o.yScale,
        xAxisDataType: o.xAxisDataType,
        resolvedColors: resolvedColorsRef.current,
        getRuns: o.getRuns,
        highlightItems: o.highlightItems,
        showDataPoints: o.showDataPoints,
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

    // The series whose nearest-by-x point is vertically closest to the cursor
    // — the line under (or near) the pointer — or null if none is close.
    const hitTest = (mx: number, my: number) => {
      const o = optsRef.current;
      let hitItem: LineChartDataItem | null = null;
      let hitPoint: DataPoint | null = null;
      let best = HIT_VERTICAL_TOLERANCE;
      for (const item of o.fullData) {
        if (!item.series || item.series.length === 0) continue;
        let nearest = item.series[0];
        let nd = Infinity;
        for (const d of item.series) {
          const dist = Math.abs(projectXValue(d, o.xScale, o.xAxisDataType) - mx);
          if (dist < nd) {
            nd = dist;
            nearest = d;
          }
        }
        const v = Math.abs(o.yScale(nearest.value) - my);
        if (v < best) {
          best = v;
          hitItem = item;
          hitPoint = nearest;
        }
      }
      return hitItem && hitPoint ? { item: hitItem, point: hitPoint } : null;
    };

    // Position + fill the HTML tooltip for a hit at pixel (mx, my).
    const showTooltip = (mx: number, my: number, item: LineChartDataItem, point: DataPoint) => {
      const o = optsRef.current;
      const tip = o.tooltipRef.current;
      if (!tip) return;
      tip.style.visibility = "visible";
      const tipRect = tip.getBoundingClientRect();
      const svgRect = svg.getBoundingClientRect();
      const xPos = mx + 10;
      const yPos = my - 25;
      tip.style.left =
        xPos + tipRect.width > svgRect.width - o.margin.right
          ? `${mx - tipRect.width - 10}px`
          : `${xPos}px`;
      tip.style.top = yPos < o.margin.top ? `${my + 10}px` : `${yPos}px`;
      const contentEl = tip.querySelector(".tooltip-content");
      if (contentEl) {
        // Sanitize the consumer's tooltipFormatter HTML before injecting it
        // (the SVG renderer does the same — see useLineChartPathsShapesRendering).
        contentEl.innerHTML = DOMPurify.sanitize(
          o.tooltipFormatter({ ...point, label: item.label } as DataPoint, item.series, o.fullData)
        );
      }
    };

    const handleMove = (event: MouseEvent) => {
      // A pinned tooltip is not moved or dismissed by the pointer.
      if (isStickyRef.current) return;
      const [mx, my] = pointer(event, svg);
      const hit = hitTest(mx, my);
      if (hit) {
        setHovered(hit.item.label);
        showTooltip(mx, my, hit.item, hit.point);
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

    // Click on a line pins the tooltip there; click on empty chart area unpins.
    const handleClick = (event: MouseEvent) => {
      const [mx, my] = pointer(event, svg);
      const hit = hitTest(mx, my);
      if (hit) {
        isStickyRef.current = true;
        setIsSticky(true);
        setHovered(hit.item.label);
        showTooltip(mx, my, hit.item, hit.point);
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

export default useLineChartCanvasRendering;

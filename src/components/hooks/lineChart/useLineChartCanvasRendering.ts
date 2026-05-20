import { useEffect, useRef } from "react";
import { line as d3line, curveBumpX, curveLinear, pointer } from "d3";
import type { ScaleLinear, ScaleTime } from "d3";
import DOMPurify from "dompurify";
import { DataPoint, LineChartDataItem } from "../../../types/data";
import type { SeriesRun } from "./useLineChartGeometry";

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

interface DrawParams {
  width: number;
  height: number;
  drawData: LineChartDataItem[];
  xScale: XScale;
  yScale: YScale;
  xAxisDataType: string;
  colorsMapping: { [key: string]: string };
  getColor: (color: string | undefined, fallback: string | null) => string;
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
    const color = p.getColor(p.colorsMapping[item.label], item.color);
    ctx.globalAlpha = anyHighlight && !highlightSet.has(item.label) ? OPACITY_NOT_HIGHLIGHTED : 1;

    // --- line: one sub-path per certainty run (solid vs 4,4 dashed) ---
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    // Reuse d3's curve generators with a canvas context so curveBumpX /
    // curveLinear are pixel-identical to the SVG renderer.
    const curve = item.curve === "curveLinear" ? curveLinear : curveBumpX;
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
  canvasRef: React.RefObject<HTMLCanvasElement>;
  svgRef: React.RefObject<SVGSVGElement>;
  tooltipRef: React.RefObject<HTMLDivElement>;
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
  getColor: (color: string | undefined, fallback: string | null) => string;
  getRuns: (series: DataPoint[]) => SeriesRun[];
  highlightItems: string[];
  showDataPoints: boolean;
  tooltipFormatter: (point: DataPoint, series: DataPoint[], dataset: LineChartDataItem[]) => string;
  onHighlightItem?: (labels: string[]) => void;
}

const useLineChartCanvasRendering = (opts: CanvasRenderingOptions): void => {
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

  // Redraw whenever the data, scales, size, colours or highlight change.
  useEffect(() => {
    if (!enabled) return;
    drawChart(canvasRef.current, {
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
      hoveredLabel: hoveredRef.current,
    });
  }, [
    enabled,
    canvasRef,
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
  ]);

  // Hover: hit-test against the full data, drive the HTML tooltip + highlight.
  // Bound once on the SVG (which sits above the canvas and receives the events).
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
        colorsMapping: o.colorsMapping,
        getColor: o.getColor,
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

    const handleMove = (event: MouseEvent) => {
      const o = optsRef.current;
      const [mx, my] = pointer(event, svg);

      // Pick the series whose nearest-by-x point is vertically closest to the
      // cursor — the line under (or near) the pointer.
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

      if (hitItem && hitPoint) {
        if (hoveredRef.current !== hitItem.label) {
          hoveredRef.current = hitItem.label;
          redraw();
          o.onHighlightItem?.([hitItem.label]);
        }
        const tip = o.tooltipRef.current;
        if (tip) {
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
              o.tooltipFormatter(
                { ...hitPoint, label: hitItem.label } as DataPoint,
                hitItem.series,
                o.fullData
              )
            );
          }
        }
      } else if (hoveredRef.current) {
        hoveredRef.current = null;
        redraw();
        o.onHighlightItem?.([]);
        hideTooltip();
      }
    };

    const handleLeave = () => {
      if (hoveredRef.current) {
        hoveredRef.current = null;
        redraw();
        optsRef.current.onHighlightItem?.([]);
      }
      hideTooltip();
    };

    svg.addEventListener("mousemove", handleMove);
    svg.addEventListener("mouseleave", handleLeave);
    return () => {
      svg.removeEventListener("mousemove", handleMove);
      svg.removeEventListener("mouseleave", handleLeave);
    };
  }, [enabled, svgRef]);
};

export default useLineChartCanvasRendering;

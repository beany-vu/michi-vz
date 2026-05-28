import { useEffect, useRef, useState } from "react";
import { area as d3area, curveMonotoneX, pointer } from "d3";
import type { ScaleLinear, ScaleTime } from "d3";
import DOMPurify from "dompurify";
import { resolveMarkColors, type ColorProbe } from "../canvas/resolveMarkColors";

// Opt-in Canvas 2D renderer for AreaChart (Phase 4 of the performance
// overhaul). Draws the stacked area paths, the per-segment `data-indicator`
// lines and the vertical `hover-line` onto a single <canvas> instead of one
// retained SVG node per area / per data point. Axes, title, the HTML tooltip
// and loading / no-data overlays stay in the SVG/HTML layered above.
//
// Modelled on useLineChartCanvasRendering: a module-scope pure `drawChart`, a
// redraw effect that runs every render, and a once-bound hover/click effect
// that drives the HTML tooltip and click-to-pin sticky behaviour.

type XScale = ScaleLinear<number, number> | ScaleTime<number, number>;
type YScale = ScaleLinear<number, number>;

const OPACITY_NOT_HIGHLIGHTED = 0.05;
const AREA_STROKE = "#fff";
const AREA_STROKE_WIDTH = 1;
// Per-data-point separator. Used to be a solid #ccc 1px line drawn over
// every area segment — at high data density it read as a forest of vertical
// slashes through the colour. Switched to a near-invisible white hairline so
// the data positions can still be inferred if you look for them, but they
// don't dominate the chart. Matches the SVG-side change in AreaChart.tsx.
const INDICATOR_STROKE = "rgba(255, 255, 255, 0.18)";
const INDICATOR_STROKE_WIDTH = 0.5;
const HOVER_LINE_STROKE = "#666";
const HOVER_LINE_WIDTH = 2;

// A stacked data point as produced by d3.stack(): [y0, y1] with `data` back-ref.
interface AreaDataPoint {
  0: number;
  1: number;
  data: { date: number; [key: string]: number | undefined };
}

// One stacked key: the key name, its stacked values and its resolved fill.
export interface AreaDatum {
  key: string;
  values: AreaDataPoint[];
  fill: string;
}

type DataPoint = { date: number; [key: string]: number | undefined };

// Project a stacked point to its pixel x — mirrors AreaChart's area generator.
const projectX = (d: AreaDataPoint, xScale: XScale, xAxisDataType: string): number => {
  if (xAxisDataType === "number") return xScale(d.data.date);
  return xScale(new Date(d.data.date).getTime());
};

interface DrawParams {
  width: number;
  height: number;
  margin: { top: number; right: number; bottom: number; left: number };
  areaData: AreaDatum[];
  xScale: XScale;
  yScale: YScale;
  xAxisDataType: string;
  // Per-area fill colour resolved from the DOM (honours consumer CSS); the
  // raw datum.fill is only the fallback. See resolveMarkColors / the redraw
  // effect below for why this is needed.
  resolvedColors: Map<string, string>;
  highlightItems: string[];
  hoveredKey: string | null;
  hoverX: number | null;
}

// Pure draw routine — clears the canvas and repaints every stacked area, the
// data-indicator lines and the hover line. Kept at module scope (no React
// closure) so both the redraw effect and the hover handler can call it.
const drawChart = (canvas: HTMLCanvasElement | null, p: DrawParams): void => {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  // jsdom has no 2D context — getContext returns null there; early-return so
  // tests do not crash (mirrors setupCanvas's null contract).
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
  // Draw in CSS pixels; the dpr transform keeps marks crisp on retina screens.
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, p.width, p.height);

  const highlightSet = new Set(p.highlightItems);
  if (p.hoveredKey) highlightSet.add(p.hoveredKey);
  const anyHighlight = highlightSet.size > 0;

  // Reuse d3.area with the canvas context so the stacked-area curves are
  // pixel-identical to the SVG renderer's `d` (curveMonotoneX cubic Béziers).
  const areaGen = d3area<AreaDataPoint>()
    .defined(() => true)
    .x(d => projectX(d, p.xScale, p.xAxisDataType))
    .y0(d => p.yScale(d[0] || 0))
    .y1(d => p.yScale(d[1] || 0))
    .curve(curveMonotoneX)
    .context(ctx);

  // --- stacked areas: keys array order = bottom-to-top ---
  for (const datum of p.areaData) {
    if (!datum.values || datum.values.length === 0) continue;
    ctx.globalAlpha =
      anyHighlight && !highlightSet.has(datum.key) ? OPACITY_NOT_HIGHLIGHTED : 1;
    ctx.beginPath();
    areaGen(datum.values);
    ctx.fillStyle = p.resolvedColors.get(datum.key) || datum.fill || "#fdfdfd";
    ctx.fill();
    ctx.lineWidth = AREA_STROKE_WIDTH;
    ctx.strokeStyle = AREA_STROKE;
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // --- data-indicator: a thin vertical line per stacked segment with height ---
  ctx.strokeStyle = INDICATOR_STROKE;
  ctx.lineWidth = INDICATOR_STROKE_WIDTH;
  for (const datum of p.areaData) {
    for (const dp of datum.values) {
      const xPos = projectX(dp, p.xScale, p.xAxisDataType);
      const y0 = p.yScale(dp[0] || 0);
      const y1 = p.yScale(dp[1] || 0);
      // Only show the indicator where the segment has height (data exists).
      if (y0 - y1 <= 0) continue;
      ctx.beginPath();
      ctx.moveTo(xPos, y1);
      ctx.lineTo(xPos, y0);
      ctx.stroke();
    }
  }

  // --- hover-line: vertical line at the hovered x ---
  if (p.hoverX != null) {
    ctx.strokeStyle = HOVER_LINE_STROKE;
    ctx.lineWidth = HOVER_LINE_WIDTH;
    ctx.beginPath();
    ctx.moveTo(p.hoverX, p.margin.top);
    ctx.lineTo(p.hoverX, p.height - p.margin.bottom);
    ctx.stroke();
  }
};

export interface AreaCanvasRenderingOptions {
  enabled: boolean;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  svgRef: React.RefObject<SVGSVGElement | null>;
  tooltipRef: React.RefObject<HTMLDivElement | null>;
  tooltipContentRef: React.RefObject<HTMLDivElement | null>;
  // Full row data, used for bisection nearest-date hit-testing.
  series: DataPoint[];
  // Stacked areas (key + d3.stack values + resolved fill).
  areaData: AreaDatum[];
  width: number;
  height: number;
  margin: { top: number; right: number; bottom: number; left: number };
  xScale: XScale;
  yScale: YScale;
  xAxisDataType: "number" | "date_annual" | "date_monthly";
  highlightItems: string[];
  // Builds the tooltip HTML for a hovered row + key (already null-safe).
  tooltipFormatter: (dataPoint: DataPoint, key: string) => string | null;
  onHighlightItem?: (labels: string[]) => void;
}

const useAreaChartCanvasRendering = (
  opts: AreaCanvasRenderingOptions
): { isSticky: boolean } => {
  const {
    enabled,
    canvasRef,
    svgRef,
    width,
    height,
    margin,
    areaData,
    xScale,
    yScale,
    xAxisDataType,
    highlightItems,
  } = opts;

  // Latest options for the once-bound hover listener (avoids stale closures).
  const optsRef = useRef(opts);
  optsRef.current = opts;

  // Currently hovered key + hover x — drive the dim/highlight + hover-line.
  const hoveredRef = useRef<string | null>(null);
  const hoverXRef = useRef<number | null>(null);

  // Sticky tooltip: a click on an area pins the tooltip; a click off it unpins.
  const [isSticky, setIsSticky] = useState(false);
  const isStickyRef = useRef(false);
  isStickyRef.current = isSticky;

  // Per-area fill colours resolved from the DOM (honouring consumer CSS),
  // reused by the hover redraw so it doesn't re-probe the DOM on every hover.
  const resolvedColorsRef = useRef<Map<string, string>>(new Map());

  // Builds a probe replicating AreaChart's real area <path> mark: same tag
  // (`path`), no class (the real mark has none — see AreaChart.tsx ~line 736),
  // the standard data-label / data-label-safe attributes, and the data-colour
  // fallback pre-set on `fill` so getComputedStyle returns it when no consumer
  // CSS rule matches.
  const buildProbe = (label: string, labelSafe: string, fallback: string): ColorProbe => {
    const node = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path"
    ) as SVGPathElement;
    node.setAttribute("data-label", label);
    node.setAttribute("data-label-safe", labelSafe);
    node.setAttribute("fill", fallback);
    node.setAttribute("visibility", "hidden");
    return { root: node, target: node };
  };

  // In canvas mode the hook owns the tooltip's visibility imperatively, so it
  // starts hidden until a hover lands on an area.
  useEffect(() => {
    if (!enabled) return;
    const tip = optsRef.current.tooltipRef.current;
    if (tip) tip.style.visibility = "hidden";
  }, [enabled]);

  // Redraw on EVERY render (intentionally not a dep-gated effect). A <canvas>,
  // unlike an SVG node, does not auto-repaint when props/CSS change, so the
  // canvas is repainted each render to stay in sync with React state. The fill
  // colours are also re-resolved each render: consumer CSS colouring
  // (skipColorMappingDispatch) arrives a render or two after mount, and the
  // <canvas> can't be CSS-styled, so we probe the DOM for the real colour each
  // time. The probe is a single batched style recalc, so this stays cheap.
  useEffect(() => {
    if (!enabled) return;
    const resolvedColors = resolveMarkColors(
      svgRef.current,
      areaData.map(d => d.key),
      key => areaData.find(d => d.key === key)?.fill || "#fdfdfd",
      buildProbe,
      "fill"
    );
    resolvedColorsRef.current = resolvedColors;
    drawChart(canvasRef.current, {
      width,
      height,
      margin,
      areaData,
      xScale,
      yScale,
      xAxisDataType,
      resolvedColors,
      highlightItems,
      hoveredKey: hoveredRef.current,
      hoverX: hoverXRef.current,
    });
  });

  // Hover + click-to-pin: hit-test against the row data, drive the HTML
  // tooltip + highlight. Bound once on the SVG (which sits above the canvas
  // and receives the events).
  useEffect(() => {
    if (!enabled) return undefined;
    const svg = svgRef.current;
    if (!svg) return undefined;

    // Date value for bisector comparison — mirrors AreaChart's getDateValue.
    const getDateValue = (d: DataPoint): number => {
      const o = optsRef.current;
      if (o.xAxisDataType === "number") return d.date;
      return new Date(
        o.xAxisDataType === "date_annual" ? `${d.date} 01 01` : d.date
      ).getTime();
    };

    const redraw = () => {
      const o = optsRef.current;
      drawChart(o.canvasRef.current, {
        width: o.width,
        height: o.height,
        margin: o.margin,
        areaData: o.areaData,
        xScale: o.xScale,
        yScale: o.yScale,
        xAxisDataType: o.xAxisDataType,
        resolvedColors: resolvedColorsRef.current,
        highlightItems: o.highlightItems,
        hoveredKey: hoveredRef.current,
        hoverX: hoverXRef.current,
      });
    };

    const hideTooltip = () => {
      const tip = optsRef.current.tooltipRef.current;
      if (tip) tip.style.visibility = "hidden";
    };

    const setHovered = (key: string | null, hoverX: number | null) => {
      if (hoveredRef.current === key && hoverXRef.current === hoverX) return;
      hoveredRef.current = key;
      hoverXRef.current = hoverX;
      redraw();
      optsRef.current.onHighlightItem?.(key ? [key] : []);
    };

    // Nearest row by x (bisection) for the cursor x.
    const nearestRow = (mx: number): DataPoint | null => {
      const o = optsRef.current;
      const series = o.series;
      if (series.length === 0) return null;
      const x0 = o.xScale.invert(mx);
      const x0Val =
        o.xAxisDataType === "number"
          ? (x0 as number)
          : (x0 as Date).getTime();
      let nearest = series[0];
      let best = Infinity;
      for (const d of series) {
        const dist = Math.abs(getDateValue(d) - x0Val);
        if (dist < best) {
          best = dist;
          nearest = d;
        }
      }
      return nearest;
    };

    // Stacked-area Y-hit-test: walk the stacked segments top-down and return
    // the key whose [y1, y0] pixel band contains the cursor — mirrors
    // AreaChart's findAreaAtPosition.
    const findAreaAtPosition = (my: number, dataPoint: DataPoint): string | null => {
      const o = optsRef.current;
      for (let i = o.areaData.length - 1; i >= 0; i--) {
        const area = o.areaData[i];
        const pointData = area.values.find(v => v.data.date === dataPoint.date);
        if (pointData) {
          const y0 = o.yScale(pointData[0] || 0);
          const y1 = o.yScale(pointData[1] || 0);
          if (my >= y1 && my <= y0) return area.key;
        }
      }
      return null;
    };

    // Pixel x for the hover-line at the matched data point.
    const rowPixelX = (dataPoint: DataPoint): number => {
      const o = optsRef.current;
      if (o.xAxisDataType === "number") return o.xScale(dataPoint.date);
      return o.xScale(
        new Date(
          o.xAxisDataType === "date_annual"
            ? `${dataPoint.date} 01 01`
            : dataPoint.date
        ).getTime()
      );
    };

    // Position + fill the HTML tooltip for a hit at pixel (mx, my).
    const showTooltip = (mx: number, my: number, key: string, dataPoint: DataPoint) => {
      const o = optsRef.current;
      const tip = o.tooltipRef.current;
      const content = o.tooltipContentRef.current;
      if (!tip) return;
      if (content) {
        // Sanitize the consumer's tooltipFormatter HTML before injecting it.
        const safeHtml = DOMPurify.sanitize(o.tooltipFormatter(dataPoint, key) ?? "");
        content.innerHTML = safeHtml;
      }
      tip.style.visibility = "visible";
      const tipW = tip.offsetWidth;
      const tipH = tip.offsetHeight;
      tip.style.transform = `translate(${mx - tipW / 2}px, ${my - tipH - 10}px)`;
    };

    const handleMove = (event: MouseEvent) => {
      // A pinned tooltip is not moved or dismissed by the pointer.
      if (isStickyRef.current) return;
      if (optsRef.current.series.length === 0) return;
      const [mx, my] = pointer(event, svg);
      const row = nearestRow(mx);
      if (!row) return;
      const key = findAreaAtPosition(my, row);
      if (!key) {
        // Cursor over white space (total < domain max) — clear hover.
        if (hoveredRef.current) setHovered(null, null);
        hideTooltip();
        return;
      }
      setHovered(key, rowPixelX(row));
      showTooltip(mx, my, key, row);
    };

    const handleLeave = (event: MouseEvent) => {
      // A pinned tooltip survives the cursor leaving the chart.
      if (isStickyRef.current) return;
      const target = event.relatedTarget as Node | null;
      if (target && svg.contains(target)) return;
      setHovered(null, null);
      hideTooltip();
    };

    // Click on an area pins the tooltip there; click on empty area unpins.
    const handleClick = (event: MouseEvent) => {
      if (optsRef.current.series.length === 0) return;
      const [mx, my] = pointer(event, svg);
      const row = nearestRow(mx);
      const key = row ? findAreaAtPosition(my, row) : null;
      if (row && key) {
        isStickyRef.current = true;
        setIsSticky(true);
        setHovered(key, rowPixelX(row));
        showTooltip(mx, my, key, row);
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
    svg.addEventListener("mouseout", handleLeave);
    svg.addEventListener("click", handleClick);
    document.addEventListener("click", handleDocClick);
    return () => {
      svg.removeEventListener("mousemove", handleMove);
      svg.removeEventListener("mouseout", handleLeave);
      svg.removeEventListener("click", handleClick);
      document.removeEventListener("click", handleDocClick);
    };
  }, [enabled, svgRef]);

  return { isSticky };
};

export default useAreaChartCanvasRendering;

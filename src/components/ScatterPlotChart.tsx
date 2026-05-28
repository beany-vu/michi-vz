import React, {
  useMemo,
  useRef,
  useEffect,
  useCallback,
  Suspense,
  useState,
  useLayoutEffect,
} from "react";
import isEqual from "lodash/isEqual";
import defaultConf from "./hooks/useDefaultConfig";
import * as d3 from "d3";
import Title from "./shared/Title";
import XaxisLinear from "./shared/XaxisLinear";
import XaxisBand from "./shared/XaxisBand";
import { DEFAULT_COLORS } from "./shared/colors";
import YaxisLinear from "./shared/YaxisLinear";
import { drawHalfLeftCircle } from "../components/shared/helpers";
import { useDisplayIsNodata } from "./hooks/useDisplayIsNodata";
import styled from "styled-components";
import useDeepCompareEffect from "use-deep-compare-effect";
import LoadingIndicator from "./shared/LoadingIndicator";
import { sanitizeForClassName } from "./hooks/lineChart/lineChartUtils";
import TooltipHint from "src/components/shared/TooltipHint";
import MichiVzCredit from "./shared/MichiVzCredit";
import useScatterPlotChartCanvasRendering from "./hooks/scatterPlotChart/useScatterPlotChartCanvasRendering";
import DOMPurify from "dompurify";

function getColor(mappedColor?: string, dataColor?: string): string {
  const FALLBACK_COLOR = "rgba(253, 253, 253, 0.5)";
  if (mappedColor) return mappedColor;
  if (dataColor) return dataColor;
  return FALLBACK_COLOR;
}

const Styled = styled.div`
  .shape {
    width: 100%;
    height: 100%;
    background-color: var(--data-background);
  }

  .shape-circle {
    border-radius: 50%;
  }

  .shape-square {
    border-radius: 0;
  }

  .shape-triangle {
    width: 0;
    height: 0;
    border-width: 0 calc(var(--data-size) / 2) var(--data-size) calc(var(--data-size) / 2);
    border-color: transparent transparent var(--data-background) transparent;
    border-style: solid;
    background: transparent !important;
  }

  circle,
  rect,
  path {
    transition-property: all;
    transition-duration: 0.1s;
    transition-timing-function: ease-out;
    transition-behavior: allow-discrete;
  }
`;

interface DataPoint {
  x: number;
  y: number;
  label: string;
  color?: string;
  d: number;
  meta?: never;
  shape?: "square" | "circle" | "triangle";
  date?: string;
}

interface ChartMetadata {
  xAxisDomain: string[];
  yAxisDomain: [number, number];
  visibleItems: string[];
  renderedData: { [key: string]: DataPoint[] };
  chartType: "scatter-plot-chart";
  legendData?: { label: string; color: string; order: number; disabled?: boolean }[];
}

interface ScatterPlotChartProps<T extends number | string> {
  dataSet: DataPoint[];
  width: number;
  height: number;
  margin: { top: number; right: number; bottom: number; left: number };
  title: string;
  children?: React.ReactNode;
  isLoading?: boolean;
  isLoadingComponent?: React.ReactNode;
  isNodataComponent?: React.ReactNode;
  isNodata?: boolean | ((dataSet: DataPoint[]) => boolean);
  xAxisFormat?: (d: number | string) => string;
  yAxisFormat?: (d: number | string) => string;
  yTicksQty?: number;
  xAxisDataType?: "number" | "date_annual" | "date_monthly" | "band";
  tooltipFormatter?: (d: DataPoint) => string;
  showGrid?: { x: boolean; y: boolean };
  xAxisDomain?: [T, T];
  yAxisDomain?: [T, T];
  dScaleLegend?: {
    title?: string;
    valueFormatter?: (d: number) => string;
  };
  dScaleLegendFormatter?: (domain: number[], dScale: d3.ScaleLinear<number, number>) => string;
  // Updated filter property to include date filtering
  filter?: {
    limit: number;
    criteria: "x" | "y" | "d"; // Sort by x, y, or d values
    sortingDir: "asc" | "desc";
    date?: string; // Added date property for filtering by date
  };
  onChartDataProcessed?: (metadata: ChartMetadata) => void;
  onHighlightItem?: (labels: string[]) => void;
  // colors is the color palette for new generated colors
  colors?: string[];
  // colorsMapping is the color mapping for existing colors
  // the purpose is to share the same color mapping between charts
  colorsMapping?: { [key: string]: string };
  // Callback to notify parent about generated color mapping
  onColorMappingGenerated?: (colorsMapping: { [key: string]: string }) => void;
  /**
   * When true, the chart opts into "wait-for-legend" / external-color mode:
   *  - it does NOT call `onColorMappingGenerated` (no Redux ping-pong with the
   *    consumer's legend store)
   *  - the auto-generated COLORS-array fallback is replaced with `"transparent"`
   *    so any label without an entry in `colorsMapping` and no `item.color`
   *    paints invisibly until the consumer provides its color (typically via
   *    CSS rules with `!important`, or a Redux-side color generator that feeds
   *    both chart and legend from a single source of truth)
   *  - labels that DO have `item.color` or are in `colorsMapping` paint with
   *    their proper color from frame 1
   *
   * Set this when the chart is wrapped by an external coloring system. Without
   * it, the chart's auto-generated COLORS-array mapping leaks into the
   * consumer's legend store and produces a visible mismatch (chart and legend
   * disagree on what color a given label should be).
   *
   * Default `false` preserves backward-compatible behaviour.
   */
  skipColorMappingDispatch?: boolean;
  // highlightItems and disabledItems as props for better performance
  highlightItems?: string[];
  disabledItems?: string[];
  /**
   * Rendering backend for the point cloud.
   *  - "svg" (default): the original SVG/D3 rendering, unchanged, one DOM
   *    node per point.
   *  - "canvas": draw every point onto a single <canvas>, for large datasets
   *    (thousands+ of points). Axes, title, d-scale legend and the tooltip are
   *    unchanged in both modes.
   */
  renderer?: "svg" | "canvas";
  /**
   * When true, shows a dashed crosshair on hover for unpinned bubbles.
   * Pinned bubbles always show a solid crosshair regardless of this prop.
   */
  showCrosshair?: boolean;
  /**
   * When true (and showCrosshair is also true), renders a circle badge on each axis at the
   * crosshair intersection showing the formatted axis value. Default false.
   */
  crosshairLabels?: boolean;
  /**
   * Icon shown in the top-right corner of each pinned tooltip.
   * - string (e.g. `"📌"`, `"★"`) — rendered as text
   * - React.ReactNode — rendered as JSX
   * - `false` / `null` / `""` — disables the icon entirely
   * Default: `"📌"`
   */
  pinIcon?: string | React.ReactNode;
}

const ScatterPlotChart: React.FC<ScatterPlotChartProps<number | string>> = ({
  dataSet = [],
  width = defaultConf.WIDTH,
  height = defaultConf.HEIGHT,
  margin = defaultConf.MARGIN,
  title,
  children,
  isLoading = false,
  isLoadingComponent,
  isNodataComponent,
  isNodata,
  xAxisFormat,
  yAxisFormat,
  yTicksQty,
  xAxisDataType = "number",
  tooltipFormatter,
  showGrid = defaultConf.SHOW_GRID,
  xAxisDomain,
  yAxisDomain,
  dScaleLegend,
  dScaleLegendFormatter,
  filter,
  onChartDataProcessed,
  onHighlightItem,
  colors = DEFAULT_COLORS,
  colorsMapping = {},
  onColorMappingGenerated,
  skipColorMappingDispatch = false,
  highlightItems = [],
  disabledItems = [],
  renderer = "svg",
  showCrosshair = false,
  crosshairLabels = false,
  pinIcon = "📌",
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const tooltipContentRef = useRef<HTMLDivElement>(null);
  const svgContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activePoint, setActivePoint] = useState<DataPoint | null>(null);
  // Multi-pin: label → DataPoint for every currently pinned bubble.
  const [pinnedPoints, setPinnedPoints] = useState<Map<string, DataPoint>>(new Map());
  const pinnedPointsRef = useRef<Map<string, DataPoint>>(new Map());
  pinnedPointsRef.current = pinnedPoints;
  const lastColorMappingSentRef = useRef<{ [key: string]: string }>({});

  // Use ref to capture latest tooltipFormatter to avoid stale closure issues
  const tooltipFormatterRef = useRef(tooltipFormatter);
  tooltipFormatterRef.current = tooltipFormatter;

  // Generate colors for data points that don't have colors in colorsMapping
  const generatedColorsMapping = useMemo(() => {
    const newMapping = { ...colorsMapping };

    if (dataSet && dataSet.length > 0) {
      // Assign colors to new items only
      let colorIndex = Object.keys(colorsMapping).length;
      for (const dataPoint of dataSet) {
        if (!newMapping[dataPoint.label]) {
          newMapping[dataPoint.label] = skipColorMappingDispatch ? "transparent" : colors[colorIndex % colors.length];
          colorIndex++;
        }
      }
    }

    return newMapping;
  }, [dataSet, colorsMapping, colors]);

  // Memoized callback for color mapping generation
  const memoizedOnColorMappingGenerated = useCallback(
    (colorsMapping: { [key: string]: string }) => {
      if (onColorMappingGenerated && !skipColorMappingDispatch) {
        onColorMappingGenerated(colorsMapping);
      }
    },
    [onColorMappingGenerated]
  );

  // Notify parent about generated color mapping with infinite loop protection
  useLayoutEffect(() => {
    if (memoizedOnColorMappingGenerated) {
      if (!isEqual(generatedColorsMapping, lastColorMappingSentRef.current)) {
        lastColorMappingSentRef.current = { ...generatedColorsMapping };
        memoizedOnColorMappingGenerated(generatedColorsMapping);
      }
    }
  }, [generatedColorsMapping, memoizedOnColorMappingGenerated]);

  const renderCompleteRef = useRef(false);
  // Add ref for previous data comparison
  const prevChartDataRef = useRef<ChartMetadata | null>(null);

  useLayoutEffect(() => {
    renderCompleteRef.current = true;
  }, []);

  // Apply filtering based on filter prop, now including date filtering
  const filteredDataSet = useMemo(() => {
    if (!filter) return dataSet;

    // First filter by date if specified
    let dateFiltered = dataSet;
    if (filter.date) {
      dateFiltered = dataSet.filter(d => d.date === filter.date);
    }

    // Then filter out disabledItems
    const filteredByDisabled = dateFiltered.filter(d => !disabledItems.includes(d.label));

    // Sort by the specified criteria
    return filteredByDisabled
      .slice() // Create a copy to avoid mutating the original
      .sort((a, b) => {
        const aVal = a[filter.criteria];
        const bVal = b[filter.criteria];
        return filter.sortingDir === "desc" ? bVal - aVal : aVal - bVal;
      })
      .slice(0, filter.limit); // Take only the first 'limit' items
  }, [dataSet, filter, disabledItems]);

  // Sort data points by 'd' value in descending order for rendering
  // This ensures larger circles are rendered first (appear at the back)
  const renderOrderedDataSet = useMemo(() => {
    return [...filteredDataSet].sort((a, b) => b.d - a.d);
  }, [filteredDataSet]);

  // Use filteredDataSet instead of dataSet in all calculations
  const xValues = useMemo(() => filteredDataSet.map(d => d.x || 0), [filteredDataSet]);

  const yValues = useMemo(() => filteredDataSet.map(d => d.y || 0), [filteredDataSet]);

  const xDomain = useMemo(() => [0, Math.max(...xValues) || 0], [xValues]);

  const yDomain = useMemo(() => [0, Math.max(...yValues) || 0], [yValues]);

  const xScale:
    | d3.ScaleLinear<number, number>
    | d3.ScaleTime<number, number>
    | d3.ScaleBand<string> = useMemo(() => {
    if (xAxisDataType === "number") {
      return d3
        .scaleLinear()
        .domain((xAxisDomain as [number, number]) ?? xDomain)
        .range([margin.left, width - margin.right])
        .nice()
        .clamp(true);
    }
    if (xAxisDataType === "date_annual" || xAxisDataType === "date_monthly") {
      return d3
        .scaleTime()
        .domain(xDomain)
        .range([margin.left, width - margin.right])
        .nice()
        .clamp(true);
    }
    if (xAxisDataType === "band") {
      return d3
        .scaleBand<string>()
        .domain(dataSet.map(d => d.label)) // Assuming dataSet has labels for bands
        .range([margin.left, width - margin.right])
        .padding(0.1); // Adjust padding as needed
    }
  }, [xDomain, width, margin]);

  const yScale = useMemo(
    () =>
      d3
        .scaleLinear()
        .domain((yAxisDomain as [number, number]) ?? yDomain)
        .range([height - margin.bottom, margin.top]),
    [yDomain, height, margin]
  );

  const dValues = useMemo(() => dataSet.map(d => d.d), [dataSet]);

  const dMax = useMemo(() => Math.max(...dValues), [dValues]);
  const dMin = useMemo(() => Math.min(...dValues), [dValues]);
  // const dDomain = dMax === dMin ? [0, dMax] : [dMin, dMax];

  const dDomain = useMemo(() => (dMax === dMin ? [0, dMax] : [dMin, dMax]), [dMin, dMax]);

  // dScale is scaleQuantile
  const dScale = useMemo(
    () => d3.scaleLinear().domain(dDomain).range([16, 80]),
    [dDomain, height, width, margin]
  );

  const dLegendPosition = useMemo(
    () => ({
      x: width - 100,
      y: height / 3,
    }),
    [width, height]
  );

  const getXValue = useCallback(
    (d: DataPoint) => {
      const offSet = "bandwidth" in xScale ? xScale?.bandwidth() / 2 : 0;
      return xAxisDataType === "band" ? xScale(d.label as never) + offSet : xScale(d.x as never);
    },
    [xScale, xAxisDataType]
  );

  useEffect(() => {
    const svg = d3.select(svgRef.current);

    if (highlightItems.length === 0) {
      svg.selectAll("foreignObject").style("opacity", 0.9);
      return;
    }
    svg.selectAll("foreignObject[data-label]").style("opacity", 0.1);
    highlightItems.forEach(label => {
      svg.selectAll(`foreignObject[data-label="${label}"]`).style("opacity", 1);
    });
  }, [highlightItems]);

  const handleMouseEnter = useCallback(
    (event, d) => {
      setActivePoint(d);
      onHighlightItem([d.label]);

      // Pinned bubbles already have a persistent tooltip — skip the hover one.
      if (!tooltipRef.current || !tooltipContentRef.current || pinnedPointsRef.current.has(d.label)) return;

      const mousePoint = d3.pointer(event.nativeEvent, svgRef.current);
      const x = mousePoint[0];
      const y = mousePoint[1];

      let content = "";
      if (tooltipFormatterRef.current) {
        content = tooltipFormatterRef.current(d);
      } else {
        content = `
          <div>
            <div>${d.label}</div>
            <div>${xAxisFormat ? xAxisFormat(d.x) : d.x}</div>
            <div>${yAxisFormat ? yAxisFormat(d.y) : d.y}</div>
          </div>
        `;
      }

      tooltipContentRef.current.innerHTML = content;
      tooltipRef.current.style.left = `${x + 10}px`;
      tooltipRef.current.style.top = `${y - 10}px`;
      tooltipRef.current.style.display = "block";
    },
    [onHighlightItem, xAxisFormat, yAxisFormat]
  );

  const handleSvgMouseMove = useCallback(
    event => {
      if (activePoint && tooltipRef.current) {
        const mousePoint = d3.pointer(event.nativeEvent, svgRef.current);
        tooltipRef.current.style.left = `${mousePoint[0] + 10}px`;
        tooltipRef.current.style.top = `${mousePoint[1] - 10}px`;
      }
    },
    [activePoint]
  );

  const handleMouseLeave = useCallback(() => {
    setActivePoint(null);
    onHighlightItem([]);
    if (tooltipRef.current) tooltipRef.current.style.display = "none";
  }, [onHighlightItem]);

  const handleMouseClick = useCallback((d: DataPoint) => {
    setPinnedPoints(prev => {
      const next = new Map(prev);
      if (next.has(d.label)) {
        next.delete(d.label);
      } else {
        next.set(d.label, d);
      }
      return next;
    });
  }, []);

  const displayIsNodata = useDisplayIsNodata({
    dataSet,
    isLoading,
    isNodataComponent,
    isNodata,
  });

  // Opt-in Canvas 2D renderer — active only when renderer="canvas". Paints the
  // point cloud onto a <canvas> behind the SVG; axes/title/legend stay SVG.
  const canvasTooltip = useScatterPlotChartCanvasRendering({
    enabled: renderer === "canvas",
    canvasRef,
    svgRef,
    tooltipRef,
    tooltipContentRef,
    renderData: renderOrderedDataSet,
    width,
    height,
    margin,
    xScale,
    yScale,
    dScale,
    xAxisDataType,
    disabledItems,
    highlightItems,
    getColor,
    colorsMapping: generatedColorsMapping,
    tooltipFormatter,
    xAxisFormat,
    yAxisFormat,
    onHighlightItem,
    showCrosshair,
    crosshairLabels,
    pinIcon,
  });

  // Click entirely outside the chart container clears all pins.
  // We use container.contains() rather than .closest(".data-point") to avoid
  // SVG element traversal issues in some browsers/environments.
  // In-chart background clicks are handled by the SVG background <rect> below.
  useEffect(() => {
    if (pinnedPoints.size === 0) return undefined;
    const handleClickOutside = (event: MouseEvent) => {
      const container = svgContainerRef.current;
      if (container && !container.contains(event.target as Node)) {
        setPinnedPoints(new Map());
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [pinnedPoints.size]);

  // Move useDeepCompareEffect here, before any conditional returns
  useDeepCompareEffect(() => {
    if (renderCompleteRef.current && onChartDataProcessed) {
      // Get all unique labels from the dataset
      const allLabels = [...new Set(dataSet.map(d => d.label))];

      // Sort labels based on filter if present
      let visibleLabels = allLabels;
      const sortValues: { [key: string]: number } = {};

      if (filter) {
        // Calculate sort values for all labels
        allLabels.forEach(label => {
          const data = dataSet.find(d => d.label === label);
          const value = data ? data[filter.criteria] : 0;
          sortValues[label] = value;
        });

        visibleLabels = allLabels.sort((a, b) => {
          const aValue = sortValues[a];
          const bValue = sortValues[b];
          return filter.sortingDir === "desc" ? bValue - aValue : aValue - bValue;
        });

        if (filter.limit) {
          visibleLabels = visibleLabels.slice(0, filter.limit);
        }
      }

      // Generate legend data based on visible labels order
      const legendData = visibleLabels
        .filter(label => dataSet.find(d => d.label === label))
        .map((label, index) => {
          // Use existing color from colorsMapping if available, otherwise assign new color
          let finalColor = colorsMapping[label];

          if (!finalColor) {
            // Assign colors based on legend order using DEFAULT_COLORS
            const colorIndex = index % DEFAULT_COLORS.length;
            const baseColor = DEFAULT_COLORS[colorIndex];

            // Calculate opacity for repeat items beyond color palette
            const repeatCycle = Math.floor(index / DEFAULT_COLORS.length);
            const opacity = Math.max(0.1, 1 - repeatCycle * 0.1);

            // Create color with opacity if needed
            finalColor =
              repeatCycle > 0
                ? `${baseColor}${Math.round(opacity * 255)
                    .toString(16)
                    .padStart(2, "0")}`
                : baseColor;
          }

          return {
            label,
            color: finalColor,
            order: index,
            disabled: disabledItems.includes(label),
            dataLabelSafe: sanitizeForClassName(label),
            sortValue: sortValues[label],
          };
        });

      // Generate new color mapping based on legend order
      const newColorMapping: { [key: string]: string } = {};
      legendData.forEach(item => {
        newColorMapping[item.label] = item.color;
      });

      // Update color mapping if it has changed
      if (!isEqual(newColorMapping, generatedColorsMapping) && onColorMappingGenerated && !skipColorMappingDispatch) {
        onColorMappingGenerated(newColorMapping);
      }

      const currentMetadata: ChartMetadata = {
        xAxisDomain: xValues.map(String),
        yAxisDomain: yScale.domain() as [number, number],
        visibleItems: filteredDataSet.map(d => d.label),
        renderedData: {
          points: renderOrderedDataSet,
        },
        chartType: "scatter-plot-chart",
        legendData: legendData,
      };

      const hasChanged =
        !prevChartDataRef.current ||
        JSON.stringify(prevChartDataRef.current.xAxisDomain) !==
          JSON.stringify(currentMetadata.xAxisDomain) ||
        JSON.stringify(prevChartDataRef.current.yAxisDomain) !==
          JSON.stringify(currentMetadata.yAxisDomain) ||
        JSON.stringify(prevChartDataRef.current.visibleItems) !==
          JSON.stringify(currentMetadata.visibleItems) ||
        JSON.stringify(Object.keys(prevChartDataRef.current.renderedData).sort()) !==
          JSON.stringify(Object.keys(currentMetadata.renderedData).sort());

      if (hasChanged) {
        onChartDataProcessed(currentMetadata);
      }

      prevChartDataRef.current = currentMetadata;
    }
  }, [
    renderOrderedDataSet,
    xValues,
    yScale,
    filteredDataSet,
    onChartDataProcessed,
    dataSet,
    filter,
    disabledItems,
    generatedColorsMapping,
    onColorMappingGenerated,
  ]);

  return (
    <Styled style={{ position: "relative" }}>
      <div ref={svgContainerRef} style={{ position: "relative", width: width, height: height }}>
        {isLoading ? (
          <LoadingIndicator />
        ) : (
          <Suspense fallback={<LoadingIndicator />}>
            <div style={{ position: "relative" }}>
              <div
                className="tooltip"
                style={{
                  position: "absolute",
                  backgroundColor: "#fff",
                  display: "none",
                  padding: "10px",
                  borderRadius: "5px",
                  zIndex: 1000,
                }}
                ref={tooltipRef}
              >
                <div className="tooltip-content" ref={tooltipContentRef} />
                {pinnedPoints.size === 0 && !canvasTooltip.isSticky && <TooltipHint />}
              </div>

              {/* Pinned tooltips — one per pinned bubble, positioned near the bubble from live scales. */}
              {renderer !== "canvas" && Array.from(pinnedPoints.values()).map(point => {
                const tipX = Math.min((getXValue(point) ?? 0) + 10, width - 160);
                const tipY = Math.max(margin.top, yScale(point.y) - 10);
                const raw = tooltipFormatterRef.current
                  ? tooltipFormatterRef.current(point)
                  : `<div><div>${point.label}</div><div>${xAxisFormat ? xAxisFormat(point.x) : point.x}</div><div>${yAxisFormat ? yAxisFormat(point.y) : point.y}</div></div>`;
                return (
                  <div key={point.label} className="tooltip pinned-tooltip"
                    style={{ position: "absolute", backgroundColor: "#fff", display: "block",
                             padding: "10px", borderRadius: "5px", zIndex: 999,
                             left: `${tipX}px`, top: `${tipY}px`, pointerEvents: "none" }}>
                    {pinIcon && (
                      <div style={{ display: "flex", justifyContent: "flex-end",
                                    marginBottom: "4px", fontSize: "12px", lineHeight: 1 }}>
                        {pinIcon}
                      </div>
                    )}
                    <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(raw) }} />
                  </div>
                );
              })}

              <svg
                width={width}
                height={height}
                ref={svgRef}
                onMouseMove={handleSvgMouseMove}
                style={{ position: "relative" }}
              >
                {/* Transparent background rect: clicking empty chart area clears all pins.
                    Must be the first child so data-points and crosshairs render on top. */}
                {renderer !== "canvas" && pinnedPoints.size > 0 && (
                  <rect x={0} y={0} width={width} height={height} fill="transparent"
                    onClick={() => setPinnedPoints(new Map())} style={{ cursor: "default" }} />
                )}

                <MichiVzCredit />
                <Title x={width / 2} y={margin.top / 2}>
                  {title}
                </Title>
                {children}

                {/* Pinned crosshairs — always shown for every pinned bubble (solid, 1.5px). */}
                {renderer !== "canvas" && Array.from(pinnedPoints.values()).map(point => {
                  const cx = getXValue(point) ?? 0;
                  const cy = yScale(point.y);
                  const color = getColor(generatedColorsMapping[point.label], point.color);
                  return (
                    <React.Fragment key={`xhair-${point.label}`}>
                      <line x1={cx} x2={cx} y1={cy} y2={height - margin.bottom}
                        stroke={color} strokeOpacity={0.75} strokeWidth={1.5} pointerEvents="none" />
                      <line x1={margin.left} x2={cx} y1={cy} y2={cy}
                        stroke={color} strokeOpacity={0.75} strokeWidth={1.5} pointerEvents="none" />
                      {crosshairLabels && (() => {
                        const yLbl = yAxisFormat ? yAxisFormat(point.y) : String(point.y);
                        const xLbl = xAxisFormat ? xAxisFormat(point.x) : String(point.x);
                        const yW = Math.max(28, yLbl.length * 6 + 16);
                        const xW = Math.max(28, xLbl.length * 6 + 16);
                        return (
                          <>
                            <g transform={`translate(${margin.left}, ${cy})`} pointerEvents="none">
                              <rect x={-yW / 2} y={-9} width={yW} height={18} rx={4}
                                fill="#fff" fillOpacity={0.92} stroke={color} strokeWidth={1} />
                              <text textAnchor="middle" dominantBaseline="middle" fontSize="10" fill={color}>
                                {yLbl}
                              </text>
                            </g>
                            <g transform={`translate(${cx}, ${height - margin.bottom})`} pointerEvents="none">
                              <rect x={-xW / 2} y={-9} width={xW} height={18} rx={4}
                                fill="#fff" fillOpacity={0.92} stroke={color} strokeWidth={1} />
                              <text textAnchor="middle" dominantBaseline="middle" fontSize="10" fill={color}>
                                {xLbl}
                              </text>
                            </g>
                          </>
                        );
                      })()}
                    </React.Fragment>
                  );
                })}

                {/* Hover crosshair — dashed, only when showCrosshair=true and hovering an unpinned bubble. */}
                {renderer !== "canvas" && showCrosshair && activePoint && !pinnedPoints.has(activePoint.label) && (() => {
                  const cx = getXValue(activePoint) ?? 0;
                  const cy = yScale(activePoint.y);
                  const color = getColor(generatedColorsMapping[activePoint.label], activePoint.color);
                  return (
                    <>
                      <line x1={cx} x2={cx} y1={cy} y2={height - margin.bottom}
                        stroke={color} strokeDasharray="4 4" strokeOpacity={0.6} strokeWidth={1.5} pointerEvents="none" />
                      <line x1={margin.left} x2={cx} y1={cy} y2={cy}
                        stroke={color} strokeDasharray="4 4" strokeOpacity={0.6} strokeWidth={1.5} pointerEvents="none" />
                      {crosshairLabels && (() => {
                        const yLbl = yAxisFormat ? yAxisFormat(activePoint.y) : String(activePoint.y);
                        const xLbl = xAxisFormat ? xAxisFormat(activePoint.x) : String(activePoint.x);
                        const yW = Math.max(28, yLbl.length * 6 + 16);
                        const xW = Math.max(28, xLbl.length * 6 + 16);
                        return (
                          <>
                            <g transform={`translate(${margin.left}, ${cy})`} pointerEvents="none">
                              <rect x={-yW / 2} y={-9} width={yW} height={18} rx={4}
                                fill="#fff" fillOpacity={0.92} stroke={color} strokeWidth={1} />
                              <text textAnchor="middle" dominantBaseline="middle" fontSize="10" fill={color}>
                                {yLbl}
                              </text>
                            </g>
                            <g transform={`translate(${cx}, ${height - margin.bottom})`} pointerEvents="none">
                              <rect x={-xW / 2} y={-9} width={xW} height={18} rx={4}
                                fill="#fff" fillOpacity={0.92} stroke={color} strokeWidth={1} />
                              <text textAnchor="middle" dominantBaseline="middle" fontSize="10" fill={color}>
                                {xLbl}
                              </text>
                            </g>
                          </>
                        );
                      })()}
                    </>
                  );
                })()}

                {/* Use renderOrderedDataSet instead of filteredDataSet for proper rendering order */}
                {/* In canvas mode the point marks are painted on the <canvas>; skip the SVG marks. */}
                {renderer !== "canvas" &&
                  renderOrderedDataSet
                    .filter(d => !disabledItems.includes(d.label))
                    .map((d, i) => {
                    const x = getXValue(d);
                    const y = yScale(d.y);
                    const size = xAxisDataType === "band" ? d.d / 2 : dScale(d.d);
                    const radius = size / 2;
                    const fill = getColor(generatedColorsMapping[d.label], d.color);
                    const isPinned = pinnedPoints.has(d.label);

                    return (
                      <g
                        className="data-point"
                        key={i}
                        transform={`translate(${x}, ${y})`}
                        opacity={0.9}
                        data-label={d.label}
                        data-label-safe={sanitizeForClassName(d.label)}
                        onMouseEnter={event => handleMouseEnter(event, d)}
                        onMouseLeave={handleMouseLeave}
                        onClick={() => handleMouseClick(d)}
                      >
                        {/* Ring sits behind the main shape — matches the bubble's shape */}
                        {isPinned && (
                          d.shape === "square" ? (
                            <rect x={-radius - 5} y={-radius - 5}
                              width={size + 10} height={size + 10}
                              fill="none" stroke={fill} strokeWidth={2} opacity={0.45}
                              pointerEvents="none" />
                          ) : d.shape === "triangle" ? (
                            <path
                              d={`M0,${-radius - 5} L${radius + 5},${radius + 5} L${-radius - 5},${radius + 5} Z`}
                              fill="none" stroke={fill} strokeWidth={2} opacity={0.45}
                              pointerEvents="none" />
                          ) : (
                            <circle r={radius + 5} fill="none"
                              stroke={fill} strokeWidth={2} opacity={0.45}
                              pointerEvents="none" />
                          )
                        )}
                        {d.shape === "square" ? (
                          <rect
                            x={-radius}
                            y={-radius}
                            width={size}
                            height={size}
                            fill={fill}
                            stroke="#fff"
                            strokeWidth={2}
                          />
                        ) : d.shape === "triangle" ? (
                          <path
                            d={`M0,${-radius} L${radius},${radius} L${-radius},${radius} Z`}
                            fill={fill}
                            stroke="#fff"
                            strokeWidth={2}
                          />
                        ) : (
                          <circle r={radius} fill={fill} stroke="#fff" strokeWidth={2} />
                        )}
                      </g>
                    );
                  })}
                {!isLoading && dataSet.length && (
                  <g className="michi-vz-legend">
                    {dScaleLegendFormatter && dScaleLegendFormatter(dDomain, dScale)}
                    {dScaleLegend?.title && (
                      <text x={dLegendPosition.x} y={dLegendPosition.y - 120} textAnchor={"middle"}>
                        {dScaleLegend?.title}
                      </text>
                    )}
                    <path
                      d={drawHalfLeftCircle(dLegendPosition.x, dLegendPosition.y, 40, 40)}
                      fill={"none"}
                      stroke={"#ccc"}
                    />
                    <path
                      d={drawHalfLeftCircle(dLegendPosition.x, dLegendPosition.y, 20, 20)}
                      fill={"none"}
                      stroke={"#ccc"}
                    />
                    <path
                      d={drawHalfLeftCircle(dLegendPosition.x, dLegendPosition.y, 8, 8)}
                      fill={"none"}
                      stroke={"#ccc"}
                    />
                    <text x={dLegendPosition.x} y={dLegendPosition.y}>
                      {dScaleLegend?.valueFormatter
                        ? dScaleLegend.valueFormatter(dScale.invert(16))
                        : dScale.invert(16)}
                    </text>
                    <text x={dLegendPosition.x} y={dLegendPosition.y - 40}>
                      {dScaleLegend?.valueFormatter
                        ? dScaleLegend.valueFormatter(dScale.invert(40))
                        : dScale.invert(40)}
                    </text>
                    <text x={dLegendPosition.x} y={dLegendPosition.y - 80}>
                      {dScaleLegend?.valueFormatter
                        ? dScaleLegend.valueFormatter(dScale.invert(80))
                        : dScale.invert(80)}
                    </text>
                  </g>
                )}
                {filteredDataSet.length > 0 && !isLoading && (
                  <>
                    {xAxisDataType === "number" ||
                    xAxisDataType === "date_annual" ||
                    xAxisDataType === "date_monthly" ? (
                      <XaxisLinear
                        xScale={
                          xScale as d3.ScaleLinear<number, number> | d3.ScaleTime<number, number>
                        }
                        height={height}
                        margin={margin}
                        xAxisFormat={xAxisFormat}
                        xAxisDataType={xAxisDataType}
                        ticks={5}
                        showGrid={showGrid?.x || false}
                      />
                    ) : (
                      <XaxisBand
                        xScale={xScale as d3.ScaleBand<string>}
                        height={height}
                        margin={margin}
                        xAxisFormat={xAxisFormat}
                      />
                    )}
                    <YaxisLinear
                      yScale={yScale}
                      width={width}
                      height={height}
                      margin={margin}
                      yAxisFormat={yAxisFormat}
                      yTicksQty={yTicksQty}
                    />
                  </>
                )}
              </svg>
              {renderer === "canvas" && (
                <canvas
                  ref={canvasRef}
                  className="scatter-plot-canvas"
                  style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}
                />
              )}
            </div>
          </Suspense>
        )}
        {isLoading && isLoadingComponent && <>{isLoadingComponent}</>}
        {displayIsNodata && <>{isNodataComponent}</>}
      </div>
    </Styled>
  );
};

export default ScatterPlotChart;

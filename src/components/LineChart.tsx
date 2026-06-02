import React, { useMemo, useCallback, FC, useEffect, useRef } from "react";
import { select } from "d3";
import { DataPoint, ChartMetadata, LegendItem, CurveType } from "../types/data";
import { DEFAULT_COLORS } from "./shared/colors";
import Title from "./shared/Title";
import MichiVzCredit from "./shared/MichiVzCredit";
import YaxisLinear from "./shared/YaxisLinear";
import XaxisLinear from "./shared/XaxisLinear";
import LoadingIndicator from "./shared/LoadingIndicator";
import { useDisplayIsNodata } from "./hooks/useDisplayIsNodata";
import styled from "styled-components";
import useFilteredDataSet from "./hooks/lineChart/useFilteredDataSet";
import useLineChartYscale from "./hooks/lineChart/useLineChartYscale";
import useLineChartXscale from "./hooks/lineChart/useLineChartXscale";
import useLineChartXtickValues from "./hooks/lineChart/useXtickValues";
import useLineChartPathsShapesRendering from "./hooks/lineChart/useLineChartPathsShapesRendering";
import { UNCERTAIN_DASH_PATTERN } from "./hooks/lineChart/useLineChartPathsShapesRendering";
import useLineChartDecimatedData from "./hooks/lineChart/useLineChartDecimatedData";
import useLineChartCanvasRendering from "./hooks/lineChart/useLineChartCanvasRendering";
import useLineChartMouseInteractionCombinedMode from "./hooks/lineChart/useLineChartMouseInteractionCombinedMode";
import useLineChartMetadataExpose from "./hooks/lineChart/useLineChartMetadataExpose";
import useLineChartColorMapping from "./hooks/lineChart/useColorMapping";
import useGenerateColorMapping from "./hooks/lineChart/useGenerateColorMapping";
import { useLineChartRefsAndState } from "./hooks/lineChart/useLineChartRefsAndState";
import { sanitizeForClassName, getColor, parseXValue } from "./hooks/lineChart/lineChartUtils";
import { useLineChartGeometry } from "./hooks/lineChart/useLineChartGeometry";
import useLineChartTooltipToggle from "./hooks/lineChart/useLineChartHandleHover";
import LineChartMouseLine from "src/components/LineChartMouseLine";
import TooltipHint from "src/components/shared/TooltipHint";
import { useChartContext, SinglePointLineConfig } from "./MichiVzProvider";

export const DEFAULT_MARGIN = { top: 50, right: 50, bottom: 50, left: 50 };
export const DEFAULT_WIDTH = 900 - DEFAULT_MARGIN.left - DEFAULT_MARGIN.right;
export const DEFAULT_HEIGHT = 480 - DEFAULT_MARGIN.top - DEFAULT_MARGIN.bottom;
export const OPACITY_DEFAULT = 1;
export const OPACITY_NOT_HIGHLIGHTED = 0.05;
const TRANSITION_DURATION = 100;

interface LineChartContainerProps {
  width: number;
  height: number;
}

const LineChartContainer = styled.div<LineChartContainerProps>`
  position: relative;
  width: ${props => `${props.width}px`};
  height: ${props => `${props.height}px`};
  /* No blanket will-change: it keeps a compositor layer alive per element for
     as long as the rule applies. On a bare path/circle/rect selector that cost
     scales with the dataset size and becomes a jank source on large charts.
     The short transitions below are kept for the colour/opacity cross-fade —
     a transition only promotes a layer while it is actually animating. */
  path {
    transition:
      stroke 0.1s ease-out,
      opacity 0.1s ease-out;
  }

  circle,
  rect,
  path.data-point {
    transition:
      fill 0.1s ease-out,
      stroke 0.1s ease-out,
      opacity 0.1s ease-out;
  }

  .data-group-wrapper {
    transition: opacity 0.1s ease-out;
  }

  /* Enhanced line-overlay styling for better hover targeting */
  .line-overlay {
    stroke-linecap: round;
    stroke-linejoin: round;
    cursor: pointer;
    /* Critical for proper hover behavior */
    pointer-events: visibleStroke;
    /* Always ensure it's visible for hover but transparent visually */
    opacity: 0.05 !important;
  }

  .mouseLine {
    stroke: #a9a9a9;
    stroke-width: 1px;
  }

  .mouseLinePoint {
    fill: #a9a9a9;
  }
`;

const LoadingIndicatorContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
`;

const TooltipStyled = styled.div`
  position: absolute;
  visibility: hidden;
  transition:
    visibility 0.1s ease-out,
    opacity 0.1s ease-out;
  will-change: visibility, opacity, top, left;
  z-index: 1000;
  padding: 5px;
  border-radius: 4px;
  white-space: nowrap;
`;

interface LineChartProps {
  dataSet: {
    label: string;
    color: string;
    shape?: "circle" | "square" | "triangle";
    curve?: CurveType;
    series: DataPoint[];
  }[];
  width: number;
  height: number;
  margin: { top: number; right: number; bottom: number; left: number };
  title?: string;
  yAxisDomain?: [number, number];
  yAxisFormat?: (d: number | { valueOf(): number }) => string;
  xAxisFormat?: (d: number | string | { valueOf(): number }, tickValues?: Array<string | number>) => string;
  xAxisDataType: "number" | "date_annual" | "date_monthly";
  tooltipFormatter?: (
    d: DataPoint,
    series: DataPoint[],
    dataSet: {
      label: string;
      color: string;
      shape?: "circle" | "square" | "triangle";
      series: DataPoint[];
    }[]
  ) => string;
  showCombined?: boolean;
  children?: React.ReactNode;
  isLoading?: boolean;
  isLoadingComponent?: React.ReactNode;
  isNodataComponent?: React.ReactNode;
  isNodata?:
    | boolean
    | ((
        dataSet: {
          label: string;
          color: string;
          series: DataPoint[];
        }[] | null | undefined
      ) => boolean);
  filter?: {
    limit: number;
    date: number | string;
    criteria: string;
    sortingDir: "asc" | "desc";
  };
  ticks?: number;
  // colors is the color palette for the chart for new generated colors
  colors?: string[];
  // colorsMapping is the color mapping for the chart for existing colors
  // the purpose is to share the same color mapping between charts
  colorsMapping?: { [key: string]: string };
  onChartDataProcessed?: (metadata: ChartMetadata) => void;
  onHighlightItem: (labels: string[]) => void;
  onColorMappingGenerated?: (colorsMapping: { [key: string]: string }) => void;
  onLegendDataChange?: (legendData: LegendItem[]) => void;
  // highlightItems and disabledItems as props for better performance
  highlightItems?: string[];
  disabledItems?: string[];
  enableMouseLine?: boolean;
  /**
   * Render per-point shapes (circle/square/triangle) on each data point.
   * Defaults to false, hover tooltips work via per-line bisection on the line-overlay.
   * Set to true to restore the classic per-dot rendering and per-dot hover tooltips.
   * Note: single-point series will be invisible when false.
   */
  showDataPoints?: boolean;
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
  /**
   * Rendering backend for the line geometry.
   *  - "svg" (default): the original SVG/D3 rendering, unchanged.
   *  - "canvas": draw lines/points onto a <canvas> with LTTB decimation, for
   *    large datasets (thousands+ of points). Axes, title, mouse-line and the
   *    tooltip are unchanged in both modes.
   */
  renderer?: "svg" | "canvas";
  /**
   * Opt-in guide line for series that have exactly ONE data point (which cannot
   * form a drawable line). When set, such a series renders a full-plot-width
   * horizontal dashed line at the point's value, plus the point's dot.
   *  - `true`            → uses the uncertainty look (series color, "4,4", width 2.5)
   *  - `{ ... }`         → same defaults with any field overridden
   *  - `false`           → force off (overrides a provider that enabled it)
   *  - omitted           → inherits `singlePointLine` from MichiVzProvider context
   * SVG renderer only.
   */
  singlePointLine?: SinglePointLineConfig;
}

const LineChart: FC<LineChartProps> = ({
  dataSet,
  filter,
  title,
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
  margin = DEFAULT_MARGIN,
  yAxisDomain,
  yAxisFormat,
  xAxisDataType = "number",
  xAxisFormat,
  tooltipFormatter = (d: DataPoint) => `<div>${d.label} - ${d.date}: ${d.value}</div>`,
  showCombined = false,
  children,
  isLoading = false,
  isLoadingComponent,
  isNodataComponent,
  isNodata,
  ticks = 5,
  colors = DEFAULT_COLORS,
  colorsMapping = {},
  onChartDataProcessed,
  onHighlightItem,
  onColorMappingGenerated,
  onLegendDataChange,
  highlightItems = [],
  disabledItems = [],
  enableMouseLine = true,
  showDataPoints = false,
  skipColorMappingDispatch = false,
  renderer = "svg",
  singlePointLine,
}) => {
  // Use the new hook for refs and state
  const { svgRef, tooltipRef, renderCompleteRef, prevChartDataRef, isInitialMount } =
    useLineChartRefsAndState();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { filteredData: filteredDataSet, topNItems } = useFilteredDataSet(
    dataSet,
    filter,
    disabledItems
  );

  const yScale = useLineChartYscale(filteredDataSet, yAxisDomain, height, margin);

  const xScale = useLineChartXscale(filteredDataSet, width, margin, xAxisDataType);

  const tickValues = useLineChartXtickValues(filteredDataSet, xAxisDataType, width, margin);

  const { getYValueAtX, getRuns, line, lineData } = useLineChartGeometry({
    dataSet,
    xAxisDataType,
    xScale,
    yScale,
  });

  // Pixel-x projector shared by LTTB decimation and the Canvas renderer.
  const getPixelX = useCallback(
    (d: DataPoint) => xScale(parseXValue(d.date, xAxisDataType)),
    [xScale, xAxisDataType]
  );

  // LTTB decimation — active only in canvas mode; an identity passthrough
  // otherwise, so the SVG path is provably unaffected.
  const { drawData } = useLineChartDecimatedData(
    filteredDataSet,
    getRuns,
    getPixelX,
    width,
    renderer === "canvas"
  );

  const showLoadingIndicator = isLoading || !isInitialMount.current;

  const visibleDataSets = useMemo(() => {
    return filteredDataSet.filter(d => d.series.length > 0);
  }, [filteredDataSet]);

  // Memoize callback functions to prevent infinite loops
  const memoizedOnHighlightItem = useCallback(
    (labels: string[]) => {
      if (onHighlightItem) {
        onHighlightItem(labels);
      }
    },
    [onHighlightItem]
  );

  const memoizedOnColorMappingGenerated = useCallback(
    (colorsMapping: { [key: string]: string }) => {
      if (onColorMappingGenerated) {
        onColorMappingGenerated(colorsMapping);
      }
    },
    [onColorMappingGenerated]
  );

  const memoizedOnChartDataProcessed = useCallback(
    (metadata: ChartMetadata) => {
      if (onChartDataProcessed) {
        onChartDataProcessed(metadata);
      }
    },
    [onChartDataProcessed]
  );

  // Generate consistent color mapping first
  const generatedColorMapping = useGenerateColorMapping(
    dataSet,
    colors,
    colorsMapping,
    onColorMappingGenerated,
    skipColorMappingDispatch
  );

  // Normalize the public `boolean | object` prop into a fully-resolved style
  // (or null when off). `stroke` stays optional so the renderer can fall back to
  // each series' color; defaults reuse the uncertainty dash look.
  // Two-level config: the `singlePointLine` PROP wins when provided (including an
  // explicit `false` to disable one chart); otherwise fall back to the
  // MichiVzProvider context default. This lets a provider enable it for every
  // LineChart at once while individual charts opt out or customize.
  const { singlePointLine: contextSinglePointLine } = useChartContext();
  const effectiveSinglePointLine =
    singlePointLine !== undefined ? singlePointLine : contextSinglePointLine;
  const resolvedSinglePointLine = useMemo(() => {
    if (!effectiveSinglePointLine) return null;
    const opts = typeof effectiveSinglePointLine === "object" ? effectiveSinglePointLine : {};
    return {
      stroke: opts.stroke,
      strokeWidth: opts.strokeWidth ?? 2.5,
      strokeDasharray: opts.strokeDasharray ?? UNCERTAIN_DASH_PATTERN,
    };
  }, [effectiveSinglePointLine]);

  const { tooltip } = useLineChartPathsShapesRendering(
    filteredDataSet,
    visibleDataSets,
    width,
    height,
    margin,
    xAxisDataType,
    getRuns,
    colors,
    generatedColorMapping, // Use the generated mapping here
    line,
    xScale,
    yScale,
    memoizedOnHighlightItem,
    tooltipFormatter,
    tooltipRef,
    svgRef,
    getColor,
    sanitizeForClassName,
    highlightItems,
    undefined, // Remove the callback since color generation is handled by useGenerateColorMapping
    showDataPoints,
    renderer,
    resolvedSinglePointLine
  );

  useLineChartColorMapping(generatedColorMapping, getColor, svgRef, TRANSITION_DURATION);

  // Canvas renderer — active only when renderer="canvas".
  const canvasTooltip = useLineChartCanvasRendering({
    enabled: renderer === "canvas",
    canvasRef,
    svgRef,
    tooltipRef,
    drawData,
    fullData: filteredDataSet,
    width,
    height,
    margin,
    xScale,
    yScale,
    xAxisDataType,
    colorsMapping: generatedColorMapping,
    getColor,
    getRuns,
    highlightItems,
    showDataPoints,
    tooltipFormatter,
    onHighlightItem: memoizedOnHighlightItem,
  });

  const handleTooltipToggle = useLineChartTooltipToggle(
    xScale,
    filteredDataSet,
    getYValueAtX,
    margin,
    svgRef,
    tooltipRef
  );
  const handleCombinedMouseOut = useCallback(() => {
    if (!tooltipRef.current || !svgRef.current) return;

    const tooltip = tooltipRef.current;
    tooltip.style.visibility = "hidden";
    tooltip.style.opacity = "0";
    tooltip.innerHTML = "";

    const hoverLinesGroup = select(svgRef.current).select(".hover-lines");
    const hoverLine = hoverLinesGroup.select(".hover-line");

    hoverLinesGroup.style("display", "none");
    hoverLine.style("display", "none");
  }, []);

  useLineChartMouseInteractionCombinedMode(
    showCombined,
    width,
    height,
    handleTooltipToggle,
    handleCombinedMouseOut,
    svgRef
  );

  const displayIsNodata = useDisplayIsNodata({
    dataSet: dataSet,
    isLoading: isLoading,
    isNodataComponent: isNodataComponent,
    isNodata: isNodata,
  });

  useLineChartMetadataExpose(
    dataSet,
    xAxisDataType,
    yScale,
    disabledItems,
    lineData,
    filter,
    memoizedOnChartDataProcessed,
    renderCompleteRef,
    prevChartDataRef,
    colorsMapping,
    colors,
    memoizedOnColorMappingGenerated,
    onLegendDataChange,
    topNItems
  );

  // Set render complete flag synchronously in render. The metadata-expose
  // useEffect (inside useLineChartMetadataExpose above) is gated on
  // `renderCompleteRef.current`. When this flag was set inside its own
  // useEffect declared AFTER useLineChartMetadataExpose, React fired the
  // metadata effect first (declaration order) — found the ref still false
  // — and skipped the dispatch. With nothing to re-trigger the effect, the
  // chart's first dispatch was lost: legendData stayed empty in Redux,
  // legends rendered nothing, and stroke colors fell back to d3's default
  // tab10 palette. Setting the ref in render ensures it's true by the time
  // the effect runs after commit.
  renderCompleteRef.current = true;

  useEffect(() => {
    return () => {
      // Clean up when component unmounts
      renderCompleteRef.current = false;
    };
  }, []);

  return (
    <LineChartContainer width={width} height={height}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        ref={svgRef}
        width={width}
        height={height}
        style={{ position: "relative" }}
      >
        <MichiVzCredit />
        {children}
        {enableMouseLine && (
          <LineChartMouseLine
            className="mouseLineContainer"
            height={height - (margin.top || 0)}
            margin={margin}
            xScale={xScale}
            yScale={yScale}
            dataSet={dataSet}
            anchorEl={svgRef}
            xAxisDataType={xAxisDataType}
            ticks={ticks}
            tickValues={tickValues}
          />
        )}
        <Title x={width / 2} y={margin.top / 2}>
          {title}
        </Title>
        {!displayIsNodata && filteredDataSet.length > 0 && (
          <>
            <XaxisLinear
              xScale={xScale}
              height={height}
              margin={margin}
              xAxisFormat={xAxisFormat}
              xAxisDataType={xAxisDataType}
              ticks={ticks}
              tickValues={tickValues}
            />
            <YaxisLinear
              yScale={yScale}
              width={width}
              height={height}
              margin={margin}
              highlightZeroLine={true}
              yAxisFormat={yAxisFormat}
            />
          </>
        )}
      </svg>

      {renderer === "canvas" && (
        <canvas
          ref={canvasRef}
          className="line-chart-canvas"
          style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}
        />
      )}

      {showLoadingIndicator && (
        <LoadingIndicatorContainer>
          {isLoadingComponent || <LoadingIndicator />}
        </LoadingIndicatorContainer>
      )}

      <TooltipStyled className="tooltip" ref={tooltipRef}>
        <div className="tooltip-content" />
        {!tooltip?.isSticky && !canvasTooltip.isSticky && <TooltipHint />}
      </TooltipStyled>

      {displayIsNodata && <>{isNodataComponent}</>}
    </LineChartContainer>
  );
};

export default LineChart;

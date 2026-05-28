import * as d3 from "d3";
import React, { useLayoutEffect, useMemo, useRef, useCallback, useEffect } from "react";
import isEqual from "lodash/isEqual";
import Title from "../components/shared/Title";
import XaxisLinear from "./shared/XaxisLinear";
import YaxisBand from "./shared/YaxisBand";
import { useChartContext } from "../components/MichiVzProvider";
import LoadingIndicator from "./shared/LoadingIndicator";
import { useDisplayIsNodata } from "./hooks/useDisplayIsNodata";
import useDeepCompareEffect from "use-deep-compare-effect";
import styled from "styled-components";
import { LegendItem, XaxisDataType } from "../types/data";
import { sanitizeForClassName } from "./hooks/lineChart/lineChartUtils";
import { DEFAULT_COLORS } from "./shared/colors";
import TooltipHint from "src/components/shared/TooltipHint";
import MichiVzCredit from "./shared/MichiVzCredit";
import useComparableHorizontalBarChartCanvasRendering from "./hooks/comparableHorizontalBarChart/useComparableHorizontalBarChartCanvasRendering";

const ComparableHorizontalBarChartStyled = styled.div`
  position: relative;
  rect {
    transition:
      fill 0.1s ease-out,
      opacity 0.1s ease-out,
      width 0.1s ease-out,
      height 0.1s ease-out;
  }
`;

interface DataPoint {
  label: string;
  color?: string;
  valueBased: number;
  valueCompared: number;
}

export const VALUE_TYPE = {
  BASED: "based",
  COMPARED: "compared",
} as const;

export type TValueType = (typeof VALUE_TYPE)[keyof typeof VALUE_TYPE];

const VALUE_BASED_OPACITY = 0.45;
const VALUE_COMPARED_OPACITY = 0.9;

const MARGIN = { top: 50, right: 50, bottom: 50, left: 50 };
const PADDING = { top: 0, right: 0, bottom: 0, left: 0 };
const WIDTH = 900 - MARGIN.left - MARGIN.right;
const HEIGHT = 480 - MARGIN.top - MARGIN.bottom;

interface LineChartProps {
  dataSet: DataPoint[];
  width: number;
  height: number;
  margin: { top: number; right: number; bottom: number; left: number };
  padding?: { top: number; right: number; bottom: number; left: number };
  horizontalTickPosition?: { x: number; y: number };
  xAxisFormat?: (d: number | { valueOf(): number }) => string;
  yAxisFormat?: (d: number | string) => string;
  xAxisPredefinedDomain?: number[];
  xAxisDataType: XaxisDataType;
  title?: string;
  tooltipFormatter?: (
    d: DataPoint | undefined,
    dataSet?: DataPoint[],
    type?: TValueType
  ) => React.ReactNode;
  children?: React.ReactNode;
  isLoading?: boolean;
  isLoadingComponent?: React.ReactNode;
  isNodataComponent?: React.ReactNode;
  isNodata?: boolean | ((dataSet: DataPoint[]) => boolean);
  // New: filter prop for sorting
  filter?: {
    limit: number;
    criteria: "valueBased" | "valueCompared";
    sortingDir: "asc" | "desc";
  };
  onChartDataProcessed?: (metadata: ChartMetadata) => void;
  onHighlightItem?: (labels: string[]) => void;
  onLegendDataChange?: (legendData: LegendItem[]) => void;
  // colors is the color palette for the chart for new generated colors
  colors?: string[];
  // colorsMapping is the color mapping for the chart for existing colors
  // the purpose is to share the same color mapping between charts
  colorsMapping?: { [key: string]: string };
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
  /**
   * Optional per-label pattern fill for the `valueBased` bar. Maps a series
   * label to an image source (a URL or data-URI) that is tiled as the bar's
   * fill. `createHatchPattern()` generates a diagonal-hatch source. The key
   * may be the raw series label or its class-safe (`data-label-safe`) form.
   * Only the Canvas renderer (`renderer="canvas"`) applies this; the SVG
   * renderer ignores it. Omit for solid fills (default).
   */
  patternsMapping?: { [key: string]: string };
  showGrid?: boolean;
  showZeroLineForXAxis?: boolean;
  tickHtmlWidth?: number;
  // highlightItems and disabledItems as props for better performance
  highlightItems?: string[];
  disabledItems?: string[];
  hideTickLabels?: boolean;
  /**
   * Rendering backend for the comparative bars.
   *  - "svg" (default): the original SVG/D3 rendering, unchanged.
   *  - "canvas": draw the two bars per item onto a <canvas> instead of two
   *    retained <rect> nodes per item, for large datasets. Axes (grid,
   *    zero-line, divider, y-labels), title, the HTML tooltip and the
   *    loading / no-data overlays are unchanged in both modes.
   */
  renderer?: "svg" | "canvas";
}

interface ChartMetadata {
  xAxisDomain: string[];
  yAxisDomain: [number, number];
  visibleItems: string[];
  renderedData: { [key: string]: DataPoint[] };
  chartType: "comparable-horizontal-bar-chart" | "";
  legendData?: LegendItem[];
}

const ComparableHorizontalBarChart: React.FC<LineChartProps> = ({
  dataSet,
  filter,
  title,
  width = WIDTH,
  height = HEIGHT,
  margin = MARGIN,
  padding = PADDING,
  horizontalTickPosition,
  yAxisFormat,
  xAxisFormat,
  xAxisPredefinedDomain = [],
  xAxisDataType = "number",
  tooltipFormatter,
  children,
  isLoading = false,
  isLoadingComponent,
  isNodataComponent,
  isNodata,
  onChartDataProcessed,
  onHighlightItem,
  onLegendDataChange,
  colors = DEFAULT_COLORS,
  colorsMapping: propColorsMapping = {},
  onColorMappingGenerated,
  skipColorMappingDispatch = false,
  patternsMapping = {},
  showGrid = false,
  showZeroLineForXAxis = false,
  tickHtmlWidth,
  highlightItems = [],
  disabledItems = [],
  hideTickLabels = false,
  renderer = "svg",
}) => {
  const [tooltip, setTooltip] = React.useState<{
    x: number;
    y: number;
    data: DataPoint;
    type?: TValueType;
    isSticky?: boolean;
  } | null>(null);
  const {
    colorsMapping: contextColorsMapping,
    colorsBasedMapping,
    visibleItems,
  } = useChartContext();

  const svgRef = useRef<SVGSVGElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // HTML tooltip element driven by the canvas renderer (canvas mode only).
  const canvasTooltipRef = useRef<HTMLDivElement>(null);
  const renderCompleteRef = useRef(false);
  // Add ref for previous data comparison
  const prevChartDataRef = useRef<ChartMetadata | null>(null);

  // Memoize filtered data set
  const filteredDataSet = useMemo(() => {
    if (!filter) return dataSet;
    return dataSet
      .slice()
      .sort((a, b) => {
        const aVal = Number(a[filter.criteria]);
        const bVal = Number(b[filter.criteria]);
        return filter.sortingDir === "desc" ? bVal - aVal : aVal - bVal;
      })
      .slice(0, filter.limit);
  }, [dataSet, filter]);

  // Memoize the color mapping callback
  const memoizedOnColorMappingGenerated = useCallback(
    (colorsMapping: { [key: string]: string }) => {
      if (onColorMappingGenerated && !skipColorMappingDispatch) {
        onColorMappingGenerated(colorsMapping);
      }
    },
    [onColorMappingGenerated]
  );

  // Generate colors for data items
  const generatedColorsMapping = useMemo(() => {
    const mapping = { ...propColorsMapping };
    let colorIndex = 0;

    filteredDataSet.forEach(item => {
      if (!mapping[item.label] && !item.color) {
        mapping[item.label] = skipColorMappingDispatch ? "transparent" : colors[colorIndex % colors.length];
        colorIndex++;
      }
    });

    return mapping;
  }, [filteredDataSet, propColorsMapping, colors]);

  // Use context colors as fallback, then prop colors, then generated colors
  const finalColorsMapping = useMemo(() => {
    return { ...contextColorsMapping, ...generatedColorsMapping };
  }, [contextColorsMapping, generatedColorsMapping]);

  // Call the color mapping callback when colors are generated
  useEffect(() => {
    if (Object.keys(generatedColorsMapping).length > 0) {
      memoizedOnColorMappingGenerated(generatedColorsMapping);
    }
  }, [generatedColorsMapping]);

  // Memoize yAxisDomain
  const yAxisDomain = useMemo(
    () => filteredDataSet.filter(d => !disabledItems.includes(d?.label))?.map(d => d?.label),
    [filteredDataSet, disabledItems]
  );

  // Memoize visible items
  const visibleItemsList = useMemo(() => {
    return filteredDataSet
      .filter(d => !disabledItems.includes(d?.label) && visibleItems.includes(d?.label))
      .map(d => d.label);
  }, [filteredDataSet, disabledItems, visibleItems]);

  // Memoize rendered data
  const renderedData = useMemo(() => {
    const uniqueLabels = [...new Set(yAxisDomain)];
    return uniqueLabels.reduce(
      (acc, label) => {
        acc[label] = filteredDataSet.filter(d => d.label === label);
        return acc;
      },
      {} as { [key: string]: DataPoint[] }
    );
  }, [yAxisDomain, filteredDataSet]);

  // Memoize xAxisRange
  const xAxisRange = useMemo(() => {
    if (filteredDataSet.length > 0) {
      return filteredDataSet
        ?.filter(d => !disabledItems.includes(d?.label))
        ?.map(d => [d.valueBased, d.valueCompared])
        ?.flat();
    }
    return [];
  }, [filteredDataSet, disabledItems]);

  // Memoize xAxisDomain
  const xAxisDomain = useMemo(() => {
    const range = xAxisPredefinedDomain.length > 0 ? xAxisPredefinedDomain : xAxisRange;
    if (xAxisDataType === "number") {
      const min = Math.min(...range);
      const max = Math.max(...range);
      return [max, min];
    }
    if (xAxisDataType === "date_annual") {
      return [new Date(Math.max(...range), 1, 1), new Date(Math.min(...range), 1, 1)];
    }
    if (xAxisRange.length >= 2) {
      const minDate = new Date(Math.min(...range));
      const maxDate = new Date(Math.max(...range));
      return [maxDate, minDate] as [Date, Date];
    }
  }, [xAxisRange, xAxisPredefinedDomain, xAxisDataType]);

  // Memoize scales
  const yAxisScale = useMemo(
    () =>
      d3
        .scaleBand()
        .domain(yAxisDomain)
        .range([margin.top, height - margin.bottom])
        .padding(0.1),
    [yAxisDomain, height, margin]
  );

  const xAxisScale = useMemo(
    () =>
      xAxisDataType === "number"
        ? d3
            .scaleLinear()
            .domain(xAxisDomain)
            .range([width - margin.left - padding.left, margin.right])
            .clamp(true)
            .nice()
        : d3
            .scaleTime()
            .domain(xAxisDomain)
            .range([width - margin.left - padding.left, margin.right]),
    [xAxisDataType, xAxisDomain, width, margin.left, margin.right, padding.left]
  );

  // Memoize the YaxisBand component
  const memoizedYaxisBand = useMemo(() => {
    return (
      <YaxisBand
        yScale={yAxisScale}
        width={width}
        margin={margin}
        yAxisFormat={yAxisFormat}
        tickHtmlWidth={tickHtmlWidth}
        defaultTickPosition={horizontalTickPosition}
        hideTickLabels={hideTickLabels}
      />
    );
  }, [yAxisScale, width, margin, yAxisFormat, tickHtmlWidth, horizontalTickPosition, hideTickLabels]);

  // Memoize event handlers
  const handleMouseOver = useCallback(
    (d: DataPoint, event: React.MouseEvent<SVGRectElement, MouseEvent>, type: TValueType) => {
      if (svgRef.current && !tooltip?.isSticky) {
        const mousePoint = d3.pointer(event.nativeEvent, svgRef.current);
        setTooltip({
          x: mousePoint[0],
          y: mousePoint[1],
          data: d,
          type,
        });
      }
    },
    [tooltip?.isSticky]
  );

  const handleMouseClick = useCallback(
    (d: DataPoint, event: React.MouseEvent<SVGRectElement, MouseEvent>, type: TValueType) => {
      if (svgRef.current) {
        const mousePoint = d3.pointer(event.nativeEvent, svgRef.current);
        setTooltip({
          x: mousePoint[0],
          y: mousePoint[1],
          data: d,
          type,
          isSticky: true,
        });
      }
    },
    []
  );

  const handleMouseOut = useCallback(() => {
    if (tooltip?.isSticky) return;
    setTooltip(null);
  }, [tooltip?.isSticky]);

  const handleHighlight = useCallback(
    (label: string) => {
      onHighlightItem([label]);
    },
    [onHighlightItem]
  );

  const handleUnhighlight = useCallback(() => {
    onHighlightItem([]);
  }, [onHighlightItem]);

  // Update bar opacity based on highlightItems
  useLayoutEffect(() => {
    if (svgRef.current) {
      d3.select(svgRef.current).select(".bar").attr("opacity", 0.3);
      highlightItems.forEach(item => {
        d3.select(svgRef.current).selectAll(`.bar[data-label="${item}"]`).attr("opacity", 1);
      });
    }
  }, [highlightItems]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tooltip?.isSticky) {
        const tooltipElement = (event.target as HTMLElement).closest(".tooltip");
        const anchorEl = (event.target as HTMLElement).closest(".bar");

        if (!tooltipElement && !anchorEl) {
          setTooltip(null);
        }
      }
    };

    if (tooltip?.isSticky) {
      document.addEventListener("click", handleClickOutside);
      return () => {
        document.removeEventListener("click", handleClickOutside);
      };
    }
  }, [tooltip?.isSticky]);

  const displayIsNodata = useDisplayIsNodata({
    dataSet: dataSet,
    isLoading: isLoading,
    isNodataComponent: isNodataComponent,
    isNodata: isNodata,
  });

  // Memoize the bars rendering
  const renderBars = useMemo(() => {
    const shouldShowAll = visibleItems.length === 0;
    return filteredDataSet
      .filter(d =>
        shouldShowAll
          ? !disabledItems.includes(d?.label)
          : !disabledItems.includes(d?.label) && visibleItems.includes(d?.label)
      )
      .map((d, i) => {
        const x1 = xAxisScale(Math.min(0, d.valueBased)) + padding.left;
        const x2 = xAxisScale(Math.min(0, d.valueCompared)) + padding.left;
        const width1 = Math.abs(xAxisScale(d.valueBased) - xAxisScale(0));
        const width2 = Math.abs(xAxisScale(d.valueCompared) - xAxisScale(0));

        const comparedColor = finalColorsMapping[d?.label] ?? d.color ?? "transparent";
        const basedColor =
          colorsBasedMapping[d?.label] ??
          finalColorsMapping[d?.label] ??
          d?.color ??
          "transparent";

        const y = yAxisScale(d?.label) || 0;
        const standardHeight = yAxisScale.bandwidth();

        return (
          <g
            className={"bar"}
            data-label={d?.label}
            data-label-safe={d?.label ? sanitizeForClassName(d.label) : ""}
            key={i}
            style={{
              opacity: highlightItems.includes(d?.label) || highlightItems.length === 0 ? 1 : 0.3,
            }}
            onMouseOver={() => handleHighlight(d?.label)}
            onMouseOut={handleUnhighlight}
          >
            {width1 < width2 ? (
              <>
                <rect
                  className="value-compared"
                  x={x2}
                  y={y + (standardHeight - 30) / 2}
                  width={Math.max(width2, 3)}
                  height={30}
                  fill={comparedColor}
                  opacity={VALUE_COMPARED_OPACITY}
                  rx={5}
                  ry={5}
                  onMouseOver={event => handleMouseOver(d, event, "compared")}
                  onMouseOut={handleMouseOut}
                  onClick={event => handleMouseClick(d, event, "compared")}
                  stroke="#fff"
                  strokeWidth={1}
                />
                <rect
                  className="value-based"
                  x={x1}
                  y={y + (standardHeight - 30) / 2}
                  width={Math.max(width1, 3)}
                  height={30}
                  fill={basedColor}
                  rx={5}
                  ry={5}
                  onMouseOver={event => handleMouseOver(d, event, "based")}
                  onMouseOut={handleMouseOut}
                  onClick={event => handleMouseClick(d, event, "based")}
                  opacity={VALUE_BASED_OPACITY}
                  stroke="#fff"
                  strokeWidth={1}
                />
              </>
            ) : (
              <>
                <rect
                  className="value-based"
                  x={x1}
                  y={y + (standardHeight - 30) / 2}
                  width={Math.max(width1, 3)}
                  height={30}
                  fill={basedColor}
                  rx={5}
                  ry={5}
                  onMouseOver={event => handleMouseOver(d, event, "based")}
                  onMouseOut={handleMouseOut}
                  onClick={event => handleMouseClick(d, event, "based")}
                  opacity={VALUE_BASED_OPACITY}
                  stroke="#fff"
                  strokeWidth={1}
                />
                <rect
                  className="value-compared"
                  x={x2}
                  y={y + (standardHeight - 30) / 2}
                  width={Math.max(width2, 3)}
                  height={30}
                  fill={comparedColor}
                  opacity={VALUE_COMPARED_OPACITY}
                  rx={5}
                  ry={5}
                  onMouseOver={event => handleMouseOver(d, event, "compared")}
                  onMouseOut={handleMouseOut}
                  onClick={event => handleMouseClick(d, event, "compared")}
                  stroke="#fff"
                  strokeWidth={1}
                />
              </>
            )}
          </g>
        );
      });
  }, [
    visibleItems,
    filteredDataSet,
    disabledItems,
    xAxisScale,
    yAxisScale,
    highlightItems,
    handleUnhighlight,
    finalColorsMapping,
    handleMouseOut,
    colorsBasedMapping,
    handleHighlight,
    handleMouseOver,
    handleMouseClick,
    padding.left,
  ]);

  // The items the canvas renderer paints — same visibility cull the SVG
  // `renderBars` memo applies (disabled items removed; visibleItems honoured
  // when the legend has narrowed the selection).
  const canvasDrawData = useMemo(() => {
    const shouldShowAll = visibleItems.length === 0;
    return filteredDataSet.filter(d =>
      shouldShowAll
        ? !disabledItems.includes(d?.label)
        : !disabledItems.includes(d?.label) && visibleItems.includes(d?.label)
    );
  }, [filteredDataSet, disabledItems, visibleItems]);

  // Canvas renderer — active only when renderer="canvas".
  const canvasInteraction = useComparableHorizontalBarChartCanvasRendering({
    enabled: renderer === "canvas",
    canvasRef,
    svgRef,
    tooltipRef: canvasTooltipRef,
    drawData: canvasDrawData,
    fullDataSet: dataSet,
    width,
    height,
    margin,
    padding,
    xScale: xAxisScale as never,
    yScale: yAxisScale,
    finalColorsMapping,
    colorsBasedMapping,
    patternsMapping,
    highlightItems,
    tooltipFormatter: tooltipFormatter as never,
    onHighlightItem,
  });

  useLayoutEffect(() => {
    renderCompleteRef.current = true;
  }, []);

  useDeepCompareEffect(() => {
    if (onChartDataProcessed && renderCompleteRef.current) {
      // Ensure unique labels
      const uniqueLabels = [...new Set(yAxisDomain)];

      // Only proceed if we have valid data
      if (uniqueLabels.length > 0) {
        const domain = yAxisScale.domain();
        const yMin = Number(domain[0]);
        const yMax = Number(domain[1]);

        // Generate legend data (include disabled items).
        //
        // `finalColorsMapping[label]` may be the literal string "transparent"
        // when the chart was opted into wait-for-legend mode (skipColorMappingDispatch=true).
        // That sentinel is fine for the chart's OWN rendering — it produces
        // invisible bars until the consumer's external CSS paints over them —
        // but it must NOT leak into the legendData we expose to consumers.
        // Consumers (e.g. project-side `useGeneratedColor` CSS injectors that
        // read `chartMetadata.legendData[i].color`, or callers who build SVG
        // <pattern> defs whose stroke comes from `legendData[i].color`) need
        // a real color. LineChart's metadata-expose hook always produces real
        // colors via DEFAULT_COLORS regardless of the flag — this aligns
        // ComparableHorizontalBarChart with that contract by treating
        // "transparent" as "no color resolved" and falling through to the
        // standard fallback chain.
        const legendData: LegendItem[] = filteredDataSet.map((item, index) => {
          const mapped = finalColorsMapping[item.label];
          const resolvedColor =
            mapped && mapped !== "transparent"
              ? mapped
              : item.color || colors[index % colors.length] || "#000000";
          return {
            label: item.label,
            color: resolvedColor,
            order: index,
            disabled: disabledItems.includes(item.label),
            dataLabelSafe: sanitizeForClassName(item.label),
          };
        });

        const currentMetadata: ChartMetadata = {
          xAxisDomain: uniqueLabels,
          yAxisDomain: [yMin, yMax],
          visibleItems: visibleItemsList,
          renderedData,
          chartType: "comparable-horizontal-bar-chart",
          legendData,
        };

        // Check individual changes
        const yAxisDomainChanged = !isEqual(
          prevChartDataRef.current?.yAxisDomain,
          currentMetadata.yAxisDomain
        );
        const xAxisDomainChanged = !isEqual(
          prevChartDataRef.current?.xAxisDomain,
          currentMetadata.xAxisDomain
        );
        const visibleItemsChanged = !isEqual(
          prevChartDataRef.current?.visibleItems,
          currentMetadata.visibleItems
        );
        const renderedDataKeysChanged = !isEqual(
          Object.keys(prevChartDataRef.current?.renderedData || {}).sort(),
          Object.keys(currentMetadata.renderedData).sort()
        );

        // Check if data has actually changed
        const hasChanged =
          !prevChartDataRef.current ||
          yAxisDomainChanged ||
          xAxisDomainChanged ||
          visibleItemsChanged ||
          renderedDataKeysChanged;

        // Only call callback if data has changed
        if (hasChanged) {
          onChartDataProcessed(currentMetadata);
          prevChartDataRef.current = { ...currentMetadata };
        }

        // Call legend data change callback
        if (onLegendDataChange) {
          onLegendDataChange(legendData);
        }
      }
    }
  }, [
    yAxisDomain,
    xAxisDomain,
    visibleItemsList,
    renderedData,
    yAxisScale,
    disabledItems,
    filteredDataSet,
    finalColorsMapping,
  ]);

  return (
    <ComparableHorizontalBarChartStyled>
      <svg
        width={width}
        height={height}
        ref={svgRef}
        style={{ overflow: "visible", position: "relative" }}
        onMouseOut={event => {
          event.stopPropagation();
          event.preventDefault();
          onHighlightItem([]);
        }}
      >
        <MichiVzCredit />
        {children}
        <Title x={width / 2} y={margin.top / 2}>
          {title}
        </Title>
        {filteredDataSet.length > 0 && !isLoading && (
          <>
            <XaxisLinear
              xScale={xAxisScale}
              height={height}
              margin={margin}
              padding={padding}
              xAxisFormat={xAxisFormat}
              xAxisDataType={xAxisDataType}
              showGrid={showGrid}
              showZeroLine={showZeroLineForXAxis}
              showDividerNextToYAxis={showZeroLineForXAxis}
            />
            {memoizedYaxisBand}
          </>
        )}
        {renderer !== "canvas" && renderBars}
      </svg>
      {renderer === "canvas" && (
        <canvas
          ref={canvasRef}
          className="comparable-horizontal-bar-canvas"
          style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}
        />
      )}
      {renderer === "canvas" && (
        <div
          className="tooltip"
          ref={canvasTooltipRef}
          style={{
            position: "absolute",
            visibility: "hidden",
            background: "white",
            padding: "5px",
            pointerEvents: "none",
            zIndex: 1000,
          }}
        >
          <div className="tooltip-content" />
          {!canvasInteraction.isSticky && <TooltipHint />}
        </div>
      )}
      {renderer !== "canvas" && tooltip && (
        <div
          className="tooltip"
          style={{
            position: "absolute",
            left: `${tooltip?.x}px`,
            top: `${tooltip?.y}px`,
            background: "white",
            padding: "5px",
            pointerEvents: "none",
          }}
        >
          {!tooltipFormatter && (
            <div>
              ${tooltip?.data?.label}: ${tooltip?.data?.valueBased} - $
              {tooltip?.data?.valueCompared}
            </div>
          )}
          {tooltipFormatter && tooltipFormatter(tooltip?.data, dataSet, tooltip?.type)}
          {!tooltip?.isSticky && <TooltipHint />}
        </div>
      )}
      {isLoading && isLoadingComponent && <>{isLoadingComponent}</>}
      {isLoading && !isLoadingComponent && <LoadingIndicator />}
      {displayIsNodata && <>{isNodataComponent}</>}
    </ComparableHorizontalBarChartStyled>
  );
};

export default ComparableHorizontalBarChart;

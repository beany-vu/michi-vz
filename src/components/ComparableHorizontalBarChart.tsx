import * as d3 from "d3";
import React, { useLayoutEffect, useMemo, useRef, useCallback } from "react";
import isEqual from "lodash/isEqual";
import Title from "../components/shared/Title";
import XaxisLinear from "./shared/XaxisLinear";
import YaxisBand from "./shared/YaxisBand";
import { useChartContext } from "../components/MichiVzProvider";
import LoadingIndicator from "./shared/LoadingIndicator";
import { useDisplayIsNodata } from "./hooks/useDisplayIsNodata";
import useDeepCompareEffect from "use-deep-compare-effect";
import styled from "styled-components";
import { LegendItem } from "../types/data";
import { sanitizeForClassName } from "./hooks/lineChart/lineChartUtils";

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

const MARGIN = { top: 50, right: 50, bottom: 50, left: 50 };
const WIDTH = 900 - MARGIN.left - MARGIN.right;
const HEIGHT = 480 - MARGIN.top - MARGIN.bottom;

interface LineChartProps {
  dataSet: DataPoint[];
  width: number;
  height: number;
  margin: { top: number; right: number; bottom: number; left: number };
  xAxisFormat?: (d: number | { valueOf(): number }) => string;
  yAxisFormat?: (d: number | string) => string;
  xAxisPredefinedDomain?: number[];
  xAxisDataType: "number" | "date_annual" | "date_monthly";
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
  showGrid?: boolean;
  showZeroLineForXAxis?: boolean;
  tickHtmlWidth?: number;
  // highlightItems and disabledItems as props for better performance
  highlightItems?: string[];
  disabledItems?: string[];
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
  showGrid = false,
  showZeroLineForXAxis = false,
  tickHtmlWidth,
  highlightItems = [],
  disabledItems = [],
}) => {
  const [tooltip, setTooltip] = React.useState<{
    x: number;
    y: number;
    data: DataPoint;
    type?: TValueType;
  } | null>(null);
  const { colorsMapping, colorsBasedMapping, visibleItems } = useChartContext();
  const svgRef = useRef<SVGSVGElement | null>(null);
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
            .range([width - margin.left, margin.right])
            .clamp(true)
            .nice()
        : d3
            .scaleTime()
            .domain(xAxisDomain)
            .range([width - margin.left, margin.right]),
    [xAxisDomain, width, margin, xAxisDataType]
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
      />
    );
  }, [yAxisScale, width, margin, yAxisFormat, tickHtmlWidth]);

  // Memoize event handlers
  const handleMouseOver = useCallback(
    (d: DataPoint, event: React.MouseEvent<SVGRectElement, MouseEvent>, type: TValueType) => {
      if (svgRef.current) {
        const mousePoint = d3.pointer(event.nativeEvent, svgRef.current);
        setTooltip({
          x: mousePoint[0],
          y: mousePoint[1],
          data: d,
          type,
        });
      }
    },
    []
  );

  const handleMouseOut = useCallback(() => {
    setTooltip(null);
  }, []);

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
        const x1 = margin.left + xAxisScale(Math.min(0, d.valueBased)) - margin.left;
        const x2 = margin.left + xAxisScale(Math.min(0, d.valueCompared)) - margin.left;
        const width1 = Math.abs(xAxisScale(d.valueBased) - xAxisScale(0));
        const width2 = Math.abs(xAxisScale(d.valueCompared) - xAxisScale(0));

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
                  fill={colorsMapping[d?.label] ?? d.color ?? "transparent"}
                  opacity={0.9}
                  rx={5}
                  ry={5}
                  onMouseOver={event => handleMouseOver(d, event, "compared")}
                  onMouseOut={handleMouseOut}
                  stroke="#fff"
                  strokeWidth={1}
                />
                <rect
                  className="value-based"
                  x={x1}
                  y={y + (standardHeight - 30) / 2}
                  width={Math.max(width1, 3)}
                  height={30}
                  fill={colorsBasedMapping[d?.label] ?? d?.color ?? "transparent"}
                  rx={5}
                  ry={5}
                  onMouseOver={event => handleMouseOver(d, event, "based")}
                  onMouseOut={handleMouseOut}
                  opacity={0.9}
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
                  fill={colorsBasedMapping[d?.label] ?? d?.color ?? "transparent"}
                  rx={5}
                  ry={5}
                  onMouseOver={event => handleMouseOver(d, event, "based")}
                  onMouseOut={handleMouseOut}
                  opacity={0.9}
                  stroke="#fff"
                  strokeWidth={1}
                />
                <rect
                  className="value-compared"
                  x={x2}
                  y={y + (standardHeight - 30) / 2}
                  width={Math.max(width2, 3)}
                  height={30}
                  fill={colorsMapping[d?.label] ?? d.color ?? "transparent"}
                  opacity={0.9}
                  rx={5}
                  ry={5}
                  onMouseOver={event => handleMouseOver(d, event, "compared")}
                  onMouseOut={handleMouseOut}
                  stroke="#fff"
                  strokeWidth={1}
                />
              </>
            )}
          </g>
        );
      });
  }, [
    filteredDataSet,
    disabledItems,
    visibleItems,
    margin,
    xAxisScale,
    yAxisScale,
    highlightItems,
    colorsMapping,
    colorsBasedMapping,
    handleMouseOver,
    handleMouseOut,
    handleHighlight,
    handleUnhighlight,
  ]);

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

        // Generate legend data (include disabled items)
        const legendData: LegendItem[] = filteredDataSet.map((item, index) => ({
          label: item.label,
          color: item.color || "#000000",
          order: index,
          disabled: disabledItems.includes(item.label),
          dataLabelSafe: sanitizeForClassName(item.label),
        }));

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
  }, [yAxisDomain, xAxisDomain, visibleItemsList, renderedData, onChartDataProcessed, yAxisScale, disabledItems, filteredDataSet, onLegendDataChange]);

  return (
    <ComparableHorizontalBarChartStyled>
      <svg
        width={width}
        height={height}
        ref={svgRef}
        style={{ overflow: "visible" }}
        onMouseOut={event => {
          event.stopPropagation();
          event.preventDefault();
          onHighlightItem([]);
        }}
      >
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
              xAxisFormat={xAxisFormat}
              xAxisDataType={xAxisDataType}
              showGrid={showGrid}
              showZeroLine={showZeroLineForXAxis}
            />
            {memoizedYaxisBand}
          </>
        )}
        {renderBars}
      </svg>
      {tooltip && (
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
        </div>
      )}
      {isLoading && isLoadingComponent && <>{isLoadingComponent}</>}
      {isLoading && !isLoadingComponent && <LoadingIndicator />}
      {displayIsNodata && <>{isNodataComponent}</>}
    </ComparableHorizontalBarChartStyled>
  );
};

export default ComparableHorizontalBarChart;

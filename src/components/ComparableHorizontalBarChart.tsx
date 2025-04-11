import * as d3 from "d3";
import React, { useEffect, useMemo, useRef, useCallback, useLayoutEffect } from "react";
import Title from "../components/shared/Title";
import XaxisLinear from "./shared/XaxisLinear";
import YaxisBand from "./shared/YaxisBand";
import { useChartContext } from "../components/MichiVzProvider";
import LoadingIndicator from "./shared/LoadingIndicator";
import { useDisplayIsNodata } from "./hooks/useDisplayIsNodata";

interface DataPoint {
  label: string;
  color?: string;
  valueBased: number;
  valueCompared: number;
}

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
    dataSet?: {
      label: string;
      color: string;
      series: DataPoint[];
    }[]
  ) => string;
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
}

interface ChartMetadata {
  yAxisDomain: string[];
  xAxisDomain: string[];
  visibleItems: string[];
  renderedData: { [key: string]: DataPoint[] };
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
}) => {
  const [tooltip, setTooltip] = React.useState<{
    x: number;
    y: number;
    data: DataPoint;
  } | null>(null);
  const {
    colorsMapping,
    colorsBasedMapping,
    highlightItems,
    setHighlightItems,
    disabledItems,
    setHiddenItems,
    hiddenItems,
    setVisibleItems,
    visibleItems,
    setDisabledItems,
  } = useChartContext();
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
    return <YaxisBand yScale={yAxisScale} width={width} margin={margin} yAxisFormat={yAxisFormat} />;
  }, [yAxisScale, width, margin, yAxisFormat]);

  // Memoize event handlers
  const handleMouseOver = useCallback((d: DataPoint, event: React.MouseEvent<SVGRectElement, MouseEvent>) => {
    if (svgRef.current) {
      const mousePoint = d3.pointer(event.nativeEvent, svgRef.current);
      setTooltip({
        x: mousePoint[0],
        y: mousePoint[1],
        data: d,
      });
    }
  }, []);

  const handleMouseOut = useCallback(() => {
    setTooltip(null);
  }, []);

  const handleHighlight = useCallback(
    (label: string) => {
      setHighlightItems([label]);
    },
    [setHighlightItems]
  );

  const handleUnhighlight = useCallback(() => {
    setHighlightItems([]);
  }, [setHighlightItems]);

  // Update hiddenItems based on filteredDataSet
  useEffect(() => {
    if (filter) {
      const newHidden = dataSet
        .filter(item => !filteredDataSet.some(filtered => filtered.label === item.label))
        .map(item => item.label);

      if (JSON.stringify(newHidden) !== JSON.stringify(hiddenItems)) {
        setHiddenItems(newHidden);
      }
    } else {
      if (hiddenItems.length > 0) {
        setHiddenItems([]);
      }
    }
  }, [dataSet, filteredDataSet, filter, hiddenItems, setHiddenItems]);

  // Update visibleItems based on filteredDataSet
  useEffect(() => {
    if (filter) {
      const newVisible = filteredDataSet.map(item => item.label);
      if (JSON.stringify(newVisible) !== JSON.stringify(visibleItems)) {
        setVisibleItems(newVisible);
      }
    } else {
      const allLabels = dataSet.map(item => item.label);
      if (JSON.stringify(allLabels) !== JSON.stringify(visibleItems)) {
        setVisibleItems(allLabels);
      }
    }
  }, [dataSet, filteredDataSet, filter, visibleItems, setVisibleItems]);

  // Update bar opacity based on highlightItems
  useEffect(() => {
    if (svgRef.current) {
      d3.select(svgRef.current).select(".bar").attr("opacity", 0.3);
      highlightItems.forEach(item => {
        d3.select(svgRef.current).selectAll(`.bar-[data-label="${item}"]`).attr("opacity", 1);
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
    return filteredDataSet
      .filter(d => !disabledItems.includes(d?.label) && visibleItems.includes(d?.label))
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
                  fill={colorsMapping[d?.label] ?? d.color}
                  opacity={0.9}
                  rx={5}
                  ry={5}
                  onMouseOver={event => handleMouseOver(d, event)}
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
                  fill={colorsBasedMapping[d?.label] ?? d?.color}
                  rx={5}
                  ry={5}
                  onMouseOver={event => handleMouseOver(d, event)}
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
                  fill={colorsBasedMapping[d?.label] ?? d?.color}
                  rx={5}
                  ry={5}
                  onMouseOver={event => handleMouseOver(d, event)}
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
                  fill={colorsMapping[d?.label] ?? d.color}
                  opacity={0.9}
                  rx={5}
                  ry={5}
                  onMouseOver={event => handleMouseOver(d, event)}
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

  useEffect(() => {
    if (renderCompleteRef.current && onChartDataProcessed) {
      // Ensure unique labels
      const uniqueLabels = [...new Set(yAxisDomain)];

      const currentMetadata: ChartMetadata = {
        yAxisDomain: uniqueLabels,
        xAxisDomain: xAxisDomain.map(value => {
          if (value instanceof Date) {
            return value.toISOString();
          }
          return value.toString();
        }),
        visibleItems: visibleItems,
        renderedData: {
          [uniqueLabels[0]]: filteredDataSet,
        },
      };

      // Check if data has actually changed
      const hasChanged =
        !prevChartDataRef.current ||
        JSON.stringify(prevChartDataRef.current.yAxisDomain) !==
          JSON.stringify(currentMetadata.yAxisDomain) ||
        JSON.stringify(prevChartDataRef.current.xAxisDomain) !==
          JSON.stringify(currentMetadata.xAxisDomain) ||
        JSON.stringify(prevChartDataRef.current.visibleItems) !==
          JSON.stringify(currentMetadata.visibleItems) ||
        JSON.stringify(Object.keys(prevChartDataRef.current.renderedData).sort()) !==
          JSON.stringify(Object.keys(currentMetadata.renderedData).sort());

      // Only call callback if data has changed
      if (hasChanged) {
        // Update ref before calling callback
        prevChartDataRef.current = currentMetadata;

        // Call callback with slight delay to ensure DOM updates are complete
        const timeoutId = setTimeout(() => {
          onChartDataProcessed(currentMetadata);
        }, 0);

        return () => clearTimeout(timeoutId);
      }
    }
  }, [yAxisDomain, xAxisDomain, visibleItems, filteredDataSet, onChartDataProcessed]);

  return (
    <div style={{ position: "relative" }}>
      <svg
        width={width}
        height={height}
        ref={svgRef}
        style={{ overflow: "visible" }}
        onMouseOut={event => {
          event.stopPropagation();
          event.preventDefault();
          setHighlightItems([]);
        }}
      >
        {children}
        <Title x={width / 2} y={margin.top / 2}>
          {title}
        </Title>
        <XaxisLinear
          xScale={xAxisScale}
          height={height}
          margin={margin}
          xAxisFormat={xAxisFormat}
          xAxisDataType={xAxisDataType}
        />
        {memoizedYaxisBand}
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
              ${tooltip?.data?.label}: ${tooltip?.data?.valueBased} - ${tooltip?.data?.valueCompared}
            </div>
          )}
          {tooltipFormatter && tooltipFormatter(tooltip?.data)}
        </div>
      )}
      {isLoading && isLoadingComponent && <>{isLoadingComponent}</>}
      {isLoading && !isLoadingComponent && <LoadingIndicator />}
      {displayIsNodata && <>{isNodataComponent}</>}
    </div>
  );
};

export default React.memo(ComparableHorizontalBarChart);

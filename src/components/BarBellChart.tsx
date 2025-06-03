import React, { useRef, useLayoutEffect, useMemo, useState, useCallback } from "react";
import Title from "./shared/Title";
import defaultConf from "./hooks/useDefaultConfig";
import * as d3 from "d3";
import { scaleBand, scaleLinear } from "d3";
import YaxisBand from "./shared/YaxisBand";
import XaxisLinear from "./shared/XaxisLinnearBarBellChart";
import { useChartContext } from "./MichiVzProvider";
import { useDisplayIsNodata } from "./hooks/useDisplayIsNodata";
import LoadingIndicator from "./shared/LoadingIndicator";

interface DataPoint {
  [key: string]: number | undefined;
}

interface ChartMetadata {
  xAxisDomain: string[];
  yAxisDomain: [number, number];
  visibleItems: string[];
  renderedData: string[];
  chartType: "bar-bell-chart";
}

interface BarBellChartProps {
  dataSet: DataPoint[];
  keys: string[];
  width: number;
  height: number;
  margin: { top: number; right: number; bottom: number; left: number };
  title: string;
  isLoading?: boolean;
  isLoadingComponent?: React.ReactNode;
  isNodataComponent?: React.ReactNode;
  isNodata?: boolean | ((dataSet: DataPoint[]) => boolean);
  xAxisFormat?: (d: number | string) => string;
  yAxisFormat?: (d: number | string) => string;
  xAxisDataType?: "number" | "date_annual" | "date_monthly";
  tooltipFormat?: (d: DataPoint, currentKey: string, currentValue: string | number) => string;
  showGrid?: { x: boolean; y: boolean };
  children?: React.ReactNode;
  onChartDataProcessed?: (metadata: ChartMetadata) => void;
  onHighlightItem?: (labels: string[]) => void;
  filter?: { limit: number; criteria: string; sortingDir: string };
  tickHtmlWidth?: number;
}

const BarBellChart: React.FC<BarBellChartProps> = ({
  dataSet = [],
  keys = [],
  width = defaultConf.WIDTH,
  height = defaultConf.HEIGHT,
  margin = defaultConf.MARGIN,
  title,
  children,
  isLoading,
  isLoadingComponent,
  isNodataComponent,
  isNodata,
  xAxisDataType,
  yAxisFormat,
  xAxisFormat,
  tooltipFormat = null,
  showGrid = defaultConf.SHOW_GRID,
  onChartDataProcessed,
  onHighlightItem,
  tickHtmlWidth,
}) => {
  const { colorsMapping, highlightItems, disabledItems } = useChartContext();
  const ref = useRef<SVGSVGElement>(null);
  const refTooltip = useRef<HTMLDivElement>(null);
  const renderCompleteRef = useRef(false);
  const prevChartDataRef = useRef<ChartMetadata | null>(null);
  const [hoveredYItem, setHoveredYItem] = useState<string | null>(null);

  const handleYAxisHover = useCallback((item: string | null) => {
    setHoveredYItem(item);
  }, []);

  useLayoutEffect(() => {
    renderCompleteRef.current = true;
  }, []);

  const generateTooltip = (
    d: DataPoint,
    currentKey: string,
    currentValue: string | number,
    event: React.MouseEvent<SVGRectElement | SVGCircleElement | HTMLDivElement>
  ) => {
    event.preventDefault();
    event.stopPropagation();
    const [x, y] = d3.pointer(event, ref.current);
    let content: string;
    if (tooltipFormat) {
      content = tooltipFormat(d, currentKey, currentValue);
    } else {
      content = `${d?.date}: ${currentKey} - ${currentValue}`;
    }
    const tooltip = refTooltip.current;

    if (tooltip) {
      tooltip.style.top = `${y}px`;
      tooltip.style.left = `${x}px`;
      tooltip.style.opacity = "1";
      tooltip.style.visibility = "visible";
      tooltip.innerHTML = content;
    }
  };

  const hideTooltip = () => {
    const tooltip = refTooltip.current;
    if (tooltip) {
      tooltip.style.opacity = "0";
      tooltip.style.visibility = "hidden";
    }
  };

  const yValues = useMemo(() => dataSet.map(d => d.date).map(date => date), [dataSet]);

  const yScale = useMemo(
    () =>
      scaleBand()
        .domain(
          yValues.map(value => {
            return `${value}`;
          })
        )
        .range([margin.top + 20, height - margin.bottom]),
    [yValues, margin.top, margin.bottom, height]
  );

  // xValues is the sum of all values which their key is not "date"
  const xValues = useMemo(
    () =>
      dataSet.map(d => {
        let sum = 0;
        for (const key in d) {
          if (key !== "date" && disabledItems.includes(key) === false) {
            sum += d[key] || 0;
          }
        }
        return sum;
      }),
    [dataSet, disabledItems]
  );

  const maxValueX = useMemo(
    () => (Math.max(...xValues) === 0 ? 1 : Math.max(...xValues)),
    [xValues]
  );

  const xScale = useMemo(
    () =>
      scaleLinear()
        .domain([0, maxValueX])
        .range([0, width - margin.left - margin.right])
        .nice()
        .clamp(true),
    [maxValueX, width, margin.left, margin.right]
  );

  const isEmpty = useMemo(() => dataSet.length === 0, [dataSet]);

  useLayoutEffect(() => {
    const svg = d3.select(ref.current);
    if (highlightItems.length > 0) {
      svg.selectAll(".bar-data").style("opacity", 0.1);
      svg.selectAll(".bar-data-point-shape").style("opacity", 0.1);
      highlightItems.forEach(item => {
        svg.selectAll(`[data-label="${item}"]`).style("opacity", 0.9);
      });
    } else {
      svg.selectAll(".bar-data").style("opacity", 0.9);
      svg.selectAll(".bar-data-point-shape").style("opacity", 0.9);
    }
  }, [highlightItems, disabledItems]);

  useLayoutEffect(() => {
    const svg = d3.select(ref.current);
    svg.selectAll(".bar-data-point").raise();
  }, [dataSet, xValues]);

  const displayIsNodata = useDisplayIsNodata({
    dataSet: dataSet,
    isLoading: isLoading,
    isNodataComponent: isNodataComponent,
    isNodata: isNodata,
  });

  useLayoutEffect(() => {
    if (renderCompleteRef.current && onChartDataProcessed) {
      const currentMetadata: ChartMetadata = {
        xAxisDomain: xValues.map(String),
        yAxisDomain: [0, maxValueX],
        visibleItems: keys.filter(key => !disabledItems.includes(key)),
        renderedData: keys,
        chartType: "bar-bell-chart",
      };

      // Check if data has actually changed
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
  }, [yValues, maxValueX, keys, disabledItems, dataSet, onChartDataProcessed]);

  return (
    <div style={{ position: "relative" }}>
      {isLoading && isLoadingComponent && <>{isLoadingComponent}</>}
      {isLoading && !isLoadingComponent && <LoadingIndicator />}
      {displayIsNodata && <>{isNodataComponent}</>}
      <svg ref={ref} height={height} width={width}>
        {children}
        <Title x={width / 2} y={margin.top / 2}>
          {title}
        </Title>
        {!isEmpty && !isLoading && (
          <>
            <YaxisBand
              yScale={yScale}
              width={width}
              margin={margin}
              yAxisFormat={yAxisFormat}
              showGrid={showGrid?.y || false}
              onHover={handleYAxisHover}
              hoveredItem={hoveredYItem}
              tickHtmlWidth={tickHtmlWidth}
            />
            <XaxisLinear
              xScale={xScale}
              height={height}
              margin={margin}
              xAxisFormat={xAxisFormat}
              xAxisDataType={xAxisDataType}
              showGrid={showGrid?.x || false}
              position={"top"}
              ticks={12}
              isEmpty={isEmpty}
            />
          </>
        )}
        {dataSet.map((d, i) => {
          let cumulativeX = margin.left; // Initialize cumulativeX for each row

          return (
            <g key={`group-line-${i}`} className={`group-line group-line-${i}`}>
              {keys
                .filter(key => !disabledItems.includes(key))
                .map((key, j) => {
                  const value = d[key];
                  const x = cumulativeX; // Use cumulativeX as the starting point for each rectangle
                  const width = xScale(value); // Adjust width based on value

                  const shapeStyle = {
                    "--data-color": colorsMapping?.[key],
                    transition: "all 0.1s ease-out",
                    opacity:
                      hoveredYItem !== null
                        ? hoveredYItem === `${d?.date}`
                          ? disabledItems.includes(key)
                            ? 0.1
                            : 0.9
                          : 0.3
                        : disabledItems.includes(key)
                          ? 0.1
                          : 0.9,
                    background: colorsMapping?.[key],
                    borderRadius: "50%",
                    width: "12px",
                    height: "12px",
                  } as React.CSSProperties;

                  cumulativeX += width; // Update cumulativeX for the next rectangle
                  return (
                    <React.Fragment key={`${key}-${i}`}>
                      {value !== 0 && (
                        <rect
                          className="bar-data"
                          data-label={key}
                          key={`${key}-${i}`}
                          x={x}
                          y={yScale(`${d?.date}`) + yScale.bandwidth() / 2 - 2 || 0}
                          height={4}
                          width={width}
                          fill={colorsMapping?.[key]}
                          style={{
                            transition: "all 0.1s ease-out",
                            opacity:
                              hoveredYItem !== null
                                ? hoveredYItem === `${d?.date}`
                                  ? disabledItems.includes(key)
                                    ? 0.1
                                    : 0.9
                                  : 0.3
                                : disabledItems.includes(key)
                                  ? 0.1
                                  : 0.9,
                          }}
                          onMouseEnter={event => {
                            onHighlightItem([key]);
                            generateTooltip(d, key, value, event);
                          }}
                          onMouseLeave={() => {
                            onHighlightItem([]);
                            hideTooltip();
                          }}
                          data-tooltip={JSON.stringify(d)}
                        />
                      )}
                      {value !== undefined && (
                        <foreignObject
                          x={x + width - 6}
                          y={yScale(`${d?.date}`) + yScale.bandwidth() / 2 - 6}
                          width="12"
                          height="12"
                          className={`bar-data-point ${value === 0 ? "has-value-zero" : ""}`}
                        >
                          <div
                            data-label={key}
                            data-value={value}
                            data-index={j}
                            data-order={keys.indexOf(key) + 1}
                            data-color={colorsMapping?.[key]}
                            className={`bar-data-point-shape ${value === 0 ? "data-value-zero" : ""}`}
                            style={shapeStyle}
                            onMouseEnter={event => {
                              onHighlightItem([key]);
                              generateTooltip(d, key, value, event);
                            }}
                            onMouseLeave={() => {
                              onHighlightItem([]);
                              hideTooltip();
                            }}
                          ></div>
                        </foreignObject>
                      )}
                    </React.Fragment>
                  );
                })}
            </g>
          );
        })}
      </svg>
      <div
        className="tooltip"
        ref={refTooltip}
        style={{
          position: "absolute",
          opacity: 0,
          visibility: "hidden",
          padding: "10px",
          backgroundColor: "rgba(0, 0, 0, 0.6)",
          color: "white",
          borderRadius: "5px",
        }}
      />
    </div>
  );
};

export default BarBellChart;

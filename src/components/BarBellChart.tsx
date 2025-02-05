import React, { useEffect, useRef } from "react";
import Title from "./shared/Title";
import defaultConf from "./hooks/useDefaultConfig";
import * as d3 from "d3";
import { scaleBand, scaleLinear } from "d3";
import YaxisBand from "./shared/YaxisBand";
import XaxisLinear from "./shared/XaxisLinear";
import { useChartContext } from "./MichiVzProvider";
import { useDisplayIsNodata } from "./hooks/useDisplayIsNodata";

interface DataPoint {
  [key: string]: number | undefined;
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
  tooltipFormat?: (
    d: DataPoint,
    currentKey: string,
    currentValue: string | number,
  ) => string;
  showGrid?: { x: boolean; y: boolean };
  children?: React.ReactNode;
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
}) => {
  const { colorsMapping, highlightItems, setHighlightItems, disabledItems } =
    useChartContext();
  const ref = useRef<SVGSVGElement>(null);
  const refTooltip = useRef<HTMLDivElement>(null);

  const generateTooltip = (
    d: DataPoint,
    currentKey: string,
    currentValue: string | number,
    event: React.MouseEvent<SVGRectElement | SVGCircleElement | HTMLDivElement>,
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

  const yValues = dataSet.map((d) => d.date).map((date) => date);

  const yScale = scaleBand()
    .domain(
      yValues.map((value) => {
        return `${value}`;
      }),
    )
    .range([margin.top + 20, height - margin.bottom]);

  // xValues is the sum of all values which their key is not "date"
  const xValues = dataSet.map((d) => {
    let sum = 0;
    for (const key in d) {
      if (key !== "date" && disabledItems.includes(key) === false) {
        sum += d[key] || 0;
      }
    }
    return sum;
  });

  const maxValueX = Math.max(...xValues) === 0 ? 1 : Math.max(...xValues);

  const xScale = scaleLinear()
    .domain([0, maxValueX])
    .range([0, width - margin.left - margin.right])
    .nice()
    .clamp(true);

  useEffect(() => {
    const svg = d3.select(ref.current);
    if (highlightItems.length > 0) {
      svg.selectAll(".bar-data").style("opacity", 0.1);
      svg.selectAll(".bar-data-point-shape").style("opacity", 0.1);
      highlightItems.forEach((item) => {
        svg.selectAll(`[data-label="${item}"]`).style("opacity", 0.9);
      });
    } else {
      svg.selectAll(".bar-data").style("opacity", 0.9);
      svg.selectAll(".bar-data-point-shape").style("opacity", 0.9);
    }
  }, [highlightItems, disabledItems]);

  useEffect(() => {
    const svg = d3.select(ref.current);
    svg.selectAll(".bar-data-point").raise();
  }, [dataSet, xValues]);

  const displayIsNodata = useDisplayIsNodata({
    dataSet: dataSet,
    isLoading: isLoading,
    isNodataComponent: isNodataComponent,
    isNodata: isNodata,
  });

  return (
    <div style={{ position: "relative" }}>
      {isLoading && isLoadingComponent}
      {displayIsNodata && isNodataComponent}
      <svg ref={ref} height={height} width={width}>
        {children}
        <Title x={width / 2} y={margin.top / 2}>
          {title}
        </Title>
        <YaxisBand
          yScale={yScale}
          width={width}
          margin={margin}
          yAxisFormat={yAxisFormat}
          showGrid={showGrid?.y || false}
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
        />
        {dataSet.map((d, i) => {
          let cumulativeX = margin.left; // Initialize cumulativeX for each row

          return (
            <g key={`group-line-${i}`} className={`group-line group-line-${i}`}>
              {keys
                .filter((key) => !disabledItems.includes(key))
                .map((key, j) => {
                  const value = d[key];
                  const x = cumulativeX; // Use cumulativeX as the starting point for each rectangle
                  const width = xScale(value); // Adjust width based on value

                  const shapeStyle = {
                    "--data-color": colorsMapping?.[key],
                    transition: "all 0.1s ease-out",
                    opacity: disabledItems.includes(key) ? 0.1 : 0.9,
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
                          y={
                            yScale(`${d?.date}`) + yScale.bandwidth() / 2 - 2 ||
                            0
                          }
                          height={4}
                          width={width}
                          fill={colorsMapping?.[key]}
                          style={{
                            transition: "all 0.1s ease-out",
                            opacity: disabledItems.includes(key) ? 0.1 : 0.9,
                          }}
                          onMouseEnter={(event) => {
                            setHighlightItems([key]);
                            generateTooltip(d, key, value, event);
                          }}
                          onMouseLeave={() => {
                            setHighlightItems([]);
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
                            onMouseEnter={(event) => {
                              setHighlightItems([key]);
                              generateTooltip(d, key, value, event);
                            }}
                            onMouseLeave={() => {
                              setHighlightItems([]);
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

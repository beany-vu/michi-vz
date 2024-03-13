import React, { useEffect, useRef } from "react";
import Title from "./shared/Title";
import defaultConf from "./hooks/useDefaultConfig";
import * as d3 from "d3";
import YaxisBand from "./shared/YaxisBand";
import XaxisLinear from "./shared/XaxisLinear";
import { scaleBand, scaleLinear } from "d3";
import { useChartContext } from "./MichiVzProvider";

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
    event: React.MouseEvent<SVGRectElement | SVGCircleElement>,
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
    .range([margin.top, height - margin.bottom])

    .padding(0.1);

  // xValues is the sum of all values which their key is not "date"
  const xValues = dataSet.map((d) => {
    let sum = 0;
    for (const key in d) {
      if (key !== "date") {
        sum += d[key] || 0;
      }
    }
    return sum;
  });

  const xScale = scaleLinear()
    .domain([0, Math.max(...xValues) + Math.max(...xValues) / 3])
    .clamp(true)
    .nice()
    .range([margin.left, width - margin.right]);

  useEffect(() => {
    const svg = d3.select(ref.current);
    if (highlightItems.length > 0) {
      svg.selectAll(".bar-data").style("opacity", 0.3);
      highlightItems.forEach((item) => {
        svg.selectAll(`[data-label="${item}"]`).style("opacity", 0.9);
      });
    } else {
      svg.selectAll(".bar-data").style("opacity", 0.9);
    }
  }, [highlightItems]);

  return (
    <div style={{ position: "relative" }}>
      {isLoading && isLoadingComponent}
      {!isLoading && !dataSet.length && isNodataComponent}
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

          return keys
            .filter((key) => !disabledItems.includes(key))
            .map((key) => {
              const value = d[key] || 0;
              const x = cumulativeX; // Use cumulativeX as the starting point for each rectangle
              const width = xScale(value); // Adjust width based on value

              cumulativeX += width; // Update cumulativeX for the next rectangle

              return (
                <React.Fragment key={`${key}-${i}`}>
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
                      opacity: 0.9,
                    }}
                    onMouseEnter={(event) => {
                      setHighlightItems([key]);
                      generateTooltip(d, key, value, event);
                    }}
                    onMouseLeave={() => {
                      setHighlightItems([]);
                      hideTooltip();
                    }}
                    data-tip={JSON.stringify(d)}
                  />
                  <circle
                    className="bar-data"
                    data-label={key}
                    cx={x + 3}
                    cy={yScale(`${d?.date}`) + yScale.bandwidth() / 2}
                    r={6}
                    style={{
                      transition: "all 0.1s ease-out",
                      opacity: 0.9,
                    }}
                    fill={colorsMapping?.[key]}
                    onMouseEnter={(event) => {
                      setHighlightItems([key]);
                      generateTooltip(d, key, value, event);
                    }}
                    onMouseLeave={() => {
                      setHighlightItems([]);
                      hideTooltip();
                    }}
                  />
                </React.Fragment>
              );
            });
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

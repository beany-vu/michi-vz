import React, { useMemo, useRef, useEffect } from "react";
import defaultConf from "./hooks/useDefaultConfig";
import * as d3 from "d3";
import Title from "./shared/Title";
import XaxisLinear from "./shared/XaxisLinear";
import YaxisLinear from "./shared/YaxisLinear";
import { useChartContext } from "./MichiVzProvider";

interface DataPoint {
  x: number;
  y: number;
  label: string;
  color?: string;
  d: number;
  meta?: never;
}

interface ScatterPlotChartProps {
  dataSet: DataPoint[];
  width: number;
  height: number;
  margin: { top: number; right: number; bottom: number; left: number };
  title: string;
  children?: React.ReactNode;
  isLoading?: boolean;
  isLoadingComponent?: React.ReactNode;
  isNodataComponent?: React.ReactNode;
  xAxisFormat?: (d: number | string) => string;
  yAxisFormat?: (d: number | string) => string;
  xAxisDataType?: "number" | "date_annual" | "date_monthly";
  tooltipFormatter?: (d: DataPoint) => string;
  showGrid?: { x: boolean; y: boolean };
}

const ScatterPlotChart: React.FC<ScatterPlotChartProps> = ({
  dataSet = [],
  width = defaultConf.WIDTH,
  height = defaultConf.HEIGHT,
  margin = defaultConf.MARGIN,
  title,
  children,
  isLoading,
  isLoadingComponent,
  isNodataComponent,
  xAxisFormat,
  yAxisFormat,
  xAxisDataType = "number",
  tooltipFormatter,
  showGrid = defaultConf.SHOW_GRID,
}) => {
  const ref = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const { colorsMapping, highlightItems, setHighlightItems, disabledItems } =
    useChartContext();
  const xValues = dataSet
    .filter((d) => !disabledItems.includes(d.label))
    .map((d) => d.x || 0);
  const yValues = dataSet
    .filter((d) => !disabledItems.includes(d.label))
    .map((d) => d.y || 0);
  const xDomain = [0, Math.max(...xValues) || 0];
  const yDomain = [0, Math.max(...yValues) || 0];
  // const radiusDomain = [16, d3.max(dataSet, (d) => d.d) || 0];
  // radiusDomain wil·be the range from [16 to 50 px]

  const xScale = useMemo(() => {
    if (xAxisDataType === "number") {
      return d3
        .scaleLinear()
        .domain(xDomain)
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
  }, [xDomain, width, margin]);

  const yScale = useMemo(
    () =>
      d3
        .scaleLinear()
        .domain(yDomain)
        .range([height - margin.bottom, margin.top])
        .nice()
        .clamp(true),
    [yDomain, height, margin],
  );

  // min value is 16 and max value is the max value of the dataSet
  const dDomain = [16, d3.max(dataSet, (d) => d.d) || 16];

  // dScale is scaleQuantile
  const dScale = useMemo(
    () => d3.scaleLinear().domain(dDomain).range([16, 80]),
    [dDomain, height, width, margin],
  );

  useEffect(() => {
    const svg = d3.select(ref.current);

    if (highlightItems.length === 0) {
      svg.selectAll("circle").style("opacity", 0.9);
      return;
    }
    // set opacity for all circles to 0.1, except for the highlighted ones (detect by data-label attribute)
    svg.selectAll("circle[data-label]").style("opacity", 0.1);
    highlightItems.forEach((label) => {
      svg.selectAll(`circle[data-label="${label}"]`).style("opacity", 1);
    });
  }, [highlightItems]);

  return (
    <div style={{ position: "relative" }}>
      {isLoading && isLoadingComponent}
      {!isLoading && !dataSet.length && isNodataComponent}
      <svg width={width} height={height} ref={ref}>
        <Title x={width / 2} y={margin.top / 2}>
          {title}
        </Title>
        {children}
        <XaxisLinear
          xScale={xScale}
          height={height}
          margin={margin}
          xAxisFormat={xAxisFormat}
          ticks={5}
          showGrid={showGrid?.x || false}
        />
        <YaxisLinear
          yScale={yScale}
          width={width}
          height={height}
          margin={margin}
          yAxisFormat={yAxisFormat}
        />
        {dataSet
          .filter((d) => !disabledItems.includes(d.label))
          .map((d, i) => (
            <circle
              data-label={d.label}
              opacity={0.9}
              key={i}
              cx={xScale(d.x)}
              cy={yScale(d.y)}
              r={dScale(d.d) / 2}
              fill={colorsMapping?.[d.label] || d.color || "transparent"}
              style={{
                transition: "r 0.1s ease-out, opacity 0.1s ease-out",
              }}
              onMouseEnter={(event) => {
                const [x, y] = d3.pointer(event);

                setHighlightItems([d.label]);
                if (tooltipRef.current) {
                  tooltipRef.current.style.display = "block";
                  tooltipRef.current.style.left = `${x}px`;
                  tooltipRef.current.style.top = `${y}px`;

                  if (tooltipFormatter) {
                    tooltipRef.current.innerHTML = tooltipFormatter(d);
                    return;
                  }

                  tooltipRef.current.innerHTML = `
                    <div>
                      <div>${d.label}</div>
                      <div>${xAxisFormat ? xAxisFormat(d.x) : d.x}</div>
                      <div>${yAxisFormat ? yAxisFormat(d.y) : d.y}</div>
                    </div>
                  `;
                }
              }}
              onMouseLeave={() => {
                setHighlightItems([]);
                if (tooltipRef.current) {
                  tooltipRef.current.style.display = "none";
                }
              }}
            />
          ))}
      </svg>
      <div
        ref={tooltipRef}
        className="tooltip"
        style={{
          position: "absolute",
          display: "none",
          padding: "10px",
          backgroundColor: "rgba(0, 0, 0, 0.6)",
          color: "white",
          borderRadius: "5px",
          pointerEvents: "none",
          zIndex: 1000,
        }}
      />
    </div>
  );
};

export default ScatterPlotChart;

import * as d3 from "d3";
import React, { useEffect, useMemo, useRef } from "react";
import Title from "../components/shared/Title";
import XaxisLinear from "./shared/XaxisLinear";
import YaxisBand from "./shared/YaxisBand";
import { useChartContext } from "../components/MichiVzProvider";
import LoadingIndicator from "./shared/LoadingIndicator";
import { useDisplayIsNodata } from "./hooks/useDisplayIsNodata";

interface DataPoint {
  label: string;
  color?: string;
  value1: number;
  value2: number;
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
  xAxisDataType: "number" | "date_annual" | "date_monthly";
  yAxisFormat?: (d: number | string) => string;
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
}

const DualHorizontalBarChart: React.FC<LineChartProps> = ({
  dataSet,
  title,
  width = WIDTH,
  height = HEIGHT,
  margin = MARGIN,
  yAxisFormat,
  xAxisFormat,
  xAxisDataType = "number",
  tooltipFormatter,
  children,
  isLoading = false,
  isLoadingComponent,
  isNodataComponent,
  isNodata,
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
  } = useChartContext();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const yAxisDomain = useMemo(
    () =>
      dataSet.filter(d => !disabledItems.includes(d.label)).map(d => d.label),
    [dataSet]
  );
  const xAxisDomain = useMemo(() => {
    const flattenedValues = dataSet
      .filter(d => !disabledItems.includes(d.label))
      .map(d => [d.value1, d.value2])
      .flat();

    if (xAxisDataType === "number") {
      return [Math.max(...flattenedValues), 0];
    }

    if (xAxisDataType === "date_annual" || xAxisDataType === "date_monthly") {
      return [
        new Date(Math.max(...flattenedValues), 1, 1),
        new Date(0, 1, 1), // Assuming the minimum date is January 1, 1900
      ];
    }

    return [];
  }, [dataSet, disabledItems, xAxisDataType]);

  const yAxisScale = d3
    .scaleBand()
    .domain(yAxisDomain)
    .range([margin.top, height - margin.bottom]);

  const xAxis1Scale = d3
    .scaleLinear()
    .domain(xAxisDomain)
    .range([width - margin.right, width / 2])
    .clamp(true)
    .nice(1);

  const xAxis2Scale = d3
    .scaleLinear()
    .domain(xAxisDomain)
    .range([margin.left, width / 2])
    .clamp(true)
    .nice(1);

  const handleMouseOver = (
    d: DataPoint,
    event: React.MouseEvent<SVGRectElement, MouseEvent>
  ) => {
    if (svgRef.current) {
      const mousePoint = d3.pointer(event.nativeEvent, svgRef.current);

      setTooltip(() => ({
        x: mousePoint[0],
        y: mousePoint[1],
        data: d,
      }));
    }
  };

  const handleMouseOut = () => {
    setTooltip(null);
  };

  useEffect(() => {
    d3.select(svgRef.current).select(".bar").attr("opacity", 0.3);
    highlightItems.forEach(item => {
      d3.select(svgRef.current)
        .select(`.bar-${item.replaceAll(" ", "-").replaceAll(",", "")}`)
        .attr("opacity", 1);
    });
  }, [highlightItems]);

  const displayIsNodata = useDisplayIsNodata({
    dataSet: dataSet,
    isLoading: isLoading,
    isNodataComponent: isNodataComponent,
    isNodata: isNodata,
  });

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
          xScale={xAxis1Scale}
          height={height}
          margin={margin}
          xAxisFormat={xAxisFormat}
          xAxisDataType={xAxisDataType}
        />
        <XaxisLinear
          xScale={xAxis2Scale}
          height={height}
          margin={margin}
          xAxisFormat={xAxisFormat}
          xAxisDataType={xAxisDataType}
        />
        <YaxisBand
          yScale={yAxisScale}
          width={width}
          margin={margin}
          yAxisFormat={yAxisFormat}
        />
        {dataSet
          .filter(d => !disabledItems.includes(d.label))
          .map((d, i) => {
            const x1 = xAxis1Scale(d.value1) - width / 2; // Corrected width calculation
            const x2 = xAxis2Scale(0) - xAxis2Scale(d.value2); // Corrected width calculation
            const y = yAxisScale(d.label) || 0;
            const standardHeight = yAxisScale.bandwidth();
            return (
              <g
                className={`bar bar-${d.label
                  .replaceAll(" ", "-")
                  .replaceAll(",", "")}`}
                key={i}
                style={{
                  opacity:
                    highlightItems.includes(d.label) ||
                    highlightItems.length === 0
                      ? 1
                      : 0.3,
                }}
                onMouseOver={() => setHighlightItems([d.label])}
                onMouseOut={() => setHighlightItems([])}
              >
                <rect
                  x={width / 2}
                  // y should be aligned to the center of the bandwidth's unit with height = 30
                  y={y + (standardHeight - 30) / 2}
                  width={x1}
                  height={30}
                  fill={colorsBasedMapping[d.label]}
                  rx={5}
                  ry={5}
                  onMouseOver={event => handleMouseOver(d, event)}
                  onMouseOut={handleMouseOut}
                  stroke={"#fff"}
                />
                <rect
                  x={width / 2 - x2}
                  y={y + (standardHeight - 30) / 2}
                  width={x2}
                  height={30}
                  fill={colorsMapping[d.label]}
                  opacity={0.8}
                  rx={3}
                  ry={3}
                  onMouseOver={event => handleMouseOver(d, event)}
                  onMouseOut={handleMouseOut}
                  stroke={"#fff"}
                />
                {!d.value1 && !d.value2 && (
                  <>
                    <rect
                      x={width / 2 - 5}
                      // y should be aligned to the center of the bandwidth's unit with height = 30
                      y={y + (standardHeight - 30) / 2}
                      width={10}
                      height={30}
                      fill={colorsBasedMapping[d.label]}
                      rx={3}
                      ry={3}
                      onMouseOver={event => handleMouseOver(d, event)}
                      onMouseOut={handleMouseOut}
                    />
                    <text
                      x={width / 2 + 15}
                      y={y + (standardHeight - 30) / 2 + 20}
                      fill="black"
                      fontSize="12px"
                      fontWeight="bold"
                    >
                      N/A
                    </text>
                  </>
                )}
              </g>
            );
          })}
      </svg>
      {tooltip && (
        <div
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
              ${tooltip?.data?.label}: ${tooltip?.data?.value1} - $
              {tooltip?.data?.value2}
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

export default DualHorizontalBarChart;

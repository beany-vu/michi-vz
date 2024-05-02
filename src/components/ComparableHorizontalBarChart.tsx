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
    }[],
  ) => string;
  children?: React.ReactNode;
  isLoading?: boolean;
  isLoadingComponent?: React.ReactNode;
  isNodataComponent?: React.ReactNode;
  isNodata?: boolean | ((dataSet: DataPoint[]) => boolean);
}

const ComparableHorizontalBarChart: React.FC<LineChartProps> = ({
  dataSet,
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
      dataSet
        ?.filter((d) => !disabledItems.includes(d?.label))
        ?.map((d) => d?.label),
    [dataSet, disabledItems],
  );

  const xAxisRange = useMemo(() => {
    if (dataSet.length > 0) {
      return dataSet
        ?.filter((d) => !disabledItems.includes(d?.label))
        ?.map((d) => [d.valueBased, d.valueCompared])
        ?.flat();
    }
    return [];
  }, [dataSet, disabledItems]);

  const xAxisDomain = useMemo(() => {
    const range =
      xAxisPredefinedDomain.length > 0 ? xAxisPredefinedDomain : xAxisRange;
    if (xAxisDataType === "number") {
      const min = Math.min(...range);
      const max = Math.max(...range);
      return [max, min];
    }
    if (xAxisDataType === "date_annual") {
      return [
        new Date(Math.max(...range), 1, 1),
        new Date(Math.min(...range), 1, 1),
      ];
    }
    if (xAxisRange.length >= 2) {
      const minDate = new Date(Math.min(...range));
      const maxDate = new Date(Math.max(...range));
      return [maxDate, minDate] as [Date, Date];
    }
  }, [xAxisRange, xAxisPredefinedDomain, disabledItems]);

  const yAxisScale = d3
    .scaleBand()
    .domain(yAxisDomain)
    .range([margin.top, height - margin.bottom]);

  const xAxisScale =
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
          .range([width - margin.left, margin.right]);

  const handleMouseOver = (
    d: DataPoint,
    event: React.MouseEvent<SVGRectElement, MouseEvent>,
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
    highlightItems.forEach((item) => {
      d3.select(svgRef.current)
        .selectAll(`.bar-[data-label="${item}"]`)
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
        onMouseOut={(event) => {
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
        <YaxisBand
          yScale={yAxisScale}
          width={width}
          margin={margin}
          yAxisFormat={yAxisFormat}
        />
        {dataSet
          .filter((d) => !disabledItems.includes(d?.label))
          .map((d, i) => {
            const x1 =
              margin.left + xAxisScale(Math.min(0, d.valueBased)) - margin.left;
            const x2 =
              margin.left +
              xAxisScale(Math.min(0, d.valueCompared)) -
              margin.left;
            const width1 = Math.abs(xAxisScale(d.valueBased) - xAxisScale(0));
            const width2 = Math.abs(
              xAxisScale(d.valueCompared) - xAxisScale(0),
            );

            const y = yAxisScale(d?.label) || 0;
            const standardHeight = yAxisScale.bandwidth();

            return (
              <g
                className={"bar"}
                data-label={d?.label}
                key={i}
                style={{
                  opacity:
                    highlightItems.includes(d?.label) ||
                    highlightItems.length === 0
                      ? 1
                      : 0.3,
                }}
                onMouseOver={() => setHighlightItems([d?.label])}
                onMouseOut={() => setHighlightItems([])}
              >
                {/* Conditionally render based on width comparison */}
                {width1 < width2 ? (
                  <>
                    <rect
                      className="value-compared"
                      x={x2}
                      y={y + (standardHeight - 30) / 2}
                      width={width2}
                      height={30}
                      fill={colorsMapping[d?.label] ?? d.color}
                      opacity={0.9}
                      rx={5}
                      ry={5}
                      onMouseOver={(event) => handleMouseOver(d, event)}
                      onMouseOut={handleMouseOut}
                      stroke="#fff"
                      strokeWidth={1}
                    />
                    <rect
                      className="value-based"
                      x={x1}
                      y={y + (standardHeight - 30) / 2}
                      width={width1}
                      height={30}
                      fill={colorsBasedMapping[d?.label] ?? d?.color}
                      rx={5}
                      ry={5}
                      onMouseOver={(event) => handleMouseOver(d, event)}
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
                      width={width1}
                      height={30}
                      fill={colorsBasedMapping[d?.label] ?? d?.color}
                      rx={5}
                      ry={5}
                      onMouseOver={(event) => handleMouseOver(d, event)}
                      onMouseOut={handleMouseOut}
                      opacity={0.9}
                      stroke="#fff"
                      strokeWidth={1}
                    />
                    <rect
                      className="value-compared"
                      x={x2}
                      y={y + (standardHeight - 30) / 2}
                      width={width2}
                      height={30}
                      fill={colorsMapping[d?.label] ?? d.color}
                      opacity={0.9}
                      rx={5}
                      ry={5}
                      onMouseOver={(event) => handleMouseOver(d, event)}
                      onMouseOut={handleMouseOut}
                      stroke="#fff"
                      strokeWidth={1}
                    />
                  </>
                )}
                {/* Rest of your code */}
              </g>
            );
          })}
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
          {tooltipFormatter && tooltipFormatter(tooltip?.data)}
        </div>
      )}
      {isLoading && isLoadingComponent && <>{isLoadingComponent}</>}
      {isLoading && !isLoadingComponent && <LoadingIndicator />}

      {displayIsNodata && <>{isNodataComponent}</>}
    </div>
  );
};

export default ComparableHorizontalBarChart;

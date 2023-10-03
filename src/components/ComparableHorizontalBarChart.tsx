import * as d3 from "d3";
import React, { useEffect, useMemo, useRef } from "react";
import Title from "src/components/shared/Title";
import HorizontalAxisLinear from "src/components/shared/HorizontalAxisLinear";
import VerticalAxisBand from "src/components/shared/VerticalAxisBand";
import { useChartContext } from "src/components/MichiVzProvider";

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
}

const ComparableHorizontalBarChart: React.FC<LineChartProps> = ({
  dataSet,
  title,
  width = WIDTH,
  height = HEIGHT,
  margin = MARGIN,
  yAxisFormat,
  xAxisFormat,
  tooltipFormatter,
  children,
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
        .filter((d) => !disabledItems.includes(d.label))
        .map((d) => d.label),
    [dataSet],
  );
  const xAxisDomain = useMemo(
    () => [
      dataSet
        .filter((d) => !disabledItems.includes(d.label))
        .map((d) => [d.valueBased, d.valueCompared])
        .flat()
        .reduce((a, b) => Math.max(a, b)),
      0,
    ],
    [dataSet],
  );
  const yAxisScale = d3
    .scaleBand()
    .domain(yAxisDomain)
    .range([margin.top, height - margin.bottom]);

  const xAxisScale = d3
    .scaleLinear()
    .domain(xAxisDomain)
    .range([width - margin.left, margin.right])
    .clamp(true)
    .nice(1);

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
        .select(`.bar-${item.replaceAll(" ", "-")}`)
        .attr("opacity", 1);
    });
  }, [highlightItems]);

  return (
    <div style={{ position: "relative" }}>
      <svg
        width={width}
        height={height}
        ref={svgRef}
        style={{ overflow: "visible" }}
      >
        {children}
        <Title x={width / 2} y={margin.top / 2}>
          {title}
        </Title>
        <HorizontalAxisLinear
          xScale={xAxisScale}
          height={height}
          margin={margin}
          xAxisFormat={xAxisFormat}
        />
        <VerticalAxisBand
          yScale={yAxisScale}
          width={width}
          margin={margin}
          yAxisFormat={yAxisFormat}
        />
        {dataSet
          .filter((d) => !disabledItems.includes(d.label))
          .map((d, i) => {
            const x1 = xAxisScale(d.valueBased);
            const x2 = xAxisScale(d.valueCompared);
            const y = yAxisScale(d.label) || 0;
            const standardHeight = yAxisScale.bandwidth();
            return (
              <g
                className={`bar bar-${d.label.replaceAll(" ", "-")}`}
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
                  x={margin.left}
                  // y should be aligned to the center of the bandwidth's unit with height = 30
                  y={y + (standardHeight - 30) / 2}
                  width={x1}
                  height={30}
                  fill={colorsBasedMapping[d.label]}
                  rx={5}
                  ry={5}
                  onMouseOver={(event) => handleMouseOver(d, event)}
                  onMouseOut={handleMouseOut}
                />
                <rect
                  x={margin.left}
                  y={y + (standardHeight - 30) / 2}
                  width={x2}
                  height={30}
                  fill={colorsMapping[d.label]}
                  opacity={0.8}
                  rx={5}
                  ry={5}
                  onMouseOver={(event) => handleMouseOver(d, event)}
                  onMouseOut={handleMouseOut}
                />
                {!d.valueBased && !d.valueCompared && (
                  <>
                    <rect
                      x={margin.left}
                      // y should be aligned to the center of the bandwidth's unit with height = 30
                      y={y + (standardHeight - 30) / 2}
                      width={10}
                      height={30}
                      fill={colorsBasedMapping[d.label]}
                      rx={5}
                      ry={5}
                      onMouseOver={(event) => handleMouseOver(d, event)}
                      onMouseOut={handleMouseOut}
                    />
                    <text
                      x={margin.left + 15}
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
            border: "1px solid black",
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
    </div>
  );
};

export default ComparableHorizontalBarChart;

import React, { useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import Title from "./shared/Title";
import VerticalAxisLinear from "./shared/VerticalAxisLinear";
import HorizontalAxisLinear from "./shared/HorizontalAxisLinear";
import { useChartContext } from "./MichiVzProvider";

interface DataPoint {
  date: number;
  [key: string]: number | undefined;
}

interface AreaDataPoint {
  0: number;
  1: number;
  data: DataPoint;
}

interface Props {
  series: DataPoint[];
  keys: string[];
  width: number;
  height: number;
  margin: { top: number; right: number; bottom: number; left: number };
  title?: string;
  yAxisFormat?: (d: number) => string;
  tooltipFormatter?: (
    d: DataPoint,
    series: DataPoint[],
    dataSet: {
      label: string;
      color: string;
      series: DataPoint[];
    }[],
  ) => string;
  children?: React.ReactNode;
}

const MARGIN = { top: 50, right: 50, bottom: 50, left: 50 };
const WIDTH = 900;
const HEIGHT = 480;

const RibbonChart: React.FC<Props> = ({
  series,
  width = WIDTH,
  height = HEIGHT,
  margin = MARGIN,
  title,
  keys,
  yAxisFormat,
  // tooltipFormatter = (d: DataPoint) =>
  //   `<div>${d.label} - ${d.year}: ${d.value}</div>`,
  children,
}) => {
  const { colorsMapping, highlightItems, setHighlightItems, disabledItems } =
    useChartContext();
  const ref = useRef<SVGSVGElement>(null);
  const [hoveredDate] = useState<number | null>(null);
  const rectWidth = (width - margin.left - margin.right) / series.length;

  // xScale
  const xScale = useMemo(
    () =>
      d3
        .scaleLinear()
        .domain([
          d3.min(series, (d) => d.date)!,
          d3.max(series, (d) => d.date)!,
        ])
        .range([margin.left, width - margin.right]),
    [series, width, height, margin],
  );

  // yScale
  const yScaleDomain = useMemo(() => {
    // return the max value of the sum of all the keys, don't count the date
    const max = d3.max(
      series,
      (d) =>
        d3.sum(
          Object.keys(d)
            .filter((key) => !disabledItems.includes(key))
            .map((key) => (key === "date" ? 0 : d[key] || 0)),
        ) || 0,
    );

    return [0, max];
  }, [series, keys]);

  const yScale = useMemo(
    () =>
      d3
        .scaleLinear()
        .domain(yScaleDomain)
        .range([height - margin.bottom, margin.top])
        .clamp(true)
        .nice(),
    [series, width, height, margin],
  );

  const stackedData = useMemo(() => {
    return d3.stack<DataPoint, string>().keys(keys)(series);
  }, [series, keys]);

  const prepareAreaData = () => {
    return stackedData.map((keyData, index) => {
      return {
        key: keys[index],
        values: keyData,
        fill: colorsMapping[keys[index]],
      };
    });
  };

  const areaGenerator = d3
    .area<AreaDataPoint>()
    .defined((d) => d[0] !== null && d[1] !== null)
    .x((d) => xScale(d.data.date))
    .y0((d) => yScale(d[0]))
    .y1((d) => yScale(d[1]))
    .curve(d3.curveMonotoneX);

  /*
  const generateTooltipContentForYear = (year: number) => {
    const yearData = series.find((d) => d.date === year);
    if (!yearData) return "";
    return `
        <div style="background: #fff; padding: 5px">
            <p>${yearData.date}</p>
            ${Object.keys(yearData)
              .filter((key) => key !== "date" && yearData[key] !== undefined)
              .map(
                (key) =>
                  `<p style="color:${colorsMapping[key]}">${key}: ${
                    yearData[key] ?? "N/A"
                  }</p>`,
              )
              .join("")}
        </div>`;
  };
*/

  const handleAreaSegmentHover = (dataPoint: DataPoint, key: string) => {
    const yearData = series.find((d) => d.date === dataPoint.date);
    if (!yearData) return "";

    return `
        <div style="background: #fff; padding: 5px">
            <p>${yearData.date}</p>
            <p style="color:${colorsMapping[key]}">${key}: ${
              yearData[key] ?? "N/A"
            }</p>
        </div>`;
  };

  return (
    <div style={{ position: "relative" }}>
      <div
        className={"tooltip"}
        style={{
          position: "absolute",
          background: "white",
          padding: "5px",
          border: "1px solid #333",
          pointerEvents: "none",
          zIndex: 1000,
          visibility: "hidden", // Initially hidden
        }}
      />

      <svg
        className={"chart"}
        ref={ref}
        width={width}
        height={height}
        style={{ overflow: "visible" }}
      >
        {children}
        <Title x={width / 2} y={MARGIN.top / 2}>
          {title}
        </Title>
        <HorizontalAxisLinear xScale={xScale} height={height} margin={margin} />
        <VerticalAxisLinear
          yScale={yScale}
          width={width}
          height={height}
          margin={margin}
          highlightZeroLine={true}
          format={yAxisFormat}
        />
        <g>
          {prepareAreaData().map((areaData) => (
            <>
              <path
                d={areaGenerator(areaData.values)}
                fill={areaData.fill}
                stroke={"#fff"}
                strokeWidth={1}
                opacity={
                  highlightItems.length === 0 ||
                  highlightItems.includes(areaData.key)
                    ? 1
                    : 0.2
                }
                style={{ transition: "opacity 0.1s ease-out" }}
                onMouseMove={() => {
                  console.log({ areaData });
                  setHighlightItems([areaData.key]);
                }}
                onMouseOut={() => {
                  setHighlightItems([]);
                }}
              />
              {/* Here's the addition*/}
              {areaData.values.map((dataPoint) => (
                <rect
                  key={`${areaData.key}-${dataPoint.data.date}`}
                  x={xScale(dataPoint.data.date) - 2}
                  y={yScale(dataPoint[1])} // Start from top of the area segment
                  width={4}
                  strokeWidth={rectWidth / 2 - 2}
                  height={yScale(dataPoint[0]) - yScale(dataPoint[1])} // Height of the area segment
                  fill="#fff"
                  opacity={highlightItems.includes(areaData.key) ? 1 : 0}
                  onMouseEnter={(event) => {
                    setHighlightItems([areaData.key]);
                    d3.select(".tooltip")
                      .style("visibility", "visible")
                      .html(
                        handleAreaSegmentHover(dataPoint.data, areaData.key),
                      );

                    const [x, y] = d3.pointer(event);
                    const tooltip = d3.select(".tooltip").node() as HTMLElement;
                    const tooltipWidth = tooltip.getBoundingClientRect().width;
                    const tooltipHeight =
                      tooltip.getBoundingClientRect().height;
                    d3.select(".tooltip")
                      .style("left", x - tooltipWidth / 2 + "px")
                      .style("top", y - tooltipHeight - 10 + "px");
                  }}
                  onMouseLeave={() => {
                    d3.select(".tooltip").style("visibility", "hidden");
                  }}
                />
              ))}
              {hoveredDate !== null && (
                <line
                  className={"hover-line"}
                  x1={xScale(hoveredDate)}
                  x2={xScale(hoveredDate)}
                  y1={margin.top}
                  y2={height - margin.bottom}
                  stroke={"#666"}
                  strokeWidth={1}
                  pointerEvents="none"
                />
              )}
            </>
          ))}
        </g>
        {/*<g className="hover-overlays" style={{pointerEvents: "none"}}>*/}
        {/*    {series.map((dataPoint, i) => (*/}
        {/*        <rect*/}
        {/*            key={i}*/}
        {/*            x={xScale(dataPoint.date) - rectWidth / 2}*/}
        {/*            y={margin.top}*/}
        {/*            width={rectWidth}*/}
        {/*            height={height - margin.bottom - margin.top}*/}
        {/*            fill="transparent"*/}
        {/*            pointerEvents="all"*/}
        {/*            onMouseOver={() => {*/}
        {/*                const hoveredDate = dataPoint.date;*/}
        {/*                setHoveredDate(hoveredDate);*/}

        {/*                d3.select(".tooltip")*/}
        {/*                    .style("visibility", "visible")*/}
        {/*                    .html(generateTooltipContentForYear(Number(hoveredDate)));*/}
        {/*            }}*/}
        {/*            onMouseMove={(event) => {*/}
        {/*                const [x, y] = d3.pointer(event);*/}
        {/*                const tooltip = d3.select(".tooltip").node() as HTMLElement;*/}
        {/*                const tooltipWidth = tooltip.getBoundingClientRect().width;*/}
        {/*                const tooltipHeight = tooltip.getBoundingClientRect().height;*/}
        {/*                d3.select(".tooltip")*/}
        {/*                    .style("left", (x - tooltipWidth / 2) + "px")*/}
        {/*                    .style("top", (y - tooltipHeight - 10) + "px");*/}
        {/*            }}*/}
        {/*            onMouseOut={() => {*/}
        {/*                setHoveredDate(null);*/}
        {/*                d3.select(".tooltip").style("visibility", "hidden");*/}
        {/*            }}*/}
        {/*        />*/}
        {/*    ))}*/}
        {/*</g>*/}
      </svg>
    </div>
  );
};

export default RibbonChart;

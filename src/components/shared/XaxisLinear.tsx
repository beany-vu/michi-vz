import React, { FC, useEffect, useRef } from "react";
import { ScaleTime, ScaleLinear } from "d3-scale";
import * as d3 from "d3";

interface Props {
  xScale: ScaleTime<number, number> | ScaleLinear<number, number>;
  height: number;
  margin: { top: number; right: number; bottom: number; left: number };
  xAxisFormat?: (d: number | { valueOf(): number } | string) => string;
  xAxisDataType?: "number" | "date_annual" | "date_monthly";
}

const checkIsTimeScale = (
  scale: ScaleTime<number, number> | ScaleLinear<number, number>,
  xAxisDataType?: "number" | "date_annual" | "date_monthly",
): scale is ScaleTime<number, number> => {
  if (xAxisDataType === "date_annual" || xAxisDataType === "date_monthly") {
    return true;
  }

  if ("ticks" in scale && "domain" in scale && "range" in scale) {
    const timeScale = scale as ScaleTime<number, number>;
    return (
      timeScale.ticks !== undefined &&
      timeScale.domain instanceof Array &&
      timeScale.range instanceof Array &&
      ((typeof timeScale.domain[0] === "number" &&
        typeof timeScale.range[0] === "number") ||
        (timeScale.domain[0] instanceof Date &&
          timeScale.range[0] instanceof Date))
    );
  }
  return false;
};

const XaxisLinear: FC<Props> = ({
  xScale = d3.scaleLinear().domain([0, 100]),
  height,
  margin,
  xAxisFormat,
  xAxisDataType = "number",
}) => {
  const ref = useRef<SVGGElement>(null);

  const isTimeScale = checkIsTimeScale(xScale, xAxisDataType);

  console.log({ isTimeScale });

  useEffect(() => {
    const defaultFormatter = (d: number | Date) => {
      if (isTimeScale) {
        console.log({ d });
        const dateObj = new Date(d);
        const month = dateObj.toLocaleString("en-US", { month: "2-digit" });
        const year = dateObj.getFullYear();
        return xAxisDataType === "date_annual" ? `${year}` : `${month}-${year}`;
      } else {
        return String(d);
      }
    };

    const g = d3.select(ref.current);

    console.log({ domain: xScale.domain() });

    const minTick =
      xAxisDataType === "date_annual"
        ? d3.timeYear.floor(xScale.domain()[0] as Date)
        : xAxisDataType === "date_monthly"
          ? d3.timeMonth.floor(xScale.domain()[0] as Date)
          : xScale.domain()[0];

    const maxTick =
      xAxisDataType === "date_annual"
        ? d3.timeYear.ceil(xScale.domain()[1] as Date)
        : xAxisDataType === "date_monthly"
          ? d3.timeMonth.ceil(xScale.domain()[1] as Date)
          : xScale.domain()[1];

    const numIntermediateTicks = 8; // You can adjust this based on your preference

    let tickValues: number[] =
      xAxisDataType === "date_annual" || xAxisDataType === "date_monthly"
        ? d3.timeYear
            .range(minTick as Date, maxTick as Date, 1)
            .map((d) => d.valueOf())
        : d3.ticks(minTick as number, maxTick as number, numIntermediateTicks);

    // Include zero as a tick if minTick is zero
    // Include zero as a tick if minTick is zero
    if (minTick === 0) {
      tickValues = [0, ...(tickValues as number[]), maxTick as number];
    }
    g.attr("class", "x-axis x-axis-linear")
      .attr("transform", "translate(0," + (height - margin.bottom + 15) + ")")
      .call(
        d3
          .axisBottom(xScale)
          .tickValues(tickValues)
          .tickFormat((domainValue: number | Date) =>
            xAxisFormat
              ? xAxisFormat(domainValue)
              : defaultFormatter(domainValue),
          ),
      )
      .call((g) => g.select(".domain").attr("stroke-opacity", 1))
      .call((g) => g.select(".domain").remove())
      .call((g) => g.selectAll("line").remove())
      .call((g) => g.selectAll(".tick-line").remove())
      .call((g) => g.selectAll(".tickValueDot").remove());

    // Add vertical dashed lines for each tick
    g.selectAll(".tick")
      .append("line")
      .attr("class", "tick-line")
      .attr("x1", 0)
      .attr("y1", 0)
      .attr("x2", 0)
      .attr("y2", -height + margin.bottom + margin.top - 10) // Adjust as needed
      .style("stroke-dasharray", "3,3") // Set dash pattern
      .style("stroke", "transparent"); // Color of the dashed line

    g.selectAll(".tick")
      .append("circle")
      .attr("class", "tickValueDot")
      .attr("cx", 0)
      .attr("cy", 0)
      .attr("r", 2)
      .attr("fill", "lightgray");
  }, [xScale, height, margin, isTimeScale, xAxisFormat, xAxisDataType]);

  return <g ref={ref} />;
};

export default XaxisLinear;

import React, { FC, useEffect, useRef, useMemo, useCallback } from "react";
import { ScaleTime, ScaleLinear } from "d3-scale";
import * as d3 from "d3";
import range from "lodash/range";

// Function to get dates with equal distance
function getDatesWithEqualDistance(
  startDate: string | number | Date,
  endDate: string | number | Date,
  numDates: number
) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diff = end.getTime() - start.getTime();
  const interval = diff / (numDates - 1);
  return range(0, numDates).map(i => new Date(start.getTime() + i * interval));
}

interface Props {
  xScale: ScaleTime<number, number> | ScaleLinear<number, number>;
  height: number;
  margin: { top: number; right: number; bottom: number; left: number };
  xAxisFormat?: (d: number | { valueOf(): number } | string) => string;
  xAxisDataType?: "number" | "date_annual" | "date_monthly";
  ticks?: number;
  showGrid?: boolean;
  position?: "top" | "bottom";
}

const checkIsTimeScale = (
  scale: ScaleTime<number, number> | ScaleLinear<number, number>,
  xAxisDataType?: "number" | "date_annual" | "date_monthly"
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
      ((typeof timeScale.domain[0] === "number" && typeof timeScale.range[0] === "number") ||
        (timeScale.domain[0] instanceof Date && timeScale.range[0] instanceof Date))
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
  ticks = 5,
  showGrid = false,
  position = "bottom",
}) => {
  const ref = useRef<SVGGElement>(null);
  const isTimeScale = checkIsTimeScale(xScale, xAxisDataType);

  // Memoize the default formatter
  const defaultFormatter = useCallback(
    (d: number | Date) => {
      if (isTimeScale) {
        const dateObj = new Date(d);
        const month = dateObj.toLocaleString("en-US", { month: "2-digit" });
        const year = dateObj.getFullYear();
        return xAxisDataType === "date_annual" ? `${year}` : `${month}-${year}`;
      } else {
        return String(d);
      }
    },
    [isTimeScale, xAxisDataType]
  );

  // Memoize tick calculations
  const tickValues = useMemo(() => {
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

    let values: number[];
    switch (xAxisDataType) {
      case "date_annual":
        values = d3.timeYear.range(minTick as Date, maxTick as Date, 1).map(d => d.valueOf());
        break;
      case "date_monthly":
        values = d3.timeMonth.range(minTick as Date, maxTick as Date, 1).map(d => d.valueOf());
        break;
      default:
        values = d3.ticks(minTick as number, maxTick as number, ticks);
        break;
    }

    if (minTick === 0) {
      values = [0, ...(values as number[]), maxTick as number];
    }

    return values;
  }, [xScale, xAxisDataType, ticks]);

  useEffect(() => {
    const g = d3.select(ref.current);

    // Create the axis
    const axisBottom = d3
      .axisBottom(xScale)
      .tickValues(tickValues)
      .tickFormat((domainValue: number | Date) =>
        xAxisFormat ? xAxisFormat(domainValue) : defaultFormatter(domainValue)
      );

    // Initial setup
    g.attr("class", "x-axis x-axis-linear").attr(
      "style",
      position === "top"
        ? `transform:translate(${margin.left}px, ${margin.top - 15}px)`
        : `transform:translate(0,${height - margin.bottom + 15}px)`
    );

    // Add transition for axis updates
    g.transition()
      .duration(750)
      .call(axisBottom)
      .call(g => g.select(".domain").attr("stroke-opacity", 0))
      .call(g => g.select(".domain").remove())
      .call(g => g.selectAll("line").attr("stroke-opacity", 0))
      .call(g => g.selectAll("line").remove());

    // Remove existing tick lines before adding new ones
    g.selectAll(".tick-line").remove();

    // Add vertical dashed lines with transition
    g.selectAll(".tick")
      .append("line")
      .attr("class", "tick-line")
      .attr("x1", 0)
      .attr("y1", position === "top" ? height - margin.bottom - margin.top : -15)
      .attr("x2", 0)
      .attr("y2", position === "top" ? margin.top - 15 : -height + margin.bottom + margin.top - 15)
      .style("stroke-dasharray", "3,3")
      .style("stroke", showGrid ? "lightgray" : "transparent")
      .attr("pointer-events", "none")
      .style("opacity", 1)
      .transition()
      .duration(750)
      .attr("x2", 0)
      .attr("y2", position === "top" ? margin.top - 15 : -height + margin.bottom + margin.top - 15);

    // Update or add dots
    const dots = g.selectAll(".tick").selectAll(".tickValueDot").data([0]); // One dot per tick

    // Enter new dots
    dots
      .enter()
      .append("circle")
      .attr("class", "tickValueDot")
      .merge(dots as any)
      .attr("cx", 0)
      .attr("cy", 0)
      .attr("r", 2)
      .attr("fill", "lightgray")
      .style("opacity", 1);

    // Remove old dots
    dots.exit().remove();

    // Cleanup function
    return () => {
      g.selectAll("*").interrupt();
    };
  }, [xScale, height, margin, xAxisFormat, xAxisDataType, tickValues, defaultFormatter, position, showGrid]);

  return <g className="x-axis-container" ref={ref} />;
};

export default XaxisLinear;

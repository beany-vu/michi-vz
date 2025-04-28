import React, { FC, useRef, useCallback, useMemo, useLayoutEffect } from "react";
import { ScaleTime, ScaleLinear } from "d3-scale";
import * as d3 from "d3";

interface Props {
  xScale: ScaleTime<number, number> | ScaleLinear<number, number>;
  height: number;
  margin: { top: number; right: number; bottom: number; left: number };
  xAxisFormat?: (d: number | { valueOf(): number } | string) => string;
  xAxisDataType?: "number" | "date_annual" | "date_monthly";
  ticks?: number;
  showGrid?: boolean;
  position?: "top" | "bottom";
  isLoading?: boolean;
  isEmpty?: boolean;
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
  isLoading = false,
  isEmpty = false,
}) => {
  const ref = useRef<SVGGElement>(null);
  const isTimeScale = checkIsTimeScale(xScale, xAxisDataType);

  // Memoize the default formatter
  const defaultFormatter = useCallback(
    (d: number | Date | { valueOf(): number }) => {
      const value = d instanceof Date ? d : new Date(d.valueOf());
      if (isTimeScale) {
        const month = value.toLocaleString("en-US", { month: "2-digit" });
        const year = value.getFullYear();
        return xAxisDataType === "date_annual" ? `${year}` : `${month}-${year}`;
      } else {
        return String(d.valueOf());
      }
    },
    [isTimeScale, xAxisDataType]
  );

  // Generate evenly spaced tick values that always include first and last
  const tickValues = useMemo(() => {
    // Don't generate ticks if loading or empty
    if (isLoading || isEmpty) {
      return [];
    }

    const domain = xScale.domain();
    const first = domain[0];
    const last = domain[1];

    // Calculate total available width
    const availableWidth = xScale.range()[1] - xScale.range()[0];

    // Estimate space needed per tick (average label width + padding)
    const estimatedTickWidth = 80; // Base estimate in pixels

    // Calculate how many ticks can fit
    const maxFittingTicks = Math.floor(availableWidth / estimatedTickWidth);

    // Use the smaller of maxFittingTicks or requested ticks
    const effectiveTicks = Math.max(2, Math.min(maxFittingTicks, ticks));

    if (effectiveTicks <= 2) {
      return [first, last];
    }

    // Generate evenly spaced tick values
    const result = [];
    const domainStart = +first;
    const domainEnd = +last;
    const step = (domainEnd - domainStart) / (effectiveTicks - 1);

    for (let i = 0; i < effectiveTicks; i++) {
      const value = domainStart + step * i;

      // Convert value back to appropriate type
      let tickValue;
      if (isTimeScale) {
        tickValue = new Date(value);
      } else {
        tickValue = value;
      }

      result.push(tickValue);
    }

    // Ensure the last value is exactly the domain end
    if (result.length > 0) {
      result[result.length - 1] = last;
    }

    return result;
  }, [xScale, ticks, isTimeScale, isLoading, isEmpty]);

  useLayoutEffect(() => {
    const g = d3.select(ref.current);
    if (!g) return;

    // Create the axis and use our calculated tickValues
    const axisBottom = d3
      .axisBottom(xScale)
      .tickValues(tickValues)
      .tickFormat((domainValue: number | Date | { valueOf(): number }) =>
        xAxisFormat
          ? xAxisFormat(domainValue instanceof Date ? domainValue : domainValue.valueOf())
          : defaultFormatter(domainValue)
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
      .delay(150)
      .duration(400)
      .call(axisBottom)
      .call(g => g.select(".domain").attr("stroke-opacity", 0))
      .call(g => g.select(".domain").remove())
      .call(g => g.selectAll("line").attr("stroke-opacity", 0))
      .call(g => g.selectAll("line").remove());

    // Keep labels horizontal by default
    g.selectAll(".tick text")
      .attr("transform", "rotate(0)")
      .style("text-anchor", "middle")
      .attr("dx", "0")
      .attr("dy", "0.71em");

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
      .merge(dots as d3.Selection<SVGCircleElement, number, SVGGElement, unknown>)
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
  }, [
    xScale,
    height,
    margin,
    xAxisFormat,
    xAxisDataType,
    tickValues,
    defaultFormatter,
    position,
    showGrid,
  ]);

  return <g className="x-axis-container" ref={ref} />;
};

export default XaxisLinear;

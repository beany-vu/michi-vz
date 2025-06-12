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
  showZeroLine?: boolean;
  position?: "top" | "bottom";
  isLoading?: boolean;
  isEmpty?: boolean;
  tickValues?: (number | Date)[]; // <-- new prop
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
  showZeroLine = false,
  position = "bottom",
  isLoading = false,
  isEmpty = false,
  tickValues: tickValuesProp, // <-- new prop
}) => {
  const ref = useRef<SVGGElement>(null);
  const isTimeScale = checkIsTimeScale(xScale, xAxisDataType);

  // Memoize the default formatter
  const defaultFormatter = useCallback(
    (d: number | Date | { valueOf(): number }) => {
      if (isTimeScale) {
        const value = d instanceof Date ? d : new Date(d.valueOf());

        // Format specifically for annual data
        if (xAxisDataType === "date_annual") {
          return `${value.getFullYear()}`;
        }

        // Format for monthly data
        if (xAxisDataType === "date_monthly") {
          const month = value.toLocaleString("en-US", { month: "short" });
          const year = value.getFullYear();
          return `${month} ${year}`;
        }

        // Default date formatting
        return value.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
        });
      }

      // For numeric values
      return String(d.valueOf());
    },
    [isTimeScale, xAxisDataType]
  );

  // Generate evenly spaced tick values that always include first and last
  const tickValues = useMemo(() => {
    if (tickValuesProp) return tickValuesProp;

    // Don't generate ticks if loading or empty
    if (isLoading || isEmpty) {
      return [];
    }

    const domain = xScale.domain();
    const first = domain[0];
    const last = domain[1];

    // Always include first and last
    const result = [];

    // Limit to exactly 5 ticks (or fewer if domain is smaller)
    const targetTickCount = Math.min(5, ticks);

    if (targetTickCount <= 2) {
      return [first, last];
    }

    // For annual dates, handle specially to ensure years align properly
    if (isTimeScale && xAxisDataType === "date_annual") {
      const firstYear =
        first instanceof Date ? first.getFullYear() : new Date(+first).getFullYear();
      const lastYear = last instanceof Date ? last.getFullYear() : new Date(+last).getFullYear();
      const yearCount = lastYear - firstYear + 1;

      // If we have a reasonable number of years, show all of them
      if (yearCount <= 10) {
        for (let year = firstYear; year <= lastYear; year++) {
          result.push(new Date(`${year}-01-01`));
        }
        return result;
      }

      // For many years, pick a sensible spacing
      // Always include first and last years
      result.push(new Date(`${firstYear}-01-01`));

      // Calculate step size based on available space
      const stepSize = Math.max(1, Math.ceil(yearCount / 10));

      // Add intermediate years at regular intervals
      for (let year = firstYear + stepSize; year < lastYear; year += stepSize) {
        result.push(new Date(`${year}-01-01`));
      }

      // Add the last year if not already included
      if (result[result.length - 1].getFullYear() !== lastYear) {
        result.push(new Date(`${lastYear}-01-01`));
      }

      return result;
    }

    // For numeric scales, ensure 0 is the first tick if domain starts at 0
    if (!isTimeScale && +first === 0) {
      result.push(0); // Start with 0

      const valueRange = +last - +first;
      const step = valueRange / (targetTickCount - 1);

      for (let i = 1; i < targetTickCount - 1; i++) {
        const value = i * step;
        result.push(value);
      }

      result.push(last);
    } else {
      // For other cases, use the standard approach
      result.push(first);

      const valueRange = +last - +first;
      const step = valueRange / (targetTickCount - 1);

      for (let i = 1; i < targetTickCount - 1; i++) {
        const value = +first + i * step;
        if (isTimeScale) {
          result.push(new Date(value));
        } else {
          result.push(value);
        }
      }

      result.push(last);

      if (
        !isTimeScale &&
        showZeroLine &&
        !result.includes(0) &&
        +first <= 0 &&
        0 <= +last
        // Ensure 0 is included if it's within the domain (including at boundaries)
      ) {
        result.push(0);
        result.sort((a, b) => a - b); // Sort ascending for proper order
      }
    }

    return result;
  }, [xScale, ticks, isTimeScale, isLoading, isEmpty, tickValuesProp, xAxisDataType, showZeroLine]);

  useLayoutEffect(() => {
    const g = d3.select(ref.current);
    if (!g) return;

    // Clear any existing axis elements to prevent duplicates
    g.selectAll("*").remove();

    // Create the axis and use our calculated tickValues
    const axisBottom = d3
      .axisBottom(xScale)
      .tickValues(tickValues)
      .tickFormat((domainValue: number | Date | { valueOf(): number }) =>
        xAxisFormat
          ? xAxisFormat(domainValue instanceof Date ? domainValue : domainValue.valueOf())
          : defaultFormatter(domainValue)
      )
      .tickSize(6); // Control tick size

    // Initial setup
    g.attr("class", "x-axis x-axis-linear").attr(
      "style",
      position === "top"
        ? `transform:translate(0, ${margin.top}px)`
        : `transform:translate(0, ${height - margin.bottom}px)`
    );

    // Call the axis
    g.call(axisBottom)
      // Remove the domain line (horizontal axis line)
      .call(g => g.select(".domain").remove())
      // Remove the default tick lines
      .call(g => g.selectAll(".tick line").remove())
      // Style the text (moved down to align with circles)
      .call(g =>
        g
          .selectAll(".tick text")
          .attr("fill", "#666")
          .attr("font-size", "12px")
          .attr("text-anchor", "middle")
          .attr("dy", "1.8em")
      )
      // Add class for tick at 0
      .call(g => {
        g.selectAll(".tick").each(function (d) {
          const tickValue = d instanceof Date ? d.valueOf() : +d;
          if (tickValue === 0) {
            d3.select(this).classed("tick-zero", true);
          }
        });
      });

    // Ensure the first and last ticks align with data points by moving them to exact edge positions
    if (tickValues.length >= 2) {
      const range = xScale.range();
      const firstTickSelector = g.select(".tick:first-child");
      const lastTickSelector = g.select(".tick:last-child");

      if (!firstTickSelector.empty()) {
        firstTickSelector.attr("transform", `translate(${range[0]}, 0)`);
      }

      if (!lastTickSelector.empty()) {
        lastTickSelector.attr("transform", `translate(${range[1]}, 0)`);
      }
    }

    // Add grid lines if requested (stop short of axis line to avoid touching circles)
    if (showGrid) {
      g.selectAll(".tick")
        .append("line")
        .attr("class", "grid-line")
        .attr("x1", 0)
        .attr("y1", -11) // Start 8px above axis line to avoid touching circles
        .attr("x2", 0)
        .attr("y2", -(height - margin.top - margin.bottom - 10)) // Extend upward through chart
        .attr("stroke", "gray")
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "1,3")
        .attr("opacity", 0.5);

      if (showZeroLine) {
        g.selectAll(".tick-zero line").attr("stroke-dasharray", null);
      }
    }

    // Add circles/dots instead of tick lines (moved down 8px to avoid grid overlap)
    g.selectAll(".tick")
      .append("circle")
      .attr("class", "tick-dot")
      .attr("cx", 0)
      .attr("cy", 8)
      .attr("r", 2)
      .attr("fill", "lightgray")
      .style("opacity", 1)
      .on("mouseover", function () {
        d3.select(this).attr("r", 4).attr("fill", "#666");
      })
      .on("mouseout", function () {
        d3.select(this).attr("r", 2).attr("fill", "lightgray");
      });

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

import React, { FC, useRef, useCallback, useMemo, useLayoutEffect } from "react";
import { ScaleTime, ScaleLinear } from "d3-scale";
import * as d3 from "d3";
import { addMonths, differenceInCalendarMonths, isAfter, isBefore } from "date-fns";

interface Props {
  xScale: ScaleTime<number, number> | ScaleLinear<number, number>;
  height: number;
  margin: { top: number; right: number; bottom: number; left: number };
  padding?: { top: number; right: number; bottom: number; left: number };
  xAxisFormat?: (
    d: number | { valueOf(): number } | string,
    tickValues?: Array<string | number>
  ) => string;
  xAxisDataType?: "number" | "date_annual" | "date_monthly";
  ticks?: number;
  showGrid?: boolean;
  showZeroLine?: boolean;
  showDividerNextToYAxis?: boolean;
  position?: "top" | "bottom";
  isLoading?: boolean;
  isEmpty?: boolean;
  tickValues?: (number | Date)[]; // <-- new prop
  enableExplicitTickValues?: boolean;
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
  padding = { top: 0, right: 0, bottom: 0, left: 0 },
  xAxisFormat,
  xAxisDataType = "number",
  ticks = 5,
  showGrid = false,
  showZeroLine = false,
  showDividerNextToYAxis = false,
  position = "bottom",
  isLoading = false,
  isEmpty = false,
  tickValues: tickValuesProp, // <-- new prop
  enableExplicitTickValues = true,
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
          result.push(new Date(`${year}-01-01T23:59:59Z`));
        }
        return result;
      }

      // For many years, pick a sensible spacing
      // Always include first and last years
      result.push(new Date(`${firstYear}-01-01T23:59:59Z`));

      // Calculate step size based on available space
      const stepSize = Math.max(1, Math.ceil(yearCount / 10));

      // Add intermediate years at regular intervals
      for (let year = firstYear + stepSize; year < lastYear; year += stepSize) {
        result.push(new Date(`${year}-01-01T23:59:59Z`));
      }

      // Add the last year if not already included
      if (result[result.length - 1].getFullYear() !== lastYear) {
        result.push(new Date(`${lastYear}-01-01T23:59:59Z`));
      }

      return result;
    }

    if (isTimeScale && xAxisDataType === "date_monthly") {
      const firstDate = first instanceof Date ? first : new Date(+first);
      const lastDate = last instanceof Date ? last : new Date(+last);

      const monthCount = differenceInCalendarMonths(lastDate, firstDate) + 1;

      // If we have a reasonable number of months, show all of them
      if (monthCount <= 10) {
        let current = new Date(firstDate);
        while (!isAfter(current, lastDate)) {
          result.push(new Date(current));
          current = addMonths(current, 1);
        }
        return result;
      }

      // For many months, pick a sensible spacing
      // Always include first month
      result.push(new Date(firstDate));

      // Calculate step size based on available space
      const stepSize = Math.max(1, Math.ceil(monthCount / 10));
      let current = addMonths(firstDate, stepSize);

      // Add intermediate months at regular intervals
      while (isBefore(current, lastDate)) {
        result.push(new Date(current));
        current = addMonths(current, stepSize);
      }

      // Add the last month if not already included
      if (
        !(
          result[result.length - 1].getFullYear() === lastDate.getFullYear() &&
          result[result.length - 1].getMonth() === lastDate.getMonth()
        )
      ) {
        result.push(new Date(lastDate));
      }
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
      if (["date_annual", "date_monthly"].includes(xAxisDataType)) {
        return result;
      }

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
    let axisBottom = d3.axisBottom(xScale);

    if (enableExplicitTickValues) {
      axisBottom = axisBottom.tickValues(tickValues);
    }

    axisBottom = axisBottom
      .tickFormat((domainValue: number | Date | { valueOf(): number }) =>
        xAxisFormat
          ? xAxisFormat(
              domainValue instanceof Date ? domainValue : domainValue.valueOf(),
              tickValues
            )
          : defaultFormatter(domainValue)
      )
      .tickSize(6); // Control tick size

    // Initial setup
    g.attr("class", "x-axis x-axis-linear").attr(
      "style",
      position === "top"
        ? `transform:translate(${padding.left}px, ${margin.top}px)`
        : `transform:translate(${padding.left}px, ${height - margin.bottom}px)`
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
        g.selectAll(".tick").each(function (d, index, groups) {
          const tickValue = d instanceof Date ? d.valueOf() : +d;
          if (tickValue === 0) {
            d3.select(this).classed("tick-zero", true);
          }

          if (index === 0) {
            d3.select(this).classed("tick-first", true);
          }

          if (index === groups.length - 1) {
            d3.select(this).classed("tick-last", true);
          }
        });
      });

    // Let ticks position naturally based on their actual data values
    // This ensures proper alignment between axis ticks and data points

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

      if (showDividerNextToYAxis) {
        g.selectAll(".tick-last line").attr("stroke-dasharray", null);
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
    showZeroLine,
    showDividerNextToYAxis,
  ]);

  return <g className="x-axis-container" ref={ref} />;
};

export default XaxisLinear;

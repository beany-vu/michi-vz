import React, { FC, useLayoutEffect, useRef, useMemo, useCallback } from "react";
import { ScaleBand } from "d3-scale";
import * as d3 from "d3";

interface Props {
  xScale: ScaleBand<string>;
  height: number;
  margin: { top: number; right: number; bottom: number; left: number };
  xAxisFormat?: (d: string | number) => string;
  xAxisDataType?: "text" | "number";
  ticks?: number;
  isLoading?: boolean;
  isEmpty?: boolean;
}

const XaxisBand: FC<Props> = ({
  xScale,
  height,
  margin,
  xAxisFormat,
  // xAxisDataType is kept for API consistency with other axis components
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  xAxisDataType = "text",
  ticks = 15,
  isLoading = false,
  isEmpty = false,
}) => {
  const ref = useRef<SVGGElement>(null);
  const renderedRef = useRef(false);

  // Memoize the tick values calculation - select evenly spaced ticks
  const tickValues = useMemo(() => {
    // Don't generate ticks if loading or empty
    if (isLoading || isEmpty) {
      return [];
    }

    const domain = xScale.domain();

    // Early return if domain is empty
    if (domain.length === 0) return [];

    // If only one item, just return it
    if (domain.length === 1) return domain;

    // Always include first and last
    const first = domain[0];
    const last = domain[domain.length - 1];

    // Calculate available width for ticks
    const availableWidth = xScale.range()[1] - xScale.range()[0];

    // Estimate space needed per tick (average label width + padding)
    const estimatedTickWidth = 80; // Base estimate in pixels

    // Calculate how many ticks can fit
    const maxFittingTicks = Math.floor(availableWidth / estimatedTickWidth);

    // Use the smaller of maxFittingTicks or requested ticks
    const effectiveTicks = Math.max(2, Math.min(maxFittingTicks, ticks));

    // If we only want two ticks or have only two items, return first and last
    if (effectiveTicks <= 2 || domain.length <= 2) {
      return [first, last];
    }

    // If we have very few items, just show them all
    if (domain.length <= effectiveTicks) {
      return domain;
    }

    // Generate evenly spaced index positions
    const result = [first]; // Always include first

    if (effectiveTicks > 2) {
      // Calculate step size to create evenly spaced ticks
      const step = (domain.length - 1) / (effectiveTicks - 1);

      // Add intermediate ticks at even intervals (skip first and last)
      for (let i = 1; i < effectiveTicks - 1; i++) {
        const index = Math.round(i * step);
        if (index > 0 && index < domain.length - 1) {
          result.push(domain[index]);
        }
      }
    }

    result.push(last); // Always include last
    return result;
  }, [xScale, ticks, isLoading, isEmpty]);

  // Memoize the formatter function
  const formatter = useCallback(
    (d: string | number): string => {
      if (xAxisFormat) {
        return xAxisFormat(d);
      }
      return String(d);
    },
    [xAxisFormat]
  );

  useLayoutEffect(() => {
    if (!ref.current || !xScale || renderedRef.current) return;

    const xAxis = d3
      .axisBottom(xScale)
      .tickFormat(formatter as (d: string) => string)
      .tickSizeOuter(0)
      .tickValues(tickValues);

    d3.select(ref.current)
      .call(xAxis)
      .selectAll("text")
      .attr("y", margin.bottom / 2)
      .attr("dx", "0em")
      .attr("dy", "0.5em");

    renderedRef.current = true;
  }, [xScale, margin.bottom, formatter, tickValues]);

  useLayoutEffect(() => {
    const g = d3.select(ref.current);
    if (!g || !tickValues.length) return;

    // Clear previous content
    g.selectAll("*").remove();

    // Create the axis group
    const axisGroup = g.attr("transform", `translate(0,${height - margin.bottom + 25})`);

    // Add the axis with transition - only apply transition on first render
    const axisCall = d3.axisBottom(xScale).tickValues(tickValues).tickFormat(formatter);

    if (!renderedRef.current) {
      axisGroup.transition().duration(500).call(axisCall);
      renderedRef.current = true;
    } else {
      axisGroup.call(axisCall);
    }

    // Remove domain line and tick lines
    axisGroup.select(".domain").remove();
    axisGroup.selectAll(".tick line").remove();

    // Keep labels horizontal by default
    axisGroup
      .selectAll(".tick text")
      .attr("transform", "rotate(0)")
      .style("text-anchor", "middle")
      .attr("dx", "0")
      .attr("dy", "0.71em");

    // Add dashed lines with transition
    const tickGroups = axisGroup.selectAll(".tick");

    // Remove existing tick lines before adding new ones
    tickGroups.selectAll(".tick-line").remove();

    // Add tick lines - only apply transition on first render
    tickGroups
      .append("line")
      .attr("class", "tick-line")
      .attr("x1", 0)
      .attr("x2", 0)
      .attr("y1", 0)
      .attr("y2", -height + margin.bottom - 25)
      .attr("pointer-events", "none")
      .style("stroke-dasharray", "3,3")
      .style("stroke", "transparent")
      .style("opacity", 1);

    // Update or add dots
    const dots = tickGroups.selectAll(".tickValueDot").data([0]); // One dot per tick

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

    // Add interactive circles (separate from the dots)
    tickGroups
      .append("circle")
      .attr("class", "tickValueDot-interactive")
      .attr("cx", 0)
      .attr("cy", 0)
      .attr("r", 2)
      .attr("fill", "lightgray")
      .style("opacity", 1)
      .on("mouseover", function () {
        d3.select(this).attr("r", 4).attr("fill", "#666");
      })
      .on("mouseout", function () {
        d3.select(this).attr("r", 2).attr("fill", "lightgray");
      });
  }, [xScale, height, margin, tickValues, formatter]);

  return <g ref={ref} className="x-axis x-axis-band" />;
};

export default XaxisBand;

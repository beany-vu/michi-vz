import React, { FC, useEffect, useRef, useMemo, useCallback } from "react";
import { ScaleBand } from "d3-scale";
import * as d3 from "d3";

interface Props {
  xScale: ScaleBand<string>;
  height: number;
  margin: { top: number; right: number; bottom: number; left: number };
  xAxisFormat?: (d: string | number) => string;
}

const XaxisBand: FC<Props> = ({ xScale, height, margin, xAxisFormat }) => {
  const ref = useRef<SVGGElement>(null);
  const renderedRef = useRef(false);

  // Memoize the tick values calculation
  const tickValues = useMemo(() => {
    const domain = xScale.domain();
    return domain.length <= 15
      ? domain
      : [
          domain[0],
          domain[Math.floor(domain.length / 4)],
          domain[Math.floor(domain.length / 2)],
          domain[Math.floor((domain.length / 4) * 3)],
          domain[domain.length - 1],
        ];
  }, [xScale]);

  // Memoize the formatter function
  const formatter = useCallback(
    (d: string | number) => (xAxisFormat ? xAxisFormat(d) : String(d)),
    [xAxisFormat]
  );

  useEffect(() => {
    const g = d3.select(ref.current);
    if (!g) return;

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

    // Add dashed lines with transition
    const tickGroups = axisGroup.selectAll(".tick");

    // Remove existing tick lines before adding new ones
    tickGroups.selectAll(".tick-line").remove();

    // Add tick lines - only apply transition on first render
    const tickLines = tickGroups
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
      .merge(dots as any)
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

export default React.memo(XaxisBand);

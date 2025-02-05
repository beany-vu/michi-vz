import React, { FC, useEffect, useRef } from "react";
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

  useEffect(() => {
    const g = d3.select(ref.current);
    if (g) {
      // Define default formatter
      const defaultFormatter = (d: string | number) => String(d);

      // Calculate tick values
      const domain = xScale.domain();

      // If there are fewer than or equal to 15 ticks, show all ticks
      // Otherwise, show 5 ticks with the first and last always visible

      const tickValues =
        domain.length <= 15
          ? domain
          : [
              domain[0],
              domain[Math.floor(domain.length / 4)],
              domain[Math.floor(domain.length / 2)],
              domain[Math.floor((domain.length / 4) * 3)],
              domain[domain.length - 1],
            ];

      // Add the x-axis with ticks
      g.attr("transform", `translate(0,${height - margin.bottom + 25})`).call(
        d3
          .axisBottom(xScale)
          // 4 equal distance ticks
          .tickValues(tickValues)
          .tickFormat(d => (xAxisFormat ? xAxisFormat(d) : defaultFormatter(d)))
      );

      // Remove existing domain line and tick lines
      g.select(".domain").remove();
      g.selectAll(".tick line").remove();

      // Add dashed lines for each tick
      g.selectAll(".tick")
        .append("line")
        .attr("class", "tick-line")
        .attr("x1", 0)
        .attr("x2", 0)
        .attr("y1", 0)
        .attr("y2", -height + margin.bottom - 25)
        .style("stroke-dasharray", "3,3") // Set dash pattern
        .style("stroke", "transparent"); // Color of the dashed line

      // Add circles at each tick
      g.selectAll(".tick")
        .append("circle")
        .attr("class", "tickValueDot")
        .attr("cx", 0)
        .attr("cy", 0)
        .attr("r", 2)
        .attr("fill", "lightgray");
    }
  }, [xScale, height, margin, xAxisFormat]);

  return <g ref={ref} className={"x-axis x-axis-band"} />;
};

export default XaxisBand;

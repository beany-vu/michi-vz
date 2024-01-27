import React, { FC, useEffect, useRef } from "react";
import { ScaleBand } from "d3-scale";
import * as d3 from "d3";

interface Props {
  yScale: ScaleBand<string>;
  width: number;
  margin: { top: number; right: number; bottom: number; left: number };
  yAxisFormat?: (d: number | string) => string;
}

const YaxisBand: FC<Props> = ({ yScale, width, margin, yAxisFormat }) => {
  const ref = useRef<SVGGElement>(null);

  useEffect(() => {
    const g = d3.select(ref.current);

    // Add the y-axis with ticks
    g.attr("class", "y-axis")
      .attr("transform", "translate(" + margin.left + ",0)")
      .call(
        d3
          .axisLeft(yScale)
          .tickFormat((d) => (yAxisFormat ? yAxisFormat(d) : d)),
      );

    // Remove existing domain line and tick lines
    g.select(".domain").remove();
    g.selectAll(".tick line").remove();

    // Add dashed lines on each tick
    g.selectAll(".tick")
      .append("line")
      .attr("class", "tick-line")
      .attr("x1", 0)
      .attr("x2", width - margin.left - margin.right)
      .attr("y1", 0)
      .attr("y2", 0)
      .style("stroke-dasharray", "1.5") // Set dash pattern
      .style("stroke", "transparent"); // Color of the dashed line

    // Add circles at each tick
    g.selectAll(".tick")
      .append("circle")
      .attr("class", "tickValueDot")
      .attr("cx", 0)
      .attr("cy", 0) // 10 units above the x-axis. Adjust as needed.
      .attr("r", 2) // Radius of the circle
      .attr("fill", "lightgray"); // Color of the circle
  }, [yScale, width, margin]);

  return <g ref={ref} />;
};

export default YaxisBand;

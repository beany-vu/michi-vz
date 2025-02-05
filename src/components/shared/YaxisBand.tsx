import React, { FC, useEffect, useRef } from "react";
import { ScaleBand } from "d3-scale";
import * as d3 from "d3";

interface Props {
  yScale: ScaleBand<string>;
  width: number;
  margin: { top: number; right: number; bottom: number; left: number };
  yAxisFormat?: (d: number | string) => string;
  showGrid?: boolean;
}

const YaxisBand: FC<Props> = ({
  yScale,
  width,
  margin,
  yAxisFormat,
  showGrid,
}) => {
  const ref = useRef<SVGGElement>(null);

  useEffect(() => {
    const g = d3.select(ref.current);

    // Add the y-axis with ticks
    g.attr("class", "y-axis")
      .attr("transform", "translate(" + margin.left + ",0)")
      .call(
        d3
          .axisLeft(yScale)
          .tickFormat((d) => (yAxisFormat ? yAxisFormat(d) : d))
          .tickSize(0), // Hide the ticks for foreignObject
      );

    // Remove existing domain line and tick lines
    g.select(".domain").remove();

    // Remove existing text labels
    g.selectAll(".tick *").remove();

    // Append foreignObject for HTML content
    g.selectAll(".tick")
      .append("foreignObject")
      .attr("class", "tick-html")
      .attr("x", -100) // Adjust as needed
      .attr("y", -10) // Adjust as needed
      .attr("width", 100) // Adjust as needed
      .attr("height", 20) // Adjust as needed
      .html(
        (d) =>
          `<div style="display:flex;align-items:center;height:100%" title="${d}"><span>${d}</span></div>`,
      ); // HTML content for each tick

    // Add dashed lines on each tick
    g.selectAll(".tick")
      .append("line")
      .attr("class", "tick-line")
      .attr("x1", 0)
      .attr("x2", width - margin.left - margin.right)
      .attr("y1", 0)
      .attr("y2", 0)
      .style("stroke-dasharray", "1.5") // Set dash pattern
      .style("stroke", showGrid ? "lightgray" : "transparent"); // Color of the dashed line
  }, [yScale, width, margin, yAxisFormat, showGrid]);

  return <g ref={ref} />;
};

export default YaxisBand;

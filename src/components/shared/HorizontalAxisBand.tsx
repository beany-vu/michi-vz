import React, { FC, useEffect, useRef } from "react";
import { ScaleBand } from "d3-scale";
import * as d3 from "d3";

interface Props {
  xScale: ScaleBand<string>;
  height: number;
  margin: { top: number; right: number; bottom: number; left: number };
}

const HorizontalAxisBand: FC<Props> = ({ xScale, height, margin }) => {
  const ref = useRef<SVGGElement>(null);

  useEffect(() => {
    const g = d3.select(ref.current);
    if (g) {
      g.selectAll(".tick")
        .append("circle")
        .attr("class", "tickValueDot")
        .attr("cx", 0)
        .attr("cy", 0) // 10 units above the x-axis. Adjust as needed.
        .attr("r", 2) // Radius of the circle
        .attr("fill", "lightgray"); // Color of the circle
      g.attr("transform", "translate(0," + (height - margin.bottom + 25) + ")")
        .call(d3.axisBottom(xScale))
        .call((g) => g.select(".domain").attr("stroke-opacity", 1))
        .call((g) => g.select(".domain").remove())
        .call((g) => g.selectAll(".tick line").remove())
        .call((g) => g.selectAll(".tick line").remove());
    }
  }, [xScale, height, margin]);

  return <g ref={ref} className={"x-axis"} />;
};

export default HorizontalAxisBand;

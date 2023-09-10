import React, { FC, useEffect, useRef } from "react";
import { ScaleBand } from "d3-scale";
import * as d3 from "d3";

interface Props {
  yScale: ScaleBand<string>;
  width: number;
  margin: { top: number; right: number; bottom: number; left: number };
  yAxisFormat?: (d: number | string) => string;
}

const VerticalAxisBand: FC<Props> = ({
  yScale,
  width,
  margin,
  yAxisFormat,
}) => {
  const ref = useRef<SVGGElement>(null);

  useEffect(() => {
    const g = d3.select(ref.current);
    g.attr("class", "y-axis")
      .attr("transform", "translate(" + margin.left + ",0)")
      .call(
        d3
          .axisLeft(yScale)
          .tickFormat((d) => (yAxisFormat ? yAxisFormat(d) : d)),
      )
      .call((g) => g.select(".domain").attr("stroke-opacity", 1))
      .call((g) => g.select(".domain").remove())
      .call((g) => g.selectAll(".tick line").remove())
      .call((g) => g.selectAll(".tick line").remove());
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

export default VerticalAxisBand;

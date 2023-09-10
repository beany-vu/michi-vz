import React, { FC, useEffect, useRef } from "react";
import { ScaleLinear } from "d3-scale";
import * as d3 from "d3";

interface Props {
  xScale: ScaleLinear<number, number>;
  height: number;
  margin: { top: number; right: number; bottom: number; left: number };
  xAxisFormat?: (d: number | { valueOf(): number }) => string;
}

const HorizontalAxisLinear: FC<Props> = ({
  xScale,
  height,
  margin,
  xAxisFormat,
}) => {
  const ref = useRef<SVGGElement>(null);

  useEffect(() => {
    // Format tick labels as integers without any separators
    const tickFormatter = d3.format("d");
    const g = d3.select(ref.current);

    g.attr("class", "x-axis")
      .attr("transform", "translate(0," + (height - margin.bottom + 15) + ")")
      .call(
        d3
          .axisBottom(xScale)
          .tickFormat((d) => (xAxisFormat ? xAxisFormat(d) : tickFormatter(d))),
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
  }, [xScale, height, margin]);

  return <g ref={ref} />;
};

export default HorizontalAxisLinear;

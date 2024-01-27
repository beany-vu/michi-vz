import React, { FC, useEffect, useRef } from "react";
import { ScaleLinear } from "d3-scale";
import * as d3 from "d3";

interface Props {
  yScale: ScaleLinear<number, number>;
  width: number;
  height: number;
  highlightZeroLine?: boolean;
  margin: { top: number; right: number; bottom: number; left: number };
  yAxisFormat?: (d: number) => string;
}

const YaxisLinear: FC<Props> = ({
  yScale,
  width,
  height,
  highlightZeroLine = true,
  margin,
  yAxisFormat,
}) => {
  const ref = useRef<SVGGElement>(null);
  useEffect(() => {
    const g = d3.select(ref.current);

    const yAxis = d3.axisLeft(yScale).tickSize(0).tickPadding(10);

    // Apply the formatter if provided
    if (yAxisFormat) {
      yAxis.tickFormat(yAxisFormat);
    }

    g.attr(
      "transform",
      "translate(" + (margin.left > 0 ? margin.left : 0) + ",0)",
    )
      .call(yAxis)
      .call((g) => g.select(".domain").remove())
      .call((g) => g.selectAll(".tick line").attr("stroke-width", "1.5"))

      .call((g) =>
        g
          .selectAll(".tick line")
          .attr("stroke-width", "1")
          .attr("stroke-dasharray", "2,2")
          .attr("x2", width - margin.right - margin.left)
          .attr("stroke", "lightgray")
          .each(function (d) {
            // Check if the datum for this tick is 0
            if (d === 0) {
              // If so, add the "zero-line" class
              d3.select(this).classed("zero-line", true);
            }
          }),
      );
  }, [yScale, width, height, margin, highlightZeroLine]);

  return <g ref={ref}></g>;
};

export default YaxisLinear;

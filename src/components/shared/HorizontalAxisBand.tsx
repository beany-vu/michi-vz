import React, { FC, useEffect, useRef } from "react";
import { ScaleBand } from "d3-scale";
import * as d3 from "d3";

interface Props {
  xScale: ScaleBand<string>;
  height: number;
  margin: { top: number; right: number; bottom: number; left: number };
  xAxisFormat?: (d: string | number) => string;
}

const HorizontalAxisBand: FC<Props> = ({
  xScale,
  height,
  margin,
  xAxisFormat,
}) => {
  const ref = useRef<SVGGElement>(null);

  useEffect(() => {
    const g = d3.select(ref.current);
    if (g) {
      g.attr("transform", "translate(0," + (height - margin.bottom + 25) + ")")
        .call(
          d3
            .axisBottom(xScale)
            .tickFormat((d) => (xAxisFormat ? xAxisFormat(d) : String(d))),
        )
        .call((g) => g.select(".domain").attr("stroke-opacity", 1))
        .call((g) => g.select(".domain").remove())
        .call((g) => g.selectAll(".tick line").remove());

      if (xScale.domain().length > 20) {
        g.selectAll(".tick")
          .filter(function (d, i) {
            return i % 3 !== 0;
          })
          .remove();
      }

      g.selectAll(".tick")
        .append("circle")
        .attr("class", "tickValueDot")
        .attr("cx", 0)
        .attr("cy", 0)
        .attr("r", 2)
        .attr("fill", "lightgray");
    }
  }, [xScale, height, margin, xAxisFormat]);

  return <g ref={ref} className={"x-axis"} />;
};

export default HorizontalAxisBand;

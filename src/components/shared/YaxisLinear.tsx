import React, { FC, useRef, useMemo, useLayoutEffect } from "react";
import { ScaleLinear } from "d3-scale";
import * as d3 from "d3";

interface Props {
  yScale: ScaleLinear<number, number>;
  width: number;
  height: number;
  highlightZeroLine?: boolean;
  margin: { top: number; right: number; bottom: number; left: number };
  yAxisFormat?: (d: number) => string;
  yTicksQty?: number;
}

const YaxisLinear: FC<Props> = ({
  yScale,
  width,
  height,
  highlightZeroLine = true,
  margin,
  yTicksQty,
  yAxisFormat,
}) => {
  const ref = useRef<SVGGElement>(null);

  const yAxisConfig = useMemo(() => {
    const axis = d3
      .axisLeft(yScale)
      .tickSize(0)
      .tickPadding(10)
      .ticks(yTicksQty || 10);

    if (yAxisFormat) {
      axis.tickFormat(yAxisFormat);
    }

    return axis;
  }, [yScale, yTicksQty, yAxisFormat]);

  // Memoize the previous yScale domain to detect changes
  const prevYScaleDomain = useRef(yScale.domain());

  useLayoutEffect(() => {
    const g = d3.select(ref.current);
    const currentYScaleDomain = yScale.domain();
    const yScaleChanged =
      JSON.stringify(currentYScaleDomain) !== JSON.stringify(prevYScaleDomain.current);
    prevYScaleDomain.current = currentYScaleDomain;

    // Initial render with transition
    g.transition()
      .duration(750)
      .attr("transform", `translate(${margin.left > 0 ? margin.left : 0},0)`)
      .call(yAxisConfig)
      .call(g => g.select(".domain").attr("stroke-opacity", 0))
      .call(g => g.select(".domain").remove())
      .call(g => g.selectAll(".tick line").attr("stroke-opacity", 0))
      .call(g => g.selectAll(".tick line").remove())
      .call(g => g.selectAll(".tick-line").remove());

    // Remove existing tick lines before updating
    g.selectAll(".tick line").remove();

    // Update transitions
    g.selectAll(".tick text").transition().duration(750).style("opacity", 1);

    // Only animate tick lines if y-scale changed
    const tickLines = g
      .selectAll(".tick")
      .append("line")
      .attr("class", "tick-line")
      .attr("x1", 0)
      .attr("x2", 0)
      .attr("y1", 0)
      .attr("y2", 0)
      .style("stroke-dasharray", "2,2")
      .style("stroke", "lightgray")
      .style("opacity", 1);

    if (yScaleChanged) {
      tickLines
        .transition()
        .duration(750)
        .attr("x2", width - margin.right - margin.left)
        .each(function (d) {
          if (d === 0) {
            d3.select(this)
              .classed("zero-line", true)
              .attr("stroke", highlightZeroLine ? "#000" : "lightgray")
              .attr("stroke-width", "1");
          }
        });
    } else {
      tickLines.attr("x2", width - margin.right - margin.left).each(function (d) {
        if (d === 0) {
          d3.select(this)
            .classed("zero-line", true)
            .attr("stroke", highlightZeroLine ? "#000" : "lightgray")
            .attr("stroke-width", "1");
        }
      });
    }
  }, [yScale, width, height, margin, highlightZeroLine, yAxisConfig]);

  return <g ref={ref}></g>;
};

export default React.memo(YaxisLinear);

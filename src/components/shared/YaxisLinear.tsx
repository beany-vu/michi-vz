import React, { FC, useRef, useMemo, useLayoutEffect } from "react";
import { ScaleLinear } from "d3-scale";
import * as d3 from "d3";

interface Props {
  yScale: ScaleLinear<number, number>;
  width: number;
  height: number;
  highlightZeroLine?: boolean;
  margin: { top: number; right: number; bottom: number; left: number };
  yAxisFormat?: (d: number | { valueOf(): number }) => string;
  yTicksQty?: number;
  showGridLines?: boolean;
  showTickLabels?: boolean;
}

const YaxisLinear: FC<Props> = ({
  yScale,
  width,
  height,
  highlightZeroLine = true,
  margin,
  yTicksQty,
  yAxisFormat,
  showGridLines = true,
  showTickLabels = true,
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

  useLayoutEffect(() => {
    if (!ref.current) return;
    const g = d3.select<SVGGElement, unknown>(ref.current);

    // Render the axis synchronously — no transitions. This mirrors the
    // XaxisLinear approach (clear, rebuild, done) and eliminates an entire
    // class of timing bugs where the chart pipeline re-runs this effect
    // mid-transition and freezes axis labels/transforms at interpolated values
    // (notably: line charts with a fixed yAxisDomain and few series, where
    // the transform tween from translate(0,0) → translate(margin.left,0) was
    // interrupted before reaching its end position, leaving tick text at
    // x < 0 and therefore off-viewport).
    g.selectAll("*").remove();
    g.attr("transform", `translate(${margin.left > 0 ? margin.left : 0},0)`);
    g.call(yAxisConfig);
    g.select(".domain").remove();
    g.selectAll(".tick line").remove();

    if (!showTickLabels) {
      g.selectAll(".tick text").remove();
    }

    if (!showGridLines) {
      return;
    }

    const fullGridWidth = width - margin.right - margin.left;
    g.selectAll<SVGGElement, number>(".tick")
      .append("line")
      .attr("class", "tick-line")
      .attr("x1", 0)
      .attr("x2", fullGridWidth)
      .attr("y1", 0)
      .attr("y2", 0)
      .style("stroke-dasharray", "2,2")
      .style("stroke", "lightgray")
      .style("opacity", 1)
      .each(function (d) {
        if (d === 0) {
          d3.select(this)
            .classed("zero-line", true)
            .attr("stroke", highlightZeroLine ? "#000" : "lightgray")
            .attr("stroke-width", "1");
        }
      });
  }, [
    yScale,
    width,
    height,
    margin,
    highlightZeroLine,
    yAxisConfig,
    showGridLines,
    showTickLabels,
  ]);

  return <g ref={ref}></g>;
};

export default YaxisLinear;

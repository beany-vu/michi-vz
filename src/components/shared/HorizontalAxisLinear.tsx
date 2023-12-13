import React, { FC, useEffect, useRef, useMemo } from "react";
import { ScaleTime, ScaleLinear } from "d3-scale";
import * as d3 from "d3";

interface Props {
  xScale: ScaleTime<number, number> | ScaleLinear<number, number>;
  height: number;
  margin: { top: number; right: number; bottom: number; left: number };
  xAxisFormat?: (d: number | { valueOf(): number }) => string;
  xAxisDataType?: "number" | "date_annual" | "date_monthly";
}

const checkIsTimeScale = (
  scale: ScaleTime<number, number> | ScaleLinear<number, number>,
): scale is ScaleTime<number, number> => {
  return (scale as ScaleTime<number, number>).ticks !== undefined;
};

const HorizontalAxisLinear: FC<Props> = ({
  xScale,
  height,
  margin,
  xAxisFormat,
  xAxisDataType = "number",
}) => {
  const ref = useRef<SVGGElement>(null);

  const isTimeScale = checkIsTimeScale(xScale);

  const tickValues = useMemo(() => {
    // const years = xScale.domain();
    if (
      isTimeScale &&
      xAxisDataType === "date_annual" &&
      xScale.domain().length < 10
    ) {
      return xScale.ticks(d3.timeYear.every(1));
    }
    return null;
  }, [xAxisDataType, margin, xScale]);

  useEffect(() => {
    const defaultFormatter = (d: number | Date) => {
      if (isTimeScale && typeof d !== "number") {
        return xAxisDataType === "date_annual"
          ? d3.timeFormat("%Y")(d)
          : d3.timeFormat("%m-%Y")(d);
      } else {
        return String(d);
      }
    };

    const g = d3.select(ref.current);

    g.attr("class", "x-axis")
      .attr("transform", "translate(0," + (height - margin.bottom + 15) + ")")
      .call(
        d3
          .axisBottom(xScale)
          .tickValues(tickValues) // Pass null for numeric scales
          .tickFormat((d: number | Date) =>
            xAxisFormat ? xAxisFormat(d) : defaultFormatter(d),
          ),
      )
      .call((g) => g.select(".domain").attr("stroke-opacity", 1))
      .call((g) => g.select(".domain").remove())
      .call((g) => g.selectAll(".tick line").remove())
      .call((g) => g.selectAll(".tick line").remove());

    g.selectAll(".tick")
      .append("circle")
      .attr("class", "tickValueDot")
      .attr("cx", 0)
      .attr("cy", 0)
      .attr("r", 2)
      .attr("fill", "lightgray");
  }, [xScale, height, margin, isTimeScale, xAxisFormat, xAxisDataType]);

  return <g ref={ref} />;
};

export default HorizontalAxisLinear;

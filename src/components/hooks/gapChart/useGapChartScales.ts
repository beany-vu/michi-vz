import { useMemo } from "react";
import * as d3 from "d3";

export const useGapChartScales = (
  xAxisDomain: number[],
  yAxisDomain: string[],
  width: number,
  height: number,
  margin: { top: number; right: number; bottom: number; left: number },
  xAxisDataType: "number" | "date_annual" | "date_monthly"
) => {
  const xScale = useMemo(() => {
    // Use margin.left directly - it already provides space for Y-axis labels
    if (xAxisDataType === "number") {
      return d3
        .scaleLinear()
        .domain(xAxisDomain as [number, number])
        .range([margin.left, width - margin.right]);
    } else if (xAxisDataType === "date_annual") {
      const [min, max] = xAxisDomain;
      return d3
        .scaleTime()
        .domain([new Date(min, 0, 1), new Date(max, 0, 1)])
        .range([margin.left, width - margin.right]);
    } else {
      // date_monthly
      const [min, max] = xAxisDomain;
      return d3
        .scaleTime()
        .domain([new Date(min), new Date(max)])
        .range([margin.left, width - margin.right]);
    }
  }, [xAxisDomain, width, margin, xAxisDataType]);

  const yScale = useMemo(
    () =>
      d3
        .scaleBand()
        .domain(yAxisDomain)
        .range([margin.top, height - margin.bottom])
        .padding(0.3),
    [yAxisDomain, height, margin]
  );

  return { xScale, yScale };
};

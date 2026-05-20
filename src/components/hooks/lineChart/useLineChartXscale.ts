import { scaleLinear, scaleTime } from "d3";
import { useMemo } from "react";
import { LineChartDataItem } from "../../../types/data";
import { getXScaleDomain } from "./lineChartUtils";

const useLineChartXscale = (
  filteredDataSet: LineChartDataItem[],
  width: number,
  margin: { left: number; right: number },
  xAxisDataType: "number" | "date_annual" | "date_monthly"
) => {
  return useMemo(() => {
    // getXScaleDomain replaces the previous double flatMap + min()/max() scans
    // (and their per-point Date allocation) with a single pass over the data.
    const [lo, hi] = getXScaleDomain(filteredDataSet, xAxisDataType);

    if (xAxisDataType === "number") {
      return scaleLinear()
        .domain([lo || 0, hi || 1])
        .range([margin.left, width - margin.right])
        .clamp(true)
        .nice();
    }

    // date_annual / date_monthly: lo/hi are epoch ms (0 / 1 for empty data),
    // matching the previous `new Date(minDate || 0)` / `new Date(maxDate || 1)`.
    return scaleTime()
      .domain([new Date(lo), new Date(hi)])
      .range([margin.left, width - margin.right]);
  }, [filteredDataSet, width, margin, xAxisDataType]);
};

export default useLineChartXscale;

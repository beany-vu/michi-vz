import { scaleLinear } from "d3";
import { useMemo } from "react";
import { LineChartDataItem } from "../../../types/data";
import { getYScaleDomain } from "./lineChartUtils";

const useLineChartYscale = (
  filteredDataSet: LineChartDataItem[],
  yAxisDomain: [number, number] | undefined,
  height: number,
  margin: { top: number; bottom: number }
) => {
  return useMemo(() => {
    // getYScaleDomain replaces the previous double flatMap + filter + min()/max()
    // scan with a single pass. `|| 0` / `|| 1` preserve the prior empty fallbacks.
    const [lo, hi] = getYScaleDomain(filteredDataSet);
    return scaleLinear()
      .domain(yAxisDomain ? yAxisDomain : [lo || 0, hi || 1])
      .range([height - margin.bottom, margin.top])
      .clamp(true)
      .nice();
  }, [filteredDataSet, height, margin, yAxisDomain]);
};

export default useLineChartYscale;

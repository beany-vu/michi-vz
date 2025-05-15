import { scaleLinear, min, max } from "d3";
import { useMemo } from "react";

const useLineChartYscale = (filteredDataSet, yAxisDomain, height, margin) => {
  return useMemo(
    () =>
      scaleLinear()
        .domain(
          yAxisDomain
            ? yAxisDomain
            : [
                min(
                  filteredDataSet.flatMap(({ series }) => series.filter(dd => dd.value !== null)),
                  d => d.value
                ) || 0,
                max(
                  filteredDataSet.flatMap(({ series }) => series.filter(dd => dd.value !== null)),
                  d => d.value
                ) || 1,
              ]
        )
        .range([height - margin.bottom, margin.top])
        .clamp(true)
        .nice(),
    [filteredDataSet, height, margin, yAxisDomain]
  );
};

export default useLineChartYscale;

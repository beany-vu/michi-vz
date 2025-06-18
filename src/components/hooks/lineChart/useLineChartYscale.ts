import { scaleLinear, min, max } from "d3";
import { useMemo } from "react";
import { LineChartDataItem, DataPoint } from "../../../types/data";

const useLineChartYscale = (
  filteredDataSet: LineChartDataItem[],
  yAxisDomain: [number, number] | undefined,
  height: number,
  margin: { top: number; bottom: number }
) => {
  return useMemo(
    () =>
      scaleLinear()
        .domain(
          yAxisDomain
            ? yAxisDomain
            : [
                min(
                  filteredDataSet.flatMap(({ series }) =>
                    series.filter((dd: DataPoint) => dd.value !== null)
                  ),
                  (d: DataPoint) => d.value
                ) || 0,
                max(
                  filteredDataSet.flatMap(({ series }) =>
                    series.filter((dd: DataPoint) => dd.value !== null)
                  ),
                  (d: DataPoint) => d.value
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

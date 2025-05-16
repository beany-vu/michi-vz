import { scaleLinear, scaleTime, min, max } from "d3";
import { useMemo } from "react";
import { LineChartDataItem } from "src/types/data";

interface Props {
  filteredDataSet: LineChartDataItem[];
  width: number;
  margin: { left: number; right: number };
  xAxisDataType: "number" | "date_annual" | "date_monthly";
}

const useLineChartXscale = (
  filteredDataSet: LineChartDataItem[],
  width: number,
  margin: { left: number; right: number },
  xAxisDataType: "number" | "date_annual" | "date_monthly"
) => {
  return useMemo(() => {
    if (xAxisDataType === "number") {
      return scaleLinear()
        .domain([
          min(filteredDataSet.flatMap(item => item.series.map(d => Number(d.date)))) || 0,
          max(filteredDataSet.flatMap(item => item.series.map(d => Number(d.date)))) || 1,
        ])
        .range([margin.left, width - margin.right])
        .clamp(true)
        .nice();
    }

    if (xAxisDataType === "date_annual") {
      // sometimes the first tick is missing, so do a hack here
      const minDate = min(
        filteredDataSet.flatMap(item => item.series.map(d => new Date(`${d.date}-01-01`)))
      );
      const maxDate = max(
        filteredDataSet.flatMap(item => item.series.map(d => new Date(`${d.date}`)))
      );

      return scaleTime()
        .domain([
          minDate instanceof Date ? minDate : new Date(minDate || 0),
          maxDate instanceof Date ? maxDate : new Date(maxDate || 1),
        ])
        .range([margin.left, width - margin.right]);
    }

    const minDate = min(filteredDataSet.flatMap(item => item.series.map(d => new Date(d.date))));
    const maxDate = max(filteredDataSet.flatMap(item => item.series.map(d => new Date(d.date))));

    return scaleTime()
      .domain([
        minDate instanceof Date ? minDate : new Date(minDate || 0),
        maxDate instanceof Date ? maxDate : new Date(maxDate || 1),
      ])
      .range([margin.left, width - margin.right]);
  }, [filteredDataSet, width, margin, xAxisDataType]);
};

export default useLineChartXscale;

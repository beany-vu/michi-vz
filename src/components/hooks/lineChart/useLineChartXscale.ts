import { scaleLinear, scaleTime, min, max } from "d3";
import { useMemo } from "react";

const useLineChartXscale = (filteredDataSet, width, margin, xAxisDataType) => {
  return useMemo(() => {
    if (xAxisDataType === "number") {
      return scaleLinear()
        .domain([
          min(filteredDataSet.flatMap(item => item.series.map(d => d.date as number))) || 0,
          max(filteredDataSet.flatMap(item => item.series.map(d => d.date as number))) || 1,
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
        .domain([minDate || 0, maxDate || 1])
        .range([margin.left, width - margin.right]);
    }

    const minDate = min(filteredDataSet.flatMap(item => item.series.map(d => new Date(d.date))));
    const maxDate = max(filteredDataSet.flatMap(item => item.series.map(d => new Date(d.date))));

    return scaleTime()
      .domain([minDate || 0, maxDate || 1])
      .range([margin.left, width - margin.right]);
  }, [filteredDataSet, width, margin, xAxisDataType]);
};

export default useLineChartXscale;

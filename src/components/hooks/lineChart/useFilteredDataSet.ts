import { useMemo } from "react";
import { LineChartDataItem, Filter } from "../../../types/data";

const useFilteredDataSet = (
  dataSet: LineChartDataItem[],
  filter: Filter,
  disabledItems: string[]
) => {
  return useMemo(() => {
    // If no filter is provided, return the entire dataset excluding disabled items
    if (!filter) {
      return dataSet.filter(d => !disabledItems.includes(d.label));
    }

    // Start with the base dataset, excluding disabled items
    let result = dataSet.filter(d => !disabledItems.includes(d.label));

    // Apply filter logic if filter exists
    result = result
      .filter(item => {
        const targetPoint = item.series.find(d => d.date.toString() === filter.date.toString());
        return targetPoint !== undefined;
      })
      .sort((a, b) => {
        const aPoint = a.series.find(d => d.date.toString() === filter.date.toString());
        const bPoint = b.series.find(d => d.date.toString() === filter.date.toString());
        const aVal = aPoint ? Number(aPoint[filter.criteria]) : 0;
        const bVal = bPoint ? Number(bPoint[filter.criteria]) : 0;
        return filter.sortingDir === "desc" ? bVal - aVal : aVal - bVal;
      })
      .slice(0, filter.limit);

    // Pre-process each dataset to ensure valid points for line rendering
    return result.map(item => ({
      ...item,
      series: item.series.filter(point => point.value !== null && point.value !== undefined),
    }));
  }, [
    dataSet,
    filter,
    filter?.limit, // Explicitly track filter.limit to ensure updates when just the limit changes
    filter?.date,
    filter?.criteria,
    filter?.sortingDir,
    disabledItems,
  ]);
};

export default useFilteredDataSet;

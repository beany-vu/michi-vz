import { useMemo } from "react";

interface DataItem {
  label: string;
  code?: string;
  value1: number;
  value2: number;
  difference: number;
  date: string;
}

interface Filter {
  limit: number;
  date: number | string;
  criteria: string;
  sortingDir: "asc" | "desc";
}

export const useGapChartData = (
  dataSet: DataItem[],
  filter: Filter | undefined,
  disabledItems: string[]
) => {
  // Calculate differences and filter data
  const processedDataSet = useMemo(() => {
    const dataWithDifference = dataSet.map(item => ({
      ...item,
      difference: item.value1 - item.value2,
    }));

    if (!filter) {
      return dataWithDifference.filter(d => !disabledItems.includes(d.label));
    }

    // Filter by date if specified
    const dateFilteredData = filter.date
      ? dataWithDifference.filter(d => d.date === filter.date)
      : dataWithDifference;

    // Sort by difference
    const sortedData = dateFilteredData.slice().sort((a, b) => {
      const diff =
        filter.sortingDir === "desc" ? b.difference - a.difference : a.difference - b.difference;
      return diff;
    });

    // Apply limit and remove disabled items
    return sortedData.slice(0, filter.limit).filter(d => !disabledItems.includes(d.label));
  }, [dataSet, filter, disabledItems]);

  // Get unique labels for y-axis
  const yAxisDomain = useMemo(() => processedDataSet.map(d => d.label), [processedDataSet]);

  // Calculate x-axis domain (min and max values)
  const xAxisDomain = useMemo(() => {
    if (processedDataSet.length === 0) return [0, 0];

    const allValues = processedDataSet.flatMap(d => [d.value1, d.value2]);
    const min = Math.min(...allValues, 0);
    const max = Math.max(...allValues);

    return [min, max];
  }, [processedDataSet]);

  return {
    processedDataSet,
    yAxisDomain,
    xAxisDomain,
  };
};


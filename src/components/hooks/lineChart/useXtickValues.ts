import { useMemo } from "react";
import { XaxisDataType, Margin, LineChartDataItem } from "src/types/data";
import { CONST_DATE_ANNUAL, CONST_DATE_MONTHLY, CONST_NUMBER } from "src/types/constants";

const useLineChartXtickValues = (
  filteredDataSet: LineChartDataItem[],
  xAxisDataType: XaxisDataType,
  width: number,
  margin: Margin
) => {
  // Compute unique sorted x values for axis ticks
  return useMemo((): (number | Date)[] => {
    if (xAxisDataType === CONST_DATE_ANNUAL) {
      // Get all years from data
      const years = filteredDataSet
        .flatMap(item =>
          item.series.map(d => {
            const year = new Date(d.date).getFullYear();
            return isNaN(year) ? null : year;
          })
        )
        .filter((y): y is number => y !== null);
      if (years.length === 0) return [];
      const minYear = Math.min(...years);
      const maxYear = Math.max(...years);
      const allYears = [];
      for (let y = minYear; y <= maxYear; y++) {
        allYears.push(new Date(`${y}-01-01`));
      }
      // Estimate how many ticks can fit based on chart width and label size
      const estimatedLabelWidth = 50; // px per year label
      const maxTicks = Math.floor((width - margin.left - margin.right) / estimatedLabelWidth);
      if (allYears.length <= maxTicks) return allYears;
      // Otherwise, pick 5 ticks: first, last, and 3 evenly spaced
      const tickCount = 5;
      const result = [allYears[0]];
      const step = (allYears.length - 1) / (tickCount - 1);
      for (let i = 1; i < tickCount - 1; i++) {
        const idx = Math.round(i * step);
        if (idx > 0 && idx < allYears.length - 1) {
          result.push(allYears[idx]);
        }
      }
      result.push(allYears[allYears.length - 1]);
      // Sort by year
      result.sort((a, b) => a.getTime() - b.getTime());
      return result;
    }
    if (xAxisDataType === CONST_DATE_MONTHLY) {
      // Get all months from data
      const months = filteredDataSet
        .flatMap(item =>
          item.series.map(d => {
            const date = new Date(d.date);
            return isNaN(date.getTime()) ? null : date;
          })
        )
        .filter((d): d is Date => d !== null);
      if (months.length === 0) return [];
      // Find min and max month
      const minMonth = new Date(Math.min(...months.map(d => d.getTime())));
      const maxMonth = new Date(Math.max(...months.map(d => d.getTime())));
      // Generate all months in range
      const allMonths = [];
      const current = new Date(minMonth.getFullYear(), minMonth.getMonth(), 1);
      const end = new Date(maxMonth.getFullYear(), maxMonth.getMonth(), 1);
      while (current <= end) {
        allMonths.push(new Date(current));
        current.setMonth(current.getMonth() + 1);
      }
      // Estimate how many ticks can fit based on chart width and label size
      const estimatedLabelWidth = 50; // px per month label
      const maxTicks = Math.floor((width - margin.left - margin.right) / estimatedLabelWidth);
      if (allMonths.length <= maxTicks) return allMonths;
      // Otherwise, pick 5 ticks: first, last, and 3 evenly spaced
      const tickCount = 5;
      const result = [allMonths[0]];
      const step = (allMonths.length - 1) / (tickCount - 1);
      for (let i = 1; i < tickCount - 1; i++) {
        const idx = Math.round(i * step);
        if (idx > 0 && idx < allMonths.length - 1) {
          result.push(allMonths[idx]);
        }
      }
      result.push(allMonths[allMonths.length - 1]);
      // Sort by date
      result.sort((a, b) => a.getTime() - b.getTime());
      return result;
    }
    if (xAxisDataType === CONST_NUMBER) {
      let values = Array.from(
        new Set(filteredDataSet.flatMap(item => item.series.map(d => Number(d.date))))
      );
      values = values.filter((v): v is number => typeof v === CONST_NUMBER && !isNaN(v));
      values.sort((a, b) => a - b);
      return values;
    } else {
      // Handle all date cases (monthly, annual, and default)
      const values = Array.from(
        new Set(filteredDataSet.flatMap(item => item.series.map(d => d.date)))
      );
      const dateValues = values
        .map(d => new Date(d))
        .filter((d): d is Date => d instanceof Date && !isNaN(d.getTime()));
      dateValues.sort((a, b) => a.getTime() - b.getTime());
      return dateValues;
    }
  }, [filteredDataSet, xAxisDataType, width, margin]);
};

export default useLineChartXtickValues;

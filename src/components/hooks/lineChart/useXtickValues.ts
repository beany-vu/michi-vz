import { useMemo } from "react";
import { XaxisDataType, Margin, LineChartDataItem } from "../../../types/data";
import { CONST_DATE_ANNUAL, CONST_DATE_MONTHLY, CONST_NUMBER } from "../../../types/constants";

function parseDate(value: number | string): Date | null {
  const str = String(value);

  // Must be exactly 6 digits
  if (/^\d{6}$/.test(str)) {
    const year = parseInt(str.slice(0, 4), 10);
    const month = parseInt(str.slice(4, 6), 10);

    const isYYYYMM = year > 0 && month >= 1 && month <= 12;
    return isYYYYMM ? new Date(year, month - 1, 1) : null;
  }

  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
}

const useLineChartXtickValues = (
  filteredDataSet: LineChartDataItem[],
  xAxisDataType: XaxisDataType,
  width: number,
  margin: Margin
) => {
  // Compute unique sorted x values for axis ticks
  return useMemo((): (number | Date)[] => {
    if (xAxisDataType === CONST_DATE_ANNUAL) {
      // Single pass over all points for the min/max year — avoids the flatMap
      // allocation and the Math.min(...spread) that can overflow the call stack
      // on very large datasets.
      let minYear = Infinity;
      let maxYear = -Infinity;
      for (const item of filteredDataSet) {
        for (const d of item.series) {
          const year = new Date(d.date).getFullYear();
          if (isNaN(year)) continue;
          if (year < minYear) minYear = year;
          if (year > maxYear) maxYear = year;
        }
      }
      if (minYear === Infinity) return [];
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
      // Single pass over all points for the min/max month — avoids the flatMap
      // allocation and the Math.min(...spread) that can overflow the call stack
      // on very large datasets.
      let minTime = Infinity;
      let maxTime = -Infinity;
      for (const item of filteredDataSet) {
        for (const d of item.series) {
          const parsed = parseDate(d.date);
          if (parsed === null) continue;
          const t = parsed.getTime();
          if (t < minTime) minTime = t;
          if (t > maxTime) maxTime = t;
        }
      }
      if (minTime === Infinity) return [];
      const minMonth = new Date(minTime);
      const maxMonth = new Date(maxTime);
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
      // Single pass: dedupe into a Set directly instead of flatMap + new Set.
      const values = new Set<number>();
      for (const item of filteredDataSet) {
        for (const d of item.series) {
          const n = Number(d.date);
          if (!isNaN(n)) values.add(n);
        }
      }
      return Array.from(values).sort((a, b) => a - b);
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

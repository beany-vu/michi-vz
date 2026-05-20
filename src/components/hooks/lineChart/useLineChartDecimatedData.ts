import { useMemo } from "react";
import { DataPoint, LineChartDataItem } from "../../../types/data";
import { SeriesRun } from "./useLineChartGeometry";
import { lttb } from "./lttb";

interface UseLineChartDecimatedDataResult {
  drawData: LineChartDataItem[];
}

// Clamp `n` into [lo, hi].
const clamp = (n: number, lo: number, hi: number): number => Math.min(Math.max(n, lo), hi);

// useLineChartDecimatedData prepares the data the LineChart Canvas renderer
// actually draws. For large series, drawing every point is wasteful — there are
// far more points than pixels — so each series is downsampled with LTTB to
// roughly screen resolution before rendering.
//
// Decimation is per certainty run, not per series: a series is first split by
// `getRuns` (certain vs. uncertain stretches, each its own <path> / dash style),
// each run is decimated independently, then the runs are rejoined. Adjacent runs
// share their boundary point, so when concatenating we drop the duplicated first
// point of every run after the first.
//
// `enabled` is the opt-in switch. When false the hook returns `filteredDataSet`
// by reference and does no work, so the default SVG render path is provably
// unchanged. The whole computation is memoized on its inputs.
export default function useLineChartDecimatedData(
  filteredDataSet: LineChartDataItem[],
  getRuns: (series: DataPoint[]) => SeriesRun[],
  getPixelX: (d: DataPoint) => number,
  chartWidth: number,
  enabled: boolean
): UseLineChartDecimatedDataResult {
  const drawData = useMemo<LineChartDataItem[]>(() => {
    // Disabled: hand back the exact same reference, no allocation, no work.
    if (!enabled) {
      return filteredDataSet;
    }

    return filteredDataSet.map(item => {
      // Empty series: nothing to decimate, pass the item through untouched.
      if (!item.series || item.series.length === 0) {
        return item;
      }

      const runs = getRuns(item.series);
      const decimatedSeries: DataPoint[] = [];

      runs.forEach((run, runIndex) => {
        const runPoints = run.points;
        let decimatedRun = runPoints;

        if (runPoints.length > 2) {
          const firstPoint = runPoints[0];
          const lastPoint = runPoints[runPoints.length - 1];
          // Pixel width this run occupies. The target point count is ~2 per
          // pixel: enough to keep the line crisp without over-sampling.
          const pixelSpan = Math.abs(getPixelX(lastPoint) - getPixelX(firstPoint));
          const threshold = clamp(Math.round(pixelSpan * 2), 3, runPoints.length);
          decimatedRun = lttb(runPoints, threshold, getPixelX, d => d.value);
        }

        // Adjacent runs share their boundary point (run[i+1].points[0] ===
        // run[i].points[last]); drop the duplicate head of every run but the
        // first so the rejoined series has each point exactly once.
        if (runIndex === 0) {
          decimatedSeries.push(...decimatedRun);
        } else {
          decimatedSeries.push(...decimatedRun.slice(1));
        }
      });

      return {
        label: item.label,
        color: item.color,
        shape: item.shape,
        curve: item.curve,
        series: decimatedSeries,
      };
    });
    // chartWidth is kept in the dependency list as an explicit invalidation
    // trigger: when the plot resizes, recompute even if getPixelX is referentially
    // stale. It is intentionally not read directly inside the memo body.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredDataSet, getRuns, getPixelX, chartWidth, enabled]);

  return { drawData };
}

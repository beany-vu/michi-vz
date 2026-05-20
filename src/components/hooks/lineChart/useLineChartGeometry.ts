import { useCallback, useMemo } from "react";
import * as d3 from "d3";
import { DataPoint } from "../../../types/data";
import { getPathLengthAtX } from "./lineChartUtils";

interface UseLineChartGeometryArgs {
  dataSet: { label: string; color: string; series: DataPoint[] }[];
  xAxisDataType: "number" | "date_annual" | "date_monthly";
  xScale: d3.ScaleLinear<number, number> | d3.ScaleTime<number, number>;
  yScale: d3.ScaleLinear<number, number>;
}

export interface SeriesRun {
  points: DataPoint[];
  certain: boolean;
}

export function useLineChartGeometry({
  dataSet,
  xAxisDataType,
  xScale,
  yScale,
}: UseLineChartGeometryArgs) {
  // Get Y value at X
  const getYValueAtX = useCallback((series: DataPoint[], x: number | Date): number | undefined => {
    if (x instanceof Date) {
      const dataPoint = series.find(d => new Date(d.date).getTime() === x.getTime());
      return dataPoint ? dataPoint.value : undefined;
    }
    const dataPoint = series.find(d => Number(d.date) === x);
    return dataPoint ? dataPoint.value : undefined;
  }, []);

  // D3 line generator
  const line = useCallback(
    ({ d, curve }: { d: Iterable<DataPoint>; curve: string }) => {
      return d3
        .line<DataPoint>()
        .x(d => {
          if (xAxisDataType === "number") {
            return xScale(Number(d.date));
          } else if (xAxisDataType === "date_annual") {
            return xScale(new Date(`${d.date}-01-01`));
          } else {
            return xScale(new Date(d.date));
          }
        })
        .y(d => yScale(d.value))
        .curve(d3?.[curve] ?? d3.curveBumpX)(d);
    },
    [xScale, yScale, xAxisDataType]
  );

  // Split a series into contiguous runs of same certainty.
  // Each run is rendered as a single <path> with a constant stroke-dasharray:
  // certain runs are solid, uncertain runs use a 4,4 dash pattern.
  // Adjacent runs share their boundary point so the visual line stays continuous.
  // Avoids the layout-blocking SVG calls (getTotalLength / getPointAtLength)
  // the previous implementation made per data point on every render.
  const getRuns = useCallback((series: DataPoint[]): SeriesRun[] => {
    if (!series || series.length === 0) return [];
    if (series.length === 1) return [{ points: [series[0]], certain: true }];

    const runs: SeriesRun[] = [];
    // The certainty between point i-1 and point i is determined by series[i].certainty.
    // Start the first run at series[0]; its successor (i=1) decides the run's certainty.
    let runStart = 0;
    let runCertain = !!series[1]?.certainty;

    for (let i = 2; i < series.length; i++) {
      const segCertain = !!series[i]?.certainty;
      if (segCertain !== runCertain) {
        runs.push({
          points: series.slice(runStart, i),
          certain: runCertain,
        });
        // Share the boundary point so the next run starts where this one ends.
        runStart = i - 1;
        runCertain = segCertain;
      }
    }
    runs.push({
      points: series.slice(runStart),
      certain: runCertain,
    });
    return runs;
  }, []);

  // Memoized line data
  const lineData = useMemo(
    () =>
      dataSet.map(set => ({
        label: set.label,
        color: set.color,
        points: set.series,
      })),
    [dataSet]
  );

  return {
    getYValueAtX,
    getPathLengthAtX,
    getRuns,
    line,
    lineData,
  };
}

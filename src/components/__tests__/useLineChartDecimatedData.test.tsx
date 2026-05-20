import { renderHook } from "@testing-library/react";
import useLineChartDecimatedData from "../hooks/lineChart/useLineChartDecimatedData";
import { SeriesRun, useLineChartGeometry } from "../hooks/lineChart/useLineChartGeometry";
import { DataPoint, LineChartDataItem } from "../../types/data";
import * as d3 from "d3";

// useLineChartDecimatedData downsamples each series (LTTB, per certainty run)
// to screen resolution for the LineChart Canvas renderer. These tests pin its
// contract: an exact no-op when disabled, a real shrink when enabled, and
// certainty runs that still split correctly after decimation.

// Splits a series into contiguous runs of equal certainty, sharing the
// boundary point between adjacent runs — same logic LineChart uses.
const getRuns = (series: DataPoint[]): SeriesRun[] => {
  if (!series || series.length === 0) return [];
  if (series.length === 1) return [{ points: [series[0]], certain: true }];
  const runs: SeriesRun[] = [];
  let runStart = 0;
  let runCertain = !!series[1]?.certainty;
  for (let i = 2; i < series.length; i++) {
    const segCertain = !!series[i]?.certainty;
    if (segCertain !== runCertain) {
      runs.push({ points: series.slice(runStart, i), certain: runCertain });
      runStart = i - 1;
      runCertain = segCertain;
    }
  }
  runs.push({ points: series.slice(runStart), certain: runCertain });
  return runs;
};

// Identity x-projector: pixel x == date for these synthetic numeric series.
const getPixelX = (d: DataPoint): number => d.date;

const makeSeries = (n: number, certainty = true): DataPoint[] =>
  Array.from({ length: n }, (_, i) => ({
    date: i,
    value: Math.sin(i / 9) * 100 + (i % 5),
    certainty,
  }));

describe("useLineChartDecimatedData", () => {
  test("returns the input by reference when disabled", () => {
    const dataSet: LineChartDataItem[] = [{ label: "A", color: "red", series: makeSeries(5000) }];
    const { result } = renderHook(() =>
      useLineChartDecimatedData(dataSet, getRuns, getPixelX, 800, false)
    );
    expect(result.current.drawData).toBe(dataSet);
  });

  test("shrinks a large series when enabled", () => {
    // 5000 points drawn in an 800px-wide plot: threshold is pixel-driven
    // (~1600), so the output is far smaller than the 5000-point input.
    const series = makeSeries(5000);
    const dataSet: LineChartDataItem[] = [{ label: "A", color: "red", series }];
    const widthPixelX = (d: DataPoint): number => (d.date / 4999) * 800;
    const { result } = renderHook(() =>
      useLineChartDecimatedData(dataSet, getRuns, widthPixelX, 800, true)
    );
    const drawn = result.current.drawData[0];
    expect(drawn.series.length).toBeLessThan(5000);
    expect(drawn.series.length).toBeGreaterThan(0);
    // Cosmetic fields are carried through unchanged.
    expect(drawn.label).toBe("A");
    expect(drawn.color).toBe("red");
  });

  test("decimates relative to pixel width, not point count", () => {
    // 5000 points squeezed into a 300px-wide plot: threshold is driven by
    // pixels (~600), so the output is far smaller than the input.
    const series = makeSeries(5000);
    const dataSet: LineChartDataItem[] = [{ label: "A", color: "red", series }];
    // Narrow projector: map the full date span 0..4999 into 0..300 px.
    const narrowPixelX = (d: DataPoint): number => (d.date / 4999) * 300;
    const { result } = renderHook(() =>
      useLineChartDecimatedData(dataSet, getRuns, narrowPixelX, 300, true)
    );
    const drawn = result.current.drawData[0];
    expect(drawn.series.length).toBeLessThanOrEqual(601);
    expect(drawn.series.length).toBeGreaterThanOrEqual(3);
  });

  test("keeps the first and last point of the whole series", () => {
    const series = makeSeries(3000);
    const dataSet: LineChartDataItem[] = [{ label: "A", color: "red", series }];
    const { result } = renderHook(() =>
      useLineChartDecimatedData(dataSet, getRuns, getPixelX, 400, true)
    );
    const drawn = result.current.drawData[0].series;
    expect(drawn[0]).toBe(series[0]);
    expect(drawn[drawn.length - 1]).toBe(series[series.length - 1]);
  });

  test("returns only original DataPoint objects", () => {
    const series = makeSeries(2000);
    const dataSet: LineChartDataItem[] = [{ label: "A", color: "red", series }];
    const { result } = renderHook(() =>
      useLineChartDecimatedData(dataSet, getRuns, getPixelX, 300, true)
    );
    const originals = new Set(series);
    result.current.drawData[0].series.forEach(p => {
      expect(originals.has(p)).toBe(true);
    });
  });

  test("passes empty series through untouched", () => {
    const empty: LineChartDataItem = { label: "E", color: "green", series: [] };
    const dataSet: LineChartDataItem[] = [empty];
    const { result } = renderHook(() =>
      useLineChartDecimatedData(dataSet, getRuns, getPixelX, 400, true)
    );
    expect(result.current.drawData[0].series).toBe(empty.series);
  });

  test("preserves a certain run + an uncertain run across decimation", () => {
    // First half certain, second half uncertain. getRuns keys certainty off
    // series[i].certainty, so flip starts at index 1500.
    const series: DataPoint[] = Array.from({ length: 3000 }, (_, i) => ({
      date: i,
      value: Math.sin(i / 11) * 80,
      certainty: i < 1500,
    }));
    const runsBefore = getRuns(series);
    expect(runsBefore.length).toBe(2);

    const dataSet: LineChartDataItem[] = [{ label: "A", color: "red", series }];
    const { result } = renderHook(() =>
      useLineChartDecimatedData(dataSet, getRuns, getPixelX, 400, true)
    );
    const drawn = result.current.drawData[0].series;

    // Re-running getRuns on the decimated series must still see both runs.
    const runsAfter = getRuns(drawn);
    expect(runsAfter.length).toBe(2);
    expect(runsAfter[0].certain).toBe(true);
    expect(runsAfter[1].certain).toBe(false);
    // Both runs are non-empty and the rejoined series has no duplicate
    // boundary point (each run after the first dropped its shared head).
    expect(runsAfter[0].points.length).toBeGreaterThan(1);
    expect(runsAfter[1].points.length).toBeGreaterThan(1);
    for (let i = 1; i < drawn.length; i++) {
      expect(drawn[i].date).toBeGreaterThan(drawn[i - 1].date);
    }
  });

  test("works with the real getRuns from useLineChartGeometry", () => {
    // Integration check: the hook accepts the geometry hook's getRuns as-is.
    const series = makeSeries(2500);
    const dataSet: LineChartDataItem[] = [{ label: "A", color: "red", series }];
    const xScale = d3.scaleLinear().domain([0, 2499]).range([0, 500]);
    const yScale = d3.scaleLinear().domain([-100, 100]).range([400, 0]);
    const { result: geom } = renderHook(() =>
      useLineChartGeometry({ dataSet, xAxisDataType: "number", xScale, yScale })
    );
    // Project x through the same 500px-wide scale the chart draws in, so
    // 2500 points decimate down to ~1000.
    const scaledPixelX = (d: DataPoint): number => xScale(d.date) as number;
    const { result } = renderHook(() =>
      useLineChartDecimatedData(dataSet, geom.current.getRuns, scaledPixelX, 500, true)
    );
    expect(result.current.drawData[0].series.length).toBeLessThan(2500);
    expect(result.current.drawData[0].series.length).toBeGreaterThan(0);
  });
});

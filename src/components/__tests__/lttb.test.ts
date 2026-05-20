import { lttb } from "../hooks/lineChart/lttb";
import { DataPoint } from "../../types/data";

// LTTB (Largest-Triangle-Three-Buckets) is the screen-resolution downsampler
// used by the LineChart Canvas renderer. These tests pin its core contract:
// it is a pure function, never invents points, and is a strict no-op for
// series small enough to draw verbatim.
const getX = (d: DataPoint): number => d.date;
const getY = (d: DataPoint): number => d.value;

const makeSeries = (n: number): DataPoint[] =>
  Array.from({ length: n }, (_, i) => ({
    date: i,
    // A noisy sine so buckets have a clear "largest triangle" winner.
    value: Math.sin(i / 5) * 100 + (i % 7),
    certainty: true,
  }));

describe("lttb", () => {
  test("returns the same array reference when length <= threshold", () => {
    const points = makeSeries(50);
    expect(lttb(points, 100, getX, getY)).toBe(points);
    expect(lttb(points, 50, getX, getY)).toBe(points);
  });

  test("returns the same array reference when threshold < 3", () => {
    const points = makeSeries(50);
    expect(lttb(points, 2, getX, getY)).toBe(points);
    expect(lttb(points, 0, getX, getY)).toBe(points);
  });

  test("downsamples a large series to exactly threshold points", () => {
    const points = makeSeries(1000);
    const result = lttb(points, 200, getX, getY);
    expect(result.length).toBe(200);
  });

  test("always keeps the first and last point of the input", () => {
    const points = makeSeries(1000);
    const result = lttb(points, 100, getX, getY);
    expect(result[0]).toBe(points[0]);
    expect(result[result.length - 1]).toBe(points[points.length - 1]);
  });

  test("returns only original DataPoint objects (identity preserved)", () => {
    const points = makeSeries(800);
    const result = lttb(points, 120, getX, getY);
    const originals = new Set(points);
    result.forEach(p => {
      expect(originals.has(p)).toBe(true);
    });
    // certainty / label / code survive because objects are never copied.
    expect(result.every(p => p.certainty === true)).toBe(true);
  });

  test("preserves chronological order of the selected points", () => {
    const points = makeSeries(600);
    const result = lttb(points, 90, getX, getY);
    for (let i = 1; i < result.length; i++) {
      expect(getX(result[i])).toBeGreaterThan(getX(result[i - 1]));
    }
  });

  test("keeps a sharp peak rather than dropping it", () => {
    // Flat baseline with one tall spike in the middle; LTTB must keep the spike.
    const points: DataPoint[] = Array.from({ length: 500 }, (_, i) => ({
      date: i,
      value: i === 250 ? 9999 : 0,
      certainty: true,
    }));
    const result = lttb(points, 20, getX, getY);
    expect(result.some(p => p.value === 9999)).toBe(true);
  });
});

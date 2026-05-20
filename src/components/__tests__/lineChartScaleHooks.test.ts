import { renderHook } from "@testing-library/react";
import useLineChartXscale from "../hooks/lineChart/useLineChartXscale";
import useLineChartYscale from "../hooks/lineChart/useLineChartYscale";
import useLineChartXtickValues from "../hooks/lineChart/useXtickValues";
import { LineChartDataItem } from "../../types/data";

// Characterization tests: these pin the current scale / tick output so the
// single-pass refactor of useLineChartXscale / useLineChartYscale / useXtickValues
// can be verified to preserve behavior exactly.
const dataSet: LineChartDataItem[] = [
  {
    label: "A",
    color: "red",
    series: [
      { date: 2001, value: 10, certainty: true },
      { date: 2002, value: 30, certainty: true },
      { date: 2003, value: 20, certainty: true },
    ],
  },
  {
    label: "B",
    color: "blue",
    series: [
      { date: 2001, value: 5, certainty: true },
      { date: 2002, value: 50, certainty: true },
      { date: 2003, value: 15, certainty: true },
    ],
  },
];

const xMargin = { left: 50, right: 50 };
const yMargin = { top: 50, bottom: 50 };

describe("useLineChartXscale", () => {
  test("number: domain spans data min/max, range respects margins", () => {
    const { result } = renderHook(() => useLineChartXscale(dataSet, 900, xMargin, "number"));
    expect(result.current.domain()).toEqual([2001, 2003]);
    expect(result.current.range()).toEqual([50, 850]);
  });

  test("date_annual: domain spans Jan-1 of the min/max year", () => {
    const { result } = renderHook(() => useLineChartXscale(dataSet, 900, xMargin, "date_annual"));
    const domain = result.current.domain() as Date[];
    expect(domain.map(d => d.getTime())).toEqual([
      new Date("2001-01-01").getTime(),
      new Date("2003-01-01").getTime(),
    ]);
  });

  test("empty data yields a usable scale without throwing", () => {
    const { result } = renderHook(() => useLineChartXscale([], 900, xMargin, "number"));
    expect(result.current.range()).toEqual([50, 850]);
  });
});

describe("useLineChartYscale", () => {
  test("auto domain spans data min/max", () => {
    const { result } = renderHook(() => useLineChartYscale(dataSet, undefined, 480, yMargin));
    expect(result.current.domain()).toEqual([5, 50]);
    expect(result.current.range()).toEqual([430, 50]);
  });

  test("respects an explicit yAxisDomain", () => {
    const { result } = renderHook(() => useLineChartYscale(dataSet, [0, 100], 480, yMargin));
    expect(result.current.domain()).toEqual([0, 100]);
  });
});

describe("useLineChartXtickValues", () => {
  test("number: returns sorted unique numeric x values", () => {
    const { result } = renderHook(() => useLineChartXtickValues(dataSet, "number", 900, xMargin));
    expect(result.current).toEqual([2001, 2002, 2003]);
  });

  test("empty data yields no ticks", () => {
    const { result } = renderHook(() => useLineChartXtickValues([], "number", 900, xMargin));
    expect(result.current).toEqual([]);
  });
});

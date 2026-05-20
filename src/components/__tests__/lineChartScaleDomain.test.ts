import { getXScaleDomain, getYScaleDomain } from "../hooks/lineChart/lineChartUtils";
import { LineChartDataItem } from "../../types/data";

// getXScaleDomain / getYScaleDomain replace the O(N·M) flatMap + double
// min()/max() scans in useLineChartXscale / useLineChartYscale with a single
// pass. They must produce the exact same domain endpoints the d3 scales
// receive today, so the scale refactor stays behavior-preserving.
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

describe("getYScaleDomain", () => {
  test("returns [min, max] across every series value", () => {
    expect(getYScaleDomain(dataSet)).toEqual([5, 50]);
  });

  test("falls back to [0, 1] for empty data", () => {
    expect(getYScaleDomain([])).toEqual([0, 1]);
  });

  test("ignores null and undefined values", () => {
    const withGaps: LineChartDataItem[] = [
      {
        label: "A",
        color: "red",
        series: [
          { date: 2001, value: null as unknown as number, certainty: true },
          { date: 2002, value: 42, certainty: true },
          { date: 2003, value: undefined as unknown as number, certainty: true },
        ],
      },
    ];
    expect(getYScaleDomain(withGaps)).toEqual([42, 42]);
  });
});

describe("getXScaleDomain", () => {
  test("returns numeric [min, max] for xAxisDataType 'number'", () => {
    expect(getXScaleDomain(dataSet, "number")).toEqual([2001, 2003]);
  });

  test("returns epoch [min, max] for 'date_annual'", () => {
    expect(getXScaleDomain(dataSet, "date_annual")).toEqual([
      new Date("2001-01-01").getTime(),
      new Date("2003-01-01").getTime(),
    ]);
  });

  test("falls back to [0, 1] for empty data", () => {
    expect(getXScaleDomain([], "number")).toEqual([0, 1]);
  });
});

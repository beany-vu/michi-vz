import { applyGapDetection, parseAxisUnit } from "./detectGaps";
import { DataPoint } from "../../../types/data";

const pt = (date: number | string, value: number, certainty = true): DataPoint => ({
  date: date as number,
  value,
  certainty,
});

const certaintyOf = (s: DataPoint[]) => s.map(d => d.certainty);
const datesOf = (s: DataPoint[]) => s.map(d => d.date);

describe("parseAxisUnit", () => {
  it("parses number, annual, and monthly into comparable units", () => {
    expect(parseAxisUnit(2018, "number")).toBe(2018);
    expect(parseAxisUnit("2018", "date_annual")).toBe(2018);
    expect(parseAxisUnit(2018, "date_annual")).toBe(2018);
    expect(parseAxisUnit("2020-03", "date_monthly")).toBe(2020 * 12 + 2);
  });

  it("returns NaN for unparseable input", () => {
    expect(Number.isNaN(parseAxisUnit("abc", "number"))).toBe(true);
    expect(Number.isNaN(parseAxisUnit("nope", "date_monthly"))).toBe(true);
  });
});

describe("applyGapDetection", () => {
  it("marks a skipped annual period as a gap on the closing point", () => {
    const s = [pt(2016, 10), pt(2017, 20), pt(2018, 30), pt(2024, 40)];
    const out = applyGapDetection(s, "date_annual");
    expect(certaintyOf(out)).toEqual([true, true, true, false]);
    expect(datesOf(out)).toEqual([2016, 2017, 2018, 2024]);
  });

  it("leaves a contiguous annual series fully certain", () => {
    const s = [pt(2016, 10), pt(2017, 20), pt(2018, 30)];
    expect(certaintyOf(applyGapDetection(s, "date_annual"))).toEqual([true, true, true]);
  });

  it("detects a monthly gap across a year boundary", () => {
    const s = [pt("2019-11", 1), pt("2019-12", 2), pt("2020-03", 3)];
    expect(certaintyOf(applyGapDetection(s, "date_monthly"))).toEqual([true, true, false]);
  });

  it("uses expectedStep for numeric x", () => {
    const s = [pt(0, 1), pt(1, 2), pt(5, 3)];
    expect(certaintyOf(applyGapDetection(s, "number", 1))).toEqual([true, true, false]);
  });

  it("respects an expectedStep override (biennial: delta 2 is not a gap)", () => {
    const s = [pt(2016, 1), pt(2018, 2), pt(2020, 3)];
    expect(certaintyOf(applyGapDetection(s, "date_annual", 2))).toEqual([true, true, true]);
  });

  it("respects an expectedStep override for monthly (quarterly: delta 3 is not a gap)", () => {
    const s = [pt("2020-01", 1), pt("2020-04", 2), pt("2020-07", 3)];
    expect(certaintyOf(applyGapDetection(s, "date_monthly", 3))).toEqual([true, true, true]);
  });

  it("normalizes unsorted input by axis x", () => {
    const s = [pt(2018, 30), pt(2016, 10), pt(2017, 20)];
    expect(datesOf(applyGapDetection(s, "date_annual"))).toEqual([2016, 2017, 2018]);
  });

  it("dedupes equal x keeping the last occurrence", () => {
    const s = [pt(2016, 10), pt(2016, 99), pt(2017, 20)];
    const out = applyGapDetection(s, "date_annual");
    expect(datesOf(out)).toEqual([2016, 2017]);
    expect(out[0].value).toBe(99);
  });

  it("drops invalid x and NaN-value points", () => {
    const s = [
      pt(2016, 10),
      pt("bad", 20),
      { date: 2017, value: NaN, certainty: true } as DataPoint,
      pt(2018, 30),
    ];
    expect(datesOf(applyGapDetection(s, "date_annual"))).toEqual([2016, 2018]);
  });

  it("gap detection overrides an explicit certainty:true", () => {
    const s = [pt(2016, 10), pt(2024, 20, true)];
    expect(certaintyOf(applyGapDetection(s, "date_annual"))).toEqual([true, false]);
  });

  it("never flips an explicit certainty:false to certain", () => {
    const s = [pt(2016, 10), pt(2017, 20, false)];
    expect(certaintyOf(applyGapDetection(s, "date_annual"))).toEqual([true, false]);
  });

  it("no-ops detection for numeric x without expectedStep (still normalizes)", () => {
    const s = [pt(5, 2), pt(0, 1)];
    const out = applyGapDetection(s, "number");
    expect(datesOf(out)).toEqual([0, 5]);
    expect(certaintyOf(out)).toEqual([true, true]);
  });

  it("handles single and empty series", () => {
    expect(applyGapDetection([pt(2016, 10)], "date_annual").length).toBe(1);
    expect(applyGapDetection([], "date_annual")).toEqual([]);
  });
});

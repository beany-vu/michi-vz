import { parseXValue } from "../hooks/lineChart/lineChartUtils";

// parseXValue centralizes the x-value parsing currently duplicated across
// useLineChartXscale / useLineChartGeometry. It must reproduce that logic
// exactly so the single-pass scale refactor stays behavior-preserving.
describe("parseXValue", () => {
  test("returns the numeric value for xAxisDataType 'number'", () => {
    expect(parseXValue("2002", "number")).toBe(2002);
    expect(parseXValue(2002, "number")).toBe(2002);
  });

  test("returns the January-1st Date of the year for 'date_annual'", () => {
    const result = parseXValue("2002", "date_annual");
    expect(result).toBeInstanceOf(Date);
    expect((result as Date).getTime()).toBe(new Date("2002-01-01").getTime());
  });

  test("returns the parsed Date for 'date_monthly'", () => {
    const result = parseXValue("2002-03-01", "date_monthly");
    expect(result).toBeInstanceOf(Date);
    expect((result as Date).getTime()).toBe(new Date("2002-03-01").getTime());
  });
});

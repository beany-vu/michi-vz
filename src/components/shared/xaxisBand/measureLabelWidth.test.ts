import { measureLabelWidth } from "./measureLabelWidth";

describe("measureLabelWidth", () => {
  test("returns a positive number for a non-empty label", () => {
    const width = measureLabelWidth("01-2023");
    expect(width).toBeGreaterThan(0);
  });

  test("longer labels measure wider than shorter labels", () => {
    expect(measureLabelWidth("01-2023-extra")).toBeGreaterThan(measureLabelWidth("01"));
  });

  test("returns 0 for empty string", () => {
    expect(measureLabelWidth("")).toBe(0);
  });
});

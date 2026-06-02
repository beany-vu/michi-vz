import React from "react";
import { waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import AreaChart from "../AreaChart";
import { customRender } from "./test-utils";
// AreaChart consumes wide stacked rows ({ date, [key]: number }); cast to satisfy
// the series prop the same way the stories do.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const wide = (rows: Array<Record<string, number>>): any[] => rows as any[];

const props = {
  keys: ["A", "B"],
  width: 900,
  height: 480,
  margin: { top: 50, right: 50, bottom: 50, left: 50 },
  xAxisDataType: "number" as const,
};

const threeRows = wide([
  { date: 0, A: 10, B: 5 },
  { date: 1, A: 20, B: 15 },
  { date: 2, A: 15, B: 25 },
]);

const areaDs = (container: HTMLElement): string[] =>
  Array.from(container.querySelectorAll("path[data-label]")).map(p => p.getAttribute("d") ?? "");

describe("AreaChart curve interpolation", () => {
  it("uses a monotone curve (cubic) by default for 3+ points", async () => {
    const { container, cleanup } = customRender(<AreaChart series={threeRows} {...props} />);
    await waitFor(() => expect(container.querySelector("path[data-label]")).toBeTruthy());
    expect(areaDs(container).some(d => /C/.test(d))).toBe(true);
    cleanup();
  });

  it("honors an explicit curveLinear override (no cubic in any area path)", async () => {
    const { container, cleanup } = customRender(
      <AreaChart series={threeRows} curve="curveLinear" {...props} />
    );
    await waitFor(() => expect(container.querySelector("path[data-label]")).toBeTruthy());
    expect(areaDs(container).every(d => !/C/.test(d))).toBe(true);
    cleanup();
  });
});

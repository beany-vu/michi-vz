import React from "react";
import { waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import RangeChart from "../RangeChart";
import { customRender } from "./test-utils";

const rangeSeries = (n: number) =>
  Array.from({ length: n }, (_, i) => ({
    date: 2000 + i,
    valueMin: 10 + i * 5,
    valueMax: 30 + i * 5,
    valueMedium: 20 + i * 5,
    certainty: true,
  }));

const props = {
  width: 900,
  height: 480,
  margin: { top: 50, right: 50, bottom: 50, left: 50 },
  xAxisDataType: "number" as const,
};

const firstAreaD = (container: HTMLElement): string =>
  container.querySelector("path.area")?.getAttribute("d") ?? "";

describe("RangeChart curve interpolation", () => {
  it("uses a monotone curve (cubic) for a 3+-point band by default", async () => {
    const { container, cleanup } = customRender(
      <RangeChart dataSet={[{ label: "A", color: "orange", series: rangeSeries(3) }]} {...props} />
    );
    await waitFor(() => expect(container.querySelector("path.area")).toBeTruthy());
    expect(firstAreaD(container)).toMatch(/C/);
    cleanup();
  });

  it("draws straight band edges (no cubic) for a 2-point band", async () => {
    const { container, cleanup } = customRender(
      <RangeChart dataSet={[{ label: "A", color: "orange", series: rangeSeries(2) }]} {...props} />
    );
    await waitFor(() => expect(container.querySelector("path.area")).toBeTruthy());
    expect(firstAreaD(container)).not.toMatch(/C/);
    cleanup();
  });

  it("honors an explicit curveLinear override (no cubic for 3+ points)", async () => {
    const { container, cleanup } = customRender(
      <RangeChart
        dataSet={[{ label: "A", color: "orange", series: rangeSeries(3) }]}
        curve="curveLinear"
        {...props}
      />
    );
    await waitFor(() => expect(container.querySelector("path.area")).toBeTruthy());
    expect(firstAreaD(container)).not.toMatch(/C/);
    cleanup();
  });
});

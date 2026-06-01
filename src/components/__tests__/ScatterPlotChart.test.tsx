import React from "react";
import { fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import ScatterPlotChart from "../ScatterPlotChart";
import { customRender } from "./test-utils";

const baseProps = {
  width: 900,
  height: 480,
  margin: { top: 50, right: 50, bottom: 50, left: 50 },
  title: "Scatter",
  xAxisDataType: "number" as const,
  xAxisDomain: [0, 100] as [number, number],
  yAxisDomain: [0, 100] as [number, number],
  showCrosshair: true,
  crosshairLabels: true,
};

// Pin a point by clicking its group (idempotent — only pins once), then return
// the badge <g> for an axis.
const pinAndGetBadge = (container: HTMLElement, axis: "x" | "y") => {
  const point = container.querySelector(".data-point") as SVGGElement;
  if (!container.querySelector("[data-crosshair-badge]")) {
    fireEvent.click(point);
  }
  return container.querySelector(`[data-crosshair-badge="${axis}"]`) as SVGGElement | null;
};

const transformOf = (el: SVGGElement | null) => el?.getAttribute("transform") ?? "";

describe("ScatterPlotChart crosshair badge flip", () => {
  test("mid-chart point keeps both badges on their default axes", () => {
    const { container } = customRender(
      <ScatterPlotChart {...baseProps} dataSet={[{ label: "A", x: 50, y: 50, d: 10 }]} />
    );
    expect(transformOf(pinAndGetBadge(container, "y"))).toContain("translate(50,");
    expect(transformOf(pinAndGetBadge(container, "x"))).toMatch(/,\s*430\)/);
  });

  test("point near the left axis flips the Y badge to the right axis", () => {
    const { container } = customRender(
      <ScatterPlotChart {...baseProps} dataSet={[{ label: "A", x: 0, y: 50, d: 10 }]} />
    );
    expect(transformOf(pinAndGetBadge(container, "y"))).toContain("translate(850,");
  });

  test("point near the bottom axis flips the X badge to the top", () => {
    const { container } = customRender(
      <ScatterPlotChart {...baseProps} dataSet={[{ label: "A", x: 50, y: 0, d: 10 }]} />
    );
    expect(transformOf(pinAndGetBadge(container, "x"))).toMatch(/,\s*50\)/);
  });

  test("crosshair badge renders after the data points so it paints on top", () => {
    const { container } = customRender(
      <ScatterPlotChart {...baseProps} dataSet={[{ label: "A", x: 50, y: 50, d: 10 }]} />
    );
    const badge = pinAndGetBadge(container, "y") as SVGGElement;
    const dataPoint = container.querySelector(".data-point") as SVGGElement;
    // In SVG, later elements paint on top — the badge must follow the data point.
    expect(
      dataPoint.compareDocumentPosition(badge) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });
});

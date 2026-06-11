import React from "react";
import { waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import ComparableHorizontalBarChart from "../ComparableHorizontalBarChart";
import { customRender } from "./test-utils";

describe("ComparableHorizontalBarChart", () => {
  jest.setTimeout(10000);

  const baseProps = {
    width: 900,
    height: 480,
    margin: { top: 50, right: 50, bottom: 50, left: 50 },
    xAxisDataType: "number" as const,
    // Wide domain so a 0.01 value maps to a sub-pixel bar length and the floor
    // is what we actually observe.
    xAxisPredefinedDomain: [0, 1000],
  };

  // Both values are sub-pixel against the [0, 1000] domain, so the rendered bar
  // length collapses to the minimum width on both sub-bars.
  const tinyData = [{ label: "Alpha", valueBased: 0.01, valueCompared: 0.01 }];

  test("minBarWidth: a sub-pixel bar length is floored to the default 5px", async () => {
    const { container } = customRender(
      <ComparableHorizontalBarChart dataSet={tinyData} {...baseProps} />
    );

    await waitFor(() => expect(container.querySelector("rect.value-based")).toBeInTheDocument(), {
      timeout: 5000,
    });

    const based = container.querySelector("rect.value-based") as SVGRectElement;
    const compared = container.querySelector("rect.value-compared") as SVGRectElement;
    expect(parseFloat(based.getAttribute("width") as string)).toBe(5);
    expect(parseFloat(compared.getAttribute("width") as string)).toBe(5);
  });

  test("minBarWidth: a custom value overrides the default floor", async () => {
    const { container } = customRender(
      <ComparableHorizontalBarChart dataSet={tinyData} {...baseProps} minBarWidth={9} />
    );

    await waitFor(() => expect(container.querySelector("rect.value-based")).toBeInTheDocument(), {
      timeout: 5000,
    });

    const based = container.querySelector("rect.value-based") as SVGRectElement;
    expect(parseFloat(based.getAttribute("width") as string)).toBe(9);
  });
});

import React from "react";
import { screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import LineChart from "../LineChart";
import { customRender, sampleChartData, defaultChartProps } from "./test-utils";

// Transform sample data to match LineChart expected structure
const transformedData = sampleChartData.map(item => ({
  label: item.seriesKey,
  color: item.seriesKey === "Africa" ? "orange" : item.seriesKey === "Non-LDC" ? "purple" : "blue",
  series: item.series.map(s => ({
    date: parseInt(s.date, 10),
    value: parseInt((s as Record<string, string>)[item.seriesKey] || "0"),
    certainty: true,
  })),
}));

describe("LineChart", () => {
  test.skip("renders with title", async () => {
    const title = "Test Line Chart";
    const { container } = customRender(
      <LineChart
        dataSet={transformedData}
        {...defaultChartProps}
        title={title}
        xAxisDataType="date_annual"
        onHighlightItem={() => {}}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(title)).toBeInTheDocument();
    });

    // Check for SVG element
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();

    // Check for line paths
    const paths = container.querySelectorAll("path.line");
    expect(paths.length).toBeGreaterThan(0);
  });

  test.skip("renders with custom colors", async () => {
    const colorsMapping = {
      Africa: "red",
      "Non-LDC": "blue",
      Sudan: "green",
    };

    const { container } = customRender(
      <LineChart
        dataSet={transformedData}
        {...defaultChartProps}
        xAxisDataType="date_annual"
        onHighlightItem={() => {}}
      />,
      {
        providerProps: {
          colorsMapping,
        },
      }
    );

    await waitFor(() => {
      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });

    // This is a basic test; in a real scenario you might want to check
    // that the colors are actually applied to the right elements
  });

  test("handles empty data", async () => {
    // Just test that it doesn't throw with empty data
    expect(() => {
      customRender(
        <LineChart
          dataSet={[]}
          {...defaultChartProps}
          xAxisDataType="date_annual"
          onHighlightItem={() => {}}
        />
      );
    }).not.toThrow();
  });

  test("hides data points by default (showDataPoints defaults to false)", async () => {
    const { container } = customRender(
      <LineChart
        dataSet={transformedData}
        {...defaultChartProps}
        xAxisDataType="date_annual"
        onHighlightItem={() => {}}
      />
    );

    await waitFor(() => {
      expect(container.querySelector("svg")).toBeInTheDocument();
    });

    expect(container.querySelectorAll(".data-point").length).toBe(0);
  });

  test("renders data points when showDataPoints={true}", async () => {
    const { container } = customRender(
      <LineChart
        dataSet={transformedData}
        {...defaultChartProps}
        xAxisDataType="date_annual"
        onHighlightItem={() => {}}
        showDataPoints={true}
      />
    );

    await waitFor(() => {
      expect(container.querySelectorAll(".data-point").length).toBeGreaterThan(0);
    });
  });

  test.skip("renders with tooltip", async () => {
    const { container } = customRender(
      <LineChart
        dataSet={transformedData}
        {...defaultChartProps}
        xAxisDataType="date_annual"
        onHighlightItem={() => {}}
      />
    );

    await waitFor(() => {
      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });

    // Check for tooltip container
    // Note: This might not be visible until interaction, so just check if the element exists
    const tooltipContainer =
      container.querySelector(".tooltip") || container.querySelector("[data-testid='tooltip']");

    // This check might need adjusting based on your tooltip implementation
    expect(tooltipContainer).toBeDefined();
  });

  // Regression: in canvas mode the Canvas renderer owns the whole tooltip
  // lifecycle, including click-to-pin. The SVG renderer's 400ms grace-hide
  // timer must NOT run there — its hide callback only consults the SVG
  // renderer's sticky flag, so it would hide a canvas-pinned tooltip ~400ms
  // after the cursor merely crossed the tooltip.
  test("canvas renderer: SVG grace timer does not hide the tooltip", async () => {
    const { container } = customRender(
      <LineChart
        dataSet={transformedData}
        {...defaultChartProps}
        xAxisDataType="date_annual"
        renderer="canvas"
        onHighlightItem={() => {}}
      />
    );

    await waitFor(() => expect(container.querySelector(".tooltip")).toBeInTheDocument());
    const tooltip = container.querySelector(".tooltip") as HTMLElement;

    // Tooltip shown, then the cursor leaves it (as a real mouse does — the
    // tooltip sits only a few px from the cursor and is crossed constantly).
    tooltip.style.visibility = "visible";
    tooltip.dispatchEvent(new MouseEvent("mouseleave"));
    await new Promise(resolve => setTimeout(resolve, 500));

    expect(tooltip.style.visibility).toBe("visible");
  });

  // Contrast case: proves the test above is meaningful — in svg mode the same
  // grace timer IS active and does hide the tooltip after mouseleave.
  test("svg renderer: grace timer hides the tooltip on mouseleave", async () => {
    const { container } = customRender(
      <LineChart
        dataSet={transformedData}
        {...defaultChartProps}
        xAxisDataType="date_annual"
        renderer="svg"
        onHighlightItem={() => {}}
      />
    );

    await waitFor(() => expect(container.querySelector(".tooltip")).toBeInTheDocument());
    const tooltip = container.querySelector(".tooltip") as HTMLElement;

    tooltip.style.visibility = "visible";
    tooltip.dispatchEvent(new MouseEvent("mouseleave"));
    await new Promise(resolve => setTimeout(resolve, 500));

    expect(tooltip.style.visibility).toBe("hidden");
  });
});

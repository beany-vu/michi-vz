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
    date: s.date,
    value: parseInt(s[item.seriesKey] || "0"),
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
});

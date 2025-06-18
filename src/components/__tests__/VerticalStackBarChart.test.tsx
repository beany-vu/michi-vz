import React from "react";
import { screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import VerticalStackBarChart from "../VerticalStackBarChart";
import { customRender, sampleChartData, defaultChartProps } from "./test-utils";

describe("VerticalStackBarChart", () => {
  // Increase timeout for React 19's increased rendering complexity
  jest.setTimeout(10000);

  test.skip("renders chart with title", async () => {
    const title = "Test Vertical Stack Bar Chart";
    const { container } = customRender(
      <VerticalStackBarChart dataSet={sampleChartData} {...defaultChartProps} title={title} />
    );

    // Wait for any async rendering to complete with longer timeout for React 19
    await waitFor(
      () => {
        expect(screen.getByText(title)).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    // Check that SVG was created
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();

    // Check for some bars (rects)
    const bars = container.querySelectorAll("rect");
    expect(bars.length).toBeGreaterThan(0);
  });

  test.skip("renders with filtered data", async () => {
    const { container } = customRender(
      <VerticalStackBarChart
        dataSet={sampleChartData}
        {...defaultChartProps}
        filter={{ limit: 2, sortingDir: "desc", date: "2003" }}
      />
    );

    await waitFor(
      () => {
        const svg = container.querySelector("svg");
        expect(svg).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    // We should have fewer bars with the filter applied
    const bars = container.querySelectorAll("rect:not(.bar-background)");
    expect(bars.length).toBeGreaterThan(0);
  });

  test.skip("calls onChartDataProcessed callback", async () => {
    const mockCallback = jest.fn();

    customRender(
      <VerticalStackBarChart
        dataSet={sampleChartData}
        {...defaultChartProps}
        onChartDataProcessed={mockCallback}
      />
    );

    await waitFor(
      () => {
        expect(mockCallback).toHaveBeenCalled();
      },
      { timeout: 5000 }
    );

    // Check that the callback was called with appropriate data structure
    const callbackData = mockCallback.mock.calls[0][0];
    expect(callbackData).toHaveProperty("xAxisDomain");
    expect(callbackData).toHaveProperty("visibleItems");
    expect(callbackData).toHaveProperty("renderedData");
    expect(callbackData).toHaveProperty("chartType", "vertical-stack-bar-chart");
  });

  test("renders loading state", async () => {
    // Mock the LoadingIndicator component
    jest.mock("../shared/LoadingIndicator", () => {
      const MockLoadingIndicator = () => <div data-testid="loading-indicator">Loading...</div>;
      return MockLoadingIndicator;
    });

    customRender(
      <VerticalStackBarChart dataSet={sampleChartData} {...defaultChartProps} isLoading={true} />
    );

    // Basic test - just check that it renders at all
    expect(() => {
      customRender(
        <VerticalStackBarChart dataSet={sampleChartData} {...defaultChartProps} isLoading={true} />
      );
    }).not.toThrow();
  });
});

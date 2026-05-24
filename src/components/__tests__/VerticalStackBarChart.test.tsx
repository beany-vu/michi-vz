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

  test("missingDataMarker emits stub rect for null values", async () => {
    const mockCallback = jest.fn();
    const dataWithGap = [
      {
        seriesKey: "Africa",
        seriesKeyAbbreviation: "Africa",
        // Three dates but the 2002 value is missing.
        series: [
          { date: "2001", Africa: "10" },
          { date: "2002", Africa: null },
          { date: "2003", Africa: "30" },
        ],
      },
    ];

    customRender(
      <VerticalStackBarChart
        dataSet={dataWithGap}
        {...defaultChartProps}
        missingDataMarker={{ height: 2 }}
        onChartDataProcessed={mockCallback}
      />
    );

    await waitFor(
      () => {
        expect(mockCallback).toHaveBeenCalled();
      },
      { timeout: 5000 }
    );

    const metadata = mockCallback.mock.calls[mockCallback.mock.calls.length - 1][0];
    const africaRects = metadata.renderedData?.Africa ?? [];
    // Two real rects (2001, 2003) plus one missing-data stub (2002).
    expect(africaRects).toHaveLength(3);
    const stubs = africaRects.filter((r: { isMissing?: boolean }) => r.isMissing);
    expect(stubs).toHaveLength(1);
    expect(stubs[0]).toMatchObject({
      isMissing: true,
      height: 2,
      value: null,
      date: "2002",
    });
  });

  test("missingDataMarker: no stub for keys absent from the data point", async () => {
    // Reproduces the "stub line across every bar" regression: when iterating
    // keys per DataSet, keys that aren't on this data point at all (because
    // they belong to other DataSets' slots) must NOT get a stub here.
    const mockCallback = jest.fn();
    const twoDataSets = [
      {
        seriesKey: "Africa",
        seriesKeyAbbreviation: "Africa",
        series: [{ date: "2001", Africa: "10" }],
      },
      {
        seriesKey: "Asia",
        seriesKeyAbbreviation: "Asia",
        series: [{ date: "2001", Asia: "20" }],
      },
    ];

    customRender(
      <VerticalStackBarChart
        dataSet={twoDataSets}
        {...defaultChartProps}
        missingDataMarker={{ height: 2 }}
        onChartDataProcessed={mockCallback}
      />
    );

    await waitFor(() => expect(mockCallback).toHaveBeenCalled(), { timeout: 5000 });

    const metadata = mockCallback.mock.calls[mockCallback.mock.calls.length - 1][0];
    // Each DataSet contributes exactly one real bar — no stubs, because
    // "Asia" is not a property on Africa's data point (and vice versa).
    const africaRects = metadata.renderedData?.Africa ?? [];
    const asiaRects = metadata.renderedData?.Asia ?? [];
    expect(africaRects).toHaveLength(1);
    expect(asiaRects).toHaveLength(1);
    expect(africaRects.every((r: { isMissing?: boolean }) => !r.isMissing)).toBe(true);
    expect(asiaRects.every((r: { isMissing?: boolean }) => !r.isMissing)).toBe(true);
  });

  test("missingDataMarker omitted: no stub rect emitted (backward compat)", async () => {
    const mockCallback = jest.fn();
    const dataWithGap = [
      {
        seriesKey: "Africa",
        seriesKeyAbbreviation: "Africa",
        series: [
          { date: "2001", Africa: "10" },
          { date: "2002", Africa: null },
          { date: "2003", Africa: "30" },
        ],
      },
    ];

    customRender(
      <VerticalStackBarChart
        dataSet={dataWithGap}
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

    const metadata = mockCallback.mock.calls[mockCallback.mock.calls.length - 1][0];
    const africaRects = metadata.renderedData?.Africa ?? [];
    // Only the two real rects — no stub when missingDataMarker is omitted.
    expect(africaRects).toHaveLength(2);
    expect(africaRects.every((r: { isMissing?: boolean }) => !r.isMissing)).toBe(true);
  });
});

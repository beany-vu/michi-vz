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

  // A single bar whose stack mixes one large value with a tiny one. The tiny
  // segment's natural pixel height is well under a pixel, so without a floor it
  // disappears. `Big` dwarfs `Tiny` to force `Tiny` sub-pixel for any sane plot
  // height.
  const stackWithTiny = [
    {
      seriesKey: "Africa",
      seriesKeyAbbreviation: "Africa",
      series: [{ date: "2001", Big: "1000", Tiny: "0.5" }],
    },
  ];

  test("minBarHeight: a sub-pixel segment is floored to the default 15px", async () => {
    const mockCallback = jest.fn();

    customRender(
      <VerticalStackBarChart
        dataSet={stackWithTiny}
        {...defaultChartProps}
        onChartDataProcessed={mockCallback}
      />
    );

    await waitFor(() => expect(mockCallback).toHaveBeenCalled(), { timeout: 5000 });

    const metadata = mockCallback.mock.calls[mockCallback.mock.calls.length - 1][0];
    const tinyRect = metadata.renderedData?.Tiny?.[0];
    const bigRect = metadata.renderedData?.Big?.[0];
    // Tiny is floored up to the default 15px so it stays visible...
    expect(tinyRect.height).toBe(15);
    // ...while the large segment keeps its natural (much larger) height.
    expect(bigRect.height).toBeGreaterThan(15);
  });

  test("minBarWidth: a sub-pixel bar thickness is floored to the default 5px", async () => {
    const mockCallback = jest.fn();
    // A narrow chart with many dates squeezes each band's width below the floor,
    // so the bar thickness (width) clamps to the default minBarWidth.
    const denseDates = Array.from({ length: 10 }, (_, i) => ({
      date: String(2000 + i),
      V: "10",
    }));
    const denseData = [{ seriesKey: "V", seriesKeyAbbreviation: "V", series: denseDates }];

    customRender(
      <VerticalStackBarChart
        dataSet={denseData}
        {...defaultChartProps}
        width={120}
        onChartDataProcessed={mockCallback}
      />
    );

    await waitFor(() => expect(mockCallback).toHaveBeenCalled(), { timeout: 5000 });

    const metadata = mockCallback.mock.calls[mockCallback.mock.calls.length - 1][0];
    // groupWidth - 4 is sub-pixel here, so width clamps to the 5px default.
    expect(metadata.renderedData?.V?.[0].width).toBe(5);
  });

  test("minBarHeight: a custom value overrides the default floor", async () => {
    const mockCallback = jest.fn();

    customRender(
      <VerticalStackBarChart
        dataSet={stackWithTiny}
        {...defaultChartProps}
        minBarHeight={8}
        onChartDataProcessed={mockCallback}
      />
    );

    await waitFor(() => expect(mockCallback).toHaveBeenCalled(), { timeout: 5000 });

    const metadata = mockCallback.mock.calls[mockCallback.mock.calls.length - 1][0];
    expect(metadata.renderedData?.Tiny?.[0].height).toBe(8);
  });

  test("minBarHeight: a literal zero value is not floored (no phantom bar)", async () => {
    const mockCallback = jest.fn();
    const stackWithZero = [
      {
        seriesKey: "Africa",
        seriesKeyAbbreviation: "Africa",
        series: [{ date: "2001", Big: "1000", Zero: "0" }],
      },
    ];

    customRender(
      <VerticalStackBarChart
        dataSet={stackWithZero}
        {...defaultChartProps}
        minBarHeight={5}
        onChartDataProcessed={mockCallback}
      />
    );

    await waitFor(() => expect(mockCallback).toHaveBeenCalled(), { timeout: 5000 });

    const metadata = mockCallback.mock.calls[mockCallback.mock.calls.length - 1][0];
    // By default a real 0 stays invisible (minBarHeightZero defaults to 0) —
    // the 15px `minBarHeight` floor never applies to a zero value.
    expect(metadata.renderedData?.Zero?.[0].height).toBe(0);
  });

  test("minBarHeightZero: a literal zero gets a small stub when opted in", async () => {
    const mockCallback = jest.fn();
    const stackWithZero = [
      {
        seriesKey: "Africa",
        seriesKeyAbbreviation: "Africa",
        series: [{ date: "2001", Big: "1000", Zero: "0" }],
      },
    ];

    customRender(
      <VerticalStackBarChart
        dataSet={stackWithZero}
        {...defaultChartProps}
        minBarHeight={15}
        minBarHeightZero={3}
        onChartDataProcessed={mockCallback}
      />
    );

    await waitFor(() => expect(mockCallback).toHaveBeenCalled(), { timeout: 5000 });

    const metadata = mockCallback.mock.calls[mockCallback.mock.calls.length - 1][0];
    // Opted in: the zero segment gets a small 3px stub (distinct from the 15px
    // real-value floor), while the real value keeps its own (larger) floor.
    expect(metadata.renderedData?.Zero?.[0].height).toBe(3);
    expect(metadata.renderedData?.Big?.[0].height).toBeGreaterThanOrEqual(15);
  });

  test("minBarHeight: floored segments stack without overlapping", async () => {
    const mockCallback = jest.fn();
    // Two tiny segments plus one big one: both tiny segments get floored, so the
    // running pixel cursor must push them apart instead of letting them overlap.
    const stackTwoTiny = [
      {
        seriesKey: "Africa",
        seriesKeyAbbreviation: "Africa",
        series: [{ date: "2001", Big: "1000", A: "0.5", B: "0.5" }],
      },
    ];

    customRender(
      <VerticalStackBarChart
        dataSet={stackTwoTiny}
        {...defaultChartProps}
        minBarHeight={3}
        onChartDataProcessed={mockCallback}
      />
    );

    await waitFor(() => expect(mockCallback).toHaveBeenCalled(), { timeout: 5000 });

    const metadata = mockCallback.mock.calls[mockCallback.mock.calls.length - 1][0];
    const rects = [
      metadata.renderedData?.Big?.[0],
      metadata.renderedData?.A?.[0],
      metadata.renderedData?.B?.[0],
    ].sort((p, q) => p.y - q.y); // top-to-bottom on screen

    // Adjacent segments touch but never overlap: each rect's bottom edge sits at
    // or above the next rect's top edge (small float tolerance).
    for (let i = 0; i < rects.length - 1; i++) {
      const bottom = rects[i].y + rects[i].height;
      expect(bottom).toBeLessThanOrEqual(rects[i + 1].y + 0.01);
    }
  });

  // --- keys / keysOrder: explicit, fixed stacking order ----------------------
  // One bar (single date) with three keys. The natural property insertion order
  // is [C, B, A] — deliberately NOT value-sorted (C is the largest) — so the
  // default "follow the data" behavior puts the smallest key at the bottom.
  // `metadata.visibleItems` reports keys in the chart's resolved order, so it
  // reads the stacking order directly without depending on SVG/canvas geometry.
  const singleStack = [
    {
      seriesKey: "Region",
      seriesKeyAbbreviation: "R",
      series: [{ date: "2001", C: "300", B: "200", A: "100" }],
    },
  ];

  test("keys: an explicit order is honored (default topToBottom)", async () => {
    const mockCallback = jest.fn();
    customRender(
      <VerticalStackBarChart
        dataSet={singleStack}
        {...defaultChartProps}
        keys={["A", "B", "C"]}
        onChartDataProcessed={mockCallback}
      />
    );

    await waitFor(() => expect(mockCallback).toHaveBeenCalled(), { timeout: 5000 });

    const metadata = mockCallback.mock.calls[mockCallback.mock.calls.length - 1][0];
    // allKeys follows the prop order, overriding the natural [C, B, A] data order.
    expect(metadata.visibleItems).toEqual(["A", "B", "C"]);
  });

  test("keysOrder='bottomToTop': keys[0] anchors the bottom (largest-at-bottom)", async () => {
    const mockCallback = jest.fn();
    // The real consumer pattern: keys sorted DESCENDING (largest first) +
    // bottomToTop, so the largest category (C) sits on the zero line and the
    // order is fixed regardless of the natural data order.
    customRender(
      <VerticalStackBarChart
        dataSet={singleStack}
        {...defaultChartProps}
        keys={["C", "B", "A"]}
        keysOrder="bottomToTop"
        onChartDataProcessed={mockCallback}
      />
    );

    await waitFor(() => expect(mockCallback).toHaveBeenCalled(), { timeout: 5000 });

    const metadata = mockCallback.mock.calls[mockCallback.mock.calls.length - 1][0];
    // bottomToTop reverses the prop order for allKeys / legend...
    expect(metadata.visibleItems).toEqual(["A", "B", "C"]);
    // ...and the largest key (C) is the bottom-most rendered segment (largest y,
    // since SVG y grows downward).
    const positions = metadata.visibleItems.map((k: string) => ({
      k,
      y: metadata.renderedData[k][0].y,
    }));
    const bottom = positions.reduce(
      (lo: { k: string; y: number }, cur: { k: string; y: number }) => (cur.y > lo.y ? cur : lo)
    );
    expect(bottom.k).toBe("C");
  });

  test("keys: a partial list keeps prop order first, then appends omitted data keys", async () => {
    const mockCallback = jest.fn();
    customRender(
      <VerticalStackBarChart
        dataSet={singleStack}
        {...defaultChartProps}
        keys={["A"]}
        onChartDataProcessed={mockCallback}
      />
    );

    await waitFor(() => expect(mockCallback).toHaveBeenCalled(), { timeout: 5000 });

    const metadata = mockCallback.mock.calls[mockCallback.mock.calls.length - 1][0];
    // A first (from the prop), then the omitted keys in natural order — nothing dropped.
    expect(metadata.visibleItems).toEqual(["A", "C", "B"]);
  });

  test("keys: an unknown key is ignored and does not break rendering", async () => {
    const mockCallback = jest.fn();
    expect(() =>
      customRender(
        <VerticalStackBarChart
          dataSet={singleStack}
          {...defaultChartProps}
          keys={["Z", "A"]}
          onChartDataProcessed={mockCallback}
        />
      )
    ).not.toThrow();

    await waitFor(() => expect(mockCallback).toHaveBeenCalled(), { timeout: 5000 });

    const metadata = mockCallback.mock.calls[mockCallback.mock.calls.length - 1][0];
    // "Z" isn't in the data, so it's dropped; A leads, then the rest in natural order.
    expect(metadata.visibleItems).toEqual(["A", "C", "B"]);
  });

  test("keys omitted: natural insertion order is unchanged (backward compat)", async () => {
    const mockCallback = jest.fn();
    customRender(
      <VerticalStackBarChart
        dataSet={singleStack}
        {...defaultChartProps}
        onChartDataProcessed={mockCallback}
      />
    );

    await waitFor(() => expect(mockCallback).toHaveBeenCalled(), { timeout: 5000 });

    const metadata = mockCallback.mock.calls[mockCallback.mock.calls.length - 1][0];
    expect(metadata.visibleItems).toEqual(["C", "B", "A"]);
  });
});

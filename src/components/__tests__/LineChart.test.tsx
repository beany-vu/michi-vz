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

  const singlePointData = [
    {
      label: "Africa",
      color: "orange",
      series: [{ date: 2020, value: 42, certainty: true }],
    },
  ];

  test("singlePointLine: renders a full-width horizontal dashed line for a one-point series", async () => {
    const { container } = customRender(
      <LineChart
        dataSet={singlePointData}
        {...defaultChartProps}
        xAxisDataType="date_annual"
        onHighlightItem={() => {}}
        singlePointLine
      />
    );

    await waitFor(() => {
      expect(container.querySelector("line.single-point-line")).toBeInTheDocument();
    });

    const line = container.querySelector("line.single-point-line") as SVGLineElement;
    expect(line.getAttribute("x1")).toBe("50"); // margin.left
    expect(line.getAttribute("x2")).toBe("850"); // width(900) - margin.right(50)
    expect(line.getAttribute("y1")).toBe(line.getAttribute("y2")); // horizontal
    expect(line.getAttribute("stroke-dasharray")).toBe("4,4"); // uncertainty look
    expect(line.getAttribute("stroke")).toBe("orange"); // series color default
    // The dot is shown even though showDataPoints defaults to false.
    expect(container.querySelectorAll(".data-point").length).toBe(1);
  });

  test("singlePointLine: style object overrides stroke / width / dasharray", async () => {
    const { container } = customRender(
      <LineChart
        dataSet={singlePointData}
        {...defaultChartProps}
        xAxisDataType="date_annual"
        onHighlightItem={() => {}}
        singlePointLine={{ stroke: "#123456", strokeWidth: 1, strokeDasharray: "2,6" }}
      />
    );

    await waitFor(() => {
      expect(container.querySelector("line.single-point-line")).toBeInTheDocument();
    });

    const line = container.querySelector("line.single-point-line") as SVGLineElement;
    expect(line.getAttribute("stroke")).toBe("#123456");
    expect(line.getAttribute("stroke-width")).toBe("1");
    expect(line.getAttribute("stroke-dasharray")).toBe("2,6");
  });

  test("singlePointLine: absent → no single-point line rendered", async () => {
    const { container } = customRender(
      <LineChart
        dataSet={singlePointData}
        {...defaultChartProps}
        xAxisDataType="date_annual"
        onHighlightItem={() => {}}
      />
    );

    await waitFor(() => {
      expect(container.querySelector("svg")).toBeInTheDocument();
    });

    expect(container.querySelector("line.single-point-line")).toBeNull();
  });

  test("singlePointLine: multi-point series draws no single-point line", async () => {
    const multiPointData = [
      {
        label: "Africa",
        color: "orange",
        series: [
          { date: 2019, value: 10, certainty: true },
          { date: 2020, value: 42, certainty: true },
        ],
      },
    ];

    const { container } = customRender(
      <LineChart
        dataSet={multiPointData}
        {...defaultChartProps}
        xAxisDataType="date_annual"
        onHighlightItem={() => {}}
        singlePointLine
      />
    );

    await waitFor(() => {
      expect(container.querySelector("svg")).toBeInTheDocument();
    });

    expect(container.querySelector("line.single-point-line")).toBeNull();
  });

  test("singlePointLine: inherits from MichiVzProvider when the prop is omitted", async () => {
    const { container } = customRender(
      <LineChart
        dataSet={singlePointData}
        {...defaultChartProps}
        xAxisDataType="date_annual"
        onHighlightItem={() => {}}
      />,
      { providerProps: { singlePointLine: true } }
    );

    await waitFor(() => {
      expect(container.querySelector("line.single-point-line")).toBeInTheDocument();
    });

    const line = container.querySelector("line.single-point-line") as SVGLineElement;
    expect(line.getAttribute("stroke")).toBe("orange"); // series-color default from the context look
  });

  test("singlePointLine: chart prop false overrides a provider that enabled it", async () => {
    const { container } = customRender(
      <LineChart
        dataSet={singlePointData}
        {...defaultChartProps}
        xAxisDataType="date_annual"
        onHighlightItem={() => {}}
        singlePointLine={false}
      />,
      { providerProps: { singlePointLine: true } }
    );

    await waitFor(() => {
      expect(container.querySelector("svg")).toBeInTheDocument();
    });

    expect(container.querySelector("line.single-point-line")).toBeNull();
  });
});

const curveSeries = (values: number[]) => ({
  label: "Series A",
  color: "orange",
  series: values.map((value, i) => ({ date: 2000 + i, value, certainty: true })),
});

const firstLinePathD = (container: HTMLElement): string =>
  container.querySelector("path.line")?.getAttribute("d") ?? "";

describe("LineChart gap detection", () => {
  const annualGap = [
    {
      label: "A",
      color: "orange",
      series: [
        { date: 2016, value: 10, certainty: true },
        { date: 2017, value: 20, certainty: true },
        { date: 2018, value: 30, certainty: true },
        { date: 2024, value: 40, certainty: true },
      ],
    },
  ];

  const dashedLinePaths = (container: HTMLElement) =>
    Array.from(container.querySelectorAll("path.line")).filter(
      p => p.getAttribute("stroke-dasharray") === "4,4"
    );

  it("renders a dashed straight segment across a missing year when detectGaps is on", async () => {
    const { container, cleanup } = customRender(
      <LineChart
        dataSet={annualGap}
        {...defaultChartProps}
        xAxisDataType="date_annual"
        detectGaps
        onHighlightItem={() => {}}
      />
    );
    await waitFor(() => expect(container.querySelector("path.line")).toBeTruthy());
    const dashed = dashedLinePaths(container);
    expect(dashed.length).toBeGreaterThan(0);
    // The gap run is two points (2018 -> 2024) so it is straight: no cubic command,
    // but a real line-to (rules out an empty / M-only path).
    const dashedD = dashed[0].getAttribute("d") ?? "";
    expect(dashedD).not.toMatch(/C/);
    expect(dashedD).toMatch(/L/);
    cleanup();
  });

  it("does not dash anything when detectGaps is off (unchanged)", async () => {
    const { container, cleanup } = customRender(
      <LineChart
        dataSet={annualGap}
        {...defaultChartProps}
        xAxisDataType="date_annual"
        onHighlightItem={() => {}}
      />
    );
    await waitFor(() => expect(container.querySelector("path.line")).toBeTruthy());
    expect(dashedLinePaths(container).length).toBe(0);
    cleanup();
  });
});

describe("LineChart curve interpolation", () => {
  it("draws a straight line (no cubic) for a 2-point series by default", async () => {
    const { container, cleanup } = customRender(
      <LineChart dataSet={[curveSeries([10, 40])]} {...defaultChartProps} xAxisDataType="number" onHighlightItem={() => {}} />
    );
    await waitFor(() => expect(container.querySelector("path.line")).toBeTruthy());
    const d = firstLinePathD(container);
    expect(d).not.toMatch(/C/);
    expect(d).toMatch(/L/);
    cleanup();
  });

  it("uses a monotone curve (cubic) for a 3+-point series by default", async () => {
    const { container, cleanup } = customRender(
      <LineChart dataSet={[curveSeries([10, 40, 25])]} {...defaultChartProps} xAxisDataType="number" onHighlightItem={() => {}} />
    );
    await waitFor(() => expect(container.querySelector("path.line")).toBeTruthy());
    expect(firstLinePathD(container)).toMatch(/C/);
    cleanup();
  });

  it("honors an explicit curveLinear override (stays straight for 3+ points)", async () => {
    const { container, cleanup } = customRender(
      <LineChart
        dataSet={[{ ...curveSeries([10, 40, 25]), curve: "curveLinear" as const }]}
        {...defaultChartProps}
        xAxisDataType="number"
        onHighlightItem={() => {}}
      />
    );
    await waitFor(() => expect(container.querySelector("path.line")).toBeTruthy());
    const d = firstLinePathD(container);
    expect(d).not.toMatch(/C/);
    expect(d).toMatch(/L/);
    cleanup();
  });
});

// Regression: the exposed legendData (which thd's LegendGeneral + canvas CSS read)
// must HONOR a provided colorsMapping per label, not assign colours by raw index.
// Index assignment is what makes a removed item cascade every following item up a
// palette slot. Mirrors VerticalStackBarChart's `colorsMapping[key] || palette[i]`.
describe("LineChart legendData honours colorsMapping", () => {
  const seriesOf = (label: string, values: number[]) => ({
    label,
    color: "blue",
    series: values.map((value, i) => ({ date: 2001 + i, value, certainty: true })),
  });

  it("colours legendData from the provided map, not by index", async () => {
    const onChartDataProcessed = jest.fn();
    // Sentinel colours deliberately NOT in the default palette, so honouring the
    // map vs. falling back to palette[index] is unambiguous.
    const colorsMapping = {
      Africa: "#111111",
      "Rest of the World": "#222222",
      "Eastern Africa": "#333333",
    };

    const { cleanup } = customRender(
      <LineChart
        dataSet={[
          seriesOf("Africa", [666, 777, 989]),
          seriesOf("Rest of the World", [444, 333, 222]),
          seriesOf("Eastern Africa", [789, 456, 123]),
        ]}
        {...defaultChartProps}
        xAxisDataType="number"
        colorsMapping={colorsMapping}
        onChartDataProcessed={onChartDataProcessed}
        onHighlightItem={() => {}}
      />
    );

    await waitFor(() => expect(onChartDataProcessed).toHaveBeenCalled(), { timeout: 5000 });

    const metadata = onChartDataProcessed.mock.calls[onChartDataProcessed.mock.calls.length - 1][0];
    const colorOf = (label: string) =>
      metadata.legendData.find((item: { label: string }) => item.label === label)?.color;

    expect(colorOf("Africa")).toBe("#111111");
    expect(colorOf("Rest of the World")).toBe("#222222");
    expect(colorOf("Eastern Africa")).toBe("#333333");
    cleanup();
  });
});

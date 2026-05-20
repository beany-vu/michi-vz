import React from "react";
import LineChartComponent from "../src/components/LineChart";
import { Meta } from "@storybook/react";
import { fn } from "@storybook/test";

// Storybook stories for the LineChart component — a focused set, one story per
// distinct feature. Each story is a self-contained, meaningful example.

// Simple tooltip styling for the demos. The LineChart tooltip container carries
// the class `.tooltip`; the formatter's HTML lands inside `.tooltip-content`.
// Real apps would style these from their own CSS — this keeps the demos clean.
const tooltipStyles = `
  .tooltip {
    background: #ffffff;
    border: 1px solid #e2e2e2;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    font: 12px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    color: #2a2a2a;
  }
  .tooltip .tt-label {
    font-weight: 600;
    margin-bottom: 2px;
  }
`;

export default {
  title: "Charts/Line Chart",
  component: LineChartComponent,
  tags: ["autodocs"],
  decorators: [
    Story => (
      <>
        <style>{tooltipStyles}</style>
        <Story />
      </>
    ),
  ],
  args: {
    showDataPoints: true,
    onHighlightItem: fn(),
    onChartDataProcessed: fn(),
    onColorMappingGenerated: fn(),
    onLegendDataChange: fn(),
  },
} as Meta;

// --- Shared data ------------------------------------------------------------

// One series with a mix of certain / uncertain points — uncertain segments
// (certainty: false) render as a dashed line.
const singleSeriesData = [
  {
    label: "Country 1",
    color: "red",
    series: [
      { date: "2002", value: 24.14, certainty: false },
      { date: "2003", value: 20.68, certainty: true },
      { date: "2004", value: 29.34, certainty: true },
      { date: "2006", value: 33.6, certainty: false },
      { date: "2007", value: 33.6, certainty: true },
    ],
  },
];

// Three series — used to show multi-series rendering and filtering.
const multiSeriesData = [
  {
    label: "Item 1",
    shape: "triangle",
    curve: "curveLinear",
    series: [
      { date: "2016", value: 101, certainty: true },
      { date: "2017", value: 201, certainty: true },
      { date: "2018", value: 151, certainty: false },
    ],
  },
  {
    label: "Item 2",
    shape: "triangle",
    curve: "curveLinear",
    series: [
      { date: "2016", value: 102, certainty: true },
      { date: "2017", value: 22, certainty: true },
      { date: "2018", value: 152, certainty: false },
    ],
  },
  {
    label: "Item 3",
    shape: "triangle",
    curve: "curveBumpX",
    series: [
      { date: "2016", value: 103, certainty: true },
      { date: "2017", value: 3, certainty: true },
      { date: "2018", value: 153, certainty: false },
    ],
  },
];

// Per-point colours — each data point carries its own `color`, useful for
// encoding categories or thresholds (temperature, performance, risk bands).
const colorPerPointDataSet = [
  {
    label: "Temperature Variations",
    shape: "circle",
    curve: "curveLinear",
    series: [
      { date: "2016", value: 35, certainty: true, color: "#2196F3" },
      { date: "2017", value: 65, certainty: true, color: "#4CAF50" },
      { date: "2018", value: 85, certainty: true, color: "#FF9800" },
      { date: "2019", value: 95, certainty: true, color: "#F44336" },
      { date: "2020", value: 75, certainty: true, color: "#FF9800" },
      { date: "2021", value: 55, certainty: false, color: "#4CAF50" },
      { date: "2022", value: 30, certainty: false, color: "#2196F3" },
    ],
  },
  {
    label: "Performance Metrics",
    shape: "square",
    curve: "curveLinear",
    series: [
      { date: "2016", value: 42, certainty: true, color: "#F44336" },
      { date: "2017", value: 58, certainty: true, color: "#FF9800" },
      { date: "2018", value: 67, certainty: true, color: "#FFEB3B" },
      { date: "2019", value: 82, certainty: true, color: "#4CAF50" },
      { date: "2020", value: 94, certainty: true, color: "#2196F3" },
      { date: "2021", value: 88, certainty: false, color: "#4CAF50" },
      { date: "2022", value: 75, certainty: false, color: "#FFEB3B" },
    ],
  },
  {
    label: "Risk Assessment",
    shape: "triangle",
    curve: "curveBumpX",
    series: [
      { date: "2016", value: 120, certainty: true, color: "#F44336" },
      { date: "2017", value: 95, certainty: true, color: "#FF9800" },
      { date: "2018", value: 65, certainty: true, color: "#4CAF50" },
      { date: "2019", value: 85, certainty: true, color: "#FF9800" },
      { date: "2020", value: 110, certainty: true, color: "#F44336" },
      { date: "2021", value: 75, certainty: false, color: "#FF9800" },
      { date: "2022", value: 55, certainty: false, color: "#4CAF50" },
    ],
  },
];

// Synthetic dataset: `seriesCount` series each with `pointsPerSeries` monthly
// points — used to exercise the opt-in Canvas renderer at scale.
const generateLargeDataset = (seriesCount: number, pointsPerSeries: number) => {
  const palette = ["#4287f5", "#42f554", "#f54242", "#f5a142", "#a142f5", "#42b6f5"];
  const startYear = 2000;
  return Array.from({ length: seriesCount }, (_, s) => {
    let value = 40 + Math.random() * 50;
    const series = Array.from({ length: pointsPerSeries }, (_, p) => {
      value += (Math.random() - 0.5) * 12;
      const year = startYear + Math.floor(p / 12);
      const month = (p % 12) + 1;
      return {
        date: `${year}-${String(month).padStart(2, "0")}-01`,
        value: Math.max(0, Math.round(value * 100) / 100),
        certainty: true,
      };
    });
    return { label: `Series ${s + 1}`, color: palette[s % palette.length], series };
  });
};

// Common props shared by the args-based stories.
const commonProps = {
  width: 900,
  height: 400,
  margin: { top: 50, right: 50, bottom: 50, left: 50 },
  onChartDataProcessed: fn(),
  onHighlightItem: fn(),
  onColorMappingGenerated: fn(),
  yAxisFormat: d => `${d}%`,
  xAxisDataType: "date_annual",
  tooltipFormatter: d => `
    <div class="tt-label">${d.label}</div>
    <div>${d.date}: ${d.value}%</div>
  `,
};

// --- Stories ----------------------------------------------------------------

// Baseline: two regions of annual data with negative values and a mix of
// certain / uncertain points. Hover a line for the formatted tooltip.
export const Primary = {
  args: {
    ...commonProps,
    dataSet: [
      {
        label: "Africa",
        shape: "circle",
        color: "#4287f5",
        series: [
          { date: "2015", value: -63.85, certainty: false, code: "1001" },
          { date: "2016", value: -64.01, certainty: true, code: "1001" },
          { date: "2017", value: -63.84, certainty: true, code: "1001" },
          { date: "2018", value: -89.53, certainty: true, code: "1001" },
          { date: "2019", value: -53.03, certainty: true, code: "1001" },
          { date: "2020", value: -84.09, certainty: true, code: "1001" },
          { date: "2021", value: -43.87, certainty: true, code: "1001" },
        ],
      },
      {
        label: "Rest of the World",
        shape: "square",
        color: "#42f554",
        series: [
          { date: "2015", value: -86.95, certainty: false, code: "1002" },
          { date: "2016", value: -75.09, certainty: true, code: "1002" },
          { date: "2017", value: -69.48, certainty: true, code: "1002" },
          { date: "2018", value: -64.23, certainty: true, code: "1002" },
          { date: "2019", value: -62.17, certainty: true, code: "1002" },
          { date: "2020", value: -86.63, certainty: true, code: "1002" },
          { date: "2021", value: -88.95, certainty: true, code: "1002" },
        ],
      },
    ],
    filter: null,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Baseline two-series example: annual data, negative values, and a mix of certain / uncertain points (the first segment of each series is dashed). Hover a line for the tooltip and series highlight.",
      },
    },
  },
};

// A single series, no filter — note the dashed segments where `certainty` is false.
export const NoFilter = {
  args: {
    ...commonProps,
    dataSet: singleSeriesData,
    title: "Single Series",
    filter: null,
  },
  parameters: {
    docs: {
      description: {
        story:
          "A single series with no filtering. Points with `certainty: false` produce dashed line segments — here the 2002 and 2006 segments.",
      },
    },
  },
};

// Multiple series with a filter applied.
export const MultiSeries = {
  args: {
    ...commonProps,
    dataSet: multiSeriesData,
    title: "Multi-Series with Filter",
    filter: { limit: 2, date: "2017", criteria: "value", sortingDir: "desc" },
  },
  parameters: {
    docs: {
      description: {
        story:
          "Three series with a `filter` — only the top 2 by value at 2017 (descending) render. The `filter` prop drives which series are shown.",
      },
    },
  },
};

// Dots hidden — hover any line for the nearest-point tooltip via bisection.
export const NoDots = {
  args: {
    ...commonProps,
    dataSet: multiSeriesData,
    title: "No Dots (hover any line for tooltip)",
    filter: null,
    showDataPoints: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          "With `showDataPoints={false}`, per-point shapes are hidden. Hovering anywhere along a line resolves the nearest point in that series and renders the tooltip via your `tooltipFormatter`. Highlight + tooltip happen together, mirroring the per-dot UX.",
      },
    },
  },
};

// Marker shapes and curve types.
export const DifferentShapesAndCurves = {
  args: {
    ...commonProps,
    dataSet: [
      {
        label: "Circle Series",
        shape: "circle",
        curve: "curveLinear",
        color: "#4287f5",
        series: [
          { date: "2016", value: 100, certainty: true },
          { date: "2017", value: 150, certainty: true },
          { date: "2018", value: 120, certainty: true },
          { date: "2019", value: 180, certainty: true },
          { date: "2020", value: 140, certainty: true },
        ],
      },
      {
        label: "Square Series",
        shape: "square",
        curve: "curveBumpX",
        color: "#f54242",
        series: [
          { date: "2016", value: 80, certainty: true },
          { date: "2017", value: 130, certainty: true },
          { date: "2018", value: 200, certainty: true },
          { date: "2019", value: 160, certainty: true },
          { date: "2020", value: 120, certainty: true },
        ],
      },
      {
        label: "Triangle Series",
        shape: "triangle",
        curve: "curveLinear",
        color: "#42f554",
        series: [
          { date: "2016", value: 60, certainty: true },
          { date: "2017", value: 110, certainty: true },
          { date: "2018", value: 80, certainty: true },
          { date: "2019", value: 140, certainty: true },
          { date: "2020", value: 100, certainty: true },
        ],
      },
    ],
    title: "Different Shapes and Curves",
    filter: null,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Per-series marker `shape` (circle / square / triangle) and `curve` (`curveLinear` straight segments vs `curveBumpX` smooth).",
      },
    },
  },
};

// Monthly x-axis.
export const MonthlyData = {
  args: {
    ...commonProps,
    dataSet: [
      {
        label: "Monthly Trends",
        color: "blue",
        series: [
          { date: "2022-01", value: 45.2, certainty: true },
          { date: "2022-02", value: 48.6, certainty: true },
          { date: "2022-03", value: 52.1, certainty: true },
          { date: "2022-04", value: 55.8, certainty: true },
          { date: "2022-05", value: 60.3, certainty: true },
          { date: "2022-06", value: 63.7, certainty: true },
          { date: "2022-07", value: 61.2, certainty: false },
          { date: "2022-08", value: 58.4, certainty: false },
          { date: "2022-09", value: 53.9, certainty: false },
          { date: "2022-10", value: 49.7, certainty: false },
          { date: "2022-11", value: 46.5, certainty: false },
          { date: "2022-12", value: 43.8, certainty: false },
        ],
      },
    ],
    title: "Monthly Data",
    xAxisDataType: "date_monthly",
    filter: null,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Monthly time series via `xAxisDataType="date_monthly"`. The second half of the year is uncertain, so those segments render dashed.',
      },
    },
  },
};

// Individual colour per data point.
export const ColorPerDataPoint = {
  args: {
    ...commonProps,
    dataSet: colorPerPointDataSet,
    title: "Color Per Data Point",
    filter: null,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Each data point carries its own `color`, useful for encoding categories or thresholds (temperature ranges, performance levels, risk bands).",
      },
    },
  },
};

// --- Canvas renderer --------------------------------------------------------

// Opt-in Canvas renderer — ~2,880 points (12 series x 240 monthly points).
export const CanvasRenderer = {
  args: {
    ...commonProps,
    xAxisDataType: "date_monthly",
    renderer: "canvas",
    showDataPoints: false,
    dataSet: generateLargeDataset(12, 240),
  },
  parameters: {
    docs: {
      description: {
        story:
          'LineChart with renderer="canvas": 12 series x 240 monthly points drawn on a <canvas> with LTTB decimation. Axes, title and tooltip stay SVG/HTML. Hover a line for the tooltip + highlight.',
      },
    },
  },
};

// SVG vs Canvas side by side on identical data — visual parity check.
export const RendererComparison = {
  render: () => {
    const data = React.useMemo(() => generateLargeDataset(8, 180), []);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div>
          <h4>renderer: svg (default)</h4>
          <LineChartComponent
            {...commonProps}
            xAxisDataType="date_monthly"
            renderer="svg"
            showDataPoints={false}
            dataSet={data}
          />
        </div>
        <div>
          <h4>renderer: canvas</h4>
          <LineChartComponent
            {...commonProps}
            xAxisDataType="date_monthly"
            renderer="canvas"
            showDataPoints={false}
            dataSet={data}
          />
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "The same dataset rendered with renderer=svg and renderer=canvas, stacked for visual parity comparison (curves, certainty dashing, colours, hover/highlight).",
      },
    },
  },
};

// Stress test — ~21,600 points (60 series x 360 monthly points).
export const CanvasLargeDataset = {
  args: {
    ...commonProps,
    xAxisDataType: "date_monthly",
    renderer: "canvas",
    showDataPoints: false,
    dataSet: generateLargeDataset(60, 360),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Stress test for the Canvas renderer: 60 series x 360 monthly points (~21,600 points). Switch renderer to "svg" via the controls to compare.',
      },
    },
  },
};

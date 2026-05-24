import React from "react";
import LineChartComponent from "../src/components/LineChart";
import { Meta } from "@storybook/react";
import { fn } from "@storybook/test";

// Storybook stories for the LineChart component — a lean, curated showcase.
// Each story demonstrates a real analytical use case with realistic data,
// not exhaustive prop coverage.

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
  parameters: {
    docs: {
      description: {
        component:
          "**LineChart** plots one or more time series on a shared set of axes — the workhorse for trend analysis, comparisons between groups, and forecasts. " +
          "It expects a `dataSet`: an array of labelled series, each with a `series` array of `{ date, value, certainty }` points. " +
          "Points marked `certainty: false` render as a dashed line, so projected or low-confidence data reads differently from observed data. " +
          "For large datasets, opt into `renderer=\"canvas\"` — the same chart drawn on a `<canvas>` with LTTB decimation, scaling smoothly to tens of thousands of points while axes, title and tooltip stay SVG/HTML.",
      },
    },
  },
  args: {
    showDataPoints: true,
    onHighlightItem: fn(),
    onChartDataProcessed: fn(),
    onColorMappingGenerated: fn(),
    onLegendDataChange: fn(),
  },
} as Meta;

// --- Shared data ------------------------------------------------------------

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
    return { label: `Sensor ${s + 1}`, color: palette[s % palette.length], series };
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

// Baseline: two regions compared over time, with a forecast tail.
export const Primary = {
  args: {
    ...commonProps,
    dataSet: [
      {
        label: "Renewable share — EU",
        shape: "circle",
        color: "#2e7d32",
        series: [
          { date: "2017", value: 32.1, certainty: true, code: "EU" },
          { date: "2018", value: 34.6, certainty: true, code: "EU" },
          { date: "2019", value: 36.0, certainty: true, code: "EU" },
          { date: "2020", value: 39.4, certainty: true, code: "EU" },
          { date: "2021", value: 41.2, certainty: true, code: "EU" },
          { date: "2022", value: 43.8, certainty: false, code: "EU" },
          { date: "2023", value: 45.5, certainty: false, code: "EU" },
        ],
      },
      {
        label: "Renewable share — United States",
        shape: "square",
        color: "#1565c0",
        series: [
          { date: "2017", value: 17.3, certainty: true, code: "US" },
          { date: "2018", value: 17.6, certainty: true, code: "US" },
          { date: "2019", value: 17.9, certainty: true, code: "US" },
          { date: "2020", value: 19.8, certainty: true, code: "US" },
          { date: "2021", value: 20.1, certainty: true, code: "US" },
          { date: "2022", value: 21.4, certainty: false, code: "US" },
          { date: "2023", value: 22.6, certainty: false, code: "US" },
        ],
      },
    ],
    filter: null,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Share of electricity from renewable sources, EU vs United States. The widening gap is the story; the final two years are marked `certainty: false` and render dashed, signalling forecast rather than observed data. Hover a line for the tooltip and series highlight.",
      },
    },
  },
};

// Multiple series narrowed by the filter prop.
export const TopPerformersFilter = {
  args: {
    ...commonProps,
    dataSet: [
      {
        label: "Solar PV",
        shape: "triangle",
        curve: "curveLinear",
        color: "#f9a825",
        series: [
          { date: "2019", value: 112, certainty: true },
          { date: "2020", value: 139, certainty: true },
          { date: "2021", value: 178, certainty: true },
        ],
      },
      {
        label: "Onshore Wind",
        shape: "triangle",
        curve: "curveLinear",
        color: "#26a69a",
        series: [
          { date: "2019", value: 95, certainty: true },
          { date: "2020", value: 108, certainty: true },
          { date: "2021", value: 121, certainty: true },
        ],
      },
      {
        label: "Hydropower",
        shape: "triangle",
        curve: "curveBumpX",
        color: "#5c6bc0",
        series: [
          { date: "2019", value: 84, certainty: true },
          { date: "2020", value: 86, certainty: true },
          { date: "2021", value: 88, certainty: true },
        ],
      },
    ],
    title: "Capacity Added by Technology (GW)",
    filter: { limit: 2, date: "2021", criteria: "value", sortingDir: "desc" },
  },
  parameters: {
    docs: {
      description: {
        story:
          "New generation capacity added by technology. The `filter` prop ranks series by value at a chosen date and keeps only the top N — here the two fastest-growing technologies as of 2021 (Solar PV and Onshore Wind), letting an analyst surface leaders without pre-trimming the data.",
      },
    },
  },
};

// Marker shapes and curve interpolation.
export const ShapesAndCurves = {
  args: {
    ...commonProps,
    dataSet: [
      {
        label: "North America",
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
        label: "Europe",
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
        label: "Asia-Pacific",
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
    title: "Quarterly Revenue Index by Region",
    filter: null,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Per-series styling for legibility when several lines overlap: each series sets its own marker `shape` (circle / square / triangle) and `curve`. `curveLinear` keeps straight segments that read values honestly; `curveBumpX` smooths the line for a cleaner trend at the cost of literal accuracy between points.",
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
          "The headline feature. Twelve sensors logged monthly for 20 years (~2,880 points) — a dataset that would stutter as SVG. Setting `renderer=\"canvas\"` draws the lines on a `<canvas>` with LTTB decimation, while axes, title and tooltip stay SVG/HTML. Hovering still resolves the nearest point and highlights its series.",
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
          "Switching to the Canvas renderer should change performance, not appearance. The same eight-sensor dataset is drawn both ways and stacked — curves, certainty dashing, colours and hover/highlight should match. Use this to satisfy yourself the opt-in is a safe swap.",
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
          "Where Canvas earns its place: 60 sensors over 30 years of monthly readings (~21,600 points) stay interactive. Flip `renderer` to `\"svg\"` in the controls to feel the difference — the SVG path count makes the same chart sluggish.",
      },
    },
  },
};

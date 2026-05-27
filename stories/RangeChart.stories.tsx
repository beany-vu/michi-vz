// RangeChart.stories.tsx
import React from "react";
import RangeChartComponent from "../src/components/RangeChart";
import { Meta } from "@storybook/react-webpack5";
import { MichiVzProvider } from "../src/components/MichiVzProvider";
import { fn } from "storybook/test";

// Storybook stories for the RangeChart component — a lean, analyst-curated set.
// RangeChart draws a value band (valueMin..valueMax, with an optional
// valueMedium) per series across an x-axis, so it's the chart you reach for
// when each data point is a *range* rather than a single number: forecast
// uncertainty, confidence intervals, daily temperature highs/lows, projected
// scenario envelopes. RangeChart reads `colorsMapping` from MichiVzProvider
// context, so every story is wrapped in that provider.

// --- Shared data ------------------------------------------------------------

// Single series of forecast uncertainty: a central projection (valueMedium)
// wrapped in a min/max band that fans out the further into the future you go —
// the classic "the further out, the less certain" shape.
const gdpForecastData = [
  {
    label: "GDP growth forecast",
    color: "#2563eb",
    series: [
      { year: 2024, date: "2024", valueMin: 2.4, valueMax: 2.6, valueMedium: 2.5 },
      { year: 2025, date: "2025", valueMin: 1.9, valueMax: 2.9, valueMedium: 2.4 },
      { year: 2026, date: "2026", valueMin: 1.3, valueMax: 3.3, valueMedium: 2.3 },
      { year: 2027, date: "2027", valueMin: 0.7, valueMax: 3.7, valueMedium: 2.2 },
      { year: 2028, date: "2028", valueMin: 0.1, valueMax: 4.1, valueMedium: 2.1 },
    ],
  },
];

// Three emission-pathway scenarios: each is a min/max projection band around a
// central estimate. Overlapping bands let an analyst see where optimistic and
// pessimistic futures still agree — and where they diverge.
const emissionScenarioData = [
  {
    label: "Low emissions",
    color: "#16a34a",
    series: [
      { year: 2025, date: "2025", valueMin: 33, valueMax: 36, valueMedium: 34.5 },
      { year: 2030, date: "2030", valueMin: 26, valueMax: 32, valueMedium: 29 },
      { year: 2035, date: "2035", valueMin: 18, valueMax: 27, valueMedium: 22.5 },
      { year: 2040, date: "2040", valueMin: 10, valueMax: 21, valueMedium: 15.5 },
      { year: 2045, date: "2045", valueMin: 4, valueMax: 15, valueMedium: 9.5 },
    ],
  },
  {
    label: "Current policies",
    color: "#ca8a04",
    series: [
      { year: 2025, date: "2025", valueMin: 34, valueMax: 37, valueMedium: 35.5 },
      { year: 2030, date: "2030", valueMin: 34, valueMax: 40, valueMedium: 37 },
      { year: 2035, date: "2035", valueMin: 33, valueMax: 43, valueMedium: 38 },
      { year: 2040, date: "2040", valueMin: 32, valueMax: 46, valueMedium: 39 },
      { year: 2045, date: "2045", valueMin: 31, valueMax: 49, valueMedium: 40 },
    ],
  },
  {
    label: "High emissions",
    color: "#dc2626",
    series: [
      { year: 2025, date: "2025", valueMin: 35, valueMax: 38, valueMedium: 36.5 },
      { year: 2030, date: "2030", valueMin: 38, valueMax: 45, valueMedium: 41.5 },
      { year: 2035, date: "2035", valueMin: 42, valueMax: 53, valueMedium: 47.5 },
      { year: 2040, date: "2040", valueMin: 46, valueMax: 61, valueMedium: 53.5 },
      { year: 2045, date: "2045", valueMin: 50, valueMax: 70, valueMedium: 60 },
    ],
  },
];

// Daily temperature envelope: each point is the record low / record high for
// that month, with the long-run average as the central value. A band per point
// is the natural encoding — a single line would throw away the spread.
// Berlin month-by-month temperature band — record low to record high, with
// the long-run average down the middle. `date` is the month index (1..12)
// because the chart reads `date` as the x-position; the story's
// `xAxisFormat` maps the index to "Jan", "Feb" etc for display.
const temperatureBandData = [
  {
    label: "Berlin",
    color: "#0891b2",
    series: [
      { date: 1, valueMin: -4, valueMax: 5, valueMedium: 0.5 },
      { date: 2, valueMin: -3, valueMax: 7, valueMedium: 2 },
      { date: 3, valueMin: 0, valueMax: 12, valueMedium: 5.5 },
      { date: 4, valueMin: 4, valueMax: 18, valueMedium: 10.5 },
      { date: 5, valueMin: 9, valueMax: 23, valueMedium: 15.5 },
      { date: 6, valueMin: 12, valueMax: 26, valueMedium: 18.5 },
      { date: 7, valueMin: 14, valueMax: 29, valueMedium: 21 },
      { date: 8, valueMin: 13, valueMax: 28, valueMedium: 20.5 },
      { date: 9, valueMin: 10, valueMax: 22, valueMedium: 16 },
      { date: 10, valueMin: 6, valueMax: 15, valueMedium: 10.5 },
      { date: 11, valueMin: 1, valueMax: 9, valueMedium: 5 },
      { date: 12, valueMin: -3, valueMax: 6, valueMedium: 1.5 },
    ],
  },
];

// --- Common props -----------------------------------------------------------

// Common props shared by every story, spread into each story's `args`.
const commonProps = {
  width: 900,
  height: 400,
  margin: { top: 50, right: 60, bottom: 65, left: 70 },
  xAxisDataType: "date_annual",
  showCombined: false,
  tooltipFormatter: (d: any) =>
    `<strong>${d.date}</strong><br/>${d.valueMin} – ${d.valueMax} (mid ${d.valueMedium})`,
  onChartDataProcessed: fn(),
  onHighlightItem: fn(),
  onLegendDataChange: fn(),
};

export default {
  title: "Charts/Range Chart",
  component: RangeChartComponent,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "**RangeChart** plots a value *band* — a `valueMin`..`valueMax` pair with an optional central `valueMedium` — for every point along the x-axis, instead of a single line. Each series is an array of `{ date, valueMin, valueMax, valueMedium }` points; series colours come from `colorsMapping` on the surrounding `MichiVzProvider`. Reach for it whenever the uncertainty *is* the story: forecast cones, confidence intervals, projected scenario envelopes, or observed min/max ranges like temperature highs and lows.",
      },
    },
  },
  decorators: [
    Story => (
      <MichiVzProvider
        colorsMapping={{
          "GDP growth forecast": "#2563eb",
          "Low emissions": "#16a34a",
          "Current policies": "#ca8a04",
          "High emissions": "#dc2626",
          Berlin: "#0891b2",
        }}
      >
        <Story />
      </MichiVzProvider>
    ),
  ],
  args: {
    ...commonProps,
  },
} as Meta;

// --- Stories ----------------------------------------------------------------

// Primary showcase: a forecast uncertainty cone.
export const ForecastUncertainty = {
  args: {
    dataSet: gdpForecastData,
    title: "GDP growth: central forecast and uncertainty range (%)",
    yAxisFormat: (d: number) => `${d}%`,
  },
  parameters: {
    docs: {
      description: {
        story:
          "A GDP forecast drawn as a fanning band, with the central projection running through the middle and the best/worst estimates as the upper and lower edges. The band stays tight near 2024 then widens further out — that widening is the chart saying \"we're less sure the further ahead we look\".",
      },
    },
  },
};

// Multiple scenario envelopes overlaid.
export const ScenarioEnvelopes = {
  args: {
    dataSet: emissionScenarioData,
    title: "CO₂ emissions to 2045 by policy scenario (Gt)",
    yAxisFormat: (d: number) => `${d} Gt`,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Three possible emission futures drawn as overlapping coloured bands — low, current-policy, high. They nearly touch in 2025 (the next few years are locked in) then peel apart sharply, and the growing gap between green and red is the cost of policy choice in a single picture.",
      },
    },
  },
};

// Observed min/max envelope on a monthly axis.
export const ObservedMinMaxRange = {
  args: {
    dataSet: temperatureBandData,
    title: "Berlin monthly temperature: record low to record high (°C)",
    xAxisDataType: "number",
    yAxisFormat: (d: number) => `${d}°`,
    xAxisFormat: (d: number) =>
      ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][d] ??
      "",
  },
  parameters: {
    docs: {
      description: {
        story:
          "Each month in Berlin shown as a temperature band: record low on the bottom edge, record high on the top, long-run average down the middle. A plain average line would hide that July's spread is much wider than January's — here the band's thickness *is* the seasonal-volatility story.",
      },
    },
  },
};

// Fixed y-domain for honest cross-view comparison.
export const FixedScaleForComparison = {
  args: {
    dataSet: emissionScenarioData,
    title: "CO₂ emissions on a fixed 0–80 Gt scale",
    yAxisDomain: [0, 80] as [number, number],
    yAxisFormat: (d: number) => `${d} Gt`,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Same scenarios as before, but the y-axis is pinned from 0 to 80 instead of auto-scaling. Locking the scale stops each chart from zooming into its own data and exaggerating differences — essential when several panels in a dashboard need to be read against each other. Set via `yAxisDomain`.",
      },
    },
  },
};

// Custom tooltip that surfaces the full min / median / max readout.
export const RichTooltipReadout = {
  args: {
    dataSet: emissionScenarioData,
    title: "CO₂ scenarios with a detailed band readout",
    yAxisFormat: (d: number) => `${d} Gt`,
    tooltipFormatter: (d: any, series: any) =>
      `<strong>${series?.label ?? ""} — ${d.date}</strong>` +
      `<br/>Low estimate: ${d.valueMin} Gt` +
      `<br/>Central: ${d.valueMedium} Gt` +
      `<br/>High estimate: ${d.valueMax} Gt` +
      `<br/>Band width: ${(d.valueMax - d.valueMin).toFixed(1)} Gt`,
  },
  parameters: {
    docs: {
      description: {
        story:
          "A band hides three numbers behind one shape; the tooltip pulls them back out — low, central, high, plus the band width — when you hover. Turns a vague visual sense of \"wide\" into a precise readout of just how uncertain a point is. Wired through `tooltipFormatter`.",
      },
    },
  },
};

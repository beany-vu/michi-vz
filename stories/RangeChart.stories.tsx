// RangeChart.stories.tsx
import React from "react";
import RangeChartComponent from "../src/components/RangeChart";
import { Meta } from "@storybook/react";
import { MichiVzProvider } from "../src/components/MichiVzProvider";
import { fn } from "@storybook/test";

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
const temperatureBandData = [
  {
    label: "Berlin",
    color: "#0891b2",
    series: [
      { year: 1, date: "Jan", valueMin: -4, valueMax: 5, valueMedium: 0.5 },
      { year: 2, date: "Feb", valueMin: -3, valueMax: 7, valueMedium: 2 },
      { year: 3, date: "Mar", valueMin: 0, valueMax: 12, valueMedium: 5.5 },
      { year: 4, date: "Apr", valueMin: 4, valueMax: 18, valueMedium: 10.5 },
      { year: 5, date: "May", valueMin: 9, valueMax: 23, valueMedium: 15.5 },
      { year: 6, date: "Jun", valueMin: 12, valueMax: 26, valueMedium: 18.5 },
      { year: 7, date: "Jul", valueMin: 14, valueMax: 29, valueMedium: 21 },
      { year: 8, date: "Aug", valueMin: 13, valueMax: 28, valueMedium: 20.5 },
      { year: 9, date: "Sep", valueMin: 10, valueMax: 22, valueMedium: 16 },
      { year: 10, date: "Oct", valueMin: 6, valueMax: 15, valueMedium: 10.5 },
      { year: 11, date: "Nov", valueMin: 1, valueMax: 9, valueMedium: 5 },
      { year: 12, date: "Dec", valueMin: -3, valueMax: 6, valueMedium: 1.5 },
    ],
  },
];

// --- Common props -----------------------------------------------------------

// Common props shared by every story, spread into each story's `args`.
const commonProps = {
  width: 900,
  height: 400,
  margin: { top: 50, right: 50, bottom: 50, left: 50 },
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
          "The signature use of a range chart: a forecast cone. The central projection holds near 2.3% while the min/max band fans out year over year — visually answering 'how confident are we?' before the reader reads a single number. The widening band is the insight.",
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
          "Three projected emission pathways as overlapping bands. Near 2025 the scenarios overlap heavily — the near-term future is largely locked in — then they diverge sharply, so the gap between the green and red bands is the cost of policy choice. Hover a band to fade the others and isolate one pathway.",
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
          "Not every range is a forecast — here each band is the observed record-low to record-high spread for a month, with the long-run average as the centre line. A plain line chart of the average would hide that January swings 9° while July swings 15°. The band width itself carries the seasonal-volatility story.",
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
          "The same scenario data pinned to a fixed `yAxisDomain` of [0, 80]. Auto-scaling makes every chart fill its frame, which exaggerates differences and breaks comparison across panels. A fixed domain keeps multiple range charts honest and directly comparable — essential when a dashboard shows the same metric for many regions.",
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
          "A band hides three numbers behind one shape. `tooltipFormatter` receives the hovered point plus its series, so the tooltip can spell out low / central / high and even compute the band width on the fly — turning a hover into a precise quantitative read of how uncertain that point is.",
      },
    },
  },
};

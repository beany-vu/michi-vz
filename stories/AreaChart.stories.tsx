import React, { useState } from "react";
import AreaChart from "../src/components/AreaChart";
import { Meta } from "@storybook/react-webpack5";
import { MichiVzProvider } from "../src/components";
import { fn } from "storybook/test";

// Storybook stories for the AreaChart component — a lean, analyst-focused set.
// Each story demonstrates a real analytical use of a stacked area chart:
// composition over time and part-to-whole trends. Stories are self-contained.

// --- Shared data ------------------------------------------------------------

// US electricity generation mix, share of total (%) by source, monthly
// 2018-01 .. 2023-10. Shows the long-run shift from coal toward gas and
// renewables — the canonical dataset reused by most stories.
const energyMixSeries = [
  { date: "2018-01", Coal: 30.1, "Natural Gas": 31.8, Nuclear: 20.4, Renewables: 17.7 },
  { date: "2018-04", Coal: 26.4, "Natural Gas": 33.9, Nuclear: 19.6, Renewables: 20.1 },
  { date: "2018-07", Coal: 28.7, "Natural Gas": 38.2, Nuclear: 19.1, Renewables: 14.0 },
  { date: "2018-10", Coal: 25.3, "Natural Gas": 36.6, Nuclear: 20.0, Renewables: 18.1 },
  { date: "2019-01", Coal: 26.8, "Natural Gas": 33.1, Nuclear: 20.7, Renewables: 19.4 },
  { date: "2019-04", Coal: 21.9, "Natural Gas": 35.4, Nuclear: 20.2, Renewables: 22.5 },
  { date: "2019-07", Coal: 24.6, "Natural Gas": 41.0, Nuclear: 19.3, Renewables: 15.1 },
  { date: "2019-10", Coal: 21.2, "Natural Gas": 38.9, Nuclear: 20.5, Renewables: 19.4 },
  { date: "2020-01", Coal: 19.4, "Natural Gas": 36.7, Nuclear: 21.1, Renewables: 22.8 },
  { date: "2020-04", Coal: 15.3, "Natural Gas": 38.2, Nuclear: 21.6, Renewables: 24.9 },
  { date: "2020-07", Coal: 19.8, "Natural Gas": 43.5, Nuclear: 19.8, Renewables: 16.9 },
  { date: "2020-10", Coal: 18.1, "Natural Gas": 40.4, Nuclear: 20.7, Renewables: 20.8 },
  { date: "2021-01", Coal: 21.6, "Natural Gas": 35.2, Nuclear: 20.9, Renewables: 22.3 },
  { date: "2021-04", Coal: 19.7, "Natural Gas": 34.8, Nuclear: 20.4, Renewables: 25.1 },
  { date: "2021-07", Coal: 23.1, "Natural Gas": 40.6, Nuclear: 19.2, Renewables: 17.1 },
  { date: "2021-10", Coal: 20.4, "Natural Gas": 37.9, Nuclear: 20.1, Renewables: 21.6 },
  { date: "2022-01", Coal: 21.0, "Natural Gas": 34.3, Nuclear: 20.6, Renewables: 24.1 },
  { date: "2022-04", Coal: 17.5, "Natural Gas": 34.9, Nuclear: 20.1, Renewables: 27.5 },
  { date: "2022-07", Coal: 20.3, "Natural Gas": 41.2, Nuclear: 18.9, Renewables: 19.6 },
  { date: "2022-10", Coal: 17.9, "Natural Gas": 38.6, Nuclear: 19.7, Renewables: 23.8 },
  { date: "2023-01", Coal: 16.8, "Natural Gas": 36.1, Nuclear: 20.3, Renewables: 26.8 },
  { date: "2023-04", Coal: 13.4, "Natural Gas": 35.7, Nuclear: 20.0, Renewables: 30.9 },
  { date: "2023-07", Coal: 16.1, "Natural Gas": 42.0, Nuclear: 18.8, Renewables: 23.1 },
  { date: "2023-10", Coal: 14.2, "Natural Gas": 39.3, Nuclear: 19.5, Renewables: 27.0 },
];

const energyMixKeys = ["Coal", "Natural Gas", "Nuclear", "Renewables"];

// Quarterly revenue mix ($M) for a SaaS company, FY2021-FY2023. Numeric x-axis
// where `date` is a sequential quarter index.
const revenueMixSeries = [
  { date: 1, Subscriptions: 42.0, Services: 18.5, "Marketplace Fees": 6.2 },
  { date: 2, Subscriptions: 45.8, Services: 17.9, "Marketplace Fees": 7.4 },
  { date: 3, Subscriptions: 49.1, Services: 19.2, "Marketplace Fees": 8.1 },
  { date: 4, Subscriptions: 53.6, Services: 20.0, "Marketplace Fees": 9.7 },
  { date: 5, Subscriptions: 58.2, Services: 19.4, "Marketplace Fees": 11.3 },
  { date: 6, Subscriptions: 63.5, Services: 18.8, "Marketplace Fees": 13.0 },
  { date: 7, Subscriptions: 69.4, Services: 18.1, "Marketplace Fees": 15.2 },
  { date: 8, Subscriptions: 76.0, Services: 17.6, "Marketplace Fees": 17.8 },
];

const revenueMixKeys = ["Subscriptions", "Services", "Marketplace Fees"];

// --- Shared props -----------------------------------------------------------

// Monthly x-axis formatter: "Jan 18".
const monthYearFormat = (d: number) =>
  new Date(d).toLocaleDateString("en-US", { month: "short", year: "2-digit" });

// Common props spread into every story.
const commonProps = {
  width: 900,
  height: 480,
  margin: { top: 50, right: 70, bottom: 70, left: 84 },
  yAxisDomain: [0, 100] as [number, number],
  yAxisFormat: (d: number) => `${d}%`,
  ticks: 6,
  onChartDataProcessed: fn(),
  onColorMappingGenerated: fn(),
  onHighlightItem: fn(),
};

// --- Meta -------------------------------------------------------------------

export default {
  title: "Charts/Area Chart",
  component: AreaChart,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "**AreaChart** is a stacked area chart for showing how a whole splits into parts *over time*. " +
          "It expects a `series` array of rows — each row has an x value (`date`) plus one numeric field per " +
          "category, and a `keys` array naming those categories. The categories are stacked, so the top edge " +
          "is the running total.\n\n" +
          "Reach for it when the story is **composition and part-to-whole trend**: how each segment's share " +
          "shifts across a time range. Prefer a **line chart** when you only care about each series' own " +
          "trajectory (not the total), and a **bar chart** when the x-axis is categorical rather than continuous.",
      },
    },
  },
  args: {
    onChartDataProcessed: fn(),
    onColorMappingGenerated: fn(),
    onHighlightItem: fn(),
  },
  decorators: [
    Story => (
      <MichiVzProvider>
        <Story />
      </MichiVzProvider>
    ),
  ],
} as Meta;

// --- Stories ----------------------------------------------------------------

// Primary showcase: the energy transition told as a stacked area chart.
export const Primary = {
  args: {
    ...commonProps,
    keys: energyMixKeys,
    series: energyMixSeries,
    title: "US Electricity Generation Mix (% of total)",
    colorsMapping: {
      Coal: "#5b5b5b",
      "Natural Gas": "#f4a259",
      Nuclear: "#8e44ad",
      Renewables: "#2e8b57",
    },
    xAxisDataType: "date_monthly",
    xAxisFormat: monthYearFormat,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Track how each fuel source's share of US power generation shifts from 2018 to 2023. " +
          "The stacked bands make the energy transition obvious at a glance — coal's slab narrows " +
          "year over year while the renewables band widens, and the seasonal gas bulge recurs every summer. " +
          "Hover any band for the per-month share and category highlight.",
      },
    },
  },
};

// Same composition story, colors auto-generated instead of hand-mapped.
export const AutoGeneratedColors = {
  args: {
    ...commonProps,
    keys: energyMixKeys,
    series: energyMixSeries,
    title: "Generation Mix — Auto-Assigned Palette",
    xAxisDataType: "date_monthly",
    xAxisFormat: monthYearFormat,
  },
  parameters: {
    docs: {
      description: {
        story:
          "The same energy mix, but without choosing colours by hand — the chart picks them and tells you " +
          "what it chose. Useful when categories aren't known up front, or when you want a sibling chart " +
          "(or external legend) to match without duplicating a colour list. Capture the assignments via " +
          "`onColorMappingGenerated`.",
      },
    },
  },
};

// Numeric x-axis: revenue composition by quarter.
export const RevenueMixByQuarter = {
  args: {
    ...commonProps,
    yAxisDomain: null,
    yAxisFormat: (d: number) => `$${d}M`,
    colorsMapping: {
      Subscriptions: "#1f77b4",
      Services: "#ff7f0e",
      "Marketplace Fees": "#2ca02c",
    },
    keys: revenueMixKeys,
    series: revenueMixSeries,
    title: "Quarterly Revenue Mix ($M)",
    xAxisDataType: "number",
    xAxisFormat: (d: number) => `Q${((d - 1) % 4) + 1} FY${21 + Math.floor((d - 1) / 4)}`,
    ticks: 8,
  },
  parameters: {
    docs: {
      description: {
        story:
          "A SaaS company nearly doubles its revenue in eight quarters — but the stack reveals the growth " +
          "is coming from subscriptions and marketplace fees, while services flatlines. Stacked areas make " +
          "this kind of \"what's actually driving the trend\" question visible in seconds. Uses " +
          "`xAxisDataType=\"number\"` so quarter indices format as fiscal-quarter labels.",
      },
    },
  },
};

// Custom tooltip — surface the exact share and rank on hover.
export const CustomTooltip = {
  args: {
    ...commonProps,
    keys: energyMixKeys,
    series: energyMixSeries,
    title: "Generation Mix with Detailed Tooltip",
    colorsMapping: {
      Coal: "#5b5b5b",
      "Natural Gas": "#f4a259",
      Nuclear: "#8e44ad",
      Renewables: "#2e8b57",
    },
    xAxisDataType: "date_monthly",
    xAxisFormat: monthYearFormat,
    tooltipFormatter: (
      d: { date: number; [key: string]: number },
      _series: unknown,
      key: string
    ) =>
      `<div style="background:#fff;border:1px solid #ddd;border-radius:4px;padding:8px 10px;font:12px sans-serif">
        <strong>${key}</strong><br/>
        ${new Date(d.date).toLocaleDateString("en-US", { month: "short", year: "numeric" })}<br/>
        Share of generation: <strong>${d[key] ?? "N/A"}%</strong>
      </div>`,
  },
  parameters: {
    docs: {
      description: {
        story:
          "The stack shows the trend; hovering reveals the precise number behind it. A custom " +
          "`tooltipFormatter` lets you control exactly what shows on hover — here the hovered fuel source's " +
          "name, the month, and its share for that period.",
      },
    },
  },
};

// Interactive: isolate categories to read part-to-whole without the noise.
export const InteractiveHighlightAndToggle = {
  render: (args: React.ComponentProps<typeof AreaChart>) => {
    const [highlightedItems, setHighlightedItems] = useState<string[]>([]);
    const [disabledItems, setDisabledItems] = useState<string[]>([]);

    return (
      <div>
        <div style={{ marginBottom: 20 }}>
          <h3>Hover a band to highlight it; click a source button below to drop it from the stack</h3>
          <p>
            <strong>Highlighted:</strong>{" "}
            {highlightedItems.length > 0 ? highlightedItems.join(", ") : "None"}
          </p>
          <div style={{ display: "flex", gap: 10, marginTop: 5 }}>
            {args.keys.map((key: string) => (
              <button
                key={key}
                onClick={() =>
                  setDisabledItems(prev =>
                    prev.includes(key)
                      ? prev.filter(item => item !== key)
                      : [...prev, key]
                  )
                }
                style={{
                  padding: "5px 10px",
                  cursor: "pointer",
                  backgroundColor: disabledItems.includes(key) ? "#ccc" : "#1f77b4",
                  color: "white",
                  border: "none",
                  borderRadius: 4,
                  textDecoration: disabledItems.includes(key) ? "line-through" : "none",
                }}
              >
                {key}
              </button>
            ))}
          </div>
        </div>
        <AreaChart
          {...args}
          onHighlightItem={setHighlightedItems}
          highlightItems={highlightedItems}
          disabledItems={disabledItems}
        />
      </div>
    );
  },
  args: {
    ...commonProps,
    keys: energyMixKeys,
    series: energyMixSeries,
    title: "Generation Mix — Isolate a Source",
    colorsMapping: {
      Coal: "#5b5b5b",
      "Natural Gas": "#f4a259",
      Nuclear: "#8e44ad",
      Renewables: "#2e8b57",
    },
    xAxisDataType: "date_monthly",
    xAxisFormat: monthYearFormat,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Stacked charts can hide what each individual band is really doing — interaction fixes that. " +
          "Hover a band to highlight it, or click a source button below to drop it from the stack: turn off coal " +
          "and gas, for instance, and the renewables-versus-nuclear race emerges cleanly. Wires " +
          "`highlightItems` and `disabledItems` to local component state — the recommended pattern.",
      },
    },
  },
};

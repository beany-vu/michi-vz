import React from "react";
import DualHorizontalBarChart from "../src/components/DualHorizontalBarChart";
import { Meta } from "@storybook/react-webpack5";
import { fn } from "storybook/test";

// Storybook stories for the DualHorizontalBarChart component — a lean, curated
// showcase. Each story demonstrates a real two-sided comparison with realistic
// data, not exhaustive prop coverage.

// --- Shared data ------------------------------------------------------------

// Population by 5-year age band, in millions — the classic population-pyramid
// shape: `value1` (males) mirrors right, `value2` (females) mirrors left.
const populationPyramid = [
  { label: "0–14", value1: 31.2, value2: 29.8 },
  { label: "15–24", value1: 21.4, value2: 20.6 },
  { label: "25–44", value1: 38.9, value2: 38.1 },
  { label: "45–64", value1: 33.5, value2: 34.7 },
  { label: "65+", value1: 18.7, value2: 23.4 },
];

// Merchandise trade by sector, in USD billions — imports vs exports.
const tradeBySector = [
  { label: "Machinery & Electronics", value1: 412, value2: 318 },
  { label: "Mineral Fuels", value1: 287, value2: 96 },
  { label: "Vehicles", value1: 198, value2: 241 },
  { label: "Chemicals", value1: 164, value2: 173 },
  { label: "Agricultural Products", value1: 121, value2: 158 },
];

// --- Common props -----------------------------------------------------------

// Repeated args spread into each story.
//
// Left margin is wide (170px) because category labels like "Machinery &
// Electronics" or "Agricultural Products" need room to render in full — with
// the previous 50px margin they clipped to "ery & nics" / "ural Products".
const commonProps = {
  width: 900,
  height: 420,
  margin: { top: 50, right: 50, bottom: 50, left: 170 },
  xAxisDataType: "number" as const,
  xAxisFormat: (d: number | { valueOf(): number }) => `${d}`,
  yAxisFormat: (d: number | string) => `${d}`,
  // Chart renders the formatter's return value directly via React. Returning
  // an HTML string would be escaped as text; return a React element instead.
  tooltipFormatter: (d: { label: string; value1: number; value2: number } | undefined) => (
    <div
      style={{
        background: "#ffffff",
        padding: "8px 12px",
        border: "1px solid #e5e5e5",
        borderLeft: "3px solid #C84B3F",
        borderRadius: 2,
        font: '12px/1.4 "Helvetica Neue", Helvetica, Arial, sans-serif',
        color: "#0A0A0A",
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 4 }}>{d?.label}</div>
      <div style={{ color: "#525252" }}>Left: {d?.value2 ?? "N/A"}</div>
      <div style={{ color: "#525252" }}>Right: {d?.value1 ?? "N/A"}</div>
    </div>
  ),
  onHighlightItem: fn(),
  onChartDataProcessed: fn(),
  onColorMappingGenerated: fn(),
  onLegendDataChange: fn(),
};

export default {
  title: "Charts/Dual Horizontal Bar Chart",
  component: DualHorizontalBarChart,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "**DualHorizontalBarChart** plots two values per category — `value1` and `value2` — as bars mirrored left and right from a shared centre line. " +
          "It expects a `dataSet`: an array of `{ label, value1, value2 }` rows, with `value1` extending right and `value2` extending left. " +
          "Reach for it whenever a category has two directly comparable quantities and the gap or symmetry between them is the story: population pyramids (male vs female by age band), imports vs exports, before vs after, or any two-sided breakdown where a single bar would hide half the picture.",
      },
    },
  },
  args: {
    onHighlightItem: fn(),
    onChartDataProcessed: fn(),
    onColorMappingGenerated: fn(),
    onLegendDataChange: fn(),
  },
} as Meta;

// --- Stories ----------------------------------------------------------------

// Primary showcase: a population pyramid — the canonical use of this chart.
export const Primary = {
  args: {
    ...commonProps,
    dataSet: populationPyramid,
    title: "Population by Age Band — Males vs Females (millions)",
  },
  parameters: {
    docs: {
      description: {
        story:
          "A classic population pyramid — male counts grow rightward from the centre, female counts grow leftward, with age bands stacked vertically. The near-mirror at younger ages and the lopsided 65+ row (women outliving men) is exactly the kind of asymmetry this layout makes obvious at a glance.",
      },
    },
  },
};

// Imports vs exports — a trade-balance read.
export const TradeBalance = {
  args: {
    ...commonProps,
    dataSet: tradeBySector,
    title: "Merchandise Trade by Sector — Imports vs Exports (USD bn)",
  },
  parameters: {
    docs: {
      description: {
        story:
          "Imports stretch right, exports stretch left, one sector per row — so each row is a trade balance you can read without doing math. Mineral Fuels leans heavily on imports while Vehicles and Agricultural Products run a surplus, and the tilt direction tells you which way each sector trades.",
      },
    },
  },
};

// Ranking + trimming via the filter prop.
export const TopSectorsByImports = {
  args: {
    ...commonProps,
    dataSet: tradeBySector,
    title: "Top 3 Sectors by Import Value (USD bn)",
    filter: { limit: 3, criteria: "valueBased", sortingDir: "desc" },
  },
  parameters: {
    docs: {
      description: {
        story:
          "Same trade dataset, narrowed to just the three biggest import sectors so the leaders stand alone. The `filter` prop does the ranking and trimming for you — flip its `criteria` to `valueCompared` to rank by exports instead.",
      },
    },
  },
};

// Year-over-year comparison with a focused highlight.
export const YearOverYearComparison = {
  args: {
    ...commonProps,
    dataSet: [
      { label: "Coal", value1: 38.1, value2: 27.4 },
      { label: "Natural Gas", value1: 34.6, value2: 38.9 },
      { label: "Nuclear", value1: 19.5, value2: 18.2 },
      { label: "Wind", value1: 6.8, value2: 10.3 },
      { label: "Solar", value1: 2.3, value2: 5.9 },
    ],
    title: "Electricity Generation Mix — 2019 vs 2024 (% share)",
    highlightItems: ["Solar"],
  },
  parameters: {
    docs: {
      description: {
        story:
          "Each fuel's share of electricity in 2019 sits on the right, 2024 on the left, so the energy transition reads as a single shape — coal shrinking, wind and solar climbing. `highlightItems` dims everything except Solar, the way you'd spotlight the fastest mover in a briefing.",
      },
    },
  },
};

// Consistent coloring across a multi-chart dashboard.
export const SharedColorMapping = {
  args: {
    ...commonProps,
    dataSet: tradeBySector,
    title: "Trade by Sector — Pinned Sector Colors",
    colors: ["#e74c3c", "#3498db", "#2ecc71", "#f39c12", "#9b59b6"],
    colorsMapping: {
      "Machinery & Electronics": "#1f77b4",
      "Mineral Fuels": "#7f3f1f",
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          "Two sectors get hand-picked colours; the rest fall back to the default palette. Reuse the same `colorsMapping` across every chart in a dashboard and a given category keeps its colour everywhere — so a reader can follow it across views without re-learning the legend.",
      },
    },
  },
};

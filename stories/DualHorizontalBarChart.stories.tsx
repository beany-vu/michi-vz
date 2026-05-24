import React from "react";
import DualHorizontalBarChart from "../src/components/DualHorizontalBarChart";
import { Meta } from "@storybook/react";
import { fn } from "@storybook/test";

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
const commonProps = {
  width: 900,
  height: 400,
  margin: { top: 50, right: 50, bottom: 50, left: 50 },
  xAxisDataType: "number" as const,
  xAxisFormat: (d: number | { valueOf(): number }) => `${d}`,
  yAxisFormat: (d: number | string) => `${d}`,
  tooltipFormatter: (d: { label: string; value1: number; value2: number } | undefined) => `
    <div style="background: white; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
      <strong>${d?.label}</strong><br/>
      Left: ${d?.value2 || "N/A"}<br/>
      Right: ${d?.value1 || "N/A"}
    </div>
  `,
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
          "A population pyramid: males (`value1`) extend right, females (`value2`) extend left, mirrored from the centre. The near symmetry in younger bands and the female-heavy 65+ band — women outliving men — is exactly the kind of asymmetry this chart makes obvious at a glance. Hover a bar for the tooltip; click to pin it.",
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
          "Imports (`value1`, right) against exports (`value2`, left) by sector. Each row reads as a trade balance: Mineral Fuels leans heavily to imports, while Vehicles and Agricultural Products run a surplus. The mirrored layout turns 'which way does this sector tilt?' into a one-glance answer.",
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
          "The `filter` prop ranks rows by `value1` (`criteria: \"valueBased\"`, descending) and keeps only the top `limit` — here the three largest import sectors. Use it to surface the leaders of a long table without pre-trimming the data; switch to `criteria: \"valueCompared\"` to rank by `value2` instead.",
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
          "Generation mix in 2019 (`value1`, right) versus 2024 (`value2`, left). Reading the bars as a pair shows the energy transition in motion — coal shrinking, wind and solar climbing. `highlightItems` focuses one row (Solar) by dimming the rest, the way an analyst would spotlight the fastest-moving line in a briefing.",
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
          "`colorsMapping` pins explicit colors for specific sectors while the rest draw from the `colors` palette. Pass the same mapping to every chart in a dashboard so a given category keeps one color everywhere — letting a reader track it across views without re-learning the legend.",
      },
    },
  },
};

import React from "react";
import ComparableHorizontalBarChart from "../src/components/ComparableHorizontalBarChart";
import { Meta } from "@storybook/react-webpack5";
import { MichiVzProvider } from "../src/components/MichiVzProvider";
import { fn } from "storybook/test";
import { createHatchPattern } from "../src/components/hooks/canvas/createHatchPattern";

// Storybook stories for ComparableHorizontalBarChart — a lean, curated showcase.
// Each story pairs two values per category row (`valueBased` and `valueCompared`)
// to answer a real comparison question, not to exhaustively cover props.

// --- Shared data ------------------------------------------------------------

// Budget vs actual spend per department ($M) — the canonical use case: two
// values on one row so over/under-spend reads off the bar pair directly.
const budgetVsActual = [
  { label: "Engineering", valueBased: 12.4, valueCompared: 14.1 },
  { label: "Sales", valueBased: 9.8, valueCompared: 8.7 },
  { label: "Marketing", valueBased: 6.5, valueCompared: 7.9 },
  { label: "Customer Support", valueBased: 4.2, valueCompared: 4.0 },
  { label: "Research & Development", valueBased: 8.1, valueCompared: 9.6 },
  { label: "Operations", valueBased: 5.7, valueCompared: 5.3 },
];

// Revenue this year vs last year by product line ($M).
const yearOverYearRevenue = [
  { label: "Cloud Platform", valueBased: 142, valueCompared: 168 },
  { label: "Professional Services", valueBased: 88, valueCompared: 81 },
  { label: "Hardware", valueBased: 64, valueCompared: 59 },
  { label: "Licensing", valueBased: 47, valueCompared: 53 },
  { label: "Support Contracts", valueBased: 39, valueCompared: 44 },
];

// Net population change by region (%) — mix of growth and decline so bars
// diverge left and right of zero.
const netChangeByRegion = [
  { label: "Sub-Saharan Africa", valueBased: 22.4, valueCompared: 18.1 },
  { label: "South Asia", valueBased: 11.3, valueCompared: 7.6 },
  { label: "Latin America", valueBased: 6.2, valueCompared: 3.9 },
  { label: "Eastern Europe", valueBased: -4.8, valueCompared: -7.2 },
  { label: "East Asia", valueBased: 1.5, valueCompared: -2.3 },
];

const regionComparedColors: Record<string, string> = {
  "Sub-Saharan Africa": "#1f77b4",
  "South Asia": "#2ca02c",
  "Latin America": "#ff7f0e",
  "Eastern Europe": "#d62728",
  "East Asia": "#9467bd",
};

const regionBasedColors: Record<string, string> = {
  "Sub-Saharan Africa": "rgba(31, 119, 180, 0.35)",
  "South Asia": "rgba(44, 160, 44, 0.35)",
  "Latin America": "rgba(255, 127, 14, 0.35)",
  "Eastern Europe": "rgba(214, 39, 40, 0.35)",
  "East Asia": "rgba(148, 103, 189, 0.35)",
};

// Common props shared across stories — width/height/margin, callbacks and
// formatters. Spread into each story's `args`.
const commonProps = {
  width: 900,
  height: 400,
  margin: { top: 50, right: 50, bottom: 50, left: 180 },
  xAxisDataType: "number" as const,
  xAxisFormat: (d: number | { valueOf(): number }) => `${d}`,
  yAxisFormat: (d: number | string) => `${d}`,
  tooltipFormatter: (d: unknown) => {
    const item = d as { label: string; valueBased: number; valueCompared: number } | undefined;
    if (!item) return null;

    return (
      <div
        style={{
          background: "#fff",
          border: "1px solid #ddd",
          borderRadius: 4,
          padding: "8px 10px",
          font: '12px/1.4 "Helvetica Neue", Helvetica, Arial, sans-serif',
          color: "#0A0A0A",
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: 2 }}>{item.label}</div>
        <div style={{ color: "#525252" }}>Based: {item.valueBased}</div>
        <div style={{ color: "#525252" }}>Compared: {item.valueCompared}</div>
      </div>
    );
  },
  filter: { limit: 10, criteria: "valueBased" as const, sortingDir: "desc" as const },
  onChartDataProcessed: fn(),
  onLegendDataChange: fn(),
  onHighlightItem: fn(),
  onColorMappingGenerated: fn(),
};

export default {
  title: "Charts/Comparable Horizontal Bar Chart",
  component: ComparableHorizontalBarChart,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "**ComparableHorizontalBarChart** draws two values — `valueBased` and `valueCompared` — for every category, as a pair of horizontal bars sharing one row. " +
          "It expects a `dataSet` of `{ label, valueBased, valueCompared }` items; values may be positive or negative, in which case bars diverge left and right of a zero line. " +
          "Reach for it whenever the question is *how do these two numbers compare, per category* — budget vs actual, this year vs last year, target vs result, region A vs region B — where stacking the pair on one row makes the gap immediately readable.",
      },
    },
  },
  args: {
    showGrid: true,
  },
} as Meta;

// --- Stories ----------------------------------------------------------------

// Primary showcase: budget vs actual spend — the textbook two-values-per-row case.
export const Primary = {
  args: {
    ...commonProps,
    dataSet: budgetVsActual,
    title: "Budget vs Actual Spend by Department ($M)",
    xAxisPredefinedDomain: [0, 16],
    showGrid: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Each department gets a pair of bars: what was planned vs what was actually spent. Reading them side-by-side makes overspend jump out immediately — Engineering and R&D ran over, Sales and Operations came in under — without scanning a table of variances.",
      },
    },
  },
};

// Period-over-period comparison — the most common analyst lens.
export const YearOverYear = {
  args: {
    ...commonProps,
    dataSet: yearOverYearRevenue,
    title: "Revenue by Product Line — Last Year vs This Year ($M)",
    xAxisPredefinedDomain: [0, 180],
    showGrid: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Each product line shows last year's revenue beside this year's. The gap and direction between the two bars tells you instantly which lines grew (Cloud Platform, Licensing, Support) and which slipped (Professional Services, Hardware), no second trend chart needed.",
      },
    },
  },
};

// Negative values — bars diverge either side of a zero line.
export const DivergingValues = {
  render: (args: React.ComponentProps<typeof ComparableHorizontalBarChart>) => (
    <MichiVzProvider
      colorsMapping={regionComparedColors}
      colorsBasedMapping={regionBasedColors}
    >
      <ComparableHorizontalBarChart {...args} />
    </MichiVzProvider>
  ),
  args: {
    ...commonProps,
    dataSet: netChangeByRegion,
    title: "Net Population Change by Region — 2010s vs 2020s (%)",
    xAxisPredefinedDomain: [-12, 24],
    showGrid: true,
    showZeroLineForXAxis: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Decade-on-decade population change for each region, with growth pointing right and decline pointing left of zero. Growth is slowing everywhere — Eastern Europe's decline deepens and East Asia tips from growth into contraction — and `showZeroLineForXAxis` draws the baseline that anchors the read.",
      },
    },
  },
};

// Two dates per row — comparing timing rather than magnitude.
export const DateAxis = {
  args: {
    ...commonProps,
    dataSet: [
      { label: "Harbour Bridge Retrofit", valueBased: 2014, valueCompared: 2019 },
      { label: "Metro Line Extension", valueBased: 2016, valueCompared: 2023 },
      { label: "Airport Terminal C", valueBased: 2018, valueCompared: 2021 },
      { label: "Riverside Flood Defence", valueBased: 2012, valueCompared: 2017 },
    ],
    title: "Infrastructure Projects — Planned Start vs Completion Year",
    xAxisDataType: "number",
    xAxisPredefinedDomain: [2010, 2024],
    xAxisFormat: (d: number | { valueOf(): number }) => `${Math.round(Number(d))}`,
    filter: undefined,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Each row becomes a project timeline: the left bar marks the planned start year, the right bar the actual completion. The gap between them is how long the project ran, making the Metro Line Extension's seven-year stretch stand out. Uses a numeric year axis for reliable rendering and clean year ticks.",
      },
    },
  },
};

// Highlight / disable interaction, framed as exploring the comparison.
export const InteractiveExploration = {
  render: (args: Record<string, unknown>) => {
    const dataSet = args.dataSet as { label: string }[];
    const [highlightItems, setHighlightItems] = React.useState<string[]>([]);
    const [disabledItems, setDisabledItems] = React.useState<string[]>([]);

    const toggleDisabled = React.useCallback((label: string) => {
      setDisabledItems(prev =>
        prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
      );
    }, []);

    const labels = dataSet.map(d => d.label);

    return (
      <div style={{ padding: 20 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
          {labels.map(label => (
            <button
              key={label}
              onMouseEnter={() => setHighlightItems([label])}
              onMouseLeave={() => setHighlightItems([])}
              onClick={() => toggleDisabled(label)}
              style={{
                padding: "8px 16px",
                border: "1px solid #ccc",
                borderRadius: 4,
                cursor: "pointer",
                background: disabledItems.includes(label) ? "#f0f0f0" : "#fff",
                textDecoration: disabledItems.includes(label) ? "line-through" : "none",
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <ComparableHorizontalBarChart
          {...args}
          highlightItems={highlightItems}
          disabledItems={disabledItems}
        />
      </div>
    );
  },
  args: {
    ...commonProps,
    dataSet: budgetVsActual,
    title: "Budget vs Actual — Focus a Department",
    xAxisPredefinedDomain: [0, 16],
  },
  parameters: {
    docs: {
      description: {
        story:
          "Hover a department button to spotlight its bar pair, click to mute it out of the view entirely. Useful when walking an audience through one row at a time, or when dropping a dominant department lets the rest of the comparison rescale and breathe. Wires up `highlightItems` and `disabledItems`.",
      },
    },
  },
};

// Per-label diagonal-hatch pattern fills on the `valueBased` bar (canvas only).
const hatchColors = ["#2563eb", "#dc2626", "#16a34a", "#d97706", "#7c3aed", "#0891b2"];
export const CanvasPatternFills = {
  args: {
    ...commonProps,
    renderer: "canvas" as const,
    dataSet: budgetVsActual,
    title: "Budget vs Actual — Hatched valueBased Bars (canvas)",
    xAxisPredefinedDomain: [0, 16],
    showGrid: true,
    patternsMapping: budgetVsActual.reduce(
      (acc, d, i) => {
        acc[d.label] = createHatchPattern({ color: hatchColors[i % hatchColors.length] });
        return acc;
      },
      {} as Record<string, string>
    ),
  },
  parameters: {
    docs: {
      description: {
        story:
          "The \"planned\" bar in each pair is filled with a diagonal hatch while \"actual\" stays solid, giving the eye an extra cue for which bar is which before reading the legend. Hatching is canvas-only via `patternsMapping`; `createHatchPattern()` is a helper but any image URL works.",
      },
    },
  },
};

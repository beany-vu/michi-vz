import React from "react";
import ComparableHorizontalBarChart from "../src/components/ComparableHorizontalBarChart";
import { Meta } from "@storybook/react";
import { MichiVzProvider } from "../src/components/MichiVzProvider";
import { fn } from "@storybook/test";
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
    const item = d as { label: string; valueBased: number; valueCompared: number };
    return `<strong>${item.label}</strong><br/>Based: ${item.valueBased}<br/>Compared: ${item.valueCompared}`;
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
          "Planned budget (`valueBased`) against actual spend (`valueCompared`) for each department. Pairing the two bars on one row makes overspend obvious at a glance — Engineering and R&D ran over, Sales and Operations came in under. This is the question the chart exists to answer.",
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
          "The same metric across two periods: `valueBased` is last year, `valueCompared` is this year. Sorted by last year's revenue, the chart shows which lines grew (Cloud Platform, Licensing, Support) and which slipped (Professional Services, Hardware) without a separate trend chart.",
      },
    },
  },
};

// Negative values — bars diverge either side of a zero line.
export const DivergingValues = {
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
          "When values can be negative, bars diverge left and right of zero. Here decade-on-decade population change shows growth slowing everywhere, with Eastern Europe deepening its decline and East Asia crossing from growth into contraction. `showZeroLineForXAxis` emphasises the zero baseline that anchors the comparison.",
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
    xAxisDataType: "date_annual",
    xAxisFormat: (d: number | { valueOf(): number }) => `${d}`,
    filter: undefined,
  },
  parameters: {
    docs: {
      description: {
        story:
          "With `xAxisDataType=\"date_annual\"` the axis reads as years, so the bar pair spans a duration instead of a magnitude. Planned start vs completion year turns each row into a project timeline — the gap between bars is how long the project ran, making the Metro Line Extension's seven-year span stand out.",
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
          "Exploring the same budget-vs-actual data interactively: hover a department to highlight its bar pair via `highlightItems`, click to mute it via `disabledItems`. Useful for walking an audience through one row at a time, or dropping a department to rescale the rest of the comparison.",
      },
    },
  },
};

// Renderer parity check — the SVG and Canvas backends drawn from one dataset.
export const RendererComparison = {
  render: (args: Record<string, unknown>) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 32, padding: 20 }}>
      <div>
        <h4 style={{ margin: "0 0 8px", font: "600 13px sans-serif" }}>renderer="svg"</h4>
        <ComparableHorizontalBarChart
          {...(args as React.ComponentProps<typeof ComparableHorizontalBarChart>)}
          renderer="svg"
        />
      </div>
      <div>
        <h4 style={{ margin: "0 0 8px", font: "600 13px sans-serif" }}>renderer="canvas"</h4>
        <ComparableHorizontalBarChart
          {...(args as React.ComponentProps<typeof ComparableHorizontalBarChart>)}
          renderer="canvas"
        />
      </div>
    </div>
  ),
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
          "Parity check: the identical budget-vs-actual dataset rendered with `renderer=\"svg\"` (the default, retained SVG <rect> pairs) and `renderer=\"canvas\"` (the opt-in Canvas 2D backend) stacked together. Both should be visually identical — same bar geometry, conditional z-order, dual-source colours, rounded corners and highlight dimming — and behave identically on hover, click-to-pin tooltip and `onHighlightItem`. The canvas backend draws the two bars per item onto a single <canvas>, cutting the DOM node count for large datasets while the axes, title and tooltip stay in the SVG/HTML layer above.",
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
          "`patternsMapping` fills each `valueBased` bar with a tiled diagonal-hatch pattern generated by `createHatchPattern()`, while the `valueCompared` bar stays solid. Pattern fills apply only to `renderer=\"canvas\"` — the SVG renderer ignores the prop. The pattern source is any image URL or data-URI; `createHatchPattern` is just a convenience generator for the common hatch case.",
      },
    },
  },
};

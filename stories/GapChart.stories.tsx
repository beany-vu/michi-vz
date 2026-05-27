import React from "react";
import type { Meta, StoryObj } from "@storybook/react-webpack5";
import { GapChart, MichiVzProvider } from "../src/components";
import { fn } from "storybook/test";

// Storybook stories for the GapChart component — a lean, curated showcase.
// Each story demonstrates a real analytical use case (the gap between two
// values per category) with realistic, well-labelled data, not exhaustive
// prop coverage.

// --- Shared data ------------------------------------------------------------

// Tourism recovery dataset: international tourist arrivals (millions) per
// destination. `value1` is the 2019 pre-pandemic baseline, `value2` the 2023
// figure. `difference` (value1 - value2) is the still-unrecovered arrivals —
// the "recovery gap" — and drives sorting when a `filter` is supplied.
const tourismRecoveryData = [
  { label: "France", value1: 90.0, value2: 100.0 },
  { label: "Spain", value1: 83.5, value2: 85.1 },
  { label: "United States", value1: 79.4, value2: 66.5 },
  { label: "Italy", value1: 64.5, value2: 57.2 },
  { label: "Turkey", value1: 51.2, value2: 55.2 },
  { label: "Mexico", value1: 45.0, value2: 42.2 },
  { label: "Germany", value1: 39.6, value2: 34.8 },
  { label: "United Kingdom", value1: 40.9, value2: 37.2 },
  { label: "Greece", value1: 31.3, value2: 32.7 },
  { label: "Austria", value1: 31.9, value2: 30.2 },
  { label: "Japan", value1: 31.9, value2: 25.1 },
  { label: "Thailand", value1: 39.8, value2: 28.2 },
  { label: "China", value1: 65.7, value2: 35.5 },
  { label: "Canada", value1: 22.1, value2: 18.3 },
  { label: "Portugal", value1: 24.6, value2: 26.5 },
].map(item => ({
  ...item,
  difference: item.value1 - item.value2,
  date: "2023",
}));

// Gender pay gap dataset: median gross hourly earnings (EUR) by occupation.
// `value1` is the male median, `value2` the female median; `difference` is the
// raw pay gap in EUR per hour.
const payGapData = [
  { label: "Financial Services", value1: 38.4, value2: 28.9 },
  { label: "Information & Communication", value1: 34.7, value2: 29.1 },
  { label: "Manufacturing", value1: 27.3, value2: 22.6 },
  { label: "Professional & Scientific", value1: 33.1, value2: 27.8 },
  { label: "Public Administration", value1: 26.9, value2: 24.5 },
  { label: "Health & Social Work", value1: 25.4, value2: 21.2 },
  { label: "Education", value1: 28.0, value2: 25.3 },
  { label: "Wholesale & Retail", value1: 21.7, value2: 17.9 },
  { label: "Transport & Storage", value1: 23.2, value2: 21.4 },
  { label: "Accommodation & Food", value1: 16.8, value2: 15.1 },
].map(item => ({
  ...item,
  difference: item.value1 - item.value2,
  date: "2023",
}));

// Budget performance dataset: full-year departmental spend (USD millions).
// `value1` is the approved budget, `value2` the actual spend; `difference`
// (budget - actual) is the underspend, or overspend when negative.
const budgetData = [
  { label: "Research & Development", value1: 48.0, value2: 52.4 },
  { label: "Sales & Marketing", value1: 36.5, value2: 33.1 },
  { label: "Engineering", value1: 61.2, value2: 59.8 },
  { label: "Customer Support", value1: 22.0, value2: 24.7 },
  { label: "Operations", value1: 29.4, value2: 26.0 },
  { label: "Human Resources", value1: 14.8, value2: 13.2 },
  { label: "Facilities", value1: 18.6, value2: 21.9 },
  { label: "Legal & Compliance", value1: 11.3, value2: 10.1 },
].map(item => ({
  ...item,
  difference: item.value1 - item.value2,
  date: "2023",
}));

// --- Shared props -----------------------------------------------------------

// Common props shared by every story. Spread into each story's `args` and
// overridden as needed.
const commonProps = {
  colors: ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#06b6d4"],
  shapeValue1: "circle" as const,
  shapeValue2: "circle" as const,
  shapesLabelsMapping: {
    value1: "2019 baseline",
    value2: "2023 arrivals",
    gap: "Recovery gap",
  },
  xAxisDataType: "number" as const,
  xAxisFormat: (d: number) => `${d}mn`,
  width: 1000,
  height: 600,
  margin: { top: 50, right: 150, bottom: 100, left: 170 },
  filter: undefined,
  onHighlightItem: fn(),
  onChartDataProcessed: fn(),
  onLegendDataChange: fn(),
  onColorMappingGenerated: fn(),
};

const meta = {
  title: "Charts/Gap Chart",
  component: GapChart,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "**GapChart** plots two values for each category and the bar that connects them — the go-to view for *gap analysis*: " +
          "actual vs target, before vs after, this year vs last, or one group against another. Each category gets a marker per value " +
          "(circle / square / triangle) and a connecting bar whose length *is* the gap, so the eye reads the difference directly. " +
          "It expects a `dataSet` of `{ label, value1, value2, difference, date }` rows, where `difference` is `value1 - value2`. " +
          "Reach for it when the story is the distance between two numbers — not the numbers themselves — and a `filter` can rank " +
          "categories by the widest (or narrowest) gap.",
      },
    },
  },
  decorators: [
    Story => (
      <MichiVzProvider colors={["#2563eb", "#dc2626", "#16a34a", "#ca8a04", "#9333ea", "#0891b2"]}>
        <Story />
      </MichiVzProvider>
    ),
  ],
  argTypes: {
    filter: { description: "Limit and sort the displayed data", control: "object" },
    shapesLabelsMapping: {
      description: "Legend labels for each shape and the gap",
      control: "object",
    },
    shapeValue1: {
      description: "Shape for the first value marker",
      control: { type: "select" },
      options: ["circle", "square", "triangle"],
    },
    shapeValue2: {
      description: "Shape for the second value marker",
      control: { type: "select" },
      options: ["circle", "square", "triangle"],
    },
  },
  args: commonProps,
} satisfies Meta<typeof GapChart>;

export default meta;
type Story = StoryObj<typeof meta>;

// --- Stories ----------------------------------------------------------------

// Primary showcase: tourism recovery — 2019 baseline vs 2023 arrivals.
export const TourismRecoveryGap: Story = {
  args: {
    ...commonProps,
    dataSet: tourismRecoveryData,
    title: "Tourist Arrivals: 2019 Baseline vs 2023 Recovery",
  },
  parameters: {
    docs: {
      description: {
        story:
          "Each destination shows its 2019 pre-pandemic peak and its 2023 figure, with a bar between them measuring how far recovery still has to go. " +
          "Asia-Pacific markets (China, Japan, Thailand) carry the widest gaps while France, Spain and Greece have already pulled level or ahead — the bar lengths rank the recovery story without anyone needing to do mental subtraction.",
      },
    },
  },
};

// Ranking the widest gaps with the `filter` prop.
export const WidestRecoveryGaps: Story = {
  args: {
    ...commonProps,
    dataSet: tourismRecoveryData,
    title: "Eight Destinations With the Most Ground to Recover",
    filter: {
      limit: 8,
      date: "2023",
      criteria: "difference",
      sortingDir: "desc",
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          "The same data, narrowed to the eight destinations furthest from recovery. The `filter` prop ranks by the gap itself and keeps the top N, so the chart answers 'who is furthest behind?' directly — flip `sortingDir` to `asc` to flip the question to 'who has bounced back hardest?', or set `criteria` to `value1` / `value2` to rank by raw size instead.",
      },
    },
  },
};

// Gender pay gap — male vs female median earnings per occupation.
export const GenderPayGap: Story = {
  args: {
    ...commonProps,
    dataSet: payGapData,
    title: "Gender Pay Gap by Sector — Median Hourly Earnings",
    xAxisFormat: (d: number) => `€${d}`,
    shapeValue1: "circle",
    shapeValue2: "triangle",
    shapesLabelsMapping: {
      value1: "Male median",
      value2: "Female median",
      gap: "Pay gap (€/hr)",
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          "Median hourly pay for men vs women across ten sectors, with the bar between the two markers measuring the raw pay gap. Financial Services and Information & Communication carry the widest disparities while Accommodation & Food sits closest to parity — the eye reads the bar length directly without comparing two columns of numbers. " +
          "Different marker shapes (`shapeValue1` circle, `shapeValue2` triangle) keep the two groups distinguishable even where the values almost overlap.",
      },
    },
  },
};

// Budget vs actual — over- and underspend in one view.
export const BudgetVsActual: Story = {
  args: {
    ...commonProps,
    dataSet: budgetData,
    title: "Departmental Budget vs Actual Spend (FY2023)",
    xAxisFormat: (d: number) => `$${d}M`,
    height: 460,
    margin: { top: 50, right: 150, bottom: 100, left: 190 },
    shapeValue1: "square",
    shapeValue2: "circle",
    shapesLabelsMapping: {
      value1: "Approved budget",
      value2: "Actual spend",
      gap: "Variance",
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          "Approved budget vs actual spend per department, with the connecting bar reading directly as the variance. Where the actual sits past the budget the team overspent (R&D, Customer Support, Facilities); where it falls short they underspent — one scan tells a finance lead which departments need a follow-up conversation.",
      },
    },
  },
};

// Marker shapes — one styling demo that doubles as a meaningful comparison.
export const ShapeStyling: Story = {
  args: {
    ...commonProps,
    dataSet: tourismRecoveryData.slice(0, 10),
    title: "Choosing Marker Shapes for Two Series",
    shapeValue1: "square",
    shapeValue2: "triangle",
    shapesLabelsMapping: {
      value1: "2019 baseline",
      value2: "2023 arrivals",
      gap: "Recovery gap",
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          "The same tourism dataset, with different marker shapes for each value. Pairing distinct shapes (square for the 2019 baseline, triangle for 2023) keeps the two series legible when their markers land close together or overlap — a more accessible cue than colour alone. " +
          "Set independently via `shapeValue1` and `shapeValue2` (`circle` / `square` / `triangle`).",
      },
    },
  },
};


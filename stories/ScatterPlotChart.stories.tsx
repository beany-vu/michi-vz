import React from "react";
import ScatterPlot from "../src/components/ScatterPlotChart";
import { Meta } from "@storybook/react-webpack5";
import { fn } from "storybook/test";

// Storybook stories for the ScatterPlotChart component — a lean, analyst-curated
// set. Each story demonstrates a real analytical use: spotting a correlation,
// encoding a third metric as bubble size, or surfacing clusters and outliers.

// --- Shared data ------------------------------------------------------------

// Country-level development indicators (2021, World Bank / UN figures, rounded).
// x = GDP per capita ($k PPP), y = life expectancy (years), d = population (millions).
// A classic two-metric correlation with population as the bubble dimension.
const countryDevelopment = [
  { date: "2021", x: 69.3, y: 76.3, d: 332, label: "United States", color: "#1F77B4" },
  { date: "2021", x: 17.6, y: 78.2, d: 1412, label: "China", color: "#D62728" },
  { date: "2021", x: 7.2, y: 67.2, d: 1408, label: "India", color: "#FF7F0E" },
  { date: "2021", x: 54.0, y: 81.0, d: 83, label: "Germany", color: "#2CA02C" },
  { date: "2021", x: 42.9, y: 84.5, d: 125, label: "Japan", color: "#9467BD" },
  { date: "2021", x: 14.9, y: 72.8, d: 214, label: "Brazil", color: "#8C564B" },
  { date: "2021", x: 27.9, y: 70.1, d: 144, label: "Russia", color: "#E377C2" },
  { date: "2021", x: 13.0, y: 66.1, d: 213, label: "Nigeria", color: "#BCBD22" },
  { date: "2021", x: 49.0, y: 83.0, d: 26, label: "Australia", color: "#17BECF" },
  { date: "2021", x: 5.5, y: 64.1, d: 109, label: "Ethiopia", color: "#7F7F7F" },
];

// Mid-range SUV models (2023 US market). x = starting price ($k), y = owner
// satisfaction (0-100), d = annual units sold (thousands). Shows price/quality
// trade-off with sales volume as the third dimension.
const suvModels = [
  { x: 28.6, y: 82, d: 351, label: "Toyota RAV4", color: "#1F77B4" },
  { x: 28.4, y: 79, d: 393, label: "Honda CR-V", color: "#FF7F0E" },
  { x: 27.5, y: 71, d: 196, label: "Ford Escape", color: "#2CA02C" },
  { x: 26.6, y: 68, d: 152, label: "Chevrolet Equinox", color: "#D62728" },
  { x: 31.2, y: 88, d: 124, label: "Subaru Outback", color: "#9467BD" },
  { x: 45.9, y: 91, d: 87, label: "BMW X3", color: "#8C564B" },
  { x: 44.5, y: 86, d: 78, label: "Audi Q5", color: "#E377C2" },
  { x: 27.0, y: 65, d: 110, label: "Nissan Rogue", color: "#BCBD22" },
];

// Sales reps positioned by deal activity. x = deals closed, y = avg deal size
// ($k), d = total revenue ($k). Two natural clusters: high-volume/low-value
// "transactional" reps vs low-volume/high-value "enterprise" reps.
const salesReps = [
  { x: 62, y: 4.1, d: 254, label: "Transactional: Rivera", shape: "circle" as const },
  { x: 58, y: 3.8, d: 220, label: "Transactional: Okafor", shape: "circle" as const },
  { x: 71, y: 4.5, d: 320, label: "Transactional: Lindqvist", shape: "circle" as const },
  { x: 66, y: 3.5, d: 231, label: "Transactional: Tanaka", shape: "circle" as const },
  { x: 9, y: 47.0, d: 423, label: "Enterprise: Adeyemi", shape: "square" as const },
  { x: 12, y: 39.5, d: 474, label: "Enterprise: Novak", shape: "square" as const },
  { x: 7, y: 52.0, d: 364, label: "Enterprise: Costa", shape: "square" as const },
  { x: 11, y: 44.0, d: 484, label: "Enterprise: Haddad", shape: "square" as const },
  { x: 38, y: 12.0, d: 456, label: "Outlier: Bergström", shape: "triangle" as const },
];

// --- Common props -----------------------------------------------------------

// Repeated args shared by the args-based stories.
const commonProps = {
  width: 900,
  height: 500,
  margin: { top: 50, right: 60, bottom: 60, left: 70 },
  xAxisDataType: "number" as const,
  onChartDataProcessed: fn(),
  onHighlightItem: fn(),
  onColorMappingGenerated: fn(),
};

export default {
  title: "Charts/Scatter Plot",
  component: ScatterPlot,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "**ScatterPlotChart** plots one record per point in x/y space, making it the go-to chart for revealing the *relationship between two metrics*: correlation, clustering, and outliers. " +
          "Each datum needs `x` and `y`; an optional `d` value drives **bubble size** so you can layer in a third dimension, and an optional per-point `shape` (circle / square / triangle) encodes a category. " +
          "Points may carry their own `color`, or colours are auto-generated per `label`. An optional `date` field enables the `filter` prop (e.g. keep the top N by a criterion). " +
          "Reach for it when you want to ask *\"does X move with Y, and where do the exceptions sit?\"* rather than tracking a value over time.",
      },
    },
  },
  args: {
    onChartDataProcessed: fn(),
    onHighlightItem: fn(),
    onColorMappingGenerated: fn(),
  },
} as Meta;

// --- Stories ----------------------------------------------------------------

// Primary showcase: the classic wealth-vs-health correlation with population
// encoded as bubble size — the canonical "why you'd use a bubble plot" example.
export const WealthVsHealth = {
  args: {
    ...commonProps,
    dataSet: countryDevelopment,
    title: "GDP per Capita vs Life Expectancy (2021)",
    xAxisFormat: (d: number | string) => `$${d}k`,
    yAxisFormat: (d: number | string) => `${d} yrs`,
    yAxisDomain: [60, 88] as [number, number],
    showGrid: { x: true, y: true },
    dScaleLegend: {
      title: "Population",
      valueFormatter: (d: number) => `${Math.round(d)}M`,
    },
    tooltipFormatter: (d: { label: string; x: number; y: number; d: number }) =>
      `<strong>${d.label}</strong><br/>GDP/capita: $${d.x}k · Life exp: ${d.y} yrs<br/>Population: ${d.d}M`,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Each country is a bubble: position shows income (rightward) and life expectancy (upward), bubble size shows population. Wealth and longevity rise together along a clear curve, but the huge India and China bubbles sit low on the income axis, and Japan floats above the trend as the longevity outlier.",
      },
    },
  },
};

// Price-vs-quality trade-off with sales volume as bubble size.
export const PriceVsSatisfaction = {
  args: {
    ...commonProps,
    dataSet: suvModels,
    title: "SUV Price vs Owner Satisfaction (2023 US market)",
    xAxisFormat: (d: number | string) => `$${d}k`,
    yAxisFormat: (d: number | string) => `${d}/100`,
    yAxisDomain: [60, 95] as [number, number],
    showGrid: { x: true, y: true },
    dScaleLegend: {
      title: "Units sold",
      valueFormatter: (d: number) => `${Math.round(d)}k`,
    },
    tooltipFormatter: (d: { label: string; x: number; y: number; d: number }) =>
      `<strong>${d.label}</strong><br/>Price: $${d.x}k · Satisfaction: ${d.y}/100<br/>Units sold: ${d.d}k`,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Each SUV is plotted by price (right) and owner satisfaction (up), with bubble size showing how many sold. Satisfaction rises with price toward the premium German badges, but the biggest bubbles cluster in the affordable / high-satisfaction sweet spot. The pricey models trade volume for ratings.",
      },
    },
  },
};

// Per-point shapes encode a category, revealing two distinct clusters.
export const ClustersAndOutlier = {
  args: {
    ...commonProps,
    dataSet: salesReps,
    title: "Sales Reps: Deal Volume vs Deal Size",
    xAxisFormat: (d: number | string) => `${d}`,
    yAxisFormat: (d: number | string) => `$${d}k`,
    showGrid: { x: true, y: true },
    dScaleLegend: {
      title: "Total revenue",
      valueFormatter: (d: number) => `$${Math.round(d)}k`,
    },
    tooltipFormatter: (d: { label: string; x: number; y: number; d: number }) =>
      `<strong>${d.label}</strong><br/>Deals closed: ${d.x} · Avg size: $${d.y}k<br/>Total revenue: $${d.d}k`,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Sales reps split into two clear groups: transactional reps (circles, bottom-right) close many small deals, enterprise reps (squares, top-left) close few big ones. The lone triangle is the outlier doing both, and its large bubble (total revenue) shows that hybrid style out-earns either cluster. Per-point `shape` drives the marker.",
      },
    },
  },
};

// Custom size legend rendered via dScaleLegendFormatter.
export const CustomSizeLegend = {
  args: {
    ...commonProps,
    dataSet: countryDevelopment,
    title: "GDP per Capita vs Life Expectancy: Custom Size Legend",
    xAxisFormat: (d: number | string) => `$${d}k`,
    yAxisFormat: (d: number | string) => `${d} yrs`,
    yAxisDomain: [60, 88] as [number, number],
    showGrid: { x: true, y: true },
    tooltipFormatter: (d: { label: string; x: number; y: number; d: number }) =>
      `<strong>${d.label}</strong><br/>GDP/capita: $${d.x}k · Life exp: ${d.y} yrs<br/>Population: ${d.d}M`,
    dScaleLegendFormatter: (domain: number[]) => (
      <text x={680} y={70} fontSize={12} fill="#444">
        {`Bubble = population: ${Math.round(domain[0])}M – ${Math.round(domain[1])}M`}
      </text>
    ),
  },
  parameters: {
    docs: {
      description: {
        story:
          "Same wealth-vs-health bubbles, but the \"what does bubble size mean\" label is rendered by your own code, a plain-English note instead of the default key. Useful when a house style or non-technical audience needs the encoding spelled out. Driven by `dScaleLegendFormatter`.",
      },
    },
  },
};

// Crosshair lines + pin indicator — hover to see axis guides, click to lock.
export const WithCrosshairAndPin = {
  args: {
    ...commonProps,
    dataSet: countryDevelopment,
    title: "GDP per Capita vs Life Expectancy: Crosshair & Pin",
    xAxisFormat: (d: number | string) => `$${d}k`,
    yAxisFormat: (d: number | string) => `${d} yrs`,
    yAxisDomain: [60, 88] as [number, number],
    showGrid: { x: true, y: true },
    showCrosshair: true,
    crosshairLabels: true,
    pinIcon: "📌",
    dScaleLegend: {
      title: "Population",
      valueFormatter: (d: number) => `${Math.round(d)}M`,
    },
    tooltipFormatter: (d: { label: string; x: number; y: number; d: number }) =>
      `<strong>${d.label}</strong><br/>GDP/capita: $${d.x}k · Life exp: ${d.y} yrs<br/>Population: ${d.d}M`,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Hover any bubble to see dashed crosshair lines with axis value badges. Click to pin: lines turn solid, a ring appears, and a 📌 marks the bubble. Click more bubbles to pin multiple for comparison. Click a pinned bubble to unpin it; click empty space to clear all. Driven by `showCrosshair`, `crosshairLabels`, and `pinIcon`.",
      },
    },
  },
};

// Filtering a larger set down to the points worth comparing.
export const TopByPopulation = {
  args: {
    ...commonProps,
    dataSet: countryDevelopment,
    title: "Five Most Populous Countries: Wealth vs Health",
    xAxisFormat: (d: number | string) => `$${d}k`,
    yAxisFormat: (d: number | string) => `${d} yrs`,
    yAxisDomain: [60, 88] as [number, number],
    showGrid: { x: true, y: true },
    dScaleLegend: {
      title: "Population",
      valueFormatter: (d: number) => `${Math.round(d)}M`,
    },
    tooltipFormatter: (d: { label: string; x: number; y: number; d: number }) =>
      `<strong>${d.label}</strong><br/>GDP/capita: $${d.x}k · Life exp: ${d.y} yrs<br/>Population: ${d.d}M`,
    filter: { limit: 5, date: "2021", criteria: "d" as const, sortingDir: "desc" as const },
  },
  parameters: {
    docs: {
      description: {
        story:
          "The same country dataset narrowed to the five most populous, so the giants tell their own story without the smaller economies crowding the view. The contrast between low-income India and the wealthier, longer-lived US and Japan becomes the headline. Trimming handled by the `filter` prop.",
      },
    },
  },
};

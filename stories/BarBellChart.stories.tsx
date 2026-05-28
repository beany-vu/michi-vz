import React, { useState } from "react";
import { Meta } from "@storybook/react-webpack5";
import { fn } from "storybook/test";
import BarBellChart from "../src/components/BarBellChart";
import { MichiVzProvider } from "../src/components";

// Storybook stories for the BarBellChart component — a lean, curated showcase.
// Each story demonstrates a real analytical use case with realistic data,
// not exhaustive prop coverage.

// --- Shared data ------------------------------------------------------------

// Hiring funnel by department: each row is a team, each key a recruiting stage.
// The segments laid end-to-end show how many candidates clear each stage —
// the visible "reach" of each colour tells you where the pipeline narrows.
const hiringFunnelData = [
  { date: "Engineering", applied: 1240, screened: 380, interviewed: 145, hired: 28 },
  { date: "Product", applied: 620, screened: 210, interviewed: 88, hired: 17 },
  { date: "Design", applied: 410, screened: 160, interviewed: 64, hired: 12 },
  { date: "Data Science", applied: 530, screened: 175, interviewed: 70, hired: 14 },
  { date: "Sales", applied: 980, screened: 420, interviewed: 190, hired: 41 },
  { date: "Customer Support", applied: 760, screened: 340, interviewed: 155, hired: 33 },
];

// Cross-country, cross-quarter rows keyed by "country | quarter". Each row
// breaks a clean-water infrastructure programme into its three delivery
// phases, so an analyst can compare phase mix across markets at a glance.
const programmePhaseData = [
  { date: "Kenya | Q1", design: 320, construction: 1450, commissioning: 280 },
  { date: "Kenya | Q2", design: 180, construction: 1980, commissioning: 540 },
  { date: "Ethiopia | Q1", design: 410, construction: 1120, commissioning: 190 },
  { date: "Ethiopia | Q2", design: 260, construction: 1670, commissioning: 430 },
  { date: "Tanzania | Q1", design: 290, construction: 980, commissioning: 150 },
  { date: "Tanzania | Q2", design: 210, construction: 1540, commissioning: 380 },
  { date: "Rwanda | Q1", design: 350, construction: 1340, commissioning: 240 },
  { date: "Rwanda | Q2", design: 190, construction: 2010, commissioning: 610 },
];

// Renewable build-out by country: capacity (MW) installed across three
// technologies. Used to show filter (sort + limit) and legend metadata.
const energyMixData = [
  { date: "Germany", solar: 6800, wind: 9400, hydro: 1200 },
  { date: "Spain", solar: 5200, wind: 7100, hydro: 2800 },
  { date: "France", solar: 3100, wind: 4200, hydro: 5400 },
  { date: "Italy", solar: 4700, wind: 2300, hydro: 3900 },
  { date: "Netherlands", solar: 3900, wind: 6200, hydro: 100 },
  { date: "Poland", solar: 2400, wind: 3800, hydro: 800 },
  { date: "Sweden", solar: 900, wind: 5100, hydro: 6700 },
  { date: "Portugal", solar: 2100, wind: 3300, hydro: 2900 },
  { date: "Denmark", solar: 1600, wind: 7800, hydro: 50 },
  { date: "Greece", solar: 3400, wind: 2700, hydro: 1100 },
];

// --- Common props -----------------------------------------------------------

// Repeated args shared across the args-based stories.
const commonProps = {
  keys: ["applied", "screened", "interviewed", "hired"],
  width: 900,
  height: 460,
  margin: { top: 50, right: 50, bottom: 50, left: 200 },
  // Round non-integer ticks — d3's auto-ticks on a 0..~2700 domain at 6
  // increments emit `333.3333333333333` etc. Floor to integer for axis labels.
  xAxisFormat: (d: number | string) =>
    typeof d === "number" ? `${Math.round(d)}` : `${d}`,
  yAxisFormat: (d: number | string) => `${d}`,
  showGrid: { x: true, y: false },
  onChartDataProcessed: fn(),
  onHighlightItem: fn(),
  onColorMappingGenerated: fn(),
};

export default {
  title: "Charts/Bar Bell Chart",
  component: BarBellChart,
  tags: ["autodocs"],
  decorators: [
    Story => (
      <MichiVzProvider>
        <Story />
      </MichiVzProvider>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          "**BarBellChart** lays the values of one row end-to-end as a sequence of horizontal bar segments, each capped with a circular bell marker, one row per category. " +
          "It expects a `dataSet` of objects keyed by a `date` label plus one numeric field per stage, and a `keys` array naming those stages in order. " +
          "Because the segments are concatenated, the chart reads as both a per-stage breakdown *and* a cumulative total, making it ideal for funnels, multi-phase programmes, or any process where you want to compare the stage mix across many categories at once.",
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

// Primary showcase: a recruiting funnel — the canonical "reach for this chart"
// case where each segment is a stage in a sequential process.
export const Primary = {
  args: {
    ...commonProps,
    dataSet: hiringFunnelData,
    title: "Hiring Funnel by Department (candidates per stage)",
  },
  parameters: {
    docs: {
      description: {
        story:
          "A recruiting funnel by department: applications, screens, interviews and hires laid end-to-end as one bar per team. The total bar length is each department's overall throughput, and the coloured segments show where the pipeline narrows: Sales runs the largest funnel, Design the smallest. Hover any segment for the stage count.",
      },
    },
  },
};

// Process breakdown across countries, keyed by "country | quarter".
export const ProgrammePhasesByCountry = {
  args: {
    ...commonProps,
    dataSet: programmePhaseData,
    keys: ["design", "construction", "commissioning"],
    title: "Clean-Water Programme Delivery by Country & Quarter ($000s)",
    showGrid: { x: true, y: true },
  },
  parameters: {
    docs: {
      description: {
        story:
          "Spend on a clean-water programme across four countries and two quarters, broken into design, construction and commissioning phases. The chart answers two questions at once: which markets are scaling up (longer Q2 bars), and which are actually delivering. A healthy commissioning band means projects are coming online; a row still dominated by design is stuck on paper.",
      },
    },
  },
};

// Two-stage comparison with a value-suffixed axis.
export const InterviewToOfferConversion = {
  args: {
    ...commonProps,
    dataSet: hiringFunnelData.map(({ applied, screened, ...rest }) => rest),
    keys: ["interviewed", "hired"],
    title: "Interview-to-Hire Conversion by Department",
    xAxisFormat: (d: number | string) =>
      typeof d === "number" ? `${Math.round(d)} people` : `${d}`,
    showGrid: { x: true, y: false },
  },
  parameters: {
    docs: {
      description: {
        story:
          "Zooming the same funnel down to just its final two stages, interviews and hires, to focus on the question that matters most to a hiring manager: how often does an interview turn into an offer? The short trailing band visualises the conversion gap directly: wide bands mean interviews rarely close; thin bands mean the team converts efficiently.",
      },
    },
  },
};

// Filter (sort + limit) plus colour/legend round-trip on a larger dataset.
export const RankedByInstalledCapacity = {
  render: (args: React.ComponentProps<typeof BarBellChart>) => {
    const [filter, setFilter] = useState({ criteria: "wind", sortingDir: "desc", limit: 6 });
    const [colorsMapping, setColorsMapping] = useState<{ [key: string]: string }>({});
    const [legendData, setLegendData] = useState<
      { label: string; color: string; order: number }[]
    >([]);
    const [disabledItems, setDisabledItems] = useState<string[]>([]);

    const toggleDisabled = (label: string) =>
      setDisabledItems(prev =>
        prev.includes(label) ? prev.filter(i => i !== label) : [...prev, label]
      );

    return (
      <div>
        <div style={{ marginBottom: 20, padding: 10, border: "1px solid #ddd", borderRadius: 4 }}>
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "center" }}>
            <label>
              Rank by{" "}
              <select
                value={filter.criteria}
                onChange={e => setFilter(p => ({ ...p, criteria: e.target.value }))}
              >
                <option value="wind">Wind capacity</option>
                <option value="solar">Solar capacity</option>
                <option value="hydro">Hydro capacity</option>
              </select>
            </label>
            <label>
              Direction{" "}
              <select
                value={filter.sortingDir}
                onChange={e => setFilter(p => ({ ...p, sortingDir: e.target.value }))}
              >
                <option value="desc">Leaders first</option>
                <option value="asc">Laggards first</option>
              </select>
            </label>
            <label>
              Show{" "}
              <select
                value={filter.limit}
                onChange={e => setFilter(p => ({ ...p, limit: parseInt(e.target.value, 10) }))}
              >
                <option value={5}>Top 5</option>
                <option value={6}>Top 6</option>
                <option value={10}>All 10</option>
              </select>
            </label>
          </div>
          <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
            {legendData.map(item => (
              <span
                key={item.label}
                onClick={() => toggleDisabled(item.label)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  cursor: "pointer",
                  fontSize: 12,
                  textDecoration: disabledItems.includes(item.label) ? "line-through" : "none",
                }}
              >
                <span
                  style={{ width: 12, height: 12, background: item.color, border: "1px solid #ccc" }}
                />
                #{item.order + 1} {item.label}
              </span>
            ))}
          </div>
        </div>
        <BarBellChart
          {...args}
          filter={filter}
          colorsMapping={colorsMapping}
          disabledItems={disabledItems}
          onChartDataProcessed={metadata => {
            if (metadata.legendData) setLegendData(metadata.legendData);
          }}
          onColorMappingGenerated={setColorsMapping}
        />
      </div>
    );
  },
  args: {
    ...commonProps,
    dataSet: energyMixData,
    keys: ["solar", "wind", "hydro"],
    height: 520,
    margin: { top: 50, right: 50, bottom: 50, left: 150 },
    title: "Renewable Capacity by Country (MW installed)",
    xAxisFormat: (d: number | string) => `${(Number(d) / 1000).toFixed(1)} GW`,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Ten European countries' renewable build-out, rankable on the fly: pick a technology and the leaders rise to the top, while the segment mix still tells the wider story. Sweden's long hydro band and Denmark's wind-heavy profile stay visible throughout. The dropdowns drive the `filter` prop; the legend chips toggle technologies via `disabledItems`.",
      },
    },
  },
};

// Interactive: external highlight state driven by hover buttons.
export const FocusASingleStage = {
  render: (args: React.ComponentProps<typeof BarBellChart>) => {
    const [highlightItems, setHighlightItems] = useState<string[]>([]);
    return (
      <div>
        <div style={{ marginBottom: 20, display: "flex", gap: 10, flexWrap: "wrap" }}>
          {args.keys.map(key => (
            <button
              key={key}
              style={{
                padding: "8px 16px",
                backgroundColor: highlightItems.includes(key) ? "#007bff" : "#f8f9fa",
                color: highlightItems.includes(key) ? "white" : "#333",
                border: "1px solid #dee2e6",
                borderRadius: 4,
                cursor: "pointer",
              }}
              onMouseEnter={() => setHighlightItems([key])}
              onMouseLeave={() => setHighlightItems([])}
            >
              {key}
            </button>
          ))}
        </div>
        <BarBellChart {...args} highlightItems={highlightItems} onHighlightItem={setHighlightItems} />
      </div>
    );
  },
  args: {
    ...commonProps,
    dataSet: hiringFunnelData,
    title: "Hiring Funnel: Focus a Single Stage",
  },
  parameters: {
    docs: {
      description: {
        story:
          "When every row has several coloured segments, it's hard to compare just one stage across departments. Highlighting solves that. Hover a stage button and every other band dims, so the `interviewed` band (for example) can be compared cleanly across all teams. Uses `highlightItems` for input and `onHighlightItem` to keep an external legend in sync.",
      },
    },
  },
};

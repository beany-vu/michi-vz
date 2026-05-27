import React, { useState, useCallback } from "react";
import RibbonChart from "../src/components/RibbonChart";
import { MichiVzProvider } from "../src/components/MichiVzProvider";
import { Meta } from "@storybook/react-webpack5";
import { fn } from "storybook/test";

// Storybook stories for the RibbonChart component.
//
// A RibbonChart draws one stacked bar per period and joins matching categories
// across periods with curved "ribbons". Reading left-to-right, the ribbons make
// it obvious how each category's *share* of the whole grows, shrinks, and
// re-ranks over time — something a plain stacked bar chart hides.
//
// Data shape: `series` is an array of objects, one per period, each with a
// numeric `date` plus one numeric field per category; `keys` lists the category
// field names to stack. Reach for it when you want to show ranked composition
// and how that composition flows between a handful of time points.
//
// Note: RibbonChart reads `colorsMapping` from MichiVzProvider context, not from
// props. Stories therefore set colours via the `MichiVzProvider` decorator below.

// --- Shared data ------------------------------------------------------------

// World electricity generation mix, share of total (%), 2010-2023.
// Source-style figures: coal declining, gas steady, renewables (wind + solar)
// climbing fast and overtaking — a textbook re-ranking story.
const energyKeys = ["coal", "naturalGas", "hydro", "nuclear", "windSolar"];

const energySeries = [
  { date: 2010, coal: 40.4, naturalGas: 22.1, hydro: 16.2, nuclear: 12.9, windSolar: 1.8 },
  { date: 2014, coal: 40.8, naturalGas: 21.6, hydro: 16.4, nuclear: 10.6, windSolar: 4.9 },
  { date: 2018, coal: 38.0, naturalGas: 23.0, hydro: 15.8, nuclear: 10.1, windSolar: 8.6 },
  { date: 2023, coal: 35.5, naturalGas: 22.5, hydro: 14.3, nuclear: 9.1, windSolar: 13.4 },
];

const energyColors = {
  coal: "#5D5D5D",
  naturalGas: "#E8A33D",
  hydro: "#2A6F97",
  nuclear: "#9B5DE5",
  windSolar: "#4CB944",
};

// EU goods imports by trading partner, share of extra-EU total (%).
// China overtaking the US, post-Brexit UK share, and others — a partner
// re-ranking story across four years.
const tradeKeys = ["china", "unitedStates", "unitedKingdom", "switzerland", "restOfWorld"];

const tradeSeries = [
  { date: 2017, china: 20.1, unitedStates: 13.8, unitedKingdom: 11.9, switzerland: 5.7, restOfWorld: 48.5 },
  { date: 2019, china: 18.7, unitedStates: 12.0, unitedKingdom: 9.6, switzerland: 5.9, restOfWorld: 53.8 },
  { date: 2021, china: 22.4, unitedStates: 11.0, unitedKingdom: 6.9, switzerland: 5.6, restOfWorld: 54.1 },
  { date: 2023, china: 20.5, unitedStates: 13.5, unitedKingdom: 6.4, switzerland: 5.8, restOfWorld: 53.8 },
];

const tradeColors = {
  china: "#D7263D",
  unitedStates: "#1B6CA8",
  unitedKingdom: "#3E5C3A",
  switzerland: "#E8A33D",
  restOfWorld: "#B0B0B0",
};

// --- Common props -----------------------------------------------------------

// Shared layout / callback args spread into every story.
const commonProps = {
  keys: energyKeys,
  series: energySeries,
  width: 900,
  height: 400,
  margin: { top: 50, right: 60, bottom: 65, left: 70 },
  yAxisFormat: (d: number) => `${d}%`,
  onChartDataProcessed: fn(),
  onHighlightItem: fn(),
  onLegendDataChange: fn(),
};

export default {
  title: "Charts/Ribbon Chart",
  component: RibbonChart,
  tags: ["autodocs"],
  decorators: [
    Story => (
      <MichiVzProvider colorsMapping={energyColors}>
        <Story />
      </MichiVzProvider>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          "**RibbonChart** draws one stacked bar per period and joins each category " +
          "across periods with a curved ribbon, so you can see at a glance how a " +
          "category's *share of the whole* rises, falls, and re-ranks over time. " +
          "It expects `series` — one object per period with a numeric `date` and one " +
          "numeric field per category — plus a `keys` list naming the categories to " +
          "stack. Reach for it when the story is about **ranked composition flowing " +
          "between a few time points** (energy mix by year, market share by quarter, " +
          "budget allocation by cycle) rather than absolute trends, which a line chart " +
          "shows better.",
      },
    },
  },
  args: {
    onChartDataProcessed: fn(),
    onHighlightItem: fn(),
    onLegendDataChange: fn(),
  },
} as Meta;

// --- Stories ----------------------------------------------------------------

// Primary showcase: the global electricity mix re-ranking over 13 years.
export const Primary = {
  args: {
    ...commonProps,
    title: "World Electricity Generation Mix, 2010-2023 (% of total)",
  },
  parameters: {
    docs: {
      description: {
        story:
          "How the world's electricity mix has shifted between 2010 and 2023, with each " +
          "year as a stacked bar and curved ribbons linking each fuel between years. The " +
          "coal ribbon narrows from 40% to 36% while wind + solar fans out from under 2% to " +
          "over 13%, visibly climbing past nuclear — a rank change a bar chart would hide. " +
          "Colours come from `colorsMapping` on the surrounding `MichiVzProvider`.",
      },
    },
  },
};

// Cross-period re-ranking on a second realistic dataset.
export const CompositionReRanking = {
  args: {
    ...commonProps,
    keys: tradeKeys,
    series: tradeSeries,
    title: "EU Goods Imports by Partner, 2017-2023 (% of extra-EU total)",
    xAxisFormat: (d: string | number) => `'${String(d).slice(2)}`,
  },
  decorators: [
    Story => (
      <MichiVzProvider colorsMapping={tradeColors}>
        <Story />
      </MichiVzProvider>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story:
          "How the EU's biggest trading partners have re-ordered themselves since 2017. " +
          "The UK ribbon collapses from ~12% to ~6% post-Brexit while China's swells and " +
          "the US stays roughly flat — the crossing and thinning ribbons make the reshuffle " +
          "obvious in a way separate bar charts would not. `xAxisFormat` shortens the year " +
          "ticks to `'17`, `'19` etc.",
      },
    },
  },
};

// Custom tooltip surfacing the exact shares behind a stack.
export const ReadableTooltip = {
  args: {
    ...commonProps,
    title: "World Electricity Mix — Detailed Tooltip",
    tooltipContent: (data: { date: number; [key: string]: number | undefined }) => `
      <div style="background:#fff;padding:8px 10px;min-width:180px;font:12px/1.5 sans-serif">
        <strong>${data.date}</strong>
        <div>Coal: ${data.coal ?? "N/A"}%</div>
        <div>Natural gas: ${data.naturalGas ?? "N/A"}%</div>
        <div>Hydro: ${data.hydro ?? "N/A"}%</div>
        <div>Nuclear: ${data.nuclear ?? "N/A"}%</div>
        <div>Wind + solar: ${data.windSolar ?? "N/A"}%</div>
      </div>`,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Ribbons show the shape of the shift; an analyst still needs the exact " +
          "numbers. `tooltipContent` replaces the built-in tooltip with a full " +
          "per-year breakdown, so hovering any stack reveals every category's share " +
          "for that period without leaving the chart.",
      },
    },
  },
};

// Focus the eye by dimming and dropping categories.
export const FocusOnCategory = {
  args: {
    ...commonProps,
    title: "Isolating the Renewables Story",
    highlightItems: ["windSolar"],
    disabledItems: ["nuclear", "hydro"],
  },
  parameters: {
    docs: {
      description: {
        story:
          "Two ways to cut through a busy stack at once. `highlightItems` spotlights the " +
          "wind + solar ribbon and fades the rest so the growth story pops, while " +
          "`disabledItems` removes hydro and nuclear entirely and rebases the y-scale to " +
          "what's left — useful when you want to compare a subset of the mix on its own " +
          "terms.",
      },
    },
  },
};

// Exploratory analysis: let the reader drive the highlight / disable state.
export const InteractiveExploration = {
  render: (args: { keys: string[]; [key: string]: unknown }) => {
    const [highlightItems, setHighlightItems] = useState<string[]>([]);
    const [disabledItems, setDisabledItems] = useState<string[]>([]);

    const toggleDisabled = useCallback((key: string) => {
      setDisabledItems(prev =>
        prev.includes(key) ? prev.filter(item => item !== key) : [...prev, key]
      );
    }, []);

    return (
      <div style={{ padding: 20 }}>
        <div style={{ marginBottom: 16 }}>
          <strong>Spotlighted:</strong>{" "}
          {highlightItems.length > 0 ? highlightItems.join(", ") : "None"}
          {"  |  "}
          <strong>Excluded:</strong>{" "}
          {disabledItems.length > 0 ? disabledItems.join(", ") : "None"}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
          {args.keys.map((key: string) => (
            <button
              key={key}
              onMouseEnter={() => setHighlightItems([key])}
              onMouseLeave={() => setHighlightItems([])}
              onClick={() => toggleDisabled(key)}
              style={{
                padding: "8px 16px",
                border: "1px solid #ccc",
                borderRadius: 4,
                cursor: "pointer",
                background: disabledItems.includes(key) ? "#f0f0f0" : "#fff",
                color: disabledItems.includes(key) ? "#999" : "#000",
                textDecoration: disabledItems.includes(key) ? "line-through" : "none",
              }}
            >
              {key}
            </button>
          ))}
        </div>
        <RibbonChart {...args} highlightItems={highlightItems} disabledItems={disabledItems} />
      </div>
    );
  },
  args: {
    ...commonProps,
    title: "Explore the Electricity Mix",
  },
  parameters: {
    docs: {
      description: {
        story:
          "The chart wired for exploration: hover a button to spotlight one fuel's ribbon, " +
          "click to remove it and rebase the stack on what's left. This is how analysts " +
          "actually use the chart in practice — focus on one fuel, then strip it out to " +
          "compare the others without its weight skewing the view.",
      },
    },
  },
};

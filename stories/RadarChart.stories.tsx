import React, { useCallback, useState } from "react";
import { Meta, StoryObj } from "@storybook/react-webpack5";
import { fn } from "storybook/test";
import { RadarChart } from "../src/components/RadarChart";

// Storybook stories for the RadarChart component — a lean, analyst-curated set.
// Each story answers "this is when you'd reach for a radar chart": comparing a
// few entities across several shared dimensions to read profile shape, balance,
// strengths and gaps at a glance.

// --- Shared data ------------------------------------------------------------

// Build a series from a metric-keyed score object. Every series in a chart must
// share the same axis labels (the radial "poles"); here each axis is a metric.
const seriesFrom = (label: string, scores: Record<string, number>, color?: string) => ({
  label,
  ...(color ? { color } : {}),
  data: Object.entries(scores).map(([date, value]) => ({ date, value: String(value) })),
});

// Smartphone review scores (0–10) across six product dimensions. Two phones
// with clearly different shapes — one is a balanced all-rounder, the other
// trades battery and value for camera and display.
const phoneAxes = ["Camera", "Battery", "Display", "Performance", "Build", "Value"];

const phoneComparison = [
  seriesFrom(
    "Pixel Pro",
    { Camera: 9.4, Battery: 6.8, Display: 8.6, Performance: 8.2, Build: 8.0, Value: 6.5 },
    "#1F77B4"
  ),
  seriesFrom(
    "Galaxy Ultra",
    { Camera: 8.7, Battery: 8.9, Display: 9.2, Performance: 9.0, Build: 8.5, Value: 7.8 },
    "#D62728"
  ),
];

// City livability scores (0–10) across six dimensions used by relocation and
// urban-planning comparisons. Auto-coloured so the colour-mapping pipeline runs.
const livabilityAxes = [
  "Affordability",
  "Safety",
  "Healthcare",
  "Transit",
  "Culture",
  "Climate",
];

const cityLivability = [
  seriesFrom("Vienna", {
    Affordability: 6.2,
    Safety: 8.8,
    Healthcare: 9.1,
    Transit: 9.0,
    Culture: 8.7,
    Climate: 6.4,
  }),
  seriesFrom("Singapore", {
    Affordability: 4.1,
    Safety: 9.5,
    Healthcare: 8.9,
    Transit: 9.3,
    Culture: 7.2,
    Climate: 5.0,
  }),
  seriesFrom("Lisbon", {
    Affordability: 7.5,
    Safety: 7.9,
    Healthcare: 7.0,
    Transit: 6.8,
    Culture: 8.3,
    Climate: 8.6,
  }),
];

// A decathlete's normalised performance index (0–10) across the ten events,
// shown solo to read where a single athlete is strong vs. weak.
const decathlonAxes = [
  "100m",
  "Long Jump",
  "Shot Put",
  "High Jump",
  "400m",
  "Hurdles",
  "Discus",
  "Pole Vault",
  "Javelin",
  "1500m",
];

const decathlonProfile = [
  seriesFrom(
    "Athlete: Season Best",
    {
      "100m": 8.9,
      "Long Jump": 8.4,
      "Shot Put": 6.1,
      "High Jump": 7.2,
      "400m": 8.7,
      Hurdles: 8.1,
      Discus: 5.8,
      "Pole Vault": 6.5,
      Javelin: 7.0,
      "1500m": 6.8,
    },
    "#2CA02C"
  ),
];

// Two job candidates rated 1–5 against an interview rubric — a hiring panel's
// "who is stronger where" comparison.
const rubricAxes = [
  "Coding",
  "System Design",
  "Communication",
  "Domain Knowledge",
  "Collaboration",
  "Leadership",
];

const candidateComparison = [
  seriesFrom(
    "Candidate A",
    {
      Coding: 4.6,
      "System Design": 3.8,
      Communication: 3.2,
      "Domain Knowledge": 4.1,
      Collaboration: 3.5,
      Leadership: 2.8,
    },
    "#9467BD"
  ),
  seriesFrom(
    "Candidate B",
    {
      Coding: 3.4,
      "System Design": 4.2,
      Communication: 4.7,
      "Domain Knowledge": 3.0,
      Collaboration: 4.5,
      Leadership: 4.3,
    },
    "#FF7F0E"
  ),
];

// --- Common props -----------------------------------------------------------

// Standard `poles` config: axes evenly spaced around the full circle, with a
// radial domain that runs from the rim (10) to the centre (0).
const makePoles = (labels: string[]) => ({
  range: [0, Math.PI * 2],
  domain: [10, 0],
  labels,
});

// Shared args spread into every story.
const commonProps = {
  width: 520,
  height: 520,
  poles: makePoles(phoneAxes),
  // Stringify the radial axis ticks with at most one decimal — otherwise non-
  // round domains (e.g. decathlete 0..10 / 6 ticks) print `7.223188405797102`.
  radialLabelFormatter: (item: number) =>
    Number.isInteger(item) ? `${item}` : item.toFixed(1),
  tooltipFormatter: (item: { date: string; value: number }) => (
    <div>
      <strong>{item.date}</strong>
      <br />
      Score: {item.value}
    </div>
  ),
  onHighlightItem: fn(),
  onChartDataProcessed: fn(),
  onColorMappingGenerated: fn(),
};

export default {
  title: "Charts/Radar Chart",
  component: RadarChart,
  tags: ["autodocs"],
  args: commonProps,
  parameters: {
    docs: {
      description: {
        component:
          "**RadarChart** plots each series as a closed polygon over a shared set of " +
          "radial axes (the *poles*). Every series supplies one value per axis; the " +
          "distance of each vertex from the centre encodes that value, so the polygon's " +
          "*shape* reveals an entity's overall profile: balanced, lopsided, strong or weak. " +
          "It expects a `series` array (each with a `label` and a `data` array of " +
          "`{ date, value }` points, one per pole) plus a `poles` config defining the axes. " +
          "Reach for it to compare a handful of entities across several comparable metrics " +
          "and read strengths, gaps and trade-offs at a glance. It works best with **few " +
          "series (2–4) and few axes (5–10)**. Beyond that the overlapping polygons become " +
          "hard to read.",
      },
    },
  },
} as Meta<typeof RadarChart>;

type Story = StoryObj<typeof RadarChart>;

// --- Stories ----------------------------------------------------------------

// Primary showcase: two products, one comparison, six axes — the classic radar
// use case where shape difference carries the insight.
export const ProductComparison: Story = {
  args: {
    series: phoneComparison,
    poles: makePoles(phoneAxes),
    showFilled: true,
    fillOpacity: 0.25,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Two smartphones scored 0–10 on the same six review dimensions, with each phone's " +
          "scores drawn as a filled shape. The bigger and rounder the shape, the better the " +
          "all-round product: the Galaxy Ultra spreads further on every side, while the Pixel " +
          "Pro leans hard on Camera and pulls in on Battery and Value. `showFilled` turns the " +
          "outlines into shaded areas so the 'who covers more ground' read is immediate.",
      },
    },
  },
};

// Profile / strengths-and-gaps read on a single entity.
export const PerformanceProfile: Story = {
  args: {
    series: decathlonProfile,
    poles: makePoles(decathlonAxes),
    showFilled: true,
    fillOpacity: 0.35,
  },
  parameters: {
    docs: {
      description: {
        story:
          "One decathlete's scores across all ten events, drawn as a single shape. The long " +
          "reach on sprints and jumps and the obvious dents on Shot Put and Discus point " +
          "straight at where training should focus. A single-shape radar answers 'where is " +
          "this person strong vs. weak?' rather than 'who wins?'.",
      },
    },
  },
};

// Multi-entity comparison with auto-generated colours and renamed axes.
export const CityLivability: Story = {
  args: {
    series: cityLivability,
    poles: makePoles(livabilityAxes),
    showFilled: true,
    fillOpacity: 0.18,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Three cities scored on six livability dimensions, each city drawn as its own shape " +
          "in an auto-assigned colour. Each city has a recognisable silhouette: Singapore " +
          "leans hard on Safety and Transit but pinches in on Affordability, while Lisbon " +
          "trades infrastructure for Climate. Three shapes is around the practical ceiling; " +
          "a fourth tends to muddy the overlap.",
      },
    },
  },
};

// Head-to-head decision support — hiring panel rubric.
export const CandidateScorecard: Story = {
  args: {
    series: candidateComparison,
    poles: makePoles(rubricAxes),
    showFilled: true,
    fillOpacity: 0.22,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Two interview candidates rated 1–5 against a six-point rubric, drawn as " +
          "overlapping shapes. The two profiles interlock: Candidate A owns the technical " +
          "sides, Candidate B owns Communication, Collaboration and Leadership, which " +
          "reframes the hiring decision from 'who scored higher overall' to 'which shape " +
          "fits the role'.",
      },
    },
  },
};

// Interactive legend — kept because it teaches how an analyst explores the
// chart: isolating series, highlighting, and reading the emitted legend data.
export const InteractiveLegend: Story = {
  args: {
    series: cityLivability,
    poles: makePoles(livabilityAxes),
    showFilled: true,
    fillOpacity: 0.2,
  },
  render: args => {
    const [highlightItems, setHighlightItems] = useState<string[]>([]);
    const [disabledItems, setDisabledItems] = useState<string[]>([]);
    const [colorsMapping, setColorsMapping] = useState<{ [key: string]: string }>({});
    const [legendData, setLegendData] = useState<
      { label: string; color: string; disabled?: boolean }[]
    >([]);

    const handleColorMappingGenerated = useCallback((mapping: { [key: string]: string }) => {
      setColorsMapping(prev =>
        JSON.stringify(prev) === JSON.stringify(mapping) ? prev : mapping
      );
    }, []);

    const handleChartDataProcessed = useCallback(
      (metadata: { legendData?: typeof legendData }) => {
        if (metadata.legendData) setLegendData(metadata.legendData);
      },
      []
    );

    const toggleDisabled = useCallback((label: string) => {
      setDisabledItems(prev =>
        prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
      );
    }, []);

    return (
      <div style={{ padding: 20 }}>
        <div style={{ marginBottom: 16 }}>
          <strong>Highlighted:</strong> {highlightItems.join(", ") || "None"} •{" "}
          <strong>Hidden:</strong> {disabledItems.join(", ") || "None"}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
          {(args.series ?? []).map(s => (
            <button
              key={s.label}
              onClick={() => toggleDisabled(s.label)}
              onMouseEnter={() => setHighlightItems([s.label])}
              onMouseLeave={() => setHighlightItems([])}
              style={{
                padding: "6px 12px",
                border: "1px solid #ccc",
                borderRadius: 4,
                cursor: "pointer",
                backgroundColor: disabledItems.includes(s.label) ? "#f0f0f0" : "#fff",
                textDecoration: disabledItems.includes(s.label) ? "line-through" : "none",
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  width: 10,
                  height: 10,
                  marginRight: 6,
                  background: colorsMapping[s.label] ?? "#ccc",
                }}
              />
              {s.label}
            </button>
          ))}
        </div>
        <RadarChart
          {...args}
          highlightItems={highlightItems}
          disabledItems={disabledItems}
          colorsMapping={colorsMapping}
          onHighlightItem={setHighlightItems}
          onColorMappingGenerated={handleColorMappingGenerated}
          onChartDataProcessed={handleChartDataProcessed}
        />
        <pre style={{ fontSize: 11, background: "#f5f5f5", padding: 10, marginTop: 12 }}>
          {JSON.stringify(legendData, null, 2)}
        </pre>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "How analysts actually work a radar: hover a button to spotlight one city and fade " +
          "the others, or click to hide it and compare just the rest. Peeling shapes off one " +
          "at a time is the standard fix for the radar's main weakness: too much overlap. " +
          "The emitted legend data (via `onChartDataProcessed`) is dumped below for wiring " +
          "up external legends.",
      },
    },
  },
};

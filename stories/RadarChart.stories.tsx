import React, { useCallback, useState } from "react";
import { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
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
    "Athlete — Season Best",
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
  radialLabelFormatter: (item: number) => `${item}`,
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
          "*shape* reveals an entity's overall profile — balanced, lopsided, strong or weak. " +
          "It expects a `series` array (each with a `label` and a `data` array of " +
          "`{ date, value }` points, one per pole) plus a `poles` config defining the axes. " +
          "Reach for it to compare a handful of entities across several comparable metrics " +
          "and read strengths, gaps and trade-offs at a glance. It works best with **few " +
          "series (2–4) and few axes (5–10)** — beyond that the overlapping polygons become " +
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
          "Two smartphones scored 0–10 across six review dimensions. The radar makes the " +
          "trade-off obvious: the Pixel Pro spikes on Camera but caves in on Battery and " +
          "Value, while the Galaxy Ultra draws a fuller, more balanced polygon. The filled " +
          "areas make the 'which phone covers more ground' read immediate — exactly the " +
          "moment a radar chart earns its place over a bar chart.",
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
          "A single decathlete's normalised index (0–10) across all ten events. With one " +
          "series the polygon becomes a *profile*: the long reach on sprints and jumps and " +
          "the dents on Shot Put and Discus instantly flag where training should focus. " +
          "Use a solo radar when the question is 'where is this entity strong vs. weak?' " +
          "rather than 'who wins?'.",
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
          "Three cities scored across six livability dimensions, with colours auto-assigned " +
          "(no per-series `color`). Each city has a distinct silhouette — Singapore leans " +
          "Safety and Transit but is squeezed on Affordability, while Lisbon trades " +
          "infrastructure for Climate and value. Three series is near the practical ceiling: " +
          "the polygons still separate cleanly, but a fourth would start to muddy the read.",
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
          "Two interview candidates rated 1–5 against a six-point rubric. The two polygons " +
          "are near mirror images: Candidate A owns the technical axes, Candidate B owns " +
          "Communication, Collaboration and Leadership. When two profiles interlock like " +
          "this, the radar reframes the decision from 'who scored higher' to 'which shape " +
          "fits the role'.",
      },
    },
  },
};

// Parity check: the SAME dataset rendered with both backends, stacked, so the
// opt-in Canvas renderer can be visually diffed against the SVG renderer.
export const RendererComparison: Story = {
  args: {
    series: phoneComparison,
    poles: makePoles(phoneAxes),
    showFilled: true,
    fillOpacity: 0.25,
  },
  render: args => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 24 }}>
      <div>
        <h4 style={{ textAlign: "center", margin: "0 0 8px" }}>renderer=&quot;svg&quot;</h4>
        <RadarChart {...args} renderer="svg" />
      </div>
      <div>
        <h4 style={{ textAlign: "center", margin: "0 0 8px" }}>renderer=&quot;canvas&quot;</h4>
        <RadarChart {...args} renderer="canvas" />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Feature-parity check for the opt-in Canvas 2D renderer (Phase 4 of the " +
          "performance overhaul). The same two-phone comparison is drawn twice — once with " +
          "the default `renderer=\"svg\"` and once with `renderer=\"canvas\"`. The two " +
          "polygons, fills, pole points, highlight dimming and tooltips should look and " +
          "behave identically; the canvas path replaces the per-series SVG nodes with a " +
          "single <canvas> while the radial grid and pole/ring labels stay SVG.",
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
          "How an analyst actually works a radar: hover a city button to highlight its " +
          "polygon and fade the rest, or click to hide it and isolate the remaining " +
          "comparison. Toggling series one at a time is the practical fix for the radar's " +
          "main weakness — overlap. The emitted legend data (from `onChartDataProcessed`) " +
          "is shown below for wiring up an external legend.",
      },
    },
  },
};

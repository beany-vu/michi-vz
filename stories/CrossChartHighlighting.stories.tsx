import React, { useState } from "react";
import type { Meta } from "@storybook/react-webpack5";
import { fn } from "storybook/test";
import {
  LineChart,
  ComparableHorizontalBarChart,
  MichiVzProvider,
} from "../src/components";

// Cross-chart highlighting: two charts share a single `highlightItems` slice of
// state. Hovering a series in either chart writes to that state via the
// chart's `onHighlightItem` callback, which the other chart consumes through
// its `highlightItems` prop and uses to dim everything else.
//
// The pairing is LineChart (trend over time) + ComparableHorizontalBarChart
// (start vs end snapshot). Same six G7 labels on both axes — the highlight
// handoff works because the label space is identical.

export default {
  title: "Examples/Cross-Chart Highlighting",
  parameters: {
    docs: {
      description: {
        component:
          "How to wire two (or more) charts together so that hovering one **highlights the matching series in the others**. " +
          "Hoist `highlightItems` to a parent component, pass it down to each chart, and route the chart's `onHighlightItem` callback back into the same state. " +
          "Every chart accepts the same shape (`string[]` of label names) so the wiring is identical regardless of which charts you're pairing.",
      },
    },
  },
} as Meta;

// --- Shared dataset ---------------------------------------------------------
//
// G7 renewable-electricity story, told two ways with one shared label space:
//   • LineChart: yearly share, 2017–2023 (one series per country)
//   • ComparableHorizontalBarChart: 2017 baseline vs 2023 latest (one row
//     per country, two bars per row)
// Because the two charts label by the same six country names, hovering a
// country on either side propagates the highlight to the other.

const countryColors = {
  Germany: "#1f77b4",
  France: "#2ca02c",
  Italy: "#9467bd",
  Japan: "#ff7f0e",
  "United Kingdom": "#17becf",
  Canada: "#8c564b",
};

const renewableShareSeries = [
  {
    label: "Germany",
    shape: "circle",
    color: countryColors.Germany,
    series: [
      { date: "2017", value: 33.3, certainty: true },
      { date: "2018", value: 35.2, certainty: true },
      { date: "2019", value: 40.2, certainty: true },
      { date: "2020", value: 43.6, certainty: true },
      { date: "2021", value: 40.9, certainty: true },
      { date: "2022", value: 44.4, certainty: true },
      { date: "2023", value: 51.8, certainty: true },
    ],
  },
  {
    label: "United Kingdom",
    shape: "square",
    color: countryColors["United Kingdom"],
    series: [
      { date: "2017", value: 29.3, certainty: true },
      { date: "2018", value: 33.1, certainty: true },
      { date: "2019", value: 36.9, certainty: true },
      { date: "2020", value: 43.1, certainty: true },
      { date: "2021", value: 39.6, certainty: true },
      { date: "2022", value: 41.5, certainty: true },
      { date: "2023", value: 46.4, certainty: true },
    ],
  },
  {
    label: "Italy",
    shape: "triangle",
    color: countryColors.Italy,
    series: [
      { date: "2017", value: 33.5, certainty: true },
      { date: "2018", value: 34.2, certainty: true },
      { date: "2019", value: 35.0, certainty: true },
      { date: "2020", value: 37.4, certainty: true },
      { date: "2021", value: 36.3, certainty: true },
      { date: "2022", value: 35.9, certainty: true },
      { date: "2023", value: 43.8, certainty: true },
    ],
  },
  {
    label: "France",
    shape: "circle",
    color: countryColors.France,
    series: [
      { date: "2017", value: 19.9, certainty: true },
      { date: "2018", value: 20.8, certainty: true },
      { date: "2019", value: 22.7, certainty: true },
      { date: "2020", value: 24.5, certainty: true },
      { date: "2021", value: 23.4, certainty: true },
      { date: "2022", value: 25.3, certainty: true },
      { date: "2023", value: 28.1, certainty: true },
    ],
  },
  {
    label: "Canada",
    shape: "square",
    color: countryColors.Canada,
    series: [
      { date: "2017", value: 65.5, certainty: true },
      { date: "2018", value: 66.1, certainty: true },
      { date: "2019", value: 67.0, certainty: true },
      { date: "2020", value: 67.9, certainty: true },
      { date: "2021", value: 68.3, certainty: true },
      { date: "2022", value: 68.0, certainty: true },
      { date: "2023", value: 68.7, certainty: true },
    ],
  },
  {
    label: "Japan",
    shape: "triangle",
    color: countryColors.Japan,
    series: [
      { date: "2017", value: 17.4, certainty: true },
      { date: "2018", value: 19.0, certainty: true },
      { date: "2019", value: 19.4, certainty: true },
      { date: "2020", value: 21.7, certainty: true },
      { date: "2021", value: 22.4, certainty: true },
      { date: "2022", value: 22.7, certainty: true },
      { date: "2023", value: 24.7, certainty: true },
    ],
  },
];

// 2017 baseline vs 2023 latest — derived from the same series above so the
// numbers can't drift apart. ComparableHorizontalBarChart reads `valueBased`
// as the "anchor" bar and `valueCompared` as the second; we read them as
// "2017" and "2023" via the tooltip and the panel sub-title.
const startVsEndShare = renewableShareSeries.map(s => ({
  label: s.label,
  valueBased: s.series[0].value,
  valueCompared: s.series[s.series.length - 1].value,
}));

// --- Styles -----------------------------------------------------------------
//
// Swiss-poster chrome: pure-white panels with a 2px red bar on the left,
// 2px corner radius, Helvetica, near-black ink. Per-country line colours stay
// varied so the data stays readable; restraint is on the chrome only.
const layoutStyles = `
  .ccl-dashboard {
    display: grid;
    grid-template-columns: 1fr;
    gap: 24px;
    padding: 4px 0 24px;
    font-family: "Helvetica Neue", Helvetica, "Arimo", "Liberation Sans", Arial, sans-serif;
  }
  .ccl-panel {
    position: relative;
    border: 1px solid #E5E5E5;
    border-radius: 2px;
    padding: 22px 28px 18px;
    background: #FFFFFF;
  }
  .ccl-panel::before {
    content: "";
    position: absolute;
    inset: 0 auto 0 0;
    width: 2px;
    background: #C84B3F;
  }
  .ccl-panel-title {
    font: 700 15px "Helvetica Neue", Helvetica, Arial, sans-serif;
    color: #0A0A0A;
    margin: 0 0 4px;
    letter-spacing: -0.015em;
  }
  .ccl-panel-sub {
    font: 13px/1.5 "Helvetica Neue", Helvetica, Arial, sans-serif;
    color: #525252;
    margin: 0 0 14px;
  }
  .ccl-hint {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 10px 16px;
    margin-bottom: 22px;
    border-radius: 2px;
    background: #FBEDEB;
    border: 1px solid #E5E5E5;
    border-left: 3px solid #C84B3F;
    font: 13px/1 "Helvetica Neue", Helvetica, Arial, sans-serif;
    color: #0A0A0A;
  }
  .ccl-hint-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #C84B3F;
  }
  .ccl-pill {
    display: inline-block;
    padding: 3px 10px;
    margin-left: 6px;
    border-radius: 2px;
    background: #0A0A0A;
    color: #FFFFFF;
    font: 600 12px "Helvetica Neue", Helvetica, Arial, sans-serif;
    letter-spacing: 0.01em;
  }
  .ccl-pill[data-empty="true"] {
    background: #F0F0F0;
    color: #525252;
  }
`;

const tooltipFormatter = (d: unknown) => {
  const item = d as { label: string; valueBased: number; valueCompared: number };
  if (!item) return null;

  return (
    <div
      style={{
        font: '12px/1.4 "Helvetica Neue", Helvetica, Arial, sans-serif',
        padding: "8px 12px",
        background: "#fff",
        border: "1px solid #e5e5e5",
        borderLeft: "3px solid #C84B3F",
        borderRadius: 2,
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 4, color: "#0A0A0A" }}>
        {item.label}
      </div>
      <div style={{ color: "#525252" }}>2017: {item.valueBased.toFixed(1)}%</div>
      <div style={{ color: "#525252" }}>2023: {item.valueCompared.toFixed(1)}%</div>
    </div>
  );
};

// --- Stories ----------------------------------------------------------------

// Two charts, one piece of state — hovering either chart highlights the
// matching country in the other.
export const TwoChartsOneState = {
  render: () => {
    const [highlightItems, setHighlightItems] = useState<string[]>([]);

    return (
      <MichiVzProvider colorsMapping={countryColors}>
        <style>{layoutStyles}</style>
        <div className="ccl-hint">
          <span className="ccl-hint-dot" />
          Hover either chart &mdash; the matching country highlights in both
          <span
            className="ccl-pill"
            data-empty={highlightItems.length === 0 ? "true" : "false"}
          >
            {highlightItems.length === 0 ? "no highlight" : highlightItems.join(", ")}
          </span>
        </div>
        <div className="ccl-dashboard">
          <div className="ccl-panel">
            <h4 className="ccl-panel-title">Renewable share of electricity — trend</h4>
            <p className="ccl-panel-sub">
              G7 economies, 2017&ndash;2023. One line per country.
            </p>
            <LineChart
              dataSet={renewableShareSeries}
              highlightItems={highlightItems}
              onHighlightItem={setHighlightItems}
              width={920}
              height={360}
              margin={{ top: 20, right: 40, bottom: 40, left: 56 }}
              xAxisDataType="date_annual"
              yAxisFormat={d => `${d}%`}
              showDataPoints
              tooltipFormatter={d => `
                <div style="font: 12px/1.4 'Helvetica Neue', Helvetica, Arial, sans-serif;
                            padding: 8px 12px; background: #fff; border: 1px solid #e5e5e5;
                            border-left: 3px solid #C84B3F; border-radius: 2px;">
                  <div style="font-weight: 700; margin-bottom: 2px;">${d.label}</div>
                  <div style="color: #525252;">${d.date}: ${d.value}%</div>
                </div>
              `}
              onChartDataProcessed={fn()}
              onColorMappingGenerated={fn()}
              onLegendDataChange={fn()}
            />
          </div>
          <div className="ccl-panel">
            <h4 className="ccl-panel-title">2017 vs 2023 &mdash; start and end</h4>
            <p className="ccl-panel-sub">
              Same six countries. The gap between the two bars on each row is
              the change in share over the seven years.
            </p>
            <ComparableHorizontalBarChart
              dataSet={startVsEndShare}
              highlightItems={highlightItems}
              onHighlightItem={setHighlightItems}
              width={920}
              height={320}
              margin={{ top: 30, right: 60, bottom: 40, left: 180 }}
              xAxisDataType="number"
              xAxisFormat={d => `${Math.round(Number(d))}%`}
              yAxisFormat={d => `${d}`}
              showGrid
              tooltipFormatter={tooltipFormatter}
              onChartDataProcessed={fn()}
              onColorMappingGenerated={fn()}
              onLegendDataChange={fn()}
            />
          </div>
        </div>
      </MichiVzProvider>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "**The pattern in three lines:** `const [highlightItems, setHighlightItems] = useState<string[]>([])`, then on each chart pass `highlightItems={highlightItems}` and `onHighlightItem={setHighlightItems}`. Both charts read from and write to the same slice of state.\n\n" +
          "Here a `LineChart` shows the 2017–2023 trajectory of every G7 economy's renewable-electricity share; underneath, a `ComparableHorizontalBarChart` snapshots just the start (2017) and end (2023) values per country, so the size of the gap on each row is the seven-year change. Hover Germany on either chart and Germany lights up on the other — the rest fade.\n\n" +
          "The same wiring works for any chart in the library: every chart accepts `highlightItems: string[]` and emits `onHighlightItem(labels: string[])`. Scale this up to a four-chart dashboard by hoisting the state one more level and giving each chart the same pair of props.",
      },
    },
  },
};


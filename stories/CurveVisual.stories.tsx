import React from "react";
import type { Meta, StoryObj } from "@storybook/react-webpack5";
import { MichiVzProvider } from "../src/components";
import LineChart from "../src/components/LineChart";
import AreaChart from "../src/components/AreaChart";
import RangeChart from "../src/components/RangeChart";
import type { DataPoint } from "../src/types/data";

// Deterministic stories used by the Playwright visual-regression suite
// (tests/visual/curve.spec.ts). Each renders a chart at a fixed size inside a
// `#chart-root` frame so screenshots are stable. Covers 2-point (must be
// straight) and multi-point (must be curved) cases, in both SVG and canvas
// renderers where the chart supports them. Story IDs derive from the title
// "Visual/Curve" + export name, e.g. `visual-curve--line-two-points-svg`.

const W = 900;
const H = 480;
const margin = { top: 50, right: 50, bottom: 50, left: 50 };

const Frame: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div id="chart-root" style={{ width: W, height: H, background: "#fff" }}>
    <MichiVzProvider>{children}</MichiVzProvider>
  </div>
);

const meta: Meta = {
  title: "Visual/Curve",
  parameters: { layout: "fullscreen" },
};
export default meta;

// --- Line data ---
const lineTwo = [
  {
    label: "A",
    color: "#1f77b4",
    series: [
      { date: 2000, value: 10, certainty: true },
      { date: 2001, value: 40, certainty: true },
    ],
  },
];
const lineMulti = [
  {
    label: "A",
    color: "#1f77b4",
    series: [
      { date: 2000, value: 10, certainty: true },
      { date: 2001, value: 40, certainty: true },
      { date: 2002, value: 25, certainty: true },
      { date: 2003, value: 55, certainty: true },
    ],
  },
];

export const LineTwoPointsSvg: StoryObj = {
  render: () => (
    <Frame>
      <LineChart dataSet={lineTwo} width={W} height={H} margin={margin} xAxisDataType="number" />
    </Frame>
  ),
};
export const LineMultiSvg: StoryObj = {
  render: () => (
    <Frame>
      <LineChart dataSet={lineMulti} width={W} height={H} margin={margin} xAxisDataType="number" />
    </Frame>
  ),
};
export const LineTwoPointsCanvas: StoryObj = {
  render: () => (
    <Frame>
      <LineChart
        dataSet={lineTwo}
        width={W}
        height={H}
        margin={margin}
        xAxisDataType="number"
        renderer="canvas"
      />
    </Frame>
  ),
};
export const LineMultiCanvas: StoryObj = {
  render: () => (
    <Frame>
      <LineChart
        dataSet={lineMulti}
        width={W}
        height={H}
        margin={margin}
        xAxisDataType="number"
        renderer="canvas"
      />
    </Frame>
  ),
};

// --- Area data (wide stacked rows; cast to DataPoint[] like the AreaChart stories) ---
const areaKeys = ["A", "B"];
const areaTwo = [
  { date: 0, A: 10, B: 5 },
  { date: 1, A: 30, B: 20 },
] as unknown as DataPoint[];
const areaMulti = [
  { date: 0, A: 10, B: 5 },
  { date: 1, A: 30, B: 20 },
  { date: 2, A: 20, B: 30 },
  { date: 3, A: 35, B: 15 },
] as unknown as DataPoint[];

export const AreaTwoPointsSvg: StoryObj = {
  render: () => (
    <Frame>
      <AreaChart
        series={areaTwo}
        keys={areaKeys}
        width={W}
        height={H}
        margin={margin}
        xAxisDataType="number"
      />
    </Frame>
  ),
};
export const AreaMultiSvg: StoryObj = {
  render: () => (
    <Frame>
      <AreaChart
        series={areaMulti}
        keys={areaKeys}
        width={W}
        height={H}
        margin={margin}
        xAxisDataType="number"
      />
    </Frame>
  ),
};
export const AreaTwoPointsCanvas: StoryObj = {
  render: () => (
    <Frame>
      <AreaChart
        series={areaTwo}
        keys={areaKeys}
        width={W}
        height={H}
        margin={margin}
        xAxisDataType="number"
        renderer="canvas"
      />
    </Frame>
  ),
};
export const AreaMultiCanvas: StoryObj = {
  render: () => (
    <Frame>
      <AreaChart
        series={areaMulti}
        keys={areaKeys}
        width={W}
        height={H}
        margin={margin}
        xAxisDataType="number"
        renderer="canvas"
      />
    </Frame>
  ),
};

// --- Range data ---
const rangeTwo = [
  {
    label: "A",
    color: "#1f77b4",
    series: [
      { date: 2000, valueMin: 10, valueMax: 30, valueMedium: 20, certainty: true },
      { date: 2001, valueMin: 20, valueMax: 45, valueMedium: 32, certainty: true },
    ],
  },
];
const rangeMulti = [
  {
    label: "A",
    color: "#1f77b4",
    series: [
      { date: 2000, valueMin: 10, valueMax: 30, valueMedium: 20, certainty: true },
      { date: 2001, valueMin: 20, valueMax: 45, valueMedium: 32, certainty: true },
      { date: 2002, valueMin: 15, valueMax: 38, valueMedium: 26, certainty: true },
      { date: 2003, valueMin: 25, valueMax: 52, valueMedium: 38, certainty: true },
    ],
  },
];

export const RangeTwoPointsSvg: StoryObj = {
  render: () => (
    <Frame>
      <RangeChart dataSet={rangeTwo} width={W} height={H} margin={margin} xAxisDataType="number" />
    </Frame>
  ),
};
export const RangeMultiSvg: StoryObj = {
  render: () => (
    <Frame>
      <RangeChart dataSet={rangeMulti} width={W} height={H} margin={margin} xAxisDataType="number" />
    </Frame>
  ),
};

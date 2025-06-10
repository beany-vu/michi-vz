import React, { useState } from "react";
import { MichiVzProvider } from "../src/components/MichiVzProvider";
import LineChartComponent from "../src/components/LineChart";
import AreaChart from "../src/components/AreaChart";
import BarBellChart from "../src/components/BarBellChart";
import ScatterPlotChart from "../src/components/ScatterPlotChart";
import VerticalStackBarChart from "../src/components/VerticalStackBarChart";
import ComparableHorizontalBarChart from "../src/components/ComparableHorizontalBarChart";
import DualHorizontalBarChart from "../src/components/DualHorizontalBarChart";
import RadarChart from "../src/components/RadarChart";
import RangeChart from "../src/components/RangeChart";
import RibbonChart from "../src/components/RibbonChart";
import GapChart from "../src/components/GapChart";

export default {
  title: "Examples/Unit Change All Charts",
  parameters: {
    docs: {
      description: {
        component: "Examples showing how to handle unit changes ($ to %) for all chart types using the key prop pattern to prevent axis flashing.",
      },
    },
  },
};

// Helper to generate data based on unit
const generateLineData = (multiplier: number) => [
  {
    label: "Revenue",
    color: "#2196F3",
    series: [
      { date: "2019", value: 1500 * multiplier, certainty: true },
      { date: "2020", value: 2200 * multiplier, certainty: true },
      { date: "2021", value: 2800 * multiplier, certainty: true },
      { date: "2022", value: 3200 * multiplier, certainty: true },
    ],
  },
  {
    label: "Costs",
    color: "#FF5722",
    series: [
      { date: "2019", value: 1200 * multiplier, certainty: true },
      { date: "2020", value: 1800 * multiplier, certainty: true },
      { date: "2021", value: 2100 * multiplier, certainty: true },
      { date: "2022", value: 2500 * multiplier, certainty: true },
    ],
  },
];

const generateBarData = (multiplier: number) => [
  { label: "Q1", value: 2500 * multiplier },
  { label: "Q2", value: 3200 * multiplier },
  { label: "Q3", value: 2800 * multiplier },
  { label: "Q4", value: 3500 * multiplier },
];

const generateStackedData = (multiplier: number) => [
  {
    label: "Q1",
    "Product A": 1000 * multiplier,
    "Product B": 1500 * multiplier,
    "Product C": 800 * multiplier,
  },
  {
    label: "Q2",
    "Product A": 1200 * multiplier,
    "Product B": 1800 * multiplier,
    "Product C": 900 * multiplier,
  },
  {
    label: "Q3",
    "Product A": 1100 * multiplier,
    "Product B": 1600 * multiplier,
    "Product C": 950 * multiplier,
  },
  {
    label: "Q4",
    "Product A": 1400 * multiplier,
    "Product B": 1900 * multiplier,
    "Product C": 1100 * multiplier,
  },
];

const generateScatterData = (multiplier: number) => [
  {
    label: "Series A",
    color: "#2196F3",
    series: [
      { x: 10, y: 1200 * multiplier, size: 20 },
      { x: 20, y: 1800 * multiplier, size: 30 },
      { x: 30, y: 2200 * multiplier, size: 25 },
      { x: 40, y: 2800 * multiplier, size: 35 },
    ],
  },
  {
    label: "Series B",
    color: "#FF5722",
    series: [
      { x: 15, y: 1500 * multiplier, size: 22 },
      { x: 25, y: 2000 * multiplier, size: 28 },
      { x: 35, y: 2500 * multiplier, size: 32 },
      { x: 45, y: 3000 * multiplier, size: 38 },
    ],
  },
];

const generateRadarData = (multiplier: number) => [
  {
    label: "Current Year",
    values: [
      { axis: "Sales", value: 80 * multiplier },
      { axis: "Marketing", value: 65 * multiplier },
      { axis: "Development", value: 75 * multiplier },
      { axis: "Support", value: 85 * multiplier },
      { axis: "HR", value: 70 * multiplier },
    ],
  },
  {
    label: "Previous Year",
    values: [
      { axis: "Sales", value: 70 * multiplier },
      { axis: "Marketing", value: 60 * multiplier },
      { axis: "Development", value: 70 * multiplier },
      { axis: "Support", value: 75 * multiplier },
      { axis: "HR", value: 65 * multiplier },
    ],
  },
];

const generateRangeData = (multiplier: number) => [
  {
    label: "Temperature Range",
    color: "#2196F3",
    series: [
      { date: "2019", lowValue: 15 * multiplier, highValue: 25 * multiplier },
      { date: "2020", lowValue: 16 * multiplier, highValue: 28 * multiplier },
      { date: "2021", lowValue: 14 * multiplier, highValue: 26 * multiplier },
      { date: "2022", lowValue: 17 * multiplier, highValue: 29 * multiplier },
    ],
  },
];

const generateGapData = (multiplier: number) => ({
  segments: [
    { label: "Segment A", value: 2500 * multiplier, color: "#2196F3" },
    { label: "Segment B", value: 3200 * multiplier, color: "#4CAF50" },
    { label: "Segment C", value: 2800 * multiplier, color: "#FF9800" },
  ],
  connectors: [
    { from: 0, to: 1, value: 2000 * multiplier, label: "A to B" },
    { from: 1, to: 2, value: 2500 * multiplier, label: "B to C" },
  ],
});

const generateComparableData = (multiplier: number) => [
  {
    label: "Region A",
    previousValue: 2000 * multiplier,
    currentValue: 2500 * multiplier,
  },
  {
    label: "Region B",
    previousValue: 1800 * multiplier,
    currentValue: 2200 * multiplier,
  },
  {
    label: "Region C",
    previousValue: 2200 * multiplier,
    currentValue: 2100 * multiplier,
  },
];

const generateDualBarData = (multiplier: number) => [
  {
    label: "Category 1",
    leftValue: 1200 * multiplier,
    rightValue: 1500 * multiplier,
  },
  {
    label: "Category 2",
    leftValue: 1800 * multiplier,
    rightValue: 1600 * multiplier,
  },
  {
    label: "Category 3",
    leftValue: 2200 * multiplier,
    rightValue: 2400 * multiplier,
  },
];

// Common control component
const UnitControl = ({ unit, setUnit }: { unit: string; setUnit: (unit: string) => void }) => (
  <div style={{ marginBottom: 20 }}>
    <button
      onClick={() => setUnit(unit === "$" ? "%" : "$")}
      style={{
        padding: "10px 20px",
        fontSize: 16,
        background: "#2196F3",
        color: "white",
        border: "none",
        borderRadius: 4,
        cursor: "pointer",
      }}
    >
      Toggle Unit (Current: {unit})
    </button>
    <div style={{ marginTop: 10, fontSize: 14, color: "#666" }}>
      Using key prop to force re-render: key="{`chart-${unit}`}"
    </div>
  </div>
);

export const LineAndAreaCharts = {
  render: () => {
    const [unit, setUnit] = useState<"$" | "%">("$");
    const multiplier = unit === "$" ? 1 : 0.01;
    const dataSet = generateLineData(multiplier);
    const yAxisFormat = (d: number) => `${unit === "$" ? "$" : ""}${d}${unit === "%" ? "%" : ""}`;

    return (
      <MichiVzProvider>
        <div>
          <h3>Line Chart & Area Chart</h3>
          <UnitControl unit={unit} setUnit={setUnit} />
          
          <div style={{ marginBottom: 40 }}>
            <h4>Line Chart</h4>
            <LineChartComponent
              key={`line-${unit}`}
              dataSet={dataSet}
              width={800}
              height={400}
              margin={{ top: 50, right: 50, bottom: 50, left: 80 }}
              yAxisFormat={yAxisFormat}
              xAxisDataType="date_annual"
              title="Revenue vs Costs"
            />
          </div>

          <div>
            <h4>Area Chart</h4>
            <AreaChart
              key={`area-${unit}`}
              dataSet={dataSet}
              width={800}
              height={400}
              margin={{ top: 50, right: 50, bottom: 50, left: 80 }}
              yAxisFormat={yAxisFormat}
              xAxisDataType="date_annual"
              title="Revenue vs Costs (Area)"
            />
          </div>
        </div>
      </MichiVzProvider>
    );
  },
};

export const BarCharts = {
  render: () => {
    const [unit, setUnit] = useState<"$" | "%">("$");
    const multiplier = unit === "$" ? 1 : 0.01;
    const yAxisFormat = (d: number) => `${unit === "$" ? "$" : ""}${d}${unit === "%" ? "%" : ""}`;
    const xAxisFormat = (d: number) => `${unit === "$" ? "$" : ""}${d}${unit === "%" ? "%" : ""}`;

    return (
      <MichiVzProvider>
        <div>
          <h3>Bar Charts</h3>
          <UnitControl unit={unit} setUnit={setUnit} />

          <div style={{ marginBottom: 40 }}>
            <h4>Vertical Stack Bar Chart</h4>
            <VerticalStackBarChart
              key={`stack-${unit}`}
              dataSet={generateStackedData(multiplier)}
              keys={["Product A", "Product B", "Product C"]}
              width={800}
              height={400}
              margin={{ top: 50, right: 50, bottom: 50, left: 80 }}
              yAxisFormat={yAxisFormat}
              title="Quarterly Sales by Product"
            />
          </div>

          <div style={{ marginBottom: 40 }}>
            <h4>Comparable Horizontal Bar Chart</h4>
            <ComparableHorizontalBarChart
              key={`comparable-${unit}`}
              dataSet={generateComparableData(multiplier)}
              width={800}
              height={400}
              margin={{ top: 50, right: 50, bottom: 50, left: 120 }}
              xAxisFormat={xAxisFormat}
              title="Regional Performance Comparison"
            />
          </div>

          <div>
            <h4>Dual Horizontal Bar Chart</h4>
            <DualHorizontalBarChart
              key={`dual-${unit}`}
              dataSet={generateDualBarData(multiplier)}
              width={800}
              height={400}
              margin={{ top: 50, right: 50, bottom: 50, left: 120 }}
              xAxisFormat={xAxisFormat}
              leftLabel="2021"
              rightLabel="2022"
              title="Year-over-Year Comparison"
            />
          </div>
        </div>
      </MichiVzProvider>
    );
  },
};

export const ScatterAndSpecialtyCharts = {
  render: () => {
    const [unit, setUnit] = useState<"$" | "%">("$");
    const multiplier = unit === "$" ? 1 : 0.01;
    const yAxisFormat = (d: number) => `${unit === "$" ? "$" : ""}${d}${unit === "%" ? "%" : ""}`;

    return (
      <MichiVzProvider>
        <div>
          <h3>Scatter Plot & Specialty Charts</h3>
          <UnitControl unit={unit} setUnit={setUnit} />

          <div style={{ marginBottom: 40 }}>
            <h4>Scatter Plot Chart</h4>
            <ScatterPlotChart
              key={`scatter-${unit}`}
              dataSet={generateScatterData(multiplier)}
              width={800}
              height={400}
              margin={{ top: 50, right: 50, bottom: 50, left: 80 }}
              yAxisFormat={yAxisFormat}
              xAxisFormat={(d) => `${d}`}
              title="Performance vs Time"
            />
          </div>

          <div style={{ marginBottom: 40 }}>
            <h4>Range Chart</h4>
            <RangeChart
              key={`range-${unit}`}
              dataSet={generateRangeData(multiplier)}
              width={800}
              height={400}
              margin={{ top: 50, right: 50, bottom: 50, left: 80 }}
              yAxisFormat={yAxisFormat}
              xAxisDataType="date_annual"
              title="Value Ranges Over Time"
            />
          </div>

          <div>
            <h4>Gap Chart</h4>
            <GapChart
              key={`gap-${unit}`}
              data={generateGapData(multiplier)}
              width={800}
              height={400}
              margin={{ top: 50, right: 50, bottom: 50, left: 80 }}
              valueFormat={yAxisFormat}
              title="Segment Flow Analysis"
            />
          </div>
        </div>
      </MichiVzProvider>
    );
  },
};

export const RadarAndOtherCharts = {
  render: () => {
    const [unit, setUnit] = useState<"$" | "%">("$");
    const multiplier = unit === "$" ? 1 : 1; // Radar typically uses percentages
    
    return (
      <MichiVzProvider>
        <div>
          <h3>Radar Chart</h3>
          <UnitControl unit={unit} setUnit={setUnit} />

          <div style={{ marginBottom: 40 }}>
            <h4>Radar Chart</h4>
            <RadarChart
              key={`radar-${unit}`}
              dataSet={generateRadarData(multiplier)}
              width={600}
              height={600}
              margin={{ top: 50, right: 50, bottom: 50, left: 50 }}
              title="Department Performance"
            />
          </div>

          <div style={{ marginTop: 40, padding: 20, background: "#f0f8ff", borderRadius: 4 }}>
            <h4>Implementation Pattern</h4>
            <pre style={{ background: "#fff", padding: 10, borderRadius: 4 }}>
{`// Always use a key prop that changes with the unit
<YourChart
  key={\`chart-\${unit}\`}
  dataSet={dataSet}
  yAxisFormat={yAxisFormat}
  // ... other props
/>`}
            </pre>
            <p style={{ marginTop: 10 }}>
              This pattern ensures the entire chart component is unmounted and remounted when units change,
              preventing any synchronization issues between axes and data.
            </p>
          </div>
        </div>
      </MichiVzProvider>
    );
  },
};

export const BarBellChartExample = {
  render: () => {
    const [unit, setUnit] = useState<"$" | "%">("$");
    const multiplier = unit === "$" ? 1 : 0.01;
    const xAxisFormat = (d: number) => `${unit === "$" ? "$" : ""}${d}${unit === "%" ? "%" : ""}`;

    const dataSet = [
      {
        label: "Product A",
        startValue: 1200 * multiplier,
        endValue: 1800 * multiplier,
      },
      {
        label: "Product B", 
        startValue: 2000 * multiplier,
        endValue: 1600 * multiplier,
      },
      {
        label: "Product C",
        startValue: 1500 * multiplier,
        endValue: 2200 * multiplier,
      },
    ];

    return (
      <MichiVzProvider>
        <div>
          <h3>BarBell Chart</h3>
          <UnitControl unit={unit} setUnit={setUnit} />

          <div>
            <BarBellChart
              key={`barbell-${unit}`}
              dataSet={dataSet}
              width={800}
              height={400}
              margin={{ top: 50, right: 50, bottom: 50, left: 120 }}
              xAxisFormat={xAxisFormat}
              title="Start vs End Values"
            />
          </div>
        </div>
      </MichiVzProvider>
    );
  },
};

export const RibbonChartExample = {
  render: () => {
    const [unit, setUnit] = useState<"$" | "%">("$");
    const multiplier = unit === "$" ? 1 : 0.01;

    const dataSet = [
      {
        source: "Category A",
        target: "Result 1",
        value: 1500 * multiplier,
      },
      {
        source: "Category A",
        target: "Result 2",
        value: 800 * multiplier,
      },
      {
        source: "Category B",
        target: "Result 1",
        value: 1200 * multiplier,
      },
      {
        source: "Category B",
        target: "Result 3",
        value: 2000 * multiplier,
      },
      {
        source: "Category C",
        target: "Result 2",
        value: 1800 * multiplier,
      },
      {
        source: "Category C",
        target: "Result 3",
        value: 1600 * multiplier,
      },
    ];

    return (
      <MichiVzProvider>
        <div>
          <h3>Ribbon Chart</h3>
          <UnitControl unit={unit} setUnit={setUnit} />

          <div>
            <RibbonChart
              key={`ribbon-${unit}`}
              dataSet={dataSet}
              width={800}
              height={600}
              margin={{ top: 50, right: 50, bottom: 50, left: 50 }}
              title="Flow Analysis"
            />
          </div>
        </div>
      </MichiVzProvider>
    );
  },
};
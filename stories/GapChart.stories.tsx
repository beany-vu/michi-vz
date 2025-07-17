import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { GapChart, MichiVzProvider } from "../src/components";
import { fn } from "@storybook/test";

const meta = {
  title: "Charts/GapChart",
  component: GapChart,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `
The GapChart component visualizes the difference between two values for multiple items.

## Key Features:
- **Shapes**: Customize markers for value1 and value2 (circle, square, triangle)
- **Legend**: Optional legend explaining shape meanings via \`shapesLabelsMapping\`
- **Filtering**: Control data display with the \`filter\` prop:
  - \`limit\`: Number of items to show
  - \`criteria\`: Sort by 'value1', 'value2', or 'difference'
  - \`sortingDir\`: 'asc' or 'desc' for sorting direction
- **Colors**: Automatic color assignment or custom mapping
- **Hover Effects**: Interactive highlighting on y-axis hover
        `,
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
  tags: ["autodocs"],
  argTypes: {
    filter: {
      description: "Filter configuration to limit and sort the displayed data",
      control: "object",
    },
    shapesLabelsMapping: {
      description: "Labels for the legend explaining what each shape and the gap represent",
      control: "object",
    },
    squareRadius: {
      description: "Border radius for square shapes (default: 2)",
      control: { type: "range", min: 0, max: 10, step: 1 },
    },
    shapeValue1: {
      description: "Shape for the first value marker",
      control: {
        type: "select",
        options: ["circle", "square", "triangle"],
      },
    },
    shapeValue2: {
      description: "Shape for the second value marker",
      control: {
        type: "select",
        options: ["circle", "square", "triangle"],
      },
    },
  },
} satisfies Meta<typeof GapChart>;

export default meta;
type Story = StoryObj<typeof meta>;

// Sample data similar to the screenshot showing countries with travel metrics
const generateSampleData = () => {
  const countries = [
    { label: "China", value1: 25, value2: 5 },
    { label: "Hong Kong SAR", value1: 23, value2: 4 },
    { label: "Thailand", value1: 12, value2: 14 },
    { label: "United States", value1: 6, value2: 7 },
    { label: "Switzerland", value1: 3, value2: 4 },
    { label: "India", value1: 0, value2: 5 },
    { label: "Italy", value1: 3, value2: 4 },
    { label: "Germany", value1: 2.5, value2: 3.5 },
    { label: "Mexico", value1: 2, value2: 3 },
    { label: "United Kingdom", value1: 2, value2: 3 },
    { label: "Japan", value1: 1.5, value2: 2.5 },
    { label: "France", value1: 1.5, value2: 2.5 },
    { label: "Malaysia", value1: 1.5, value2: 2.5 },
    { label: "Viet Nam", value1: 8, value2: 10 },
    { label: "United Arab Emirates", value1: 1, value2: 2 },
    { label: "Spain", value1: 1.5, value2: 2.5 },
    { label: "Taipei, Chinese", value1: 1, value2: 1.5 },
    { label: "Singapore", value1: 1, value2: 2 },
    { label: "Netherlands", value1: 1, value2: 2 },
    { label: "Türkiye", value1: 0.5, value2: 1.5 },
    { label: "Canada", value1: 4, value2: 5 },
    { label: "Australia", value1: 3.5, value2: 2 },
    { label: "Brazil", value1: 2.5, value2: 4.5 },
    { label: "South Korea", value1: 5, value2: 3 },
    { label: "Indonesia", value1: 2, value2: 1.5 },
  ];

  return countries.map((country) => ({
    ...country,
    difference: country.value1 - country.value2,
    date: "2024",
  }));
};

export const Default: Story = {
  args: {
    dataSet: generateSampleData(),
    title: "International Tourist Arrivals Gap Chart",
    colors: ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#06b6d4"],
    shapeValue1: "circle",
    shapeValue2: "circle",
    shapesLabelsMapping: {
      value1: "2019 Arrivals",
      value2: "2023 Arrivals",
      gap: "Recovery Gap",
    },
    xAxisDataType: "number",
    xAxisFormat: (d: number, values?: Array<string | number>) => `${d}mn`,
    width: 1000,
    height: 600,
    margin: { top: 50, right: 150, bottom: 100, left: 150 },
    onHighlightItem: fn(),
    onChartDataProcessed: fn(),
    onLegendDataChange: fn(),
    onColorMappingGenerated: fn(),
    filter: undefined,
  },
};

export const WithFilterTop10: Story = {
  args: {
    ...Default.args,
    title: "Top 10 Countries by Recovery Gap",
    filter: {
      limit: 10,
      date: "2024",
      criteria: "difference",
      sortingDir: "desc",
    },
    shapesLabelsMapping: {
      value1: "Pre-COVID (2019)",
      value2: "Current (2023)",
      gap: "Recovery Gap"
    },
  },
};

export const WithFilterBottom5: Story = {
  args: {
    ...Default.args,
    title: "Bottom 5 Countries by Recovery Gap",
    filter: {
      limit: 5,
      date: "2024",
      criteria: "difference",
      sortingDir: "asc",
    },
    shapesLabelsMapping: {
      value1: "Pre-COVID (2019)",
      value2: "Current (2023)",
      gap: "Recovery Gap"
    },
  },
};

export const WithFilterByValue1: Story = {
  args: {
    ...Default.args,
    title: "Top 15 Countries by 2019 Arrivals",
    filter: {
      limit: 15,
      date: "2024",
      criteria: "value1",
      sortingDir: "desc",
    },
    shapesLabelsMapping: {
      value1: "2019 Arrivals",
      value2: "2023 Arrivals",
      gap: "Change"
    },
  },
};

export const WithFilterByValue2: Story = {
  args: {
    ...Default.args,
    title: "Top 8 Countries by 2023 Arrivals",
    filter: {
      limit: 8,
      date: "2024",
      criteria: "value2",
      sortingDir: "desc",
    },
    shapesLabelsMapping: {
      value1: "2019 Baseline",
      value2: "2023 Current",
      gap: "Gap"
    },
  },
};

export const WithDifferentShapes: Story = {
  args: {
    ...Default.args,
    title: "Tourism Recovery Analysis with Different Shapes",
    shapeValue1: "square",
    shapeValue2: "triangle",
    shapesLabelsMapping: {
      value1: "Baseline (Square)",
      value2: "Current (Triangle)",
      gap: "Recovery Gap"
    },
  },
};

export const WithMixedShapes: Story = {
  args: {
    ...Default.args,
    title: "Comparison with Mixed Shape Indicators",
    shapeValue1: "circle",
    shapeValue2: "square",
    shapesLabelsMapping: {
      value1: "Expected (Circle)",
      value2: "Actual (Square)",
      gap: "Performance Gap"
    },
    filter: {
      limit: 12,
      date: "2024",
      criteria: "difference",
      sortingDir: "desc",
    },
  },
};

export const WithColorMapping: Story = {
  args: {
    ...Default.args,
    colorsMapping: {
      "China": "#dc2626",
      "Hong Kong SAR": "#dc2626",
      "Thailand": "#f59e0b",
      "Viet Nam": "#f59e0b",
      "United States": "#8b5cf6",
      "India": "#10b981",
    },
    onColorMappingGenerated: fn(),
  },
};

export const WithCustomSquareRadius: Story = {
  args: {
    ...Default.args,
    title: "Custom Square Border Radius",
    shapeValue1: "square",
    shapeValue2: "square",
    squareRadius: 0,
    shapesLabelsMapping: {
      value1: "Target (Sharp Square)",
      value2: "Actual (Sharp Square)",
      gap: "Performance Gap",
    },
  },
};

export const WithRoundedSquares: Story = {
  args: {
    ...Default.args,
    title: "Rounded Square Shapes",
    shapeValue1: "square",
    shapeValue2: "square",
    squareRadius: 4,
    shapesLabelsMapping: {
      value1: "Previous Year (Rounded)",
      value2: "Current Year (Rounded)",
      gap: "Year-over-Year Change",
    },
  },
};

export const WithShapeBasedColors: Story = {
  args: {
    ...Default.args,
    title: "Shape-Based Color Assignment",
    colorMode: "shape",
    shapeColorsMapping: {
      value1: "#3b82f6", // Blue for 2019 values
      value2: "#10b981", // Green for 2023 values
      gap: "#f59e0b", // Orange for gap bars
    },
    shapeValue1: "square",
    shapeValue2: "circle",
    shapesLabelsMapping: {
      value1: "2019 Arrivals (Blue)",
      value2: "2023 Arrivals (Green)",
      gap: "Recovery Gap (Orange)"
    },
  },
};

export const WithHighlightedItems: Story = {
  args: {
    ...Default.args,
    highlightItems: ["China", "Thailand", "United States", "India"],
  },
};

export const WithDisabledItems: Story = {
  args: {
    ...Default.args,
    disabledItems: ["Netherlands", "Türkiye", "Spain", "Singapore"],
  },
};

export const Loading: Story = {
  args: {
    ...Default.args,
    isLoading: true,
  },
};

export const NoData: Story = {
  args: {
    ...Default.args,
    dataSet: [],
    isNodata: true,
    isNodataComponent: <div style={{ padding: "20px", textAlign: "center" }}>No data available</div>,
  },
};

export const CustomTooltip: Story = {
  args: {
    ...Default.args,
    tooltipFormatter: () => "Custom tooltip content",
  },
};

export const TimeSeriesData: Story = {
  args: {
    ...Default.args,
    dataSet: generateSampleData().map((item, index) => ({
      ...item,
      date: `202${index % 5}`,
    })),
    xAxisDataType: "date_annual",
    xAxisFormat: (d: number) => new Date(d).getFullYear().toString(),
  },
};

export const WithPartialLegend: Story = {
  args: {
    ...Default.args,
    shapesLabelsMapping: {
      gap: "Performance Gap"
    },
  },
};

export const NoLegend: Story = {
  args: {
    ...Default.args,
    shapesLabelsMapping: undefined,
  },
};

export const WithoutColors: Story = {
  args: {
    dataSet: generateSampleData().slice(0, 10),
    title: "Gap Chart Using Default Color Palette",
    // Note: colors prop is not provided, will use default palette
    shapeValue1: "circle",
    shapeValue2: "square",
    shapesLabelsMapping: {
      value1: "2019 Arrivals",
      value2: "2023 Arrivals",
      gap: "Recovery Gap"
    },
    xAxisDataType: "number",
    xAxisFormat: (d: number) => `${d}mn`,
    width: 1000,
    height: 500,
    margin: { top: 50, right: 150, bottom: 100, left: 150 },
    onHighlightItem: fn(),
    onChartDataProcessed: fn(),
    onLegendDataChange: fn(),
    onColorMappingGenerated: fn(),
    filter: undefined,
  },
};

export const PositiveGrowthOnly: Story = {
  args: {
    dataSet: generateSampleData().filter(d => d.value2 > d.value1),
    title: "Countries with Tourism Growth (Positive Recovery)",
    colors: ["#10b981"],
    shapeValue1: "circle",
    shapeValue2: "circle",
    shapesLabelsMapping: {
      value1: "2019 Baseline",
      value2: "2023 Recovery",
      gap: "Growth",
    },
    xAxisDataType: "number",
    xAxisFormat: (d: number) => `${d}mn`,
    width: 1000,
    height: 400,
    margin: { top: 50, right: 150, bottom: 100, left: 150 },
    onHighlightItem: fn(),
    onChartDataProcessed: fn(),
    onLegendDataChange: fn(),
    onColorMappingGenerated: fn(),
    tickHtmlWidth: 150,
    filter: {
      limit: 20,
      date: "2024",
      criteria: "difference",
      sortingDir: "desc",
    },
  },
};

export const NegativeGrowthOnly: Story = {
  args: {
    dataSet: generateSampleData().filter(d => d.value2 < d.value1),
    title: "Countries Still Below Pre-Pandemic Levels",
    colors: ["#ef4444"],
    shapeValue1: "square",
    shapeValue2: "square",
    shapesLabelsMapping: {
      value1: "Pre-Pandemic Peak",
      value2: "Current Level",
      gap: "Recovery Deficit"
    },
    xAxisDataType: "number",
    xAxisFormat: (d: number) => `${d}mn`,
    width: 1000,
    height: 500,
    margin: { top: 50, right: 150, bottom: 100, left: 150 },
    onHighlightItem: fn(),
    onChartDataProcessed: fn(),
    onLegendDataChange: fn(),
    onColorMappingGenerated: fn(),
    filter: {
      limit: 15,
      date: "2024",
      criteria: "difference",
      sortingDir: "asc",
    },
  },
};

export const ComplexScenario: Story = {
  args: {
    dataSet: generateSampleData(),
    title: "Global Tourism Recovery Dashboard - 2023 vs 2019",
    colors: ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#06b6d4"],
    colorsMapping: {
      "China": "#dc2626",
      "Hong Kong SAR": "#dc2626",
      "United States": "#1e40af",
      "Thailand": "#10b981",
      "Viet Nam": "#10b981",
    },
    shapeValue1: "triangle",
    shapeValue2: "circle",
    shapesLabelsMapping: {
      value1: "2019 International Arrivals (Millions)",
      value2: "2023 International Arrivals (Millions)",
      gap: "Recovery Status"
    },
    xAxisDataType: "number",
    xAxisFormat: (d: number) => `${d}mn`,
    width: 1200,
    height: 800,
    margin: { top: 60, right: 180, bottom: 120, left: 180 },
    onHighlightItem: fn(),
    onChartDataProcessed: fn(),
    onLegendDataChange: fn(),
    onColorMappingGenerated: fn(),
    onLegendDataChange: fn(),
    filter: {
      limit: 20,
      date: "2024",
      criteria: "value1",
      sortingDir: "desc",
    },
  },
};

export const ColorModesComparison: Story = {
  render: (args) => {
    const sharedData = generateSampleData().slice(0, 10);
    
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
        <div>
          <h3 style={{ marginBottom: "20px" }}>Label-Based Coloring (Default)</h3>
          <GapChart
            {...args}
            dataSet={sharedData}
            title="Countries Colored by Label"
            colorMode="label"
            height={400}
          />
        </div>
        
        <div>
          <h3 style={{ marginBottom: "20px" }}>Shape-Based Coloring</h3>
          <GapChart
            {...args}
            dataSet={sharedData}
            title="Shapes Colored by Type"
            colorMode="shape"
            shapeColorsMapping={{
              value1: "#dc2626", // Red for all value1 shapes
              value2: "#059669", // Green for all value2 shapes
              gap: "#7c3aed", // Purple for all gap bars
            }}
            height={400}
          />
        </div>
      </div>
    );
  },
  args: {
    colors: ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#06b6d4"],
    shapeValue1: "triangle",
    shapeValue2: "circle",
    shapesLabelsMapping: {
      value1: "2019 Arrivals",
      value2: "2023 Arrivals",
      gap: "Recovery Gap"
    },
    xAxisDataType: "number",
    xAxisFormat: (d: number) => `${d}mn`,
    width: 1000,
    margin: { top: 50, right: 150, bottom: 100, left: 150 },
    onHighlightItem: fn(),
    onChartDataProcessed: fn(),
    onLegendDataChange: fn(),
    onColorMappingGenerated: fn(),
    filter: {
      limit: 10,
      date: "2024",
      criteria: "difference",
      sortingDir: "desc",
    },
  },
};

// Interactive story with controls
// Advanced interactive story with all controls
export const AdvancedInteractive: Story = {
  render: (args) => {
    const [limit, setLimit] = useState(15);
    const [criteria, setCriteria] = useState<"value1" | "value2" | "difference">("difference");
    const [sortingDir, setSortingDir] = useState<"asc" | "desc">("desc");
    const [shape1, setShape1] = useState<"circle" | "square" | "triangle">("circle");
    const [shape2, setShape2] = useState<"circle" | "square" | "triangle">("square");
    const [showLegend, setShowLegend] = useState(true);

    return (
      <div style={{ width: "100%", padding: "20px" }}>
        <h2 style={{ marginBottom: "20px" }}>GapChart Interactive Playground</h2>
        
        {/* Main Control Panel */}
        <div style={{ 
          marginBottom: "20px", 
          padding: "20px", 
          backgroundColor: "#f9fafb", 
          borderRadius: "12px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
        }}>
          {/* Filter Controls */}
          <h3 style={{ marginBottom: "16px", color: "#374151" }}>Filter Controls</h3>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
            {/* Limit Control */}
            <div>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "#4b5563" }}>
                Number of Countries: <span style={{ color: "#3b82f6", fontSize: "18px" }}>{limit}</span>
              </label>
              <input
                type="range"
                min="5"
                max="25"
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                style={{ 
                  width: "100%", 
                  height: "8px",
                  borderRadius: "4px",
                  background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(limit - 5) * 5}%, #e5e7eb ${(limit - 5) * 5}%, #e5e7eb 100%)`
                }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#9ca3af", marginTop: "4px" }}>
                <span>5 countries</span>
                <span>25 countries</span>
              </div>
            </div>

            {/* Legend Toggle */}
            <div>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "#4b5563" }}>
                Legend Display:
              </label>
              <button
                onClick={() => setShowLegend(!showLegend)}
                style={{
                  padding: "10px 20px",
                  borderRadius: "6px",
                  border: "1px solid #d1d5db",
                  backgroundColor: showLegend ? "#10b981" : "#ef4444",
                  color: "white",
                  cursor: "pointer",
                  width: "150px",
                  fontWeight: "500"
                }}
              >
                {showLegend ? "✓ Legend ON" : "✗ Legend OFF"}
              </button>
            </div>
          </div>

          {/* Sort Controls */}
          <h3 style={{ marginBottom: "16px", color: "#374151" }}>Sort Controls</h3>
          
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "12px", fontWeight: "600", color: "#4b5563" }}>
              Sort By Metric:
            </label>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              {[
                { value: "value1", label: "2019 Arrivals", color: "#8b5cf6" },
                { value: "value2", label: "2023 Arrivals", color: "#06b6d4" },
                { value: "difference", label: "Recovery Gap", color: "#f59e0b" }
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setCriteria(option.value as any)}
                  style={{
                    padding: "10px 20px",
                    borderRadius: "6px",
                    border: `2px solid ${criteria === option.value ? option.color : "#e5e7eb"}`,
                    backgroundColor: criteria === option.value ? option.color : "white",
                    color: criteria === option.value ? "white" : "#374151",
                    cursor: "pointer",
                    fontWeight: "500",
                    transition: "all 0.2s"
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "12px", fontWeight: "600", color: "#4b5563" }}>
              Sort Direction:
            </label>
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={() => setSortingDir("desc")}
                style={{
                  padding: "10px 24px",
                  borderRadius: "6px",
                  border: "2px solid #e5e7eb",
                  backgroundColor: sortingDir === "desc" ? "#1f2937" : "white",
                  color: sortingDir === "desc" ? "white" : "#374151",
                  cursor: "pointer",
                  fontWeight: "500",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}
              >
                <span style={{ fontSize: "20px" }}>↓</span> Highest First
              </button>
              <button
                onClick={() => setSortingDir("asc")}
                style={{
                  padding: "10px 24px",
                  borderRadius: "6px",
                  border: "2px solid #e5e7eb",
                  backgroundColor: sortingDir === "asc" ? "#1f2937" : "white",
                  color: sortingDir === "asc" ? "white" : "#374151",
                  cursor: "pointer",
                  fontWeight: "500",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}
              >
                <span style={{ fontSize: "20px" }}>↑</span> Lowest First
              </button>
            </div>
          </div>

          {/* Shape Controls */}
          <h3 style={{ marginBottom: "16px", color: "#374151" }}>Shape Controls</h3>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "#4b5563" }}>
                2019 Marker Shape:
              </label>
              <select 
                value={shape1} 
                onChange={(e) => setShape1(e.target.value as any)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  border: "1px solid #d1d5db",
                  fontSize: "14px"
                }}
              >
                <option value="circle">● Circle</option>
                <option value="square">■ Square</option>
                <option value="triangle">▲ Triangle</option>
              </select>
            </div>
            
            <div>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "#4b5563" }}>
                2023 Marker Shape:
              </label>
              <select 
                value={shape2} 
                onChange={(e) => setShape2(e.target.value as any)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  border: "1px solid #d1d5db",
                  fontSize: "14px"
                }}
              >
                <option value="circle">● Circle</option>
                <option value="square">■ Square</option>
                <option value="triangle">▲ Triangle</option>
              </select>
            </div>
          </div>
        </div>

        {/* Active Filter Summary */}
        <div style={{ 
          marginBottom: "20px", 
          padding: "16px", 
          backgroundColor: "#eff6ff", 
          borderRadius: "8px",
          border: "1px solid #bfdbfe"
        }}>
          <h4 style={{ margin: 0, marginBottom: "8px", color: "#1e40af" }}>Active Filter Summary:</h4>
          <p style={{ margin: 0, color: "#3730a3" }}>
            Displaying <strong>{limit}</strong> countries, sorted by <strong>{criteria === "value1" ? "2019 arrivals" : criteria === "value2" ? "2023 arrivals" : "recovery gap"}</strong> in <strong>{sortingDir === "desc" ? "descending" : "ascending"}</strong> order.
            Markers: {shape1} (2019) and {shape2} (2023).
          </p>
        </div>

        {/* Chart */}
        <GapChart
          {...args}
          shapeValue1={shape1}
          shapeValue2={shape2}
          shapesLabelsMapping={showLegend ? {
            value1: "2019 Arrivals",
            value2: "2023 Arrivals",
            gap: "Recovery Gap"
          } : undefined}
          filter={{
            limit,
            date: "2024",
            criteria,
            sortingDir,
          }}
        />
      </div>
    );
  },
  args: {
    dataSet: generateSampleData(),
    title: "Tourism Recovery Analysis - Interactive Dashboard",
    colors: ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#06b6d4"],
    xAxisDataType: "number",
    xAxisFormat: (d: number) => `${d}mn`,
    width: 1000,
    height: 600,
    margin: { top: 50, right: 150, bottom: 100, left: 150 },
    onHighlightItem: fn(),
    onChartDataProcessed: fn(),
    onLegendDataChange: fn(),
    onColorMappingGenerated: fn(),
    filter: undefined,
    shapeValue1: "circle",
    shapeValue2: "square",
  },
};

export const DataChanges: Story = {
  render: args => {
    const [dataVersion, setDataVersion] = React.useState(0);

    const animatedData = React.useMemo(() => {
      const baseData = generateSampleData();

      // Version 0: Original data
      if (dataVersion === 0) {
        return baseData.slice(0, 15);
      }

      // Version 1: Remove some items
      if (dataVersion === 1) {
        return baseData.filter((_, index) => index % 2 === 0).slice(0, 10);
      }

      // Version 2: Add new items and modify existing
      if (dataVersion === 2) {
        const modifiedData = baseData.slice(0, 8).map(item => ({
          ...item,
          value1: item.value1 * (0.8 + Math.random() * 0.4),
          value2: item.value2 * (0.8 + Math.random() * 0.4),
          difference: 0, // Will be recalculated
        }));

        // Add some new items
        const newItems = [
          {
            label: "New Country 1",
            value1: 15,
            value2: 18,
            difference: -3,
            date: "2024",
          },
          {
            label: "New Country 2",
            value1: 22,
            value2: 12,
            difference: 10,
            date: "2024",
          },
          {
            label: "New Country 3",
            value1: 8,
            value2: 14,
            difference: -6,
            date: "2024",
          },
        ];

        const combined = [...modifiedData, ...newItems];
        // Recalculate differences
        return combined.map(item => ({
          ...item,
          difference: item.value1 - item.value2,
        }));
      }

      // Version 3: Reorder items
      if (dataVersion === 3) {
        return [...baseData.slice(0, 12)].sort(() => Math.random() - 0.5);
      }

      return baseData;
    }, [dataVersion]);

    return (
      <div>
        <div
          style={{
            marginBottom: 20,
            display: "flex",
            gap: "10px",
            padding: "20px",
            backgroundColor: "#f3f4f6",
            borderRadius: "8px",
          }}
        >
          <button
            onClick={() => setDataVersion(0)}
            style={{
              padding: "10px 20px",
              borderRadius: "6px",
              border: "1px solid #d1d5db",
              backgroundColor: dataVersion === 0 ? "#3b82f6" : "white",
              color: dataVersion === 0 ? "white" : "black",
              cursor: "pointer",
              fontWeight: "500",
            }}
          >
            Original Data (15 items)
          </button>
          <button
            onClick={() => setDataVersion(1)}
            style={{
              padding: "10px 20px",
              borderRadius: "6px",
              border: "1px solid #d1d5db",
              backgroundColor: dataVersion === 1 ? "#ef4444" : "white",
              color: dataVersion === 1 ? "white" : "black",
              cursor: "pointer",
              fontWeight: "500",
            }}
          >
            Remove Items (10 items)
          </button>
          <button
            onClick={() => setDataVersion(2)}
            style={{
              padding: "10px 20px",
              borderRadius: "6px",
              border: "1px solid #d1d5db",
              backgroundColor: dataVersion === 2 ? "#10b981" : "white",
              color: dataVersion === 2 ? "white" : "black",
              cursor: "pointer",
              fontWeight: "500",
            }}
          >
            Add & Modify (11 items)
          </button>
          <button
            onClick={() => setDataVersion(3)}
            style={{
              padding: "10px 20px",
              borderRadius: "6px",
              border: "1px solid #d1d5db",
              backgroundColor: dataVersion === 3 ? "#f59e0b" : "white",
              color: dataVersion === 3 ? "white" : "black",
              cursor: "pointer",
              fontWeight: "500",
            }}
          >
            Reorder (12 items)
          </button>
        </div>

        <div
          style={{
            marginBottom: "10px",
            padding: "10px",
            backgroundColor: "#fef3c7",
            borderRadius: "4px",
            fontSize: "14px",
          }}
        >
          <strong>Note:</strong> This chart demonstrates data changes without animations. Animations have been removed for stability.
        </div>

        <GapChart
          {...args}
          dataSet={animatedData}
          title="Gap Chart - Data Changes (No Animations)"
        />
      </div>
    );
  },
  args: {
    colors: ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#06b6d4"],
    shapeValue1: "circle",
    shapeValue2: "triangle",
    shapesLabelsMapping: {
      value1: "2019 Arrivals",
      value2: "2023 Arrivals",
      gap: "Recovery Gap",
    },
    xAxisDataType: "number",
    xAxisFormat: (d: number) => `${d}mn`,
    width: 1000,
    height: 600,
    margin: { top: 50, right: 150, bottom: 100, left: 150 },
    filter: {
      limit: 20,
      date: "2024",
      criteria: "difference",
      sortingDir: "desc",
    },
    onHighlightItem: fn(),
    onChartDataProcessed: fn(),
    onLegendDataChange: fn(),
    onColorMappingGenerated: fn(),
    filter: undefined,
  },
};

// Test story for X-axis zero positioning with all positive values
export const AllPositiveValues: Story = {
  args: {
    dataSet: [
      { label: "United States", value1: 120, value2: 150, difference: -30, date: "2024" },
      { label: "China", value1: 180, value2: 200, difference: -20, date: "2024" },
      { label: "Germany", value1: 80, value2: 95, difference: -15, date: "2024" },
      { label: "France", value1: 60, value2: 85, difference: -25, date: "2024" },
      { label: "Japan", value1: 50, value2: 70, difference: -20, date: "2024" },
      { label: "United Kingdom", value1: 45, value2: 65, difference: -20, date: "2024" },
      { label: "Italy", value1: 40, value2: 60, difference: -20, date: "2024" },
      { label: "Canada", value1: 35, value2: 55, difference: -20, date: "2024" },
      { label: "South Korea", value1: 30, value2: 50, difference: -20, date: "2024" },
      { label: "Australia", value1: 25, value2: 45, difference: -20, date: "2024" },
    ],
    title: "All Positive Values - Zero Should Be at Left Edge",
    colors: ["#3b82f6", "#10b981", "#f59e0b"],
    shapeValue1: "circle",
    shapeValue2: "circle",
    shapesLabelsMapping: {
      value1: "Q1 2024",
      value2: "Q2 2024",
      gap: "Growth",
    },
    xAxisDataType: "number",
    xAxisFormat: (d: number) => `$${d}M`,
    yAxisFormat: (d: string) => d,
    width: 1000,
    height: 500,
    margin: { top: 50, right: 150, bottom: 100, left: 80 },  // Reduced left margin for shorter labels
    onHighlightItem: fn(),
    onChartDataProcessed: fn(),
    onLegendDataChange: fn(),
    onColorMappingGenerated: fn(),
    filter: undefined,
    ticks: 5,
  },
};

// Test story with values very close to zero
export const ValuesNearZero: Story = {
  args: {
    dataSet: [
      { label: "Product A", value1: 2.5, value2: 3.2, difference: -0.7, date: "2024" },
      { label: "Product B", value1: 1.8, value2: 2.1, difference: -0.3, date: "2024" },
      { label: "Product C", value1: 0.5, value2: 1.2, difference: -0.7, date: "2024" },
      { label: "Product D", value1: 3.2, value2: 2.8, difference: 0.4, date: "2024" },
      { label: "Product E", value1: 1.5, value2: 2.0, difference: -0.5, date: "2024" },
      { label: "Product F", value1: 0.8, value2: 1.5, difference: -0.7, date: "2024" },
    ],
    title: "Values Near Zero - Zero Should Still Be at Left Edge",
    colors: ["#ef4444", "#10b981"],
    shapeValue1: "square",
    shapeValue2: "square",
    shapesLabelsMapping: {
      value1: "Expected",
      value2: "Actual",
      gap: "Variance",
    },
    xAxisDataType: "number",
    xAxisFormat: (d: number) => d.toFixed(1),
    width: 1000,
    height: 400,
    margin: { top: 50, right: 150, bottom: 100, left: 150 },
    onHighlightItem: fn(),
    onChartDataProcessed: fn(),
    onLegendDataChange: fn(),
    onColorMappingGenerated: fn(),
    filter: undefined,
  },
};

// Test story with larger positive values
export const LargePositiveValues: Story = {
  args: {
    dataSet: [
      { label: "Company A", value1: 850000, value2: 920000, difference: -70000, date: "2024" },
      { label: "Company B", value1: 720000, value2: 780000, difference: -60000, date: "2024" },
      { label: "Company C", value1: 650000, value2: 700000, difference: -50000, date: "2024" },
      { label: "Company D", value1: 580000, value2: 620000, difference: -40000, date: "2024" },
      { label: "Company E", value1: 450000, value2: 480000, difference: -30000, date: "2024" },
      { label: "Company F", value1: 320000, value2: 350000, difference: -30000, date: "2024" },
      { label: "Company G", value1: 280000, value2: 300000, difference: -20000, date: "2024" },
      { label: "Company H", value1: 150000, value2: 180000, difference: -30000, date: "2024" },
    ],
    title: "Large Positive Values - $0 Should Be at Left Edge",
    colors: ["#8b5cf6", "#06b6d4", "#10b981"],
    shapeValue1: "triangle",
    shapeValue2: "circle",
    shapesLabelsMapping: {
      value1: "FY2023 Revenue",
      value2: "FY2024 Revenue",
      gap: "YoY Growth",
    },
    xAxisDataType: "number",
    xAxisFormat: (d: number) => `$${(d / 1000).toFixed(0)}K`,
    width: 1200,
    height: 500,
    margin: { top: 50, right: 180, bottom: 100, left: 180 },
    onHighlightItem: fn(),
    onChartDataProcessed: fn(),
    onLegendDataChange: fn(),
    filter: {
      limit: 8,
      date: "2024",
      criteria: "value2",
      sortingDir: "desc",
    },
  },
};

// Test story with mixed positive and negative values
// Story demonstrating shadow effects
export const WithShadowEffects: Story = {
  args: {
    dataSet: [
      { label: "Product A", value1: 45, value2: 60, difference: -15, date: "2024" },
      { label: "Product B", value1: 38, value2: 52, difference: -14, date: "2024" },
      { label: "Product C", value1: 42, value2: 48, difference: -6, date: "2024" },
      { label: "Product D", value1: 55, value2: 45, difference: 10, date: "2024" },
      { label: "Product E", value1: 35, value2: 42, difference: -7, date: "2024" },
      { label: "Product F", value1: 48, value2: 58, difference: -10, date: "2024" },
    ],
    title: "Gap Chart with Shadow Effects",
    colors: ["#3b82f6", "#10b981", "#f59e0b"],
    shapeValue1: "circle",
    shapeValue2: "square",
    shapesLabelsMapping: {
      value1: "Target",
      value2: "Actual",
      gap: "Variance",
    },
    enableShadow: true,
    shadowConfig: {
      blur: 4,
      dx: 2,
      dy: 3,
      opacity: 0.3,
      color: "#000000",
    },
    xAxisDataType: "number",
    xAxisFormat: (d: number) => `${d}`,
    width: 1000,
    height: 400,
    margin: { top: 50, right: 150, bottom: 100, left: 100 },
    onHighlightItem: fn(),
    onChartDataProcessed: fn(),
    onLegendDataChange: fn(),
    filter: undefined,
  },
};

// Story with colored shadows
export const WithColoredShadows: Story = {
  args: {
    dataSet: [
      { label: "Team Alpha", value1: 85, value2: 92, difference: -7, date: "2024" },
      { label: "Team Beta", value1: 78, value2: 88, difference: -10, date: "2024" },
      { label: "Team Gamma", value1: 92, value2: 85, difference: 7, date: "2024" },
      { label: "Team Delta", value1: 70, value2: 82, difference: -12, date: "2024" },
      { label: "Team Epsilon", value1: 88, value2: 91, difference: -3, date: "2024" },
    ],
    title: "Performance Metrics with Blue Shadow",
    colors: ["#3b82f6", "#ef4444"],
    shapeValue1: "triangle",
    shapeValue2: "circle",
    shapesLabelsMapping: {
      value1: "Q3 Performance",
      value2: "Q4 Performance",
      gap: "Improvement",
    },
    enableShadow: true,
    shadowConfig: {
      blur: 5,
      dx: 0,
      dy: 4,
      opacity: 0.4,
      color: "#3b82f6", // Blue shadow
    },
    xAxisDataType: "number",
    xAxisFormat: (d: number) => `${d}%`,
    width: 1000,
    height: 450,
    margin: { top: 50, right: 150, bottom: 100, left: 120 },
    onHighlightItem: fn(),
    onChartDataProcessed: fn(),
    onLegendDataChange: fn(),
    filter: {
      limit: 5,
      date: "2024",
      criteria: "difference",
      sortingDir: "desc",
    },
  },
};

export const MixedPositiveNegativeValues: Story = {
  args: {
    dataSet: [
      { label: "Metric A", value1: -20, value2: 30, difference: -50, date: "2024" },
      { label: "Metric B", value1: -10, value2: 15, difference: -25, date: "2024" },
      { label: "Metric C", value1: 5, value2: -10, difference: 15, date: "2024" },
      { label: "Metric D", value1: -5, value2: 20, difference: -25, date: "2024" },
      { label: "Metric E", value1: 15, value2: -5, difference: 20, date: "2024" },
      { label: "Metric F", value1: -15, value2: 10, difference: -25, date: "2024" },
    ],
    title: "Mixed Positive/Negative - Zero Line Should Be Visible",
    colors: ["#dc2626", "#10b981", "#3b82f6"],
    shapeValue1: "circle",
    shapeValue2: "triangle",
    shapesLabelsMapping: {
      value1: "Baseline",
      value2: "Current",
      gap: "Change",
    },
    xAxisDataType: "number",
    xAxisFormat: (d: number) => (d >= 0 ? `+${d}` : `${d}`),
    width: 1000,
    height: 400,
    margin: { top: 50, right: 150, bottom: 100, left: 150 },
    onHighlightItem: fn(),
    onChartDataProcessed: fn(),
    onLegendDataChange: fn(),
    filter: undefined,
  },
};

export const InteractiveControls: Story = {
  render: (args) => {
    const [limit, setLimit] = useState(10);
    const [criteria, setCriteria] = useState<"value1" | "value2" | "difference">("difference");
    const [sortingDir, setSortingDir] = useState<"asc" | "desc">("desc");
    const [highlightItems, setHighlightItems] = useState<string[]>([]);
    const [disabledItems, setDisabledItems] = useState<string[]>([]);
    const [legendData, setLegendData] = useState<any[]>([]);
    const [metadataInfo, setMetadataInfo] = useState<any>(null);
    const [availableItems, setAvailableItems] = useState<string[]>([]);

    const handleLegendDataChange = (newLegendData: any[]) => {
      setLegendData(newLegendData);
    };

    const handleMetadataChange = (metadata: any) => {
      setMetadataInfo(metadata);
      if (metadata.visibleItems) {
        setAvailableItems(metadata.visibleItems);
      }
    };

    const toggleHighlight = (item: string) => {
      setHighlightItems(prev => 
        prev.includes(item) 
          ? prev.filter(i => i !== item)
          : [...prev, item]
      );
    };

    const toggleDisable = (item: string) => {
      setDisabledItems(prev => 
        prev.includes(item) 
          ? prev.filter(i => i !== item)
          : [...prev, item]
      );
    };

    return (
      <div style={{ width: "100%", display: "flex", gap: "20px" }}>
        {/* Main Chart Area */}
        <div style={{ flex: 1 }}>
          {/* Control Panel */}
          <div style={{ 
            marginBottom: "20px", 
            padding: "20px", 
            backgroundColor: "#f3f4f6", 
            borderRadius: "8px",
            display: "flex",
            gap: "20px",
            alignItems: "center",
            flexWrap: "wrap"
          }}>
            {/* Limit Slider */}
            <div style={{ flex: "1", minWidth: "200px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}>
                Number of Items: {limit}
              </label>
              <input
                type="range"
                min="1"
                max="25"
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                style={{ width: "100%" }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#666" }}>
                <span>1</span>
                <span>25</span>
              </div>
            </div>

            {/* Sort By Buttons */}
            <div style={{ flex: "1", minWidth: "300px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}>
                Sort By:
              </label>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <button
                  onClick={() => setCriteria("value1")}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "4px",
                    border: "1px solid #d1d5db",
                    backgroundColor: criteria === "value1" ? "#3b82f6" : "white",
                    color: criteria === "value1" ? "white" : "black",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  2019 Arrivals
                </button>
                <button
                  onClick={() => setCriteria("value2")}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "4px",
                    border: "1px solid #d1d5db",
                    backgroundColor: criteria === "value2" ? "#3b82f6" : "white",
                    color: criteria === "value2" ? "white" : "black",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  2023 Arrivals
                </button>
                <button
                  onClick={() => setCriteria("difference")}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "4px",
                    border: "1px solid #d1d5db",
                    backgroundColor: criteria === "difference" ? "#3b82f6" : "white",
                    color: criteria === "difference" ? "white" : "black",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  Gap/Difference
                </button>
              </div>
            </div>

            {/* Sort Direction */}
            <div style={{ minWidth: "150px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}>
                Direction:
              </label>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => setSortingDir("desc")}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "4px",
                    border: "1px solid #d1d5db",
                    backgroundColor: sortingDir === "desc" ? "#10b981" : "white",
                    color: sortingDir === "desc" ? "white" : "black",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  ↓ High to Low
                </button>
                <button
                  onClick={() => setSortingDir("asc")}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "4px",
                    border: "1px solid #d1d5db",
                    backgroundColor: sortingDir === "asc" ? "#10b981" : "white",
                    color: sortingDir === "asc" ? "white" : "black",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  ↑ Low to High
                </button>
              </div>
            </div>
          </div>

          {/* Current Filter Info */}
          <div style={{ 
            marginBottom: "10px", 
            padding: "10px", 
            backgroundColor: "#e5e7eb", 
            borderRadius: "4px",
            fontSize: "14px"
          }}>
            <strong>Current Filter:</strong> Showing {limit} items sorted by {criteria} in {sortingDir}ending order
            <br />
            <strong>Highlighted:</strong> {highlightItems.length} items | <strong>Disabled:</strong> {disabledItems.length} items
          </div>

          {/* Chart */}
          <GapChart
            {...args}
            filter={{
              limit,
              date: "2024",
              criteria,
              sortingDir,
            }}
            highlightItems={highlightItems}
            disabledItems={disabledItems}
            onLegendDataChange={handleLegendDataChange}
            onChartDataProcessed={handleMetadataChange}
          />
        </div>

        {/* Right Panel - Data Reading & Controls */}
        <div style={{ 
          width: "350px", 
          padding: "20px", 
          backgroundColor: "#f8fafc", 
          borderRadius: "8px",
          border: "1px solid #e2e8f0",
          maxHeight: "800px",
          overflow: "auto"
        }}>
          <h3 style={{ marginTop: 0, color: "#1e293b", marginBottom: "20px" }}>📊 Data Reading & Controls</h3>
          
          {/* Item Controls */}
          <div style={{ marginBottom: "20px" }}>
            <h4 style={{ color: "#475569", marginBottom: "10px" }}>🎯 Item Controls</h4>
            <div style={{ 
              maxHeight: "150px",
              overflow: "auto",
              backgroundColor: "#ffffff", 
              padding: "10px", 
              borderRadius: "4px",
              border: "1px solid #e2e8f0"
            }}>
              {availableItems.map((item, index) => (
                <div key={index} style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "center",
                  marginBottom: "8px",
                  padding: "4px",
                  backgroundColor: disabledItems.includes(item) ? "#fee2e2" : highlightItems.includes(item) ? "#fef3c7" : "#f8fafc",
                  borderRadius: "3px"
                }}>
                  <span style={{ 
                    fontSize: "11px", 
                    fontWeight: "500",
                    color: disabledItems.includes(item) ? "#dc2626" : highlightItems.includes(item) ? "#d97706" : "#374151",
                    flex: 1,
                    marginRight: "8px"
                  }}>
                    {item}
                  </span>
                  <div style={{ display: "flex", gap: "4px" }}>
                    <button
                      onClick={() => toggleHighlight(item)}
                      style={{
                        padding: "2px 6px",
                        borderRadius: "2px",
                        border: "1px solid #d1d5db",
                        backgroundColor: highlightItems.includes(item) ? "#f59e0b" : "#f3f4f6",
                        color: highlightItems.includes(item) ? "white" : "#374151",
                        cursor: "pointer",
                        fontSize: "10px"
                      }}
                    >
                      ✨
                    </button>
                    <button
                      onClick={() => toggleDisable(item)}
                      style={{
                        padding: "2px 6px",
                        borderRadius: "2px",
                        border: "1px solid #d1d5db",
                        backgroundColor: disabledItems.includes(item) ? "#ef4444" : "#f3f4f6",
                        color: disabledItems.includes(item) ? "white" : "#374151",
                        cursor: "pointer",
                        fontSize: "10px"
                      }}
                    >
                      ❌
                    </button>
                  </div>
                </div>
              ))}
              {availableItems.length === 0 && (
                <div style={{ color: "#64748b", fontStyle: "italic", fontSize: "12px" }}>
                  No items available yet
                </div>
              )}
            </div>
          </div>

          {/* Legend Data */}
          <div style={{ marginBottom: "20px" }}>
            <h4 style={{ color: "#475569", marginBottom: "10px" }}>🏷️ Legend Data</h4>
            <div style={{ 
              backgroundColor: "#ffffff", 
              padding: "10px", 
              borderRadius: "4px",
              border: "1px solid #e2e8f0",
              fontSize: "11px",
              fontFamily: "monospace"
            }}>
              {legendData.length > 0 ? (
                <div>
                  {legendData.map((item, index) => (
                    <div key={index} style={{ 
                      marginBottom: "8px",
                      padding: "6px",
                      backgroundColor: "#f8fafc",
                      borderRadius: "3px",
                      border: `1px solid ${item.color}`
                    }}>
                      <div style={{ fontWeight: "bold", color: item.color }}>
                        {item.label}
                      </div>
                      <div style={{ marginTop: "2px", color: "#64748b" }}>
                        Order: {item.order} | Color: {item.color}
                        <br />
                        Disabled: {item.disabled ? 'Yes' : 'No'}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <span style={{ color: "#64748b", fontStyle: "italic" }}>No legend data</span>
              )}
            </div>
          </div>
          
          {/* Metadata */}
          <div style={{ marginBottom: "20px" }}>
            <h4 style={{ color: "#475569", marginBottom: "10px" }}>📈 Metadata</h4>
            <div style={{ 
              backgroundColor: "#ffffff", 
              padding: "10px", 
              borderRadius: "4px",
              border: "1px solid #e2e8f0",
              fontSize: "11px",
              fontFamily: "monospace"
            }}>
              {metadataInfo ? (
                <div>
                  <div style={{ marginBottom: "4px" }}>
                    <strong>Chart Type:</strong> {metadataInfo.chartType}
                  </div>
                  <div style={{ marginBottom: "4px" }}>
                    <strong>Visible Items:</strong> {metadataInfo.visibleItems?.length || 0}
                  </div>
                  <div style={{ marginBottom: "4px" }}>
                    <strong>X-Axis Domain:</strong> [{metadataInfo.xAxisDomain?.join(', ')}]
                  </div>
                  <div style={{ marginBottom: "4px" }}>
                    <strong>Y-Axis Domain:</strong> [{metadataInfo.yAxisDomain?.join(', ')}]
                  </div>
                  <div style={{ marginBottom: "4px" }}>
                    <strong>Legend Items:</strong> {metadataInfo.legendData?.length || 0}
                  </div>
                  <div style={{ marginBottom: "4px" }}>
                    <strong>Data Points:</strong> {Object.keys(metadataInfo.renderedData || {}).length}
                  </div>
                  
                  {metadataInfo.visibleItems && (
                    <div style={{ marginTop: "8px" }}>
                      <strong>Visible Items List:</strong>
                      <div style={{ 
                        maxHeight: "100px", 
                        overflow: "auto", 
                        marginTop: "4px",
                        padding: "4px",
                        backgroundColor: "#f8fafc",
                        borderRadius: "2px"
                      }}>
                        {metadataInfo.visibleItems.map((item: string, index: number) => (
                          <div key={index} style={{ 
                            fontSize: "10px", 
                            color: "#374151",
                            marginBottom: "2px"
                          }}>
                            {index + 1}. {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <span style={{ color: "#64748b", fontStyle: "italic" }}>No metadata</span>
              )}
            </div>
          </div>

          {/* JSON Output */}
          <div>
            <h4 style={{ color: "#475569", marginBottom: "10px" }}>🔧 JSON Output</h4>
            <div style={{ 
              backgroundColor: "#ffffff", 
              padding: "10px", 
              borderRadius: "4px",
              border: "1px solid #e2e8f0",
              fontSize: "10px",
              fontFamily: "monospace",
              maxHeight: "200px",
              overflow: "auto"
            }}>
              <strong>Legend Data:</strong>
              <pre style={{ margin: "4px 0", color: "#059669" }}>
                {JSON.stringify(legendData, null, 2)}
              </pre>
              <strong>Metadata:</strong>
              <pre style={{ margin: "4px 0", color: "#dc2626" }}>
                {JSON.stringify(metadataInfo, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </div>
    );
  },
  args: {
    dataSet: generateSampleData(),
    title: "Interactive Tourism Recovery Analysis",
    colors: ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#06b6d4"],
    shapeValue1: "circle",
    shapeValue2: "square",
    shapesLabelsMapping: {
      value1: "2019 (Pre-Pandemic)",
      value2: "2023 (Current)",
      gap: "Recovery Gap"
    },
    xAxisDataType: "number",
    xAxisFormat: (d: number) => `${d}mn`,
    width: 1000,
    height: 600,
    margin: { top: 50, right: 150, bottom: 100, left: 150 },
    onHighlightItem: fn(),
    onChartDataProcessed: fn(),
    onLegendDataChange: fn(),
    onColorMappingGenerated: fn(),
  },
};

// Story to demonstrate legend data exposure
export const LegendDataExposure: Story = {
  render: (args) => {
    const [legendData, setLegendData] = useState<any[]>([]);
    const [metadataInfo, setMetadataInfo] = useState<any>(null);
    
    const handleLegendDataChange = (newLegendData: any[]) => {
      console.log("Legend data changed:", newLegendData);
      setLegendData(newLegendData);
    };
    
    const handleMetadataChange = (metadata: any) => {
      console.log("Chart metadata:", metadata);
      setMetadataInfo(metadata);
    };

    return (
      <div style={{ width: "100%", display: "flex", gap: "30px" }}>
        <div style={{ flex: 1 }}>
          <GapChart
            {...args}
            onLegendDataChange={handleLegendDataChange}
            onChartDataProcessed={handleMetadataChange}
          />
        </div>
        
        <div style={{ 
          width: "300px", 
          padding: "20px", 
          backgroundColor: "#f8fafc", 
          borderRadius: "8px",
          border: "1px solid #e2e8f0"
        }}>
          <h3 style={{ marginTop: 0, color: "#1e293b" }}>Exposed Data</h3>
          
          <div style={{ marginBottom: "20px" }}>
            <h4 style={{ color: "#475569", marginBottom: "10px" }}>Legend Data:</h4>
            <div style={{ 
              backgroundColor: "#ffffff", 
              padding: "10px", 
              borderRadius: "4px",
              border: "1px solid #e2e8f0",
              fontSize: "12px",
              fontFamily: "monospace"
            }}>
              {legendData.length > 0 ? (
                <div>
                  {legendData.map((item, index) => (
                    <div key={index} style={{ marginBottom: "8px" }}>
                      <div style={{ fontWeight: "bold", color: item.color }}>
                        {item.label}
                      </div>
                      <div style={{ marginLeft: "10px", color: "#64748b" }}>
                        Order: {item.order}<br/>
                        Color: {item.color}<br/>
                        Disabled: {item.disabled ? 'Yes' : 'No'}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <span style={{ color: "#64748b", fontStyle: "italic" }}>No legend data</span>
              )}
            </div>
          </div>
          
          <div>
            <h4 style={{ color: "#475569", marginBottom: "10px" }}>Metadata Info:</h4>
            <div style={{ 
              backgroundColor: "#ffffff", 
              padding: "10px", 
              borderRadius: "4px",
              border: "1px solid #e2e8f0",
              fontSize: "12px",
              fontFamily: "monospace",
              maxHeight: "200px",
              overflow: "auto"
            }}>
              {metadataInfo ? (
                <div>
                  <div><strong>Chart Type:</strong> {metadataInfo.chartType}</div>
                  <div><strong>Visible Items:</strong> {metadataInfo.visibleItems?.length || 0}</div>
                  <div><strong>X-Axis Domain:</strong> [{metadataInfo.xAxisDomain?.join(', ')}]</div>
                  <div><strong>Y-Axis Domain:</strong> [{metadataInfo.yAxisDomain?.join(', ')}]</div>
                  <div><strong>Legend Data:</strong> {metadataInfo.legendData?.length || 0} items</div>
                  <div><strong>Rendered Data Keys:</strong> {Object.keys(metadataInfo.renderedData || {}).length}</div>
                </div>
              ) : (
                <span style={{ color: "#64748b", fontStyle: "italic" }}>No metadata</span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  },
  args: {
    dataSet: generateSampleData().slice(0, 12),
    title: "Legend Data Exposure Demo",
    colors: ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#06b6d4"],
    shapeValue1: "circle",
    shapeValue2: "square",
    shapesLabelsMapping: {
      value1: "2019 Tourist Arrivals",
      value2: "2023 Tourist Arrivals", 
      gap: "Recovery Gap"
    },
    xAxisDataType: "number",
    xAxisFormat: (d: number) => `${d}mn`,
    width: 800,
    height: 500,
    margin: { top: 50, right: 150, bottom: 100, left: 150 },
    shapeValue1: "circle",
    shapeValue2: "square",
    filter: {
      limit: 12,
      date: "2024",
      criteria: "difference",
      sortingDir: "desc",
    },
    onHighlightItem: fn(),
    onChartDataProcessed: fn(),
    onLegendDataChange: fn(),
    onColorMappingGenerated: fn(),
  },
};

// Story to demonstrate real-time legend updates
export const InteractiveLegendUpdates: Story = {
  render: (args) => {
    const [legendData, setLegendData] = useState<any[]>([]);
    const [shapeValue1, setShapeValue1] = useState<"circle" | "square" | "triangle">("circle");
    const [shapeValue2, setShapeValue2] = useState<"circle" | "square" | "triangle">("square");
    const [colorMode, setColorMode] = useState<"label" | "shape">("label");
    const [shapesLabelsMapping, setShapesLabelsMapping] = useState({
      value1: "Pre-Pandemic (2019)",
      value2: "Current (2023)",
      gap: "Recovery Gap"
    });
    
    const handleLegendDataChange = (newLegendData: any[]) => {
      setLegendData(newLegendData);
    };

    return (
      <div style={{ width: "100%" }}>
        <div style={{
          marginBottom: "20px",
          padding: "20px",
          backgroundColor: "#f1f5f9",
          borderRadius: "8px",
          border: "1px solid #cbd5e1"
        }}>
          <h3 style={{ marginTop: 0, color: "#334155" }}>Interactive Legend Controls</h3>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>
                Shape for Value 1:
              </label>
              <select
                value={shapeValue1}
                onChange={(e) => setShapeValue1(e.target.value as any)}
                style={{
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid #d1d5db",
                  width: "100%"
                }}
              >
                <option value="circle">● Circle</option>
                <option value="square">■ Square</option>
                <option value="triangle">▲ Triangle</option>
              </select>
            </div>
            
            <div>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>
                Shape for Value 2:
              </label>
              <select
                value={shapeValue2}
                onChange={(e) => setShapeValue2(e.target.value as any)}
                style={{
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid #d1d5db",
                  width: "100%"
                }}
              >
                <option value="circle">● Circle</option>
                <option value="square">■ Square</option>
                <option value="triangle">▲ Triangle</option>
              </select>
            </div>
          </div>
          
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>
              Color Mode:
            </label>
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={() => setColorMode("label")}
                style={{
                  padding: "8px 16px",
                  borderRadius: "4px",
                  border: "1px solid #d1d5db",
                  backgroundColor: colorMode === "label" ? "#3b82f6" : "white",
                  color: colorMode === "label" ? "white" : "black",
                  cursor: "pointer"
                }}
              >
                Color by Label
              </button>
              <button
                onClick={() => setColorMode("shape")}
                style={{
                  padding: "8px 16px",
                  borderRadius: "4px",
                  border: "1px solid #d1d5db",
                  backgroundColor: colorMode === "shape" ? "#3b82f6" : "white",
                  color: colorMode === "shape" ? "white" : "black",
                  cursor: "pointer"
                }}
              >
                Color by Shape
              </button>
            </div>
          </div>
          
          <div>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>
              Legend Labels:
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
              <input
                type="text"
                placeholder="Value 1 label"
                value={shapesLabelsMapping.value1}
                onChange={(e) => setShapesLabelsMapping({...shapesLabelsMapping, value1: e.target.value})}
                style={{
                  padding: "6px",
                  borderRadius: "4px",
                  border: "1px solid #d1d5db",
                  fontSize: "12px"
                }}
              />
              <input
                type="text"
                placeholder="Value 2 label"
                value={shapesLabelsMapping.value2}
                onChange={(e) => setShapesLabelsMapping({...shapesLabelsMapping, value2: e.target.value})}
                style={{
                  padding: "6px",
                  borderRadius: "4px",
                  border: "1px solid #d1d5db",
                  fontSize: "12px"
                }}
              />
              <input
                type="text"
                placeholder="Gap label"
                value={shapesLabelsMapping.gap}
                onChange={(e) => setShapesLabelsMapping({...shapesLabelsMapping, gap: e.target.value})}
                style={{
                  padding: "6px",
                  borderRadius: "4px",
                  border: "1px solid #d1d5db",
                  fontSize: "12px"
                }}
              />
            </div>
          </div>
        </div>
        
        <div style={{ display: "flex", gap: "20px" }}>
          <div style={{ flex: 1 }}>
            <GapChart
              {...args}
              shapeValue1={shapeValue1}
              shapeValue2={shapeValue2}
              colorMode={colorMode}
              shapesLabelsMapping={shapesLabelsMapping}
              shapeColorsMapping={colorMode === "shape" ? {
                value1: "#dc2626",
                value2: "#059669",
                gap: "#7c3aed"
              } : undefined}
              onLegendDataChange={handleLegendDataChange}
            />
          </div>
          
          <div style={{ 
            width: "250px", 
            padding: "15px", 
            backgroundColor: "#fefefe", 
            borderRadius: "6px",
            border: "1px solid #e2e8f0"
          }}>
            <h4 style={{ marginTop: 0, color: "#374151" }}>Live Legend Data:</h4>
            <div style={{ 
              backgroundColor: "#f8fafc", 
              padding: "12px", 
              borderRadius: "4px",
              fontSize: "11px",
              fontFamily: "monospace"
            }}>
              {legendData.length > 0 ? (
                legendData.map((item, index) => (
                  <div key={index} style={{ 
                    marginBottom: "10px", 
                    padding: "8px", 
                    backgroundColor: "white", 
                    borderRadius: "3px",
                    border: `1px solid ${item.color}`
                  }}>
                    <div style={{ fontWeight: "bold", color: item.color }}>
                      {item.label}
                    </div>
                    <div style={{ marginTop: "4px", color: "#64748b" }}>
                      Order: {item.order}<br/>
                      Color: {item.color}<br/>
                      Disabled: {item.disabled ? 'Yes' : 'No'}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ color: "#64748b", fontStyle: "italic" }}>
                  No legend data available
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  },
  args: {
    dataSet: generateSampleData().slice(0, 10),
    title: "Interactive Legend Updates Demo",
    colors: ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#06b6d4"],
    xAxisDataType: "number",
    xAxisFormat: (d: number) => `${d}mn`,
    width: 700,
    height: 500,
    margin: { top: 50, right: 150, bottom: 100, left: 150 },
    shapeValue1: "circle",
    shapeValue2: "square",
    filter: {
      limit: 10,
      date: "2024",
      criteria: "difference",
      sortingDir: "desc",
    },
    onHighlightItem: fn(),
    onChartDataProcessed: fn(),
    onLegendDataChange: fn(),
    onColorMappingGenerated: fn(),
  },
};

// Story to demonstrate metadata callback with detailed information
export const MetadataExposureDemo: Story = {
  render: (args) => {
    const [metadataHistory, setMetadataHistory] = useState<any[]>([]);
    const [currentMetadata, setCurrentMetadata] = useState<any>(null);
    const [dataFilter, setDataFilter] = useState({
      limit: 15,
      criteria: "difference" as "value1" | "value2" | "difference",
      sortingDir: "desc" as "asc" | "desc"
    });
    
    const handleMetadataChange = (metadata: any) => {
      setCurrentMetadata(metadata);
      setMetadataHistory(prev => [...prev.slice(-4), {
        timestamp: new Date().toLocaleTimeString(),
        metadata: metadata
      }]);
    };

    return (
      <div style={{ width: "100%" }}>
        <div style={{
          marginBottom: "20px",
          padding: "20px",
          backgroundColor: "#f0f9ff",
          borderRadius: "8px",
          border: "1px solid #0ea5e9"
        }}>
          <h3 style={{ marginTop: 0, color: "#0c4a6e" }}>Metadata Exposure Controls</h3>
          
          <div style={{ display: "flex", gap: "20px", alignItems: "center", marginBottom: "15px" }}>
            <div>
              <label style={{ marginRight: "10px", fontWeight: "600" }}>Limit:</label>
              <input
                type="range"
                min="5"
                max="25"
                value={dataFilter.limit}
                onChange={(e) => setDataFilter({...dataFilter, limit: Number(e.target.value)})}
                style={{ marginRight: "10px" }}
              />
              <span style={{ fontWeight: "bold", color: "#0ea5e9" }}>{dataFilter.limit}</span>
            </div>
            
            <div>
              <label style={{ marginRight: "10px", fontWeight: "600" }}>Sort by:</label>
              <select
                value={dataFilter.criteria}
                onChange={(e) => setDataFilter({...dataFilter, criteria: e.target.value as any})}
                style={{ padding: "4px", borderRadius: "4px", border: "1px solid #0ea5e9" }}
              >
                <option value="difference">Gap/Difference</option>
                <option value="value1">Value 1</option>
                <option value="value2">Value 2</option>
              </select>
            </div>
            
            <div>
              <label style={{ marginRight: "10px", fontWeight: "600" }}>Direction:</label>
              <select
                value={dataFilter.sortingDir}
                onChange={(e) => setDataFilter({...dataFilter, sortingDir: e.target.value as any})}
                style={{ padding: "4px", borderRadius: "4px", border: "1px solid #0ea5e9" }}
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
          </div>
        </div>
        
        <div style={{ display: "flex", gap: "20px" }}>
          <div style={{ flex: 1 }}>
            <GapChart
              {...args}
              filter={{
                limit: dataFilter.limit,
                date: "2024",
                criteria: dataFilter.criteria,
                sortingDir: dataFilter.sortingDir,
              }}
              onChartDataProcessed={handleMetadataChange}
            />
          </div>
          
          <div style={{ 
            width: "350px", 
            padding: "15px", 
            backgroundColor: "#fefefe", 
            borderRadius: "6px",
            border: "1px solid #e2e8f0"
          }}>
            <h4 style={{ marginTop: 0, color: "#374151" }}>Current Metadata:</h4>
            <div style={{ 
              backgroundColor: "#f8fafc", 
              padding: "12px", 
              borderRadius: "4px",
              fontSize: "11px",
              fontFamily: "monospace",
              marginBottom: "15px"
            }}>
              {currentMetadata ? (
                <div>
                  <div style={{ marginBottom: "8px" }}>
                    <strong>Chart Type:</strong> {currentMetadata.chartType}
                  </div>
                  <div style={{ marginBottom: "8px" }}>
                    <strong>Visible Items:</strong> {currentMetadata.visibleItems?.length || 0}
                  </div>
                  <div style={{ marginBottom: "8px" }}>
                    <strong>X-Axis Domain:</strong><br />
                    <span style={{ color: "#059669" }}>
                      [{currentMetadata.xAxisDomain?.join(', ')}]
                    </span>
                  </div>
                  <div style={{ marginBottom: "8px" }}>
                    <strong>Y-Axis Domain:</strong><br />
                    <span style={{ color: "#dc2626" }}>
                      [{currentMetadata.yAxisDomain?.join(', ')}]
                    </span>
                  </div>
                  <div style={{ marginBottom: "8px" }}>
                    <strong>Legend Items:</strong> {currentMetadata.legendData?.length || 0}
                  </div>
                  <div style={{ marginBottom: "8px" }}>
                    <strong>Data Points:</strong> {Object.keys(currentMetadata.renderedData || {}).length}
                  </div>
                  
                  {currentMetadata.legendData && (
                    <div style={{ marginTop: "12px" }}>
                      <strong>Legend Details:</strong>
                      <div style={{ marginTop: "6px" }}>
                        {currentMetadata.legendData.map((item: any, index: number) => (
                          <div key={index} style={{ 
                            marginBottom: "4px", 
                            padding: "4px", 
                            backgroundColor: "white", 
                            borderRadius: "2px",
                            border: `1px solid ${item.color}`
                          }}>
                            <span style={{ color: item.color, fontWeight: "bold" }}>
                              {item.label}
                            </span>
                            <span style={{ color: "#64748b", marginLeft: "8px" }}>
                              (Order: {item.order})
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ color: "#64748b", fontStyle: "italic" }}>
                  No metadata available
                </div>
              )}
            </div>
            
            <h4 style={{ color: "#374151", marginBottom: "10px" }}>Metadata History:</h4>
            <div style={{ 
              backgroundColor: "#f8fafc", 
              padding: "12px", 
              borderRadius: "4px",
              fontSize: "10px",
              fontFamily: "monospace",
              maxHeight: "200px",
              overflowY: "auto"
            }}>
              {metadataHistory.length > 0 ? (
                metadataHistory.map((entry, index) => (
                  <div key={index} style={{ 
                    marginBottom: "8px", 
                    padding: "6px", 
                    backgroundColor: "white", 
                    borderRadius: "3px",
                    border: "1px solid #e2e8f0"
                  }}>
                    <div style={{ fontWeight: "bold", color: "#0ea5e9" }}>
                      {entry.timestamp}
                    </div>
                    <div style={{ color: "#64748b" }}>
                      Items: {entry.metadata.visibleItems?.length || 0} | 
                      Legend: {entry.metadata.legendData?.length || 0}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ color: "#64748b", fontStyle: "italic" }}>
                  No history available
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  },
  args: {
    dataSet: generateSampleData(),
    title: "Metadata Exposure Demo",
    colors: ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#06b6d4"],
    shapeValue1: "triangle",
    shapeValue2: "circle",
    shapesLabelsMapping: {
      value1: "2019 International Arrivals",
      value2: "2023 Current Arrivals",
      gap: "Recovery Status"
    },
    xAxisDataType: "number",
    xAxisFormat: (d: number) => `${d}mn`,
    width: 700,
    height: 600,
    margin: { top: 50, right: 150, bottom: 100, left: 150 },
    filter: undefined,
    onHighlightItem: fn(),
    onChartDataProcessed: fn(),
    onLegendDataChange: fn(),
    onColorMappingGenerated: fn(),
  },
};
import AreaChart from "../src/components/AreaChart";
import { Meta } from "@storybook/react";
import { MichiVzProvider } from "../src/components";
import React, { useState, useCallback, useMemo } from "react";
import { fn } from "@storybook/test";

// Define the default metadata for the component
export default {
  title: "Charts/Area Chart",
  component: AreaChart,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: `
# AreaChart - Color Management & Integration Guide

The AreaChart component supports multiple color management patterns and state integration options.

## 🎨 Color Management Features

### 1. Self-Generated Colors (Recommended)
- **Automatic**: Colors are auto-generated from a palette
- **Customizable**: Provide your own color palette via \`colors\` prop
- **Consistent**: Colors remain stable across re-renders
- **Callback**: Get generated colors via \`onColorMappingGenerated\`

### 2. Explicit Color Mapping
- **Direct Control**: Specify exact colors for each category
- **Override**: Takes precedence over auto-generation
- **Predictable**: Colors are exactly what you specify

### 3. Context-Based (Global State)
- **Shared**: Colors and highlights shared across multiple charts
- **Coordinated**: All charts respond to the same interactions
- **Centralized**: Managed via MichiVzProvider

## 🔗 Redux Integration Pattern

\`\`\`jsx
// 1. Store generated colors in Redux
<AreaChart
  onColorMappingGenerated={(colors) => 
    dispatch(setColorMapping({ chartId: 'chart1', colors }))
  }
/>

// 2. Use stored colors in other charts
<AreaChart
  colorsMapping={colorMappings.chart1 || {}}
/>
\`\`\`

## 📊 Story Examples

- **Primary**: Basic usage with predefined colors
- **SelfGeneratedColors**: Automatic color generation
- **WithCustomColors**: Custom color palette
- **WithColorMapping**: Explicit color assignments
- **WithSharedColorMapping**: Color sharing between charts
- **InteractiveHighlight**: Hover interactions & category toggles
- **TestHighlighting**: Programmatic highlighting controls

## 🎯 Interactive Features

- **Hover Highlighting**: Mouse over areas to highlight categories
- **Category Toggle**: Enable/disable categories dynamically  
- **Cross-Chart Sync**: Synchronize highlights across multiple charts
- **State Persistence**: Store interactions in Redux/context
        `
      }
    }
  },
  argTypes: {
    onChartDataProcessed: { action: "onChartDataProcessed" },
    onColorMappingGenerated: { 
      action: "onColorMappingGenerated",
      description: "Callback fired when colors are auto-generated. Use this to store colors in Redux/state management."
    },
    onHighlightItem: {
      action: "onHighlightItem", 
      description: "Callback fired when user hovers/highlights categories. Use for cross-chart synchronization."
    },
    colors: {
      description: "Custom color palette for auto-generation. Defaults to D3 category colors.",
      control: { type: "object" }
    },
    colorsMapping: {
      description: "Explicit color mapping for categories. Overrides auto-generation.",
      control: { type: "object" }
    }
  },
  decorators: [
    Story => (
      <MichiVzProvider>
        <Story />
      </MichiVzProvider>
    ),
  ],
} as Meta;

// Create a default story using the template
export const Primary = {
  args: {
    onChartDataProcessed: fn(),
    onColorMappingGenerated: fn(),
    colorsMapping: {
      Raw: "red",
      "Semi-processed": "blue",
      Processed: "green",
    },
    keys: ["Raw", "Semi-processed", "Processed"],
    series: [
      {
        date: "2018-01",
        Raw: 25.31,
        "Semi-processed": 37.44,
        Processed: 37.25,
      },
      {
        date: "2018-02",
        Raw: 29.23,
        "Semi-processed": 12.29,
        Processed: 58.48,
      },
      {
        date: "2018-03",
        Raw: 35.120000000000005,
        "Semi-processed": 21.64,
        Processed: 43.24,
      },
      {
        date: "2018-04",
        Raw: 14.24,
        "Semi-processed": 49.97,
        Processed: 35.79,
      },
      {
        date: "2018-05",
        Raw: 52.669999999999995,
        "Semi-processed": 21.65,
        Processed: 25.69,
      },
      {
        date: "2018-06",
        Raw: 17.61,
        "Semi-processed": 39.54,
        Processed: 42.85,
      },
      {
        date: "2018-07",
        Raw: 21.37,
        "Semi-processed": 25.669999999999998,
        Processed: 52.96999999999999,
      },
      {
        date: "2018-08",
        Raw: 19.05,
        "Semi-processed": 26.169999999999998,
        Processed: 54.779999999999994,
      },
      {
        date: "2018-09",
        Raw: 17.19,
        "Semi-processed": 36.19,
        Processed: 46.63,
      },
      {
        date: "2018-10",
        Raw: 32.96,
        "Semi-processed": 16.919999999999998,
        Processed: 50.12,
      },
      {
        date: "2018-11",
        Raw: 46.73,
        "Semi-processed": 22.84,
        Processed: 30.43,
      },
      {
        date: "2018-12",
        Raw: 44.85,
        "Semi-processed": 23.549999999999997,
        Processed: 31.59,
      },
      {
        date: "2019-01",
        Raw: 20.03,
        "Semi-processed": 14.38,
        Processed: 65.59,
      },
      {
        date: "2019-02",
        Raw: 16.689999999999998,
        "Semi-processed": 12.120000000000001,
        Processed: 71.19,
      },
      {
        date: "2019-03",
        Raw: 31.03,
        "Semi-processed": 19.63,
        Processed: 49.34,
      },
      {
        date: "2019-04",
        Raw: 10.15,
        "Semi-processed": 37.34,
        Processed: 52.51,
      },
      {
        date: "2019-05",
        Raw: 33.650000000000006,
        "Semi-processed": 23.580000000000002,
        Processed: 42.77,
      },
      {
        date: "2019-06",
        Raw: 36.7,
        "Semi-processed": 13.81,
        Processed: 49.49,
      },
      {
        date: "2019-07",
        Raw: 11.360000000000001,
        "Semi-processed": 15.02,
        Processed: 73.61999999999999,
      },
      {
        date: "2019-08",
        Raw: 16.3,
        "Semi-processed": 26.11,
        Processed: 57.589999999999996,
      },
      {
        date: "2019-09",
        Raw: 33.71,
        "Semi-processed": 33.22,
        Processed: 33.07,
      },
      {
        date: "2019-10",
        Raw: 39.32,
        "Semi-processed": 20.380000000000003,
        Processed: 40.300000000000004,
      },
      {
        date: "2019-11",
        Raw: 50.2,
        "Semi-processed": 14.680000000000001,
        Processed: 35.120000000000005,
      },
      {
        date: "2019-12",
        Raw: 44.12,
        "Semi-processed": 17.28,
        Processed: 38.6,
      },
      {
        date: "2020-01",
        Raw: 9.67,
        "Semi-processed": 26.66,
        Processed: 63.68000000000001,
      },
      {
        date: "2020-02",
        Raw: 9.48,
        "Semi-processed": 27.08,
        Processed: 63.44,
      },
      {
        date: "2020-03",
        Raw: 23.82,
        "Semi-processed": 17.919999999999998,
        Processed: 58.26,
      },
      {
        date: "2020-04",
        Raw: 40.910000000000004,
        "Semi-processed": 44.37,
        Processed: 14.719999999999999,
      },
      {
        date: "2020-05",
        Raw: 72.37,
        "Semi-processed": 7.5600000000000005,
        Processed: 20.080000000000002,
      },
      {
        date: "2020-06",
        Raw: 19.85,
        "Semi-processed": 11.88,
        Processed: 68.27,
      },
      {
        date: "2020-07",
        Raw: 29.56,
        "Semi-processed": 14.81,
        Processed: 55.63,
      },
      {
        date: "2020-08",
        Raw: 21.05,
        "Semi-processed": 18.59,
        Processed: 60.36,
      },
      {
        date: "2020-09",
        Raw: 18.67,
        "Semi-processed": 18.060000000000002,
        Processed: 63.27,
      },
      {
        date: "2020-10",
        Raw: 19.52,
        "Semi-processed": 19.08,
        Processed: 61.39,
      },
      {
        date: "2020-11",
        Raw: 24.67,
        "Semi-processed": 14.39,
        Processed: 60.95,
      },
      {
        date: "2020-12",
        Raw: 11.110000000000001,
        "Semi-processed": 20.47,
        Processed: 68.42,
      },
      {
        date: "2021-01",
        Raw: 20.19,
        "Semi-processed": 13.18,
        Processed: 66.64,
      },
      {
        date: "2021-02",
        Raw: 16.86,
        "Semi-processed": 13.71,
        Processed: 69.43,
      },
      {
        date: "2021-03",
        Raw: 19.650000000000002,
        "Semi-processed": 15.479999999999999,
        Processed: 64.87,
      },
      {
        date: "2021-04",
        Raw: 24.98,
        "Semi-processed": 15.110000000000001,
        Processed: 59.9,
      },
      {
        date: "2021-05",
        Raw: 12.540000000000001,
        "Semi-processed": 23.27,
        Processed: 64.19,
      },
      {
        date: "2021-06",
        Raw: 37.19,
        "Semi-processed": 24.7,
        Processed: 38.11,
      },
      {
        date: "2021-07",
        Raw: 7.23,
        "Semi-processed": 29.89,
        Processed: 62.88,
      },
      {
        date: "2021-08",
        Raw: 9.73,
        "Semi-processed": 29.520000000000003,
        Processed: 60.75000000000001,
      },
      {
        date: "2021-09",
        Raw: 11.360000000000001,
        "Semi-processed": 27.389999999999997,
        Processed: 61.25000000000001,
      },
      {
        date: "2021-10",
        Raw: 11.62,
        "Semi-processed": 27.97,
        Processed: 60.41,
      },
      {
        date: "2021-11",
        Raw: 20.830000000000002,
        "Semi-processed": 25.53,
        Processed: 53.64,
      },
      {
        date: "2021-12",
        Raw: 21.07,
        "Semi-processed": 34.300000000000004,
        Processed: 44.629999999999995,
      },
      {
        date: "2022-01",
        Raw: 21.959999999999997,
        "Semi-processed": 35.32,
        Processed: 42.72,
      },
      {
        date: "2022-02",
        Raw: 17.89,
        "Semi-processed": 27.439999999999998,
        Processed: 54.67999999999999,
      },
      {
        date: "2022-03",
        Raw: 15.559999999999999,
        "Semi-processed": 29.03,
        Processed: 55.410000000000004,
      },
      {
        date: "2022-04",
        Raw: 18.37,
        "Semi-processed": 27.139999999999997,
        Processed: 54.49,
      },
      {
        date: "2022-05",
        Raw: 25.06,
        "Semi-processed": 30.75,
        Processed: 44.190000000000005,
      },
      {
        date: "2022-06",
        Raw: 31.979999999999997,
        "Semi-processed": 23.200000000000003,
        Processed: 44.82,
      },
      {
        date: "2022-07",
        Raw: 10.61,
        "Semi-processed": 20.26,
        Processed: 69.13,
      },
      {
        date: "2022-08",
        Raw: 11.62,
        "Semi-processed": 19.99,
        Processed: 68.4,
      },
      {
        date: "2022-09",
        Raw: 10.040000000000001,
        "Semi-processed": 16.91,
        Processed: 73.05,
      },
      {
        date: "2022-10",
        Raw: 13.059999999999999,
        "Semi-processed": 20.91,
        Processed: 66.03,
      },
      {
        date: "2022-11",
        Raw: 7.62,
        "Semi-processed": 21.83,
        Processed: 70.55,
      },
      {
        date: "2022-12",
        Raw: 11.81,
        "Semi-processed": 15.540000000000001,
        Processed: 72.64,
      },
      {
        date: "2023-01",
        Raw: 9.99,
        "Semi-processed": 14.81,
        Processed: 75.2,
      },
      {
        date: "2023-02",
        Raw: 13.309999999999999,
        "Semi-processed": 7.91,
        Processed: 78.78,
      },
      {
        date: "2023-03",
        Raw: 32.06,
        "Semi-processed": 13.51,
        Processed: 54.44,
      },
      {
        date: "2023-04",
        Raw: 42.11,
        "Semi-processed": 15.57,
        Processed: 42.33,
      },
      {
        date: "2023-05",
        Raw: 37.32,
        "Semi-processed": 12.520000000000001,
        Processed: 50.160000000000004,
      },
      {
        date: "2023-06",
        Raw: 15.14,
        "Semi-processed": 16.520000000000003,
        Processed: 68.33,
      },
      {
        date: "2023-07",
        Raw: 24.39,
        "Semi-processed": 17.98,
        Processed: 57.620000000000005,
      },
      {
        date: "2023-08",
        Raw: 9.51,
        "Semi-processed": 19.18,
        Processed: 71.31,
      },
      {
        date: "2023-09",
        Raw: 9.47,
        "Semi-processed": 22.24,
        Processed: 68.28999999999999,
      },
      {
        date: "2023-10",
        Raw: 8.459999999999999,
        "Semi-processed": 29.270000000000003,
        Processed: 62.27,
      },
    ],

    width: 900,
    height: 480,
    margin: {
      top: 50,
      right: 70,
      bottom: 70,
      left: 70,
    },
    yAxisFormat: (d: any) => `${d}%`,
    title: "Area Chart",
    yAxisDomain: [0, 100],
    xAxisDataType: "date_monthly",
    xAxisFormat: (d: any) => {
      const date = new Date(d);
      return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    },
    ticks: 6,
  },
};

export const QuarterlyTicks = {
  args: {
    ...Primary.args,
    xAxisFormat: (d: any) => {
      const date = new Date(d);
      const month = date.getMonth() + 1;
      if (month === 1 || month === 7) {
        return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      }
      return "";
    },
    ticks: 4,
  },
};

export const YearlyTicks = {
  args: {
    ...Primary.args,
    xAxisFormat: (d: any) => {
      const date = new Date(d);
      const month = date.getMonth() + 1;
      if (month === 1) {
        return date.toLocaleDateString("en-US", { year: "numeric" });
      }
      return "";
    },
    ticks: 3,
  },
};

export const SelfGeneratedColors = {
  args: {
    onChartDataProcessed: fn(),
    onColorMappingGenerated: fn(),
    // No colorsMapping provided - colors will be auto-generated
    keys: ["Category A", "Category B", "Category C", "Category D"],
    series: [
      {
        date: "2023-01",
        "Category A": 25,
        "Category B": 30,
        "Category C": 20,
        "Category D": 25,
      },
      {
        date: "2023-02",
        "Category A": 30,
        "Category B": 25,
        "Category C": 25,
        "Category D": 20,
      },
      {
        date: "2023-03",
        "Category A": 20,
        "Category B": 35,
        "Category C": 30,
        "Category D": 15,
      },
      {
        date: "2023-04",
        "Category A": 35,
        "Category B": 20,
        "Category C": 25,
        "Category D": 20,
      },
    ],
    width: 900,
    height: 480,
    margin: {
      top: 50,
      right: 70,
      bottom: 70,
      left: 70,
    },
    yAxisFormat: (d: any) => `${d}%`,
    title: "Self-Generated Colors Example",
    yAxisDomain: [0, 100],
    xAxisDataType: "date_monthly",
    xAxisFormat: (d: any) => {
      const date = new Date(d);
      return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    },
    ticks: 4,
  },
};

// Interactive story with highlight functionality
export const InteractiveHighlight = {
  parameters: {
    docs: {
      description: {
        story: `
**Interactive Highlighting & State Management**

This story shows how to implement interactive highlighting with category toggles:

\`\`\`jsx
const [highlightedItems, setHighlightedItems] = useState([]);
const [disabledItems, setDisabledItems] = useState([]);

<AreaChart
  onHighlightItem={setHighlightedItems}  // Handle hover highlights
  highlightItems={highlightedItems}      // Pass as props for better performance
  disabledItems={disabledItems}
  {...props}
/>
\`\`\`

**Features Demonstrated:**
- **Hover Highlighting**: Mouse over chart areas to highlight categories
- **Category Toggling**: Click buttons to enable/disable categories  
- **Real-time Feedback**: Visual display of current highlight state
- **State Synchronization**: Changes affect all charts in the provider

**Redux Integration:**
\`\`\`jsx
// Store interactions in Redux
onHighlightItem={(items) => dispatch(setHighlightItems(items))}

// Use from Redux state
const highlightItems = useSelector(state => state.charts.highlightItems);
\`\`\`
        `
      }
    }
  },
  render: (args: any) => {
    const [highlightedItems, setHighlightedItems] = useState<string[]>([]);
    const [disabledItems, setDisabledItems] = useState<string[]>([]);

    return (
      <div>
        <div style={{ marginBottom: "20px" }}>
          <h3>Hover over the chart to highlight areas</h3>
          <p>
            <strong>Currently highlighted:</strong>{" "}
            {highlightedItems.length > 0 ? highlightedItems.join(", ") : "None"}
          </p>
          <div style={{ marginTop: "10px" }}>
            <strong>Toggle categories (click to disable/enable):</strong>
            <div style={{ display: "flex", gap: "10px", marginTop: "5px" }}>
              {args.keys.map((key: string) => (
                <button
                  key={key}
                  onClick={() => {
                    setDisabledItems(prev =>
                      prev.includes(key)
                        ? prev.filter(item => item !== key)
                        : [...prev, key]
                    );
                  }}
                  style={{
                    padding: "5px 10px",
                    cursor: "pointer",
                    backgroundColor: disabledItems.includes(key) ? "#ccc" : "#1f77b4",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    textDecoration: disabledItems.includes(key) ? "line-through" : "none",
                  }}
                >
                  {key}
                </button>
              ))}
            </div>
          </div>
        </div>
        <AreaChart
          {...args}
          onHighlightItem={setHighlightedItems}
          highlightItems={highlightedItems}
          disabledItems={disabledItems}
        />
      </div>
    );
  },
  args: {
    onChartDataProcessed: fn(),
    onColorMappingGenerated: fn(),
    keys: ["Raw", "Semi-processed", "Processed"],
    series: Primary.args.series.slice(0, 24), // Use subset of data for cleaner demo
    width: 900,
    height: 480,
    margin: {
      top: 50,
      right: 70,
      bottom: 70,
      left: 70,
    },
    yAxisFormat: (d: any) => `${d}%`,
    title: "Interactive Area Chart - Hover to Highlight",
    yAxisDomain: [0, 100],
    xAxisDataType: "date_monthly",
    xAxisFormat: (d: any) => {
      const date = new Date(d);
      return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    },
    ticks: 6,
  },
};

// Story with predefined highlights
export const WithPredefinedHighlight = {
  render: (args: any) => {
    return (
      <div>
        <div style={{ marginBottom: "20px" }}>
          <h3>Area Chart with "Processed" Category Pre-highlighted</h3>
          <p>The "Processed" category is highlighted by default via props</p>
        </div>
        <MichiVzProvider
          colorsMapping={{
            Raw: "#ff7f0e",
            "Semi-processed": "#2ca02c",
            Processed: "#1f77b4",
          }}
        >
          <AreaChart {...args} highlightItems={["Processed"]} />
        </MichiVzProvider>
      </div>
    );
  },
  args: {
    onChartDataProcessed: fn(),
    onColorMappingGenerated: fn(),
    onHighlightItem: fn(),
    keys: ["Raw", "Semi-processed", "Processed"],
    series: Primary.args.series.slice(0, 12), // Use one year of data
    width: 900,
    height: 480,
    margin: {
      top: 50,
      right: 70,
      bottom: 70,
      left: 70,
    },
    yAxisFormat: (d: any) => `${d}%`,
    title: "Production Data by Processing Stage",
    yAxisDomain: [0, 100],
    xAxisDataType: "date_monthly",
    xAxisFormat: (d: any) => {
      const date = new Date(d);
      return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    },
    ticks: 6,
  },
};

// Story with custom colors array
export const WithCustomColors = {
  parameters: {
    docs: {
      description: {
        story: `
**Custom Color Palette Example**

This story demonstrates how to provide a custom color palette for automatic color generation:

\`\`\`jsx
<AreaChart
  colors={["#e91e63", "#9c27b0", "#673ab7", "#3f51b5"]}  // Material Design colors
  onColorMappingGenerated={(colors) => {
    // colors = { "Category A": "#e91e63", "Category B": "#9c27b0", ... }
  }}
/>
\`\`\`

**Use Cases:**
- Brand-specific color schemes
- Accessibility-compliant palettes  
- Theme-based color variations
- Custom color requirements
        `
      }
    }
  },
  args: {
    onChartDataProcessed: fn(),
    onColorMappingGenerated: fn(),
    onHighlightItem: fn(),
    // Custom color palette
    colors: ["#e91e63", "#9c27b0", "#673ab7", "#3f51b5"],
    keys: ["Category A", "Category B", "Category C", "Category D"],
    series: [
      {
        date: "2023-Q1",
        "Category A": 30,
        "Category B": 25,
        "Category C": 25,
        "Category D": 20,
      },
      {
        date: "2023-Q2",
        "Category A": 25,
        "Category B": 30,
        "Category C": 20,
        "Category D": 25,
      },
      {
        date: "2023-Q3",
        "Category A": 35,
        "Category B": 20,
        "Category C": 30,
        "Category D": 15,
      },
      {
        date: "2023-Q4",
        "Category A": 20,
        "Category B": 35,
        "Category C": 25,
        "Category D": 20,
      },
    ],
    width: 900,
    height: 480,
    margin: {
      top: 50,
      right: 70,
      bottom: 70,
      left: 70,
    },
    yAxisFormat: (d: any) => `${d}%`,
    title: "Custom Color Palette Example",
    yAxisDomain: [0, 100],
    xAxisDataType: "date_monthly",
    xAxisFormat: (d: any) => d,
    ticks: 4,
  },
};

// Story with explicit color mapping
export const WithColorMapping = {
  args: {
    onChartDataProcessed: fn(),
    onColorMappingGenerated: fn(),
    onHighlightItem: fn(),
    // Explicit color mapping for each category
    colorsMapping: {
      "Sales": "#4caf50",
      "Marketing": "#ff9800",
      "Development": "#2196f3",
      "Support": "#f44336",
    },
    keys: ["Sales", "Marketing", "Development", "Support"],
    series: [
      {
        date: 1,
        "Sales": 45,
        "Marketing": 20,
        "Development": 25,
        "Support": 10,
      },
      {
        date: 2,
        "Sales": 40,
        "Marketing": 25,
        "Development": 20,
        "Support": 15,
      },
      {
        date: 3,
        "Sales": 50,
        "Marketing": 15,
        "Development": 25,
        "Support": 10,
      },
      {
        date: 4,
        "Sales": 35,
        "Marketing": 30,
        "Development": 20,
        "Support": 15,
      },
    ],
    width: 900,
    height: 480,
    margin: {
      top: 50,
      right: 70,
      bottom: 70,
      left: 70,
    },
    yAxisFormat: (d: any) => `${d}%`,
    title: "Department Budget Allocation",
    yAxisDomain: [0, 100],
    xAxisDataType: "number",
    xAxisFormat: (d: any) => {
      const months = ["Jan", "Feb", "Mar", "Apr"];
      return months[d - 1] || `Month ${d}`;
    },
    ticks: 4,
  },
};

// Story demonstrating shared color mapping between charts
export const WithSharedColorMapping = {
  parameters: {
    docs: {
      description: {
        story: `
**Redux Integration Example**

This story demonstrates the complete pattern for sharing colors between charts via state management:

\`\`\`jsx
// 1. First chart generates colors
const [generatedColors, setGeneratedColors] = useState({});

<AreaChart
  onColorMappingGenerated={setGeneratedColors}  // Store generated colors
  title="Chart 1: Generates Colors"
/>

// 2. Second chart uses the same colors
<AreaChart
  colorsMapping={generatedColors}  // Use stored colors
  title="Chart 2: Uses Generated Colors" 
/>
\`\`\`

**Redux Pattern:**
\`\`\`jsx
// Store colors in Redux
dispatch(setColorMapping({ chartId: 'global', colors }));

// Use colors from Redux
const globalColors = useSelector(state => state.charts.colorMappings.global);
<AreaChart colorsMapping={globalColors} />
\`\`\`

**Benefits:**
- Consistent colors across all charts
- Centralized color management
- Easy to persist/restore color schemes
- Perfect for dashboards with multiple charts
        `
      }
    }
  },
  render: (args: any) => {
    const [generatedColors, setGeneratedColors] = useState<{ [key: string]: string }>({});
    
    // Use useCallback to prevent infinite loops
    const handleColorMappingGenerated = useCallback((colors: { [key: string]: string }) => {
      // Only update if colors actually changed
      if (JSON.stringify(colors) !== JSON.stringify(generatedColors)) {
        setGeneratedColors(colors);
      }
    }, [generatedColors]);
    
    // Memoize the modified series to prevent recalculation on every render
    const modifiedSeries = useMemo(() => 
      args.series.map((item: any) => ({
        ...item,
        "Product A": item["Product A"] * 0.8,
        "Product B": item["Product B"] * 1.2,
        "Product C": item["Product C"] * 0.9,
      })), [args.series]);
    
    return (
      <div>
        <div style={{ marginBottom: "20px" }}>
          <h3>Shared Color Mapping Between Charts</h3>
          <p>Both charts share the same color mapping generated by the first chart</p>
          <p><strong>Generated colors:</strong> {JSON.stringify(generatedColors)}</p>
        </div>
        
        <div style={{ marginBottom: "40px" }}>
          <AreaChart
            {...args}
            onColorMappingGenerated={handleColorMappingGenerated}
            title="Chart 1: Generates Colors"
          />
        </div>
        
        <div>
          <AreaChart
            {...args}
            colorsMapping={generatedColors}
            onColorMappingGenerated={undefined}
            title="Chart 2: Uses Generated Colors"
            series={modifiedSeries}
          />
        </div>
      </div>
    );
  },
  args: {
    onChartDataProcessed: fn(),
    onHighlightItem: fn(),
    keys: ["Product A", "Product B", "Product C"],
    series: [
      {
        date: "2023-01",
        "Product A": 30,
        "Product B": 40,
        "Product C": 30,
      },
      {
        date: "2023-02",
        "Product A": 35,
        "Product B": 35,
        "Product C": 30,
      },
      {
        date: "2023-03",
        "Product A": 25,
        "Product B": 45,
        "Product C": 30,
      },
      {
        date: "2023-04",
        "Product A": 40,
        "Product B": 30,
        "Product C": 30,
      },
    ],
    width: 900,
    height: 400,
    margin: {
      top: 50,
      right: 70,
      bottom: 70,
      left: 70,
    },
    yAxisFormat: (d: any) => `${d}%`,
    yAxisDomain: [0, 100],
    xAxisDataType: "date_monthly",
    xAxisFormat: (d: any) => {
      const date = new Date(d);
      return date.toLocaleDateString("en-US", { month: "short" });
    },
    ticks: 4,
  },
};

// Test highlighting functionality
export const TestHighlighting = {
  render: (args: any) => {
    const [highlightedItems, setHighlightedItems] = useState<string[]>(["Beta"]);
    
    return (
      <div>
        <div style={{ marginBottom: "20px" }}>
          <h3>Test Highlighting Functionality</h3>
          <p>Click buttons to highlight different categories</p>
          <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
            <button onClick={() => setHighlightedItems([])}>Clear All</button>
            <button onClick={() => setHighlightedItems(["Alpha"])}>Highlight Alpha</button>
            <button onClick={() => setHighlightedItems(["Beta"])}>Highlight Beta</button>
            <button onClick={() => setHighlightedItems(["Gamma"])}>Highlight Gamma</button>
            <button onClick={() => setHighlightedItems(["Alpha", "Gamma"])}>Highlight Alpha & Gamma</button>
          </div>
          <p style={{ marginTop: "10px" }}>
            <strong>Currently highlighted:</strong> {highlightedItems.join(", ") || "None"}
          </p>
        </div>
        
        <AreaChart
          {...args}
          onHighlightItem={setHighlightedItems}
          highlightItems={highlightedItems}
        />
      </div>
    );
  },
  args: {
    onChartDataProcessed: fn(),
    onColorMappingGenerated: fn(),
    keys: ["Alpha", "Beta", "Gamma"],
    series: [
      {
        date: 1,
        "Alpha": 20,
        "Beta": 50,
        "Gamma": 30,
      },
      {
        date: 2,
        "Alpha": 30,
        "Beta": 40,
        "Gamma": 30,
      },
      {
        date: 3,
        "Alpha": 25,
        "Beta": 45,
        "Gamma": 30,
      },
      {
        date: 4,
        "Alpha": 35,
        "Beta": 35,
        "Gamma": 30,
      },
      {
        date: 5,
        "Alpha": 40,
        "Beta": 30,
        "Gamma": 30,
      },
    ],
    width: 900,
    height: 480,
    margin: {
      top: 50,
      right: 70,
      bottom: 70,
      left: 70,
    },
    yAxisFormat: (d: any) => `${d}%`,
    title: "Test Highlighting - Click Buttons Above",
    yAxisDomain: [0, 100],
    xAxisDataType: "number",
    xAxisFormat: (d: any) => `Point ${d}`,
    ticks: 5,
  },
};

// Generate comprehensive dataset for legend testing (similar to LineChart)
const generateLargeDataset = () => {
  const countries = [
    "United States", "China", "Japan", "Germany", "India", "United Kingdom", "France", "Brazil", "Italy", "Canada",
    "Russia", "South Korea", "Australia", "Spain", "Mexico", "Indonesia", "Netherlands", "Saudi Arabia", "Turkey", "Taiwan",
    "Switzerland", "Ireland", "Belgium", "Israel", "Argentina", "Egypt", "South Africa", "Thailand", "Bangladesh", "Nigeria",
    "Chile", "Finland", "Philippines", "Malaysia", "New Zealand", "Vietnam", "Peru", "Czech Republic", "Romania", "Portugal",
    "Iraq", "Kenya", "Morocco", "Ukraine", "Sri Lanka", "Ethiopia", "Guatemala", "Uruguay", "Costa Rica", "Panama"
  ];
  
  const years = [2020, 2021, 2022, 2023];
  
  return years.map(year => {
    const entry: any = { date: year };
    countries.forEach(country => {
      entry[country] = Math.random() * 100;
    });
    return entry;
  });
};

export const LegendWithFilterControls = {
  render: (args: any) => {
    const [filter, setFilter] = useState({ date: 2023, sortingDir: "desc" as "asc" | "desc" });
    const [colorsMapping, setColorsMapping] = useState<{ [key: string]: string }>({});
    const [legendData, setLegendData] = useState<any[]>([]);
    const [originalLegendOrder, setOriginalLegendOrder] = useState<any[]>([]);
    const [disabledItems, setDisabledItems] = useState<string[]>([]);

    const handleChartDataProcessed = useCallback((metadata: any) => {
      if (metadata.legendData) {
        setLegendData(metadata.legendData);
        
        // Store original legend order when first loaded or when no items are disabled
        if (disabledItems.length === 0) {
          setOriginalLegendOrder(metadata.legendData);
        }
      }
    }, [disabledItems.length]);

    const handleColorMappingGenerated = useCallback((colors: { [key: string]: string }) => {
      setColorsMapping(colors);
    }, []);

    const toggleItemDisabled = useCallback((label: string) => {
      setDisabledItems(prev => 
        prev.includes(label) 
          ? prev.filter(item => item !== label)
          : [...prev, label]
      );
    }, []);

    return (
      <div>
        <div style={{ marginBottom: "20px", padding: "10px", border: "1px solid #ddd", borderRadius: "4px" }}>
          <h3>🎨 Legend-Based Color Assignment Test</h3>
          <p>This story tests the new legend-based color assignment approach for AreaChart.</p>
          
          <div style={{ display: "flex", gap: "20px", marginBottom: "15px", alignItems: "center" }}>
            <div>
              <label style={{ marginRight: "5px" }}>Filter Year:</label>
              <select 
                value={filter.date} 
                onChange={(e) => setFilter(prev => ({ ...prev, date: parseInt(e.target.value) }))}
                style={{ padding: "4px" }}
              >
                <option value={2020}>2020</option>
                <option value={2021}>2021</option>
                <option value={2022}>2022</option>
                <option value={2023}>2023</option>
              </select>
            </div>
            
            <div>
              <label style={{ marginRight: "5px" }}>Sort Direction:</label>
              <select 
                value={filter.sortingDir} 
                onChange={(e) => setFilter(prev => ({ ...prev, sortingDir: e.target.value as "asc" | "desc" }))}
                style={{ padding: "4px" }}
              >
                <option value="desc">Highest First</option>
                <option value="asc">Lowest First</option>
              </select>
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
            <button onClick={() => setFilter({ date: 2020, sortingDir: "desc" })}>📊 2020 High→Low</button>
            <button onClick={() => setFilter({ date: 2021, sortingDir: "asc" })}>📈 2021 Low→High</button>
            <button onClick={() => setFilter({ date: 2022, sortingDir: "desc" })}>📉 2022 High→Low</button>
            <button onClick={() => setFilter({ date: 2023, sortingDir: "asc" })}>🔄 2023 Low→High</button>
          </div>

          <div style={{ marginTop: "15px" }}>
            <strong>Legend Data (First 10 items):</strong>
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
              gap: "5px", 
              marginTop: "5px",
              maxHeight: "120px",
              overflowY: "auto"
            }}>
              {(originalLegendOrder.length > 0 ? originalLegendOrder : legendData)
                .slice(0, 10)
                .map((originalItem, index) => {
                  // Find current status from legendData
                  const currentItem = legendData.find(item => item.label === originalItem.label);
                  const displayItem = currentItem || originalItem;
                  
                  return (
                <div 
                  key={displayItem.label}
                  style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    padding: "2px 5px",
                    fontSize: "12px",
                    cursor: "pointer",
                    backgroundColor: disabledItems.includes(displayItem.label) ? "#f5f5f5" : "transparent",
                    textDecoration: disabledItems.includes(displayItem.label) ? "line-through" : "none"
                  }}
                  onClick={() => toggleItemDisabled(displayItem.label)}
                >
                  <div 
                    style={{ 
                      width: "12px", 
                      height: "12px", 
                      backgroundColor: originalItem.color, 
                      marginRight: "5px",
                      border: "1px solid #ccc"
                    }}
                  />
                  <span>#{originalItem.order + 1} {displayItem.label}</span>
                </div>
                  );
                })}
            </div>
            {legendData.length > 10 && (
              <p style={{ fontSize: "12px", color: "#666", marginTop: "5px" }}>
                ... and {legendData.length - 10} more items
              </p>
            )}
          </div>
        </div>

        <AreaChart
          {...args}
          filter={filter}
          colorsMapping={colorsMapping}
          disabledItems={disabledItems}
          onChartDataProcessed={handleChartDataProcessed}
          onColorMappingGenerated={handleColorMappingGenerated}
        />
      </div>
    );
  },
  args: {
    keys: [
      "United States", "China", "Japan", "Germany", "India", "United Kingdom", "France", "Brazil", "Italy", "Canada",
      "Russia", "South Korea", "Australia", "Spain", "Mexico", "Indonesia", "Netherlands", "Saudi Arabia", "Turkey", "Taiwan",
      "Switzerland", "Ireland", "Belgium", "Israel", "Argentina", "Egypt", "South Africa", "Thailand", "Bangladesh", "Nigeria",
      "Chile", "Finland", "Philippines", "Malaysia", "New Zealand", "Vietnam", "Peru", "Czech Republic", "Romania", "Portugal",
      "Iraq", "Kenya", "Morocco", "Ukraine", "Sri Lanka", "Ethiopia", "Guatemala", "Uruguay", "Costa Rica", "Panama"
    ],
    series: generateLargeDataset(),
    width: 900,
    height: 500,
    margin: { top: 50, right: 70, bottom: 70, left: 70 },
    title: "Area Chart - Legend-Based Color Assignment Test",
    yAxisFormat: (d: any) => `${d.toFixed(1)}%`,
    yAxisDomain: [0, 100],
    xAxisDataType: "number",
    xAxisFormat: (d: any) => `${d}`,
    ticks: 4,
  },
};

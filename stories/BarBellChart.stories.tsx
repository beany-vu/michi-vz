import React, { useState } from "react";
import { Meta } from "@storybook/react";
import { fn } from '@storybook/test';
import BarBellChart from "../src/components/BarBellChart";
import { MichiVzProvider } from "../src/components";

const mockData = [
  {
    date: "2020-01",
    step1: 1000,
    step2: 2000,
    step3: 100,
  },
  {
    date: "2020-02",
    step1: 1500,
    step2: 2000,
    step3: 1000,
  },
  {
    date: "2020-03",
    step1: 2000,
    step2: 1500,
    step3: 2000,
  },
  {
    date: "2020-04",
    step1: 2500,
    step2: 1000,
    step3: 3000,
  },
  {
    date: "2020-05",
    step1: 3000,
    step2: 500,
    step3: 4000,
  },
  {
    date: "2020-06",
    step1: 3500,
    step2: 0,
    step3: 5000,
  },
  {
    date: "2020-07",
    step1: 4000,
    step2: 0,
    step3: 6000,
  },
  {
    date: "2020-08",
    step1: 4500,
    step2: 0,
    step3: 7000,
  },
  {
    date: "2020-09",
    step1: 5000,
    step2: 0,
    step3: 8000,
  },
  {
    date: "2020-10",
    step1: 5500,
    step2: 10,
    step3: 9000,
  },
  {
    date: "2020-11",
    step1: 6000,
    step2: 1,
    step3: 10000,
  },
  {
    date: "2020-12",
    step1: 1,
    step2: 0,
    step3: 2,
  },
];

const mockData2 = [
  {
    date: "2020-01 | Egypt",
    step1: 1000,
    step2: 2000,
    step3: 100,
  },
  {
    date: "2020-01 | Madagascar",
    step1: 1500,
    step2: 2000,
    step3: 1000,
  },
  {
    date: "2020-01 | Morocco",
    step1: 2000,
    step2: 1500,
    step3: 2000,
  },
  {
    date: "2020-02 | Egypt",
    step1: 2500,
    step2: 1000,
    step3: 3000,
  },
  {
    date: "2020-02 | Madagascar",
    step1: 3000,
    step2: 500,
    step3: 4000,
  },
  {
    date: "2020-02 | Morocco",
    step1: 3500,
    step2: 0,
    step3: 5000,
  },
  {
    date: "2020-03 | Egypt",
    step1: 0,
    step2: 0,
    step3: 6000,
  },
  {
    date: "2020-03 | Madagascar",
    step1: 4500,
    step2: 0,
    step3: 7000,
  },
  {
    date: "2020-03 | Morocco",
    step1: 5000,
    step2: 0,
    step3: 8000,
  },
  {
    date: "2020-04 | Egypt",
    step1: 5500,
    step2: 10,
    step3: 9000,
  },
  {
    date: "2020-04 | Madagascar",
    step1: 6000,
    step2: 1,
    step3: 10000,
  },
  {
    date: "2020-04 | Morocco",
    step1: 1,
    step2: 0,
  },
];

export default {
  title: "Charts/BarBellChart",
  component: BarBellChart,
  decorators: [
    Story => (
      <MichiVzProvider
        colorsMapping={{ step1: "red", step2: "blue", step3: "pink" }}
      >
        <Story />
      </MichiVzProvider>
    ),
  ],
} as Meta;

export const Primary = {
  args: {
    dataSet: mockData2,
    keys: ["step1", "step2", "step3"],
    width: 900,
    height: 500,
    margin: {
      top: 50,
      right: 50,
      bottom: 50,
      left: 200,
    },
    title: "BarBell Chart",
    xAxisFormat: (value: any) => value,
    yAxisFormat: (value: any) => {
      return value;
    },
    showGrid: {
      x: true,
      y: false,
    },
    children: null,
    onColorMappingGenerated: fn(),
  },
};

export const SimpleData = {
  args: {
    dataSet: mockData,
    keys: ["step1", "step2", "step3"],
    width: 900,
    height: 400,
    margin: {
      top: 50,
      right: 50,
      bottom: 50,
      left: 100,
    },
    title: "Simple BarBell Chart",
    xAxisFormat: (value: any) => `${value}`,
    yAxisFormat: (value: any) => value,
    showGrid: {
      x: true,
      y: true,
    },
    onColorMappingGenerated: fn(),
  },
};

export const TwoStepsOnly = {
  args: {
    dataSet: mockData.map(({ step3, ...rest }) => rest),
    keys: ["step1", "step2"],
    width: 900,
    height: 400,
    margin: {
      top: 50,
      right: 50,
      bottom: 50,
      left: 100,
    },
    title: "Two Steps BarBell Chart",
    xAxisFormat: (value: any) => `${value}K`,
    yAxisFormat: (value: any) => value,
    showGrid: {
      x: false,
      y: false,
    },
    onColorMappingGenerated: fn(),
  },
};

export const LargeDataset = {
  args: {
    dataSet: [
      ...mockData,
      ...mockData.map((item, index) => ({
        ...item,
        date: `2021-${String(index + 1).padStart(2, '0')}`,
        step1: item.step1 * 1.2,
        step2: item.step2 * 0.8,
        step3: item.step3 * 1.5,
      })),
      ...mockData.map((item, index) => ({
        ...item,
        date: `2022-${String(index + 1).padStart(2, '0')}`,
        step1: item.step1 * 0.9,
        step2: item.step2 * 1.3,
        step3: item.step3 * 0.7,
      })),
    ],
    keys: ["step1", "step2", "step3"],
    width: 900,
    height: 800,
    margin: {
      top: 50,
      right: 50,
      bottom: 50,
      left: 100,
    },
    title: "Large Dataset BarBell Chart",
    xAxisFormat: (value: any) => `${(value / 1000).toFixed(1)}K`,
    yAxisFormat: (value: any) => value,
    showGrid: {
      x: true,
      y: false,
    },
    onColorMappingGenerated: fn(),
  },
};

export const CustomColors = {
  args: {
    dataSet: mockData2,
    keys: ["step1", "step2", "step3"],
    width: 900,
    height: 500,
    margin: {
      top: 50,
      right: 50,
      bottom: 50,
      left: 200,
    },
    title: "Custom Colors BarBell Chart",
    colors: ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7"],
    xAxisFormat: (value: any) => `${value}`,
    yAxisFormat: (value: any) => value,
    showGrid: {
      x: true,
      y: false,
    },
    onColorMappingGenerated: fn(),
  },
  decorators: [
    (Story) => (
      <MichiVzProvider>
        <Story />
      </MichiVzProvider>
    ),
  ],
};

const InteractiveTemplate = (args: any) => {
  const [highlightItems, setHighlightItems] = useState<string[]>([]);
  
  return (
    <div>
      <div style={{ marginBottom: "20px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <h3>Hover Controls:</h3>
        {args.keys.map((key: string) => (
          <button
            key={key}
            style={{
              padding: "8px 16px",
              backgroundColor: highlightItems.includes(key) ? "#007bff" : "#f8f9fa",
              color: highlightItems.includes(key) ? "white" : "#333",
              border: "1px solid #dee2e6",
              borderRadius: "4px",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={() => setHighlightItems([key])}
            onMouseLeave={() => setHighlightItems([])}
            onClick={() => {
              setHighlightItems(prev => 
                prev.includes(key) ? prev.filter(item => item !== key) : [...prev, key]
              );
            }}
          >
            {key.charAt(0).toUpperCase() + key.slice(1)}
          </button>
        ))}
        <button
          style={{
            padding: "8px 16px",
            backgroundColor: "#dc3545",
            color: "white",
            border: "1px solid #dc3545",
            borderRadius: "4px",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
          onClick={() => setHighlightItems([])}
        >
          Clear All
        </button>
      </div>
      
      <MichiVzProvider highlightItems={highlightItems}>
        <BarBellChart {...args} onHighlightItem={setHighlightItems} />
      </MichiVzProvider>
    </div>
  );
};

export const InteractiveHover = {
  render: InteractiveTemplate,
  args: {
    dataSet: mockData2,
    keys: ["step1", "step2", "step3"],
    width: 900,
    height: 500,
    margin: {
      top: 50,
      right: 50,
      bottom: 50,
      left: 200,
    },
    title: "Interactive Hover BarBell Chart",
    xAxisFormat: (value: any) => `${value}`,
    yAxisFormat: (value: any) => value,
    showGrid: {
      x: true,
      y: false,
    },
    onColorMappingGenerated: fn(),
  },
};

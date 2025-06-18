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
      <MichiVzProvider>
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

// Comprehensive interactive story with disable/enable functionality
export const DisableEnableColorMapping = {
  render: (args: any) => {
    const [currentHighlight, setCurrentHighlight] = React.useState<string[]>([]);
    const [disabledItems, setDisabledItems] = React.useState<string[]>([]);
    const [colorsMapping, setColorsMapping] = React.useState<{ [key: string]: string }>({});
    
    const handleColorMappingGenerated = React.useCallback((newMapping: { [key: string]: string }) => {
      setColorsMapping(prev => ({ ...prev, ...newMapping }));
    }, []);

    const toggleDisabled = React.useCallback((key: string) => {
      setDisabledItems(prev => 
        prev.includes(key) 
          ? prev.filter(item => item !== key)
          : [...prev, key]
      );
    }, []);

    const controlsContainerStyle = {
      display: "flex",
      flexDirection: "column" as const,
      gap: "15px",
      marginBottom: "20px",
      padding: "15px",
      border: "1px solid #e0e0e0",
      borderRadius: "8px",
      backgroundColor: "#f9f9f9",
    };

    const buttonGroupStyle = {
      display: "flex",
      gap: "10px",
      flexWrap: "wrap" as const,
      alignItems: "center",
    };

    const sectionLabelStyle = {
      fontSize: "14px",
      fontWeight: "bold" as const,
      color: "#333",
      marginBottom: "5px",
    };

    const buttonStyle = (key: string, type: "highlight" | "disable") => {
      const baseStyle = {
        padding: "8px 16px",
        border: "2px solid",
        borderRadius: "4px",
        cursor: "pointer",
        transition: "all 0.3s ease",
        fontWeight: 500,
        fontSize: "12px",
      };

      if (type === "highlight") {
        const isHighlighted = currentHighlight.includes(key);
        const color = colorsMapping[key] || "#666";
        return {
          ...baseStyle,
          borderColor: color,
          background: isHighlighted ? color : "white",
          color: isHighlighted ? "white" : color,
        };
      } else { // disable
        const isDisabled = disabledItems.includes(key);
        return {
          ...baseStyle,
          borderColor: isDisabled ? "#dc3545" : "#28a745",
          background: isDisabled ? "#dc3545" : "#28a745",
          color: "white",
        };
      }
    };

    const infoPanelStyle = {
      padding: "10px",
      backgroundColor: "#e9ecef",
      borderRadius: "4px",
      fontSize: "12px",
      fontFamily: "monospace",
    };

    return (
      <div>
        <div style={controlsContainerStyle}>
          <div>
            <div style={sectionLabelStyle}>Highlight Controls:</div>
            <div style={buttonGroupStyle}>
              {args.keys.map((key: string) => (
                <button
                  key={`highlight-${key}`}
                  style={buttonStyle(key, "highlight")}
                  onMouseEnter={() => setCurrentHighlight([key])}
                  onMouseLeave={() => setCurrentHighlight([])}
                >
                  {key}
                </button>
              ))}
              <button
                style={{
                  padding: "8px 16px",
                  border: "2px solid #666",
                  borderRadius: "4px",
                  background: currentHighlight.length === args.keys.length ? "#666" : "white",
                  color: currentHighlight.length === args.keys.length ? "white" : "#666",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  fontWeight: 500,
                  fontSize: "12px",
                }}
                onMouseEnter={() => setCurrentHighlight(args.keys)}
                onMouseLeave={() => setCurrentHighlight([])}
              >
                Show All
              </button>
            </div>
          </div>
          
          <div>
            <div style={sectionLabelStyle}>Disable/Enable Controls:</div>
            <div style={buttonGroupStyle}>
              {args.keys.map((key: string) => (
                <button
                  key={`disable-${key}`}
                  style={buttonStyle(key, "disable")}
                  onClick={() => toggleDisabled(key)}
                >
                  {disabledItems.includes(key) ? "Enable" : "Disable"} {key}
                </button>
              ))}
              <button
                style={{
                  padding: "8px 16px",
                  border: "2px solid #6c757d",
                  borderRadius: "4px",
                  background: "#6c757d",
                  color: "white",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  fontWeight: 500,
                  fontSize: "12px",
                }}
                onClick={() => setDisabledItems([])}
              >
                Enable All
              </button>
            </div>
          </div>
          
          <div style={infoPanelStyle}>
            <div><strong>Disabled Items:</strong> {disabledItems.length > 0 ? disabledItems.join(", ") : "None"}</div>
            <div><strong>Colors Mapping:</strong> {JSON.stringify(colorsMapping, null, 2)}</div>
          </div>
        </div>
        
        <MichiVzProvider>
          <BarBellChart 
            {...args} 
            onColorMappingGenerated={handleColorMappingGenerated}
            colorsMapping={colorsMapping}
            highlightItems={currentHighlight}
            disabledItems={disabledItems}
          />
        </MichiVzProvider>
      </div>
    );
  },
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
    title: "Test Disable/Enable with Color Mapping",
    xAxisFormat: (value: any) => `${value}`,
    yAxisFormat: (value: any) => value,
    showGrid: {
      x: true,
      y: false,
    },
    onColorMappingGenerated: fn(),
  },
};

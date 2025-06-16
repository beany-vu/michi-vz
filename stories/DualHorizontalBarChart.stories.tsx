import React, { useState, useCallback } from "react";
import DualHorizontalBarChart from "../src/components/DualHorizontalBarChart";
import { Meta } from "@storybook/react";
import { MichiVzProvider } from "../src/components/MichiVzProvider";

// Define the default metadata for the component
export default {
  title: "Charts/Dual Horizontal Bar Chart",
  component: DualHorizontalBarChart,
  tags: ["autodocs"],
} as Meta;

// Interactive story component
const InteractiveDualHorizontalBarChart = () => {
  const [highlightItems, setHighlightItems] = useState<string[]>([]);
  const [disabledItems, setDisabledItems] = useState<string[]>([]);
  const [colorsMapping, setColorsMapping] = useState<{ [key: string]: string }>({});

  const dataSet = [
    {
      label: "Africa",
      value1: 400,
      value2: 200,
    },
    {
      label: "Asia",
      value1: 350,
      value2: 200,
    },
    {
      label: "Australia",
      value1: 0,
      value2: 180,
    },
    {
      label: "Europe",
      value1: 180,
      value2: 500,
    },
    {
      label: "North America",
      value1: 0,
      value2: 0,
    },
  ];

  const handleHighlightItem = useCallback((labels: string[]) => {
    setHighlightItems(labels);
  }, []);

  const handleColorMappingGenerated = useCallback((mapping: { [key: string]: string }) => {
    setColorsMapping(mapping);
  }, []);

  const toggleDisableItem = (label: string) => {
    setDisabledItems(prev => 
      prev.includes(label) 
        ? prev.filter(item => item !== label)
        : [...prev, label]
    );
  };

  return (
    <div>
      <div style={{ marginBottom: "20px" }}>
        <h3>Interactive Controls</h3>
        <div style={{ marginBottom: "10px" }}>
          <strong>Toggle items (click to disable/enable):</strong>
        </div>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "10px" }}>
          {dataSet.map(item => (
            <button
              key={item.label}
              onClick={() => toggleDisableItem(item.label)}
              style={{
                padding: "5px 10px",
                backgroundColor: disabledItems.includes(item.label) ? "#ffcccc" : "#ccffcc",
                border: "1px solid #ccc",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "12px"
              }}
            >
              {item.label} {disabledItems.includes(item.label) ? "(Disabled)" : "(Enabled)"}
            </button>
          ))}
        </div>
        <div style={{ fontSize: "12px", color: "#666", marginBottom: "10px" }}>
          <div><strong>Currently highlighted:</strong> {highlightItems.length > 0 ? highlightItems.join(", ") : "None"}</div>
          <div><strong>Currently disabled:</strong> {disabledItems.length > 0 ? disabledItems.join(", ") : "None"}</div>
        </div>
        <div style={{ fontSize: "12px", color: "#666", marginBottom: "10px" }}>
          <strong>Generated colors:</strong>
          <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", marginTop: "5px" }}>
            {Object.entries(colorsMapping).map(([label, color]) => (
              <div key={label} style={{ fontSize: "11px" }}>
                <span style={{ 
                  display: "inline-block", 
                  width: "12px", 
                  height: "12px", 
                  backgroundColor: color,
                  marginRight: "3px",
                  border: "1px solid #ccc"
                }}></span>
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>

      <MichiVzProvider
        highlightItems={highlightItems}
        disabledItems={disabledItems}
      >
        <DualHorizontalBarChart
          dataSet={dataSet}
          width={900}
          height={400}
          margin={{
            top: 50,
            right: 50,
            bottom: 50,
            left: 50,
          }}
          xAxisFormat={(d) => `${d}`}
          yAxisFormat={(d) => `${d}`}
          xAxisDataType="number"
          title="Interactive Dual Horizontal Bar Chart"
          tooltipFormatter={(d: any) => {
            return `<div style="background: white; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
              <strong>${d?.label}</strong><br/>
              Value 1: ${d?.value1 || 'N/A'}<br/>
              Value 2: ${d?.value2 || 'N/A'}
            </div>`;
          }}
          onHighlightItem={handleHighlightItem}
          onColorMappingGenerated={handleColorMappingGenerated}
        />
      </MichiVzProvider>
    </div>
  );
};

// Create stories
export const Primary = {
  render: () => <InteractiveDualHorizontalBarChart />,
};

export const WithCustomColors = {
  render: () => {
    const [highlightItems, setHighlightItems] = useState<string[]>([]);
    const [disabledItems, setDisabledItems] = useState<string[]>([]);
    
    const customColors = ["#e74c3c", "#3498db", "#2ecc71", "#f39c12", "#9b59b6"];
    const customColorsMapping = {
      "Africa": "#e74c3c",
      "Europe": "#3498db"
    };

    const handleHighlightItem = useCallback((labels: string[]) => {
      setHighlightItems(labels);
    }, []);

    const handleColorMappingGenerated = useCallback((mapping: { [key: string]: string }) => {
      console.log("Generated colors:", mapping);
    }, []);

    return (
      <MichiVzProvider
        highlightItems={highlightItems}
        disabledItems={disabledItems}
      >
        <DualHorizontalBarChart
          dataSet={[
            { label: "Africa", value1: 400, value2: 200 },
            { label: "Asia", value1: 350, value2: 200 },
            { label: "Australia", value1: 0, value2: 180 },
            { label: "Europe", value1: 180, value2: 500 },
            { label: "North America", value1: 250, value2: 300 },
          ]}
          width={900}
          height={400}
          margin={{ top: 50, right: 50, bottom: 50, left: 50 }}
          xAxisFormat={(d) => `${d}`}
          yAxisFormat={(d) => `${d}`}
          xAxisDataType="number"
          title="Custom Colors Dual Horizontal Bar Chart"
          colors={customColors}
          colorsMapping={customColorsMapping}
          onHighlightItem={handleHighlightItem}
          onColorMappingGenerated={handleColorMappingGenerated}
        />
      </MichiVzProvider>
    );
  },
};

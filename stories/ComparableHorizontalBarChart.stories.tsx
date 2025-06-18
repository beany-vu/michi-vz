import React, { useState, useCallback } from "react";
import ComparableHorizontalBarChart from "../src/components/ComparableHorizontalBarChart";
import { Meta } from "@storybook/react";
import { MichiVzProvider } from "../src/components/MichiVzProvider";
import { fn } from "@storybook/test";

// Define the default metadata for the component
export default {
  title: "Charts/Comparable Horizontal Bar Chart",
  component: ComparableHorizontalBarChart,
  tags: ["autodocs"],
  decorators: [
    Story => (
      <MichiVzProvider
        visibleItems={["Africa", "Congo", "Egypt", "Madagascar"]}
      >
        <Story />
      </MichiVzProvider>
    ),
  ],
} as Meta;

// Create a default story using the template
export const Primary = {
  args: {
    onChartDataProcessed: (metadata: any) => {
      // console.log({ metadata });
    },
    isNoDataComponent: <div>No data</div>,
    dataSet: [
      {
        label: "Africa",
        valueBased: 100,
        valueCompared: 55,
      },
      {
        label: "Egypt",
        valueBased: -23.06,
        valueCompared: -49.59,
      },
      {
        label: "Congo",
        valueBased: 100,
        valueCompared: 55,
      },
    ],
    width: 900,
    height: 400,
    margin: {
      top: 50,
      right: 50,
      bottom: 50,
      left: 150,
    },

    xAxisPredefinedDomain: [-100, 100],
    showCombined: false,
    xAisFormat: d => `${d}`, // Example: format values as percentages
    yAxisFormat: d => `${d}`, // Example: format values as percentages
    title: "My Comparable Vertical Bar Chart",
    tooltipFormatter: (d: unknown) => {
      return JSON.stringify(d);
    },
    children: (
      <defs>
        <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="red" />
          <stop offset="100%" stopColor="blue" />
        </linearGradient>

        <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="red" />
          <stop offset="100%" stopColor="pink" />
        </linearGradient>
      </defs>
    ),
    filter: { limit: 10, criteria: "valueBased", sortingDir: "desc" },
  },
};

// Interactive story with disable/enable functionality
export const InteractiveControls = {
  render: (args: any) => {
    const [highlightItems, setHighlightItems] = useState<string[]>([]);
    const [disabledItems, setDisabledItems] = useState<string[]>([]);
    const [colorsMapping, setColorsMapping] = useState<{ [key: string]: string }>({});

    const handleHighlightItem = useCallback((labels: string[]) => {
      setHighlightItems(labels);
    }, []);

    const handleColorMappingGenerated = useCallback((mapping: { [key: string]: string }) => {
      setColorsMapping(prev => {
        if (JSON.stringify(prev) !== JSON.stringify(mapping)) {
          return mapping;
        }
        return prev;
      });
    }, []);

    const toggleDisabledItem = useCallback((label: string) => {
      setDisabledItems(prev => {
        const newDisabled = prev.includes(label) 
          ? prev.filter(item => item !== label)
          : [...prev, label];
        return newDisabled;
      });
    }, []);

    // Get all unique labels from the dataset
    const allLabels = React.useMemo(() => {
      return args.dataSet?.map((item: any) => item.label) || [];
    }, [args.dataSet]);

    return (
      <div style={{ padding: '20px' }}>
        <div style={{ marginBottom: '20px' }}>
          <h3>Interactive Controls</h3>
          <div style={{ marginBottom: '10px' }}>
            <strong>Current Highlighted Items:</strong> {highlightItems.length > 0 ? highlightItems.join(', ') : 'None'}
          </div>
          <div style={{ marginBottom: '10px' }}>
            <strong>Current Disabled Items:</strong> {disabledItems.length > 0 ? disabledItems.join(', ') : 'None'}
          </div>
          <div style={{ marginBottom: '10px' }}>
            <strong>Generated Colors:</strong> {Object.keys(colorsMapping).length > 0 ? JSON.stringify(colorsMapping) : 'None yet'}
          </div>
          <div style={{ marginBottom: '10px' }}>
            <strong>Instructions:</strong>
            <ul>
              <li>Hover over chart bars to highlight items</li>
              <li>Click on legend items below to disable/enable data items</li>
            </ul>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {allLabels.map((label: string) => (
              <button
                key={label}
                onClick={() => toggleDisabledItem(label)}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  backgroundColor: disabledItems.includes(label) ? '#f0f0f0' : colorsMapping[label] || '#fff',
                  color: disabledItems.includes(label) ? '#999' : '#000',
                  cursor: 'pointer',
                  textDecoration: disabledItems.includes(label) ? 'line-through' : 'none'
                }}
              >
                {label} {disabledItems.includes(label) ? '(Disabled)' : ''}
              </button>
            ))}
          </div>
        </div>
        
        <MichiVzProvider>
          <ComparableHorizontalBarChart 
            {...args} 
            colorsMapping={colorsMapping}
            onColorMappingGenerated={handleColorMappingGenerated}
            onHighlightItem={handleHighlightItem}
            highlightItems={highlightItems}
            disabledItems={disabledItems}
          />
        </MichiVzProvider>
      </div>
    );
  },
  args: {
    onChartDataProcessed: fn(),
    isNoDataComponent: <div>No data</div>,
    dataSet: [
      {
        label: "North America",
        valueBased: 85,
        valueCompared: 72,
      },
      {
        label: "Europe",
        valueBased: 78,
        valueCompared: 85,
      },
      {
        label: "Asia",
        valueBased: 92,
        valueCompared: 88,
      },
      {
        label: "Africa",
        valueBased: 45,
        valueCompared: 58,
      },
      {
        label: "South America",
        valueBased: 68,
        valueCompared: 75,
      },
      {
        label: "Oceania",
        valueBased: 52,
        valueCompared: 48,
      },
    ],
    width: 900,
    height: 400,
    margin: {
      top: 50,
      right: 50,
      bottom: 50,
      left: 150,
    },
    xAxisPredefinedDomain: [0, 100],
    showCombined: false,
    xAisFormat: (d: any) => `${d}%`,
    yAxisFormat: (d: any) => `${d}`,
    title: "Interactive Comparable Horizontal Bar Chart",
    tooltipFormatter: (d: unknown) => {
      return JSON.stringify(d);
    },
    filter: { limit: 10, criteria: "valueBased", sortingDir: "desc" },
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

    const toggleDisabled = React.useCallback((label: string) => {
      setDisabledItems(prev => 
        prev.includes(label) 
          ? prev.filter(item => item !== label)
          : [...prev, label]
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

    const buttonStyle = (label: string, type: "highlight" | "disable") => {
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
        const isHighlighted = currentHighlight.includes(label);
        const color = colorsMapping[label] || "#666";
        return {
          ...baseStyle,
          borderColor: color,
          background: isHighlighted ? color : "white",
          color: isHighlighted ? "white" : color,
        };
      } else { // disable
        const isDisabled = disabledItems.includes(label);
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

    // Get all unique labels from the dataset
    const allLabels = React.useMemo(() => {
      return args.dataSet?.map((item: any) => item.label) || [];
    }, [args.dataSet]);

    return (
      <div>
        <div style={controlsContainerStyle}>
          <div>
            <div style={sectionLabelStyle}>Highlight Controls:</div>
            <div style={buttonGroupStyle}>
              {allLabels.map((label: string) => (
                <button
                  key={`highlight-${label}`}
                  style={buttonStyle(label, "highlight")}
                  onMouseEnter={() => setCurrentHighlight([label])}
                  onMouseLeave={() => setCurrentHighlight([])}
                >
                  {label}
                </button>
              ))}
              <button
                style={{
                  padding: "8px 16px",
                  border: "2px solid #666",
                  borderRadius: "4px",
                  background: currentHighlight.length === allLabels.length ? "#666" : "white",
                  color: currentHighlight.length === allLabels.length ? "white" : "#666",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  fontWeight: 500,
                  fontSize: "12px",
                }}
                onMouseEnter={() => setCurrentHighlight(allLabels)}
                onMouseLeave={() => setCurrentHighlight([])}
              >
                Show All
              </button>
            </div>
          </div>
          
          <div>
            <div style={sectionLabelStyle}>Disable/Enable Controls:</div>
            <div style={buttonGroupStyle}>
              {allLabels.map((label: string) => (
                <button
                  key={`disable-${label}`}
                  style={buttonStyle(label, "disable")}
                  onClick={() => toggleDisabled(label)}
                >
                  {disabledItems.includes(label) ? "Enable" : "Disable"} {label}
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
          <ComparableHorizontalBarChart 
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
    onChartDataProcessed: fn(),
    isNoDataComponent: <div>No data</div>,
    dataSet: [
      {
        label: "Manufacturing",
        valueBased: 75,
        valueCompared: 82,
      },
      {
        label: "Technology",
        valueBased: 88,
        valueCompared: 85,
      },
      {
        label: "Healthcare",
        valueBased: 92,
        valueCompared: 88,
      },
      {
        label: "Finance",
        valueBased: 65,
        valueCompared: 78,
      },
      {
        label: "Education",
        valueBased: 58,
        valueCompared: 72,
      },
      {
        label: "Retail",
        valueBased: 71,
        valueCompared: 68,
      },
    ],
    width: 900,
    height: 400,
    margin: {
      top: 50,
      right: 50,
      bottom: 50,
      left: 150,
    },
    xAxisPredefinedDomain: [0, 100],
    showCombined: false,
    xAisFormat: (d: any) => `${d}%`,
    yAxisFormat: (d: any) => `${d}`,
    title: "Test Disable/Enable with Color Mapping",
    tooltipFormatter: (d: unknown) => {
      return JSON.stringify(d);
    },
    filter: { limit: 10, criteria: "valueBased", sortingDir: "desc" },
  },
};

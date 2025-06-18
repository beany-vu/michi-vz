// RangeChart.stories.tsx
import React, { useState, useCallback } from "react";
import RangeChartComponent from "../src/components/RangeChart";
import { Meta } from "@storybook/react";
import { MichiVzProvider } from "../src/components/MichiVzProvider";
import { fn } from "@storybook/test";

export default {
  title: "Charts/Range Chart",
  component: RangeChartComponent,
  tags: ["autodocs"],
  decorators: [
    Story => (
      <MichiVzProvider
        colorsMapping={{
          Egypt: "red",
          Euro: "purple",
          "Rest of the World": "orange",
          Africa: "purple",
        }}
        highlightItems={["Africa"]}
      >
        <Story />
      </MichiVzProvider>
    ),
  ],
} as Meta;

export const Primary = {
  args: {
    dataSet: [
      {
        label: "Africa",
        series: [
          {
            year: 2018,
            date: "2018",
            valueMin: 1,
            valueMax: 12,
            valueMedium: 6,
          },
          {
            year: 2019,
            date: "2019",
            valueMin: 0,
            valueMax: 0.1162,
            valueMedium: 0.1162,
          },
          {
            year: 2020,
            date: "2020",
            valueMin: 2,
            valueMax: 14.1162,
            valueMedium: 14.1162,
          },
          {
            year: 2021,
            date: "2021",
            valueMin: 12,
            valueMax: 12,
            valueMedium: 12,
          },
          {
            year: 2022,
            date: "2022",
            valueMin: 0,
            valueMax: 0.1199,
            valueMedium: 0.1199,
          },
        ],
      },
      // {
      //   "label": "Africa",
      //   "color": "green",
      //   "series": [
      //     {
      //       "year": 2016,
      //       "date": "2016",
      //       "valueMax": 18.5,
      //       "valueMin": 7.8,
      //       "valueMedium": 8.2,
      //       "certainty": false
      //     },
      //     {
      //       "year": 2017,
      //       "date": "2017",
      //       "valueMax": 82.2,
      //       "valueMin": 7.4,
      //       "valueMedium": 7.7,
      //       "certainty": true
      //     },
      //     {
      //       "year": 2018,
      //       "date": "2018",
      //       "valueMax": 38.4,
      //       "valueMin": 7.7,
      //       "valueMedium": 7.9,
      //       "certainty": true
      //     },
      //     // ... (add more data points)
      //   ]
      // },
      // {
      //   "label": "Rest of the World",
      //   "color": "orange",
      //   "series": [
      //     {
      //       "year": 2016,
      //       "date": "2016",
      //       "valueMax": 70.5,
      //       "valueMin": 10.5,
      //       "valueMedium": 52,
      //       "certainty": false
      //     },
      //     {
      //       "year": 2017,
      //       "date": "2017",
      //       "valueMax": 96,
      //       "valueMin": 30.5,
      //       "valueMedium": 63,
      //       "certainty": true
      //     },
      //     {
      //       "year": 2017,
      //       "date": "2018",
      //       "valueMax": 96,
      //       "valueMin": 30.5,
      //       "valueMedium": 63,
      //       "certainty": true
      //     },
      //     {
      //       "year": 2019,
      //       "date": "2019",
      //       "valueMax": 40.8,
      //       "valueMin": 0.8,
      //       "valueMedium": 14.2,
      //       "certainty": true
      //     },
      //   ]
      // }
    ],
    width: 900,
    height: 400,
    margin: {
      top: 50,
      right: 50,
      bottom: 50,
      left: 50,
    },
    showCombined: false,
    // yAxisFormat: (d) => `${d}%`, // Example: format values as percentages
    xAxisDataType: "date_annual",

    title: "My Range Chart",
    tooltipFormatter: (dataSet, d) => {
      return JSON.stringify(d);
    },
    onChartDataProcessed: fn(),
  },
};

// Test story for highlighting and disabling functionality
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
              <li>Hover over chart areas to highlight series</li>
              <li>Click on legend items below to disable/enable data series</li>
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
        
        <RangeChartComponent 
          {...args} 
          colorsMapping={colorsMapping}
          onColorMappingGenerated={handleColorMappingGenerated}
          onHighlightItem={handleHighlightItem}
          highlightItems={highlightItems}
          disabledItems={disabledItems}
        />
      </div>
    );
  },
  args: {
    dataSet: [
      {
        label: "Africa",
        series: [
          {
            year: 2018,
            date: "2018",
            valueMin: 1,
            valueMax: 12,
            valueMedium: 6,
          },
          {
            year: 2019,
            date: "2019",
            valueMin: 0,
            valueMax: 0.1162,
            valueMedium: 0.1162,
          },
          {
            year: 2020,
            date: "2020",
            valueMin: 2,
            valueMax: 14.1162,
            valueMedium: 14.1162,
          },
          {
            year: 2021,
            date: "2021",
            valueMin: 12,
            valueMax: 12,
            valueMedium: 12,
          },
          {
            year: 2022,
            date: "2022",
            valueMin: 0,
            valueMax: 0.1199,
            valueMedium: 0.1199,
          },
        ],
      },
      {
        label: "Asia",
        series: [
          {
            year: 2018,
            date: "2018",
            valueMin: 3,
            valueMax: 18,
            valueMedium: 10,
          },
          {
            year: 2019,
            date: "2019",
            valueMin: 2,
            valueMax: 15,
            valueMedium: 8,
          },
          {
            year: 2020,
            date: "2020",
            valueMin: 1,
            valueMax: 20,
            valueMedium: 12,
          },
          {
            year: 2021,
            date: "2021",
            valueMin: 5,
            valueMax: 25,
            valueMedium: 15,
          },
          {
            year: 2022,
            date: "2022",
            valueMin: 3,
            valueMax: 22,
            valueMedium: 13,
          },
        ],
      },
      {
        label: "Europe",
        series: [
          {
            year: 2018,
            date: "2018",
            valueMin: 4,
            valueMax: 16,
            valueMedium: 9,
          },
          {
            year: 2019,
            date: "2019",
            valueMin: 2,
            valueMax: 18,
            valueMedium: 11,
          },
          {
            year: 2020,
            date: "2020",
            valueMin: 1,
            valueMax: 19,
            valueMedium: 10,
          },
          {
            year: 2021,
            date: "2021",
            valueMin: 3,
            valueMax: 21,
            valueMedium: 12,
          },
          {
            year: 2022,
            date: "2022",
            valueMin: 2,
            valueMax: 24,
            valueMedium: 14,
          },
        ],
      },
    ],
    width: 900,
    height: 400,
    margin: {
      top: 50,
      right: 50,
      bottom: 50,
      left: 50,
    },
    showCombined: false,
    xAxisDataType: "date_annual",
    title: "Interactive Range Chart with Disable/Enable",
    tooltipFormatter: (dataSet: any, d: any) => {
      return JSON.stringify(d);
    },
    onChartDataProcessed: fn(),
  },
};

// Test story for testing disabled items with color mapping persistence
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
        
        <RangeChartComponent 
          {...args} 
          onColorMappingGenerated={handleColorMappingGenerated}
          colorsMapping={colorsMapping}
          highlightItems={currentHighlight}
          disabledItems={disabledItems}
        />
      </div>
    );
  },
  args: {
    dataSet: [
      {
        label: "North America",
        series: [
          {
            year: 2018,
            date: "2018",
            valueMin: 5,
            valueMax: 20,
            valueMedium: 12,
          },
          {
            year: 2019,
            date: "2019",
            valueMin: 3,
            valueMax: 22,
            valueMedium: 14,
          },
          {
            year: 2020,
            date: "2020",
            valueMin: 2,
            valueMax: 25,
            valueMedium: 16,
          },
          {
            year: 2021,
            date: "2021",
            valueMin: 4,
            valueMax: 18,
            valueMedium: 11,
          },
          {
            year: 2022,
            date: "2022",
            valueMin: 6,
            valueMax: 24,
            valueMedium: 15,
          },
        ],
      },
      {
        label: "South America",
        series: [
          {
            year: 2018,
            date: "2018",
            valueMin: 2,
            valueMax: 15,
            valueMedium: 8,
          },
          {
            year: 2019,
            date: "2019",
            valueMin: 1,
            valueMax: 18,
            valueMedium: 9,
          },
          {
            year: 2020,
            date: "2020",
            valueMin: 3,
            valueMax: 20,
            valueMedium: 12,
          },
          {
            year: 2021,
            date: "2021",
            valueMin: 2,
            valueMax: 16,
            valueMedium: 10,
          },
          {
            year: 2022,
            date: "2022",
            valueMin: 4,
            valueMax: 22,
            valueMedium: 13,
          },
        ],
      },
      {
        label: "Africa",
        series: [
          {
            year: 2018,
            date: "2018",
            valueMin: 1,
            valueMax: 12,
            valueMedium: 6,
          },
          {
            year: 2019,
            date: "2019",
            valueMin: 0,
            valueMax: 14,
            valueMedium: 7,
          },
          {
            year: 2020,
            date: "2020",
            valueMin: 2,
            valueMax: 16,
            valueMedium: 9,
          },
          {
            year: 2021,
            date: "2021",
            valueMin: 1,
            valueMax: 18,
            valueMedium: 10,
          },
          {
            year: 2022,
            date: "2022",
            valueMin: 3,
            valueMax: 20,
            valueMedium: 11,
          },
        ],
      },
      {
        label: "Asia",
        series: [
          {
            year: 2018,
            date: "2018",
            valueMin: 8,
            valueMax: 30,
            valueMedium: 19,
          },
          {
            year: 2019,
            date: "2019",
            valueMin: 6,
            valueMax: 28,
            valueMedium: 17,
          },
          {
            year: 2020,
            date: "2020",
            valueMin: 5,
            valueMax: 32,
            valueMedium: 18,
          },
          {
            year: 2021,
            date: "2021",
            valueMin: 7,
            valueMax: 35,
            valueMedium: 21,
          },
          {
            year: 2022,
            date: "2022",
            valueMin: 9,
            valueMax: 38,
            valueMedium: 23,
          },
        ],
      },
      {
        label: "Europe",
        series: [
          {
            year: 2018,
            date: "2018",
            valueMin: 4,
            valueMax: 16,
            valueMedium: 10,
          },
          {
            year: 2019,
            date: "2019",
            valueMin: 3,
            valueMax: 18,
            valueMedium: 11,
          },
          {
            year: 2020,
            date: "2020",
            valueMin: 2,
            valueMax: 20,
            valueMedium: 12,
          },
          {
            year: 2021,
            date: "2021",
            valueMin: 5,
            valueMax: 22,
            valueMedium: 14,
          },
          {
            year: 2022,
            date: "2022",
            valueMin: 6,
            valueMax: 24,
            valueMedium: 15,
          },
        ],
      },
    ],
    width: 900,
    height: 400,
    margin: {
      top: 50,
      right: 50,
      bottom: 50,
      left: 50,
    },
    showCombined: false,
    xAxisDataType: "date_annual",
    title: "Test Disable/Enable with Color Mapping Persistence",
    tooltipFormatter: (dataSet: any, d: any) => {
      return JSON.stringify(d);
    },
    onChartDataProcessed: fn(),
  },
};

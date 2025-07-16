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
    onChartDataProcessed: fn(),
    onLegendDataChange: fn(),
    onHighlightItem: fn(),
    onColorMappingGenerated: fn(),
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
    onLegendDataChange: fn(),
    onHighlightItem: fn(),
    onColorMappingGenerated: fn(),
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
      setColorsMapping(prev => {
        const updated = { ...prev, ...newMapping };
        // Only update if the mapping has actually changed
        if (JSON.stringify(prev) !== JSON.stringify(updated)) {
          return updated;
        }
        return prev;
      });
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
    onLegendDataChange: fn(),
    onHighlightItem: fn(),
    onColorMappingGenerated: fn(),
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

// Story to test legend metadata exposure
export const LegendMetadataExposure = {
  render: (args: any) => {
    const [legendData, setLegendData] = React.useState<any[]>([]);
    const [chartMetadata, setChartMetadata] = React.useState<any>(null);
    const [colorMapping, setColorMapping] = React.useState<{ [key: string]: string }>({});

    const handleLegendDataChange = React.useCallback((newLegendData: any[]) => {
      setLegendData(prev => {
        if (JSON.stringify(prev) !== JSON.stringify(newLegendData)) {
          console.log('Legend data changed:', newLegendData);
          return newLegendData;
        }
        return prev;
      });
    }, []);

    const handleChartDataProcessed = React.useCallback((metadata: any) => {
      setChartMetadata(prev => {
        if (JSON.stringify(prev) !== JSON.stringify(metadata)) {
          console.log('Chart metadata processed:', metadata);
          return metadata;
        }
        return prev;
      });
    }, []);

    const handleColorMappingGenerated = React.useCallback((mapping: { [key: string]: string }) => {
      setColorMapping(prev => {
        if (JSON.stringify(prev) !== JSON.stringify(mapping)) {
          console.log('Color mapping generated:', mapping);
          return mapping;
        }
        return prev;
      });
    }, []);

    return (
      <div style={{ padding: '20px' }}>
        <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
          <h3>Legend & Metadata Exposure Test</h3>
          
          <div style={{ marginBottom: '15px' }}>
            <h4>Legend Data:</h4>
            <pre style={{ fontSize: '12px', backgroundColor: '#fff', padding: '10px', borderRadius: '4px', overflow: 'auto' }}>
              {JSON.stringify(legendData, null, 2)}
            </pre>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <h4>Chart Metadata:</h4>
            <pre style={{ fontSize: '12px', backgroundColor: '#fff', padding: '10px', borderRadius: '4px', overflow: 'auto' }}>
              {JSON.stringify(chartMetadata, null, 2)}
            </pre>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <h4>Color Mapping:</h4>
            <pre style={{ fontSize: '12px', backgroundColor: '#fff', padding: '10px', borderRadius: '4px', overflow: 'auto' }}>
              {JSON.stringify(colorMapping, null, 2)}
            </pre>
          </div>
          
          <div style={{ fontSize: '14px', color: '#666' }}>
            <strong>Instructions:</strong> Check the browser console for real-time logging of legend data changes.
          </div>
        </div>
        
        <MichiVzProvider>
          <ComparableHorizontalBarChart 
            {...args}
            onLegendDataChange={handleLegendDataChange}
            onChartDataProcessed={handleChartDataProcessed}
            onColorMappingGenerated={handleColorMappingGenerated}
          />
        </MichiVzProvider>
      </div>
    );
  },
  args: {
    onHighlightItem: fn(),
    isNoDataComponent: <div>No data</div>,
    dataSet: [
      {
        label: "Research & Development",
        valueBased: 85,
        valueCompared: 78,
      },
      {
        label: "Marketing",
        valueBased: 72,
        valueCompared: 85,
      },
      {
        label: "Operations",
        valueBased: 91,
        valueCompared: 88,
      },
      {
        label: "Sales",
        valueBased: 67,
        valueCompared: 74,
      },
      {
        label: "Customer Support",
        valueBased: 89,
        valueCompared: 82,
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
    title: "Legend Metadata Exposure Test",
    tooltipFormatter: (d: unknown) => {
      return JSON.stringify(d);
    },
    filter: { limit: 10, criteria: "valueBased", sortingDir: "desc" },
  },
};

// Story to test legend metadata with dynamic data changes
export const DynamicLegendMetadata = {
  render: (args: any) => {
    const [currentDataSet, setCurrentDataSet] = React.useState(args.dataSet);
    const [legendData, setLegendData] = React.useState<any[]>([]);
    const [updateCount, setUpdateCount] = React.useState(0);

    const handleLegendDataChange = React.useCallback((newLegendData: any[]) => {
      setLegendData(prev => {
        if (JSON.stringify(prev) !== JSON.stringify(newLegendData)) {
          setUpdateCount(prevCount => {
            console.log(`Legend update #${prevCount + 1}:`, newLegendData);
            return prevCount + 1;
          });
          return newLegendData;
        }
        return prev;
      });
    }, []);

    const addRandomDataPoint = React.useCallback(() => {
      const newItem = {
        label: `Item ${currentDataSet.length + 1}`,
        valueBased: Math.floor(Math.random() * 100),
        valueCompared: Math.floor(Math.random() * 100),
      };
      setCurrentDataSet(prev => [...prev, newItem]);
    }, [currentDataSet]);

    const removeLastDataPoint = React.useCallback(() => {
      if (currentDataSet.length > 1) {
        setCurrentDataSet(prev => prev.slice(0, -1));
      }
    }, [currentDataSet]);

    const shuffleData = React.useCallback(() => {
      setCurrentDataSet(prev => [...prev].sort(() => Math.random() - 0.5));
    }, []);

    return (
      <div style={{ padding: '20px' }}>
        <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
          <h3>Dynamic Legend Metadata Test</h3>
          
          <div style={{ marginBottom: '15px' }}>
            <button onClick={addRandomDataPoint} style={{ marginRight: '10px', padding: '8px 16px' }}>
              Add Random Item
            </button>
            <button onClick={removeLastDataPoint} style={{ marginRight: '10px', padding: '8px 16px' }}>
              Remove Last Item
            </button>
            <button onClick={shuffleData} style={{ padding: '8px 16px' }}>
              Shuffle Data
            </button>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <strong>Legend Updates: {updateCount}</strong>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <h4>Current Legend Data:</h4>
            <pre style={{ fontSize: '12px', backgroundColor: '#fff', padding: '10px', borderRadius: '4px', overflow: 'auto', maxHeight: '200px' }}>
              {JSON.stringify(legendData, null, 2)}
            </pre>
          </div>
          
          <div style={{ fontSize: '14px', color: '#666' }}>
            <strong>Instructions:</strong> Use the buttons above to modify the data and watch how the legend metadata changes.
          </div>
        </div>
        
        <MichiVzProvider>
          <ComparableHorizontalBarChart 
            {...args}
            dataSet={currentDataSet}
            onLegendDataChange={handleLegendDataChange}
            onChartDataProcessed={fn()}
            onColorMappingGenerated={fn()}
            onHighlightItem={fn()}
          />
        </MichiVzProvider>
      </div>
    );
  },
  args: {
    isNoDataComponent: <div>No data</div>,
    dataSet: [
      {
        label: "Alpha",
        valueBased: 75,
        valueCompared: 68,
      },
      {
        label: "Beta",
        valueBased: 82,
        valueCompared: 91,
      },
      {
        label: "Gamma",
        valueBased: 59,
        valueCompared: 73,
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
    title: "Dynamic Legend Metadata Test",
    tooltipFormatter: (d: unknown) => {
      return JSON.stringify(d);
    },
    filter: { limit: 10, criteria: "valueBased", sortingDir: "desc" },
  },
};
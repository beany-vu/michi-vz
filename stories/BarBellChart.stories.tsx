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
  argTypes: {
  },
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

// Generate comprehensive dataset for legend testing
const generateLargeBarBellDataset = () => {
  const sectors = [
    "Technology", "Healthcare", "Finance", "Manufacturing", "Retail", "Energy", 
    "Education", "Transportation", "Real Estate", "Agriculture", "Aerospace", "Automotive",
    "Telecommunications", "Construction", "Entertainment", "Food & Beverage", "Chemicals", 
    "Pharmaceuticals", "Banking", "Insurance", "Consulting", "Media", "Tourism", "Mining",
    "Textile", "Electronics", "Software", "Biotechnology", "Renewable Energy", "Logistics"
  ];
  
  return sectors.map((sector, index) => ({
    date: `Q${Math.floor(index / 8) + 1} | ${sector}`,
    revenue: Math.random() * 10000 + 1000,
    profit: Math.random() * 5000 + 500,
    expenses: Math.random() * 3000 + 200,
  }));
};

export const LegendWithFilterControls = {
  render: (args: any) => {
    const [filter, setFilter] = useState({ 
      criteria: "revenue", 
      sortingDir: "desc", 
      limit: 15 
    });
    const [colorsMapping, setColorsMapping] = useState<{ [key: string]: string }>({});
    const [legendData, setLegendData] = useState<any[]>([]);
    const [originalLegendOrder, setOriginalLegendOrder] = useState<any[]>([]);
    const [disabledItems, setDisabledItems] = useState<string[]>([]);

    const handleChartDataProcessed = React.useCallback((metadata: any) => {
      if (metadata.legendData) {
        setLegendData(metadata.legendData);
        
        // Store original legend order when first loaded or when no items are disabled
        if (disabledItems.length === 0) {
          setOriginalLegendOrder(metadata.legendData);
        }
      }
    }, [disabledItems.length]);

    const handleColorMappingGenerated = React.useCallback((colors: { [key: string]: string }) => {
      setColorsMapping(colors);
    }, []);

    const toggleItemDisabled = React.useCallback((label: string) => {
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
          <p>This story tests the new legend-based color assignment approach for BarBellChart.</p>
          
          <div style={{ display: "flex", gap: "20px", marginBottom: "15px", alignItems: "center", flexWrap: "wrap" }}>
            <div>
              <label style={{ marginRight: "5px" }}>Sort By:</label>
              <select 
                value={filter.criteria} 
                onChange={(e) => setFilter(prev => ({ ...prev, criteria: e.target.value }))}
                style={{ padding: "4px" }}
              >
                <option value="revenue">Revenue</option>
                <option value="profit">Profit</option>
                <option value="expenses">Expenses</option>
              </select>
            </div>
            
            <div>
              <label style={{ marginRight: "5px" }}>Direction:</label>
              <select 
                value={filter.sortingDir} 
                onChange={(e) => setFilter(prev => ({ ...prev, sortingDir: e.target.value }))}
                style={{ padding: "4px" }}
              >
                <option value="desc">Highest First</option>
                <option value="asc">Lowest First</option>
              </select>
            </div>

            <div>
              <label style={{ marginRight: "5px" }}>Limit:</label>
              <select 
                value={filter.limit} 
                onChange={(e) => setFilter(prev => ({ ...prev, limit: parseInt(e.target.value) }))}
                style={{ padding: "4px" }}
              >
                <option value={10}>Top 10</option>
                <option value={15}>Top 15</option>
                <option value={20}>Top 20</option>
                <option value={30}>All 30</option>
              </select>
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px", marginBottom: "10px", flexWrap: "wrap" }}>
            <button onClick={() => setFilter({ criteria: "revenue", sortingDir: "desc", limit: 10 })}>
              💰 Revenue: High→Low (10)
            </button>
            <button onClick={() => setFilter({ criteria: "profit", sortingDir: "asc", limit: 15 })}>
              📊 Profit: Low→High (15)
            </button>
            <button onClick={() => setFilter({ criteria: "expenses", sortingDir: "desc", limit: 20 })}>
              💸 Expenses: High→Low (20)
            </button>
            <button onClick={() => setFilter({ criteria: "revenue", sortingDir: "asc", limit: 30 })}>
              🔄 All Revenue: Low→High
            </button>
          </div>

          <div style={{ marginTop: "15px" }}>
            <strong>Legend Data (First 10 items):</strong>
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", 
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

        <BarBellChart
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
    dataSet: generateLargeBarBellDataset(),
    keys: ["revenue", "profit", "expenses"],
    width: 900,
    height: 800,
    margin: { top: 50, right: 50, bottom: 50, left: 200 },
    title: "BarBell Chart - Legend-Based Color Assignment Test",
    xAxisFormat: (d: any) => `$${(d / 1000).toFixed(1)}K`,
    yAxisFormat: (d: any) => d,
    showGrid: { x: true, y: false },
  },
};

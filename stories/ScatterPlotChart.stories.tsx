import React, { useState, useCallback } from "react";
import ScatterPlot from "../src/components/ScatterPlotChart";
import { Meta, StoryFn } from "@storybook/react";
import { fn } from "@storybook/test";

interface ScatterPlotChartProps {
  dataSet: Array<{
    x: number;
    y: number;
    label: string;
    color?: string;
    d: number;
    meta?: never;
    shape?: "square" | "circle" | "triangle";
    date?: string;
  }>;
  width: number;
  height: number;
  margin: { top: number; right: number; bottom: number; left: number };
  title: string;
  children?: React.ReactNode;
  isLoading?: boolean;
  isLoadingComponent?: React.ReactNode;
  isNodataComponent?: React.ReactNode;
  isNodata?: boolean | ((dataSet: any[]) => boolean);
  xAxisFormat?: (d: number | string) => string;
  yAxisFormat?: (d: number | string) => string;
  yTicksQty?: number;
  xAxisDataType?: "number" | "date_annual" | "date_monthly" | "band";
  tooltipFormatter?: (d: any) => string;
  showGrid?: { x: boolean; y: boolean };
  xAxisDomain?: [any, any];
  yAxisDomain?: [any, any];
  dScaleLegend?: {
    title?: string;
    valueFormatter?: (d: number) => string;
  };
  dScaleLegendFormatter?: (domain: number[], dScale: any) => string;
  filter?: {
    limit: number;
    criteria: "x" | "y" | "d";
    sortingDir: "asc" | "desc";
    date?: string;
  };
  onChartDataProcessed?: (metadata: any) => void;
  onHighlightItem?: (labels: string[]) => void;
  colors?: string[];
  colorsMapping?: { [key: string]: string };
  onColorMappingGenerated?: (colorsMapping: { [key: string]: string }) => void;
}

export default {
  title: "Charts/Scatter Plot",
  component: ScatterPlot,
  tags: ["autodocs"],
  argTypes: {},
} as Meta;

const Template: StoryFn<ScatterPlotChartProps> = (args: ScatterPlotChartProps) => {
  const [highlightItems, setHighlightItems] = useState<string[]>([]);
  const [disabledItems, setDisabledItems] = useState<string[]>([]);
  const [colorsMapping, setColorsMapping] = useState<{ [key: string]: string }>({});

  const handleHighlightItem = useCallback((labels: string[]) => {
    setHighlightItems(labels);
    console.log("Highlighted items:", labels);
  }, []);

  const handleColorMappingGenerated = useCallback((mapping: { [key: string]: string }) => {
    setColorsMapping(prev => {
      // Only update if mapping actually changed
      if (JSON.stringify(prev) !== JSON.stringify(mapping)) {
        console.log("Generated color mapping:", mapping);
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
      console.log("Disabled items:", newDisabled);
      return newDisabled;
    });
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ marginBottom: "20px" }}>
        <h3>Interactive Controls</h3>
        <div style={{ marginBottom: "10px" }}>
          <strong>Current Highlighted Items:</strong>{" "}
          {highlightItems.length > 0 ? highlightItems.join(", ") : "None"}
        </div>
        <div style={{ marginBottom: "10px" }}>
          <strong>Current Disabled Items:</strong>{" "}
          {disabledItems.length > 0 ? disabledItems.join(", ") : "None"}
        </div>
        <div style={{ marginBottom: "10px" }}>
          <strong>Generated Colors:</strong>{" "}
          {Object.keys(colorsMapping).length > 0 ? JSON.stringify(colorsMapping) : "None yet"}
        </div>
        <div style={{ marginBottom: "10px" }}>
          <strong>Instructions:</strong>
          <ul>
            <li>Hover over scatter plot points to highlight items</li>
            <li>Click on legend items below to disable/enable data points</li>
          </ul>
        </div>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {args.dataSet?.map(dataPoint => (
            <button
              key={dataPoint.label}
              onClick={() => toggleDisabledItem(dataPoint.label)}
              style={{
                padding: "8px 16px",
                border: "1px solid #ccc",
                borderRadius: "4px",
                backgroundColor: disabledItems.includes(dataPoint.label)
                  ? "#f0f0f0"
                  : colorsMapping[dataPoint.label] || "#fff",
                color: disabledItems.includes(dataPoint.label) ? "#999" : "#000",
                cursor: "pointer",
                textDecoration: disabledItems.includes(dataPoint.label) ? "line-through" : "none",
              }}
            >
              {dataPoint.label} {disabledItems.includes(dataPoint.label) ? "(Disabled)" : ""}
            </button>
          ))}
        </div>
      </div>

      <ScatterPlot
        {...args}
        colorsMapping={colorsMapping}
        onColorMappingGenerated={handleColorMappingGenerated}
        onHighlightItem={handleHighlightItem}
        highlightItems={highlightItems}
        disabledItems={disabledItems}
      />
    </div>
  );
};

export const Primary = Template.bind({});
Primary.args = {
  onChartDataProcessed: fn(),
  width: 900,
  height: 400,
  margin: {
    top: 50,
    right: 50,
    bottom: 50,
    left: 50,
  },
  yAxisDomain: [0, 25],
  xAxisFormat: d => `${d}%`,
  xAxisDataType: "number",
  yAxisFormat: d => `${d}%`,
  title: "My Scatter Plot",
  filter: {
    limit: 5,
    date: "202009",
    sortingDir: "desc",
    criteria: "d",
  },
  dataSet: [
    {
      date: "202009",
      sector: "10",
      x: 70,
      y: 20.5,
      d: 3860,
      label: "Beauty products & perfumes",
      color: "#1F77B4",
      code: 123,
    },
    {
      date: "202009",
      sector: "22",
      x: 64.28571,
      y: 8.035714,
      d: 1320,
      label: "Unknown",
      color: "#17BECF",
    },
    {
      date: "202009",
      sector: "30",
      x: 90.90909,
      y: 37.585,
      d: 5330,
      label: "Ferrous metals",
      color: "#FF7F0E",
    },
    {
      date: "202009",
      sector: "48",
      x: 4.761905,
      y: 12.4569,
      d: 2240,
      label: "Machinery",
      color: "#D62728",
    },
    {
      date: "202009",
      sector: "62",
      x: 4,
      y: 12.4569,
      d: 3270,
      label: "Motor vehicles & parts",
      color: "#9467BD",
    },
    {
      date: "202009",
      sector: "68",
      x: 87.5,
      y: 13.33333,
      d: 2420,
      label: "Paper products",
      color: "#8C564B",
    },
    {
      date: "202009",
      sector: "70",
      x: 2.941176,
      y: 0.5,
      d: 1480,
      label: "Pharmaceutical components",
      color: "#E377C2",
    },
    {
      date: "202009",
      sector: "71",
      x: 78.04878,
      y: 9.939024,
      d: 2780,
      label: "Plastics & rubber",
      color: "#7F7F7F",
    },
    {
      date: "202009",
      sector: "92",
      x: 10,
      y: 25,
      d: 10200,
      label: "Tobacco & tobacco products",
      color: "#BCBD22",
    },
    {
      date: "202009",
      sector: "99",
      x: 5,
      y: 3.240741,
      d: 904,
      label: "Waste, n.e.s.",
      color: "#2CA02C",
    },
    {
      date: "202009",
      sector: "101",
      x: 0,
      y: 10,
      d: 206,
      label: "Wood & vegetable material",
      color: "#0CF823",
    },
  ],
};

// Generate comprehensive dataset for legend testing
const generateLargeScatterDataset = () => {
  const industries = [
    "Technology",
    "Healthcare",
    "Finance",
    "Manufacturing",
    "Retail",
    "Energy",
    "Education",
    "Transportation",
    "Real Estate",
    "Agriculture",
    "Aerospace",
    "Automotive",
    "Telecommunications",
    "Construction",
    "Entertainment",
    "Food & Beverage",
    "Chemicals",
    "Pharmaceuticals",
    "Banking",
    "Insurance",
    "Consulting",
    "Media",
    "Tourism",
    "Mining",
    "Textile",
    "Electronics",
    "Software",
    "Biotechnology",
    "Renewable Energy",
    "Logistics",
    "Gaming",
    "Sports",
    "Fashion",
    "Furniture",
    "Jewelry",
    "Cosmetics",
    "Publishing",
    "Photography",
    "Architecture",
    "Legal Services",
    "Accounting",
    "Marketing",
    "HR Services",
    "Security",
    "Cleaning",
    "Catering",
    "Event Management",
    "Translation",
    "Fitness",
    "Beauty",
  ];

  const dates = ["2020", "2021", "2022", "2023"];

  return industries.map((industry, index) => ({
    x: Math.random() * 100, // Market Share %
    y: Math.random() * 50, // Growth Rate %
    d: Math.random() * 10000 + 1000, // Market Size
    label: industry,
    date: dates[index % dates.length],
    shape: ["circle", "square", "triangle"][index % 3] as "circle" | "square" | "triangle",
  }));
};

export const LegendWithFilterControls = {
  render: (args: any) => {
    const [filter, setFilter] = useState({
      limit: 15,
      criteria: "d" as "x" | "y" | "d",
      sortingDir: "desc" as "asc" | "desc",
      date: "2023",
    });
    const [colorsMapping, setColorsMapping] = useState<{ [key: string]: string }>({});
    const [legendData, setLegendData] = useState<any[]>([]);
    const [originalLegendOrder, setOriginalLegendOrder] = useState<any[]>([]);
    const [disabledItems, setDisabledItems] = useState<string[]>([]);

    const handleChartDataProcessed = useCallback(
      (metadata: any) => {
        if (metadata.legendData) {
          setLegendData(metadata.legendData);

          // Store original legend order when first loaded or when no items are disabled
          if (disabledItems.length === 0) {
            setOriginalLegendOrder(metadata.legendData);
          }
        }
      },
      [disabledItems.length]
    );

    const handleColorMappingGenerated = useCallback((colors: { [key: string]: string }) => {
      setColorsMapping(colors);
    }, []);

    const toggleItemDisabled = useCallback((label: string) => {
      setDisabledItems(prev =>
        prev.includes(label) ? prev.filter(item => item !== label) : [...prev, label]
      );
    }, []);

    return (
      <div>
        <div
          style={{
            marginBottom: "20px",
            padding: "10px",
            border: "1px solid #ddd",
            borderRadius: "4px",
          }}
        >
          <h3>🎨 Legend-Based Color Assignment Test</h3>
          <p>
            This story tests the new legend-based color assignment approach for ScatterPlotChart.
          </p>

          <div
            style={{
              display: "flex",
              gap: "20px",
              marginBottom: "15px",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <div>
              <label style={{ marginRight: "5px" }}>Sort By:</label>
              <select
                value={filter.criteria}
                onChange={e =>
                  setFilter(prev => ({ ...prev, criteria: e.target.value as "x" | "y" | "d" }))
                }
                style={{ padding: "4px" }}
              >
                <option value="x">Market Share (X)</option>
                <option value="y">Growth Rate (Y)</option>
                <option value="d">Market Size (D)</option>
              </select>
            </div>

            <div>
              <label style={{ marginRight: "5px" }}>Direction:</label>
              <select
                value={filter.sortingDir}
                onChange={e =>
                  setFilter(prev => ({ ...prev, sortingDir: e.target.value as "asc" | "desc" }))
                }
                style={{ padding: "4px" }}
              >
                <option value="desc">Highest First</option>
                <option value="asc">Lowest First</option>
              </select>
            </div>

            <div>
              <label style={{ marginRight: "5px" }}>Date Filter:</label>
              <select
                value={filter.date}
                onChange={e => setFilter(prev => ({ ...prev, date: e.target.value }))}
                style={{ padding: "4px" }}
              >
                <option value="2020">2020</option>
                <option value="2021">2021</option>
                <option value="2022">2022</option>
                <option value="2023">2023</option>
              </select>
            </div>

            <div>
              <label style={{ marginRight: "5px" }}>Limit:</label>
              <select
                value={filter.limit}
                onChange={e => setFilter(prev => ({ ...prev, limit: parseInt(e.target.value) }))}
                style={{ padding: "4px" }}
              >
                <option value={10}>Top 10</option>
                <option value={15}>Top 15</option>
                <option value={25}>Top 25</option>
                <option value={50}>All 50</option>
              </select>
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px", marginBottom: "10px", flexWrap: "wrap" }}>
            <button
              onClick={() =>
                setFilter({ limit: 10, criteria: "d", sortingDir: "desc", date: "2023" })
              }
            >
              💰 Market Size: High→Low (10)
            </button>
            <button
              onClick={() =>
                setFilter({ limit: 15, criteria: "y", sortingDir: "desc", date: "2022" })
              }
            >
              📈 Growth: High→Low (15)
            </button>
            <button
              onClick={() =>
                setFilter({ limit: 25, criteria: "x", sortingDir: "asc", date: "2021" })
              }
            >
              📊 Market Share: Low→High (25)
            </button>
            <button
              onClick={() =>
                setFilter({ limit: 50, criteria: "d", sortingDir: "desc", date: "2020" })
              }
            >
              🔄 All 2020: Size High→Low
            </button>
          </div>

          <div style={{ marginTop: "15px" }}>
            <strong>Legend Data (First 10 items):</strong>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                gap: "5px",
                marginTop: "5px",
                maxHeight: "120px",
                overflowY: "auto",
              }}
            >
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
                        backgroundColor: disabledItems.includes(displayItem.label)
                          ? "#f5f5f5"
                          : "transparent",
                        textDecoration: disabledItems.includes(displayItem.label)
                          ? "line-through"
                          : "none",
                      }}
                      onClick={() => toggleItemDisabled(displayItem.label)}
                    >
                      <div
                        style={{
                          width: "12px",
                          height: "12px",
                          backgroundColor: originalItem.color,
                          marginRight: "5px",
                          border: "1px solid #ccc",
                        }}
                      />
                      <span>
                        #{originalItem.order + 1} {displayItem.label}
                      </span>
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

        <ScatterPlot
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
    dataSet: generateLargeScatterDataset(),
    width: 900,
    height: 600,
    margin: { top: 50, right: 50, bottom: 80, left: 80 },
    title: "ScatterPlotChart - Legend-Based Color Assignment Test",
    xAxisFormat: (d: any) => `${d.toFixed(1)}%`,
    yAxisFormat: (d: any) => `${d.toFixed(1)}%`,
    xAxisDataType: "number",
    yAxisDomain: [0, 50],
    tooltipFormatter: (d: any) => `${d.label}: Market Share ${d.x}%, Growth ${d.y}%, Size $${d.d}M`,
    showGrid: { x: true, y: true },
    dScaleLegend: {
      title: "Market Size ($M)",
      valueFormatter: (d: number) => `$${(d / 1000).toFixed(1)}B`,
    },
  },
};
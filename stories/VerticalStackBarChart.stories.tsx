import React, { useState, useCallback } from "react";
import VerticalStackBarChart, { RectData } from "../src/components/VerticalStackBarChart";
import { Meta, StoryFn } from "@storybook/react";
import { MichiVzProvider } from "../src/components/MichiVzProvider";
import { fn } from "@storybook/test";

// Define the ChartMetadata interface to match what's in the component
interface ChartMetadata {
  xAxisDomain: string[];
  visibleItems: string[];
  renderedData: Record<string, RectData[]>;
  chartType: "vertical-stack-bar-chart";
}

interface VerticalStackBarChartProps {
  dataSet: Array<{
    seriesKey: string;
    seriesKeyAbbreviation: string;
    series: Array<{
      date: string | number;
      [key: string]: string | number | null | undefined;
    }>;
    label?: string;
  }>;
  width: number;
  height: number;
  margin: { top: number; right: number; bottom: number; left: number };
  title?: string;
  xAxisFormat?: (d: number) => string;
  yAxisFormat?: (d: number) => string;
  xAxisDomain?: [string, string];
  yAxisDomain?: [number, number];
  tooltipFormatter?: (tooltipData: any) => string;
  showCombined?: boolean;
  children?: React.ReactNode;
  isLoading?: boolean;
  isLoadingComponent?: React.ReactNode;
  isNodataComponent?: React.ReactNode;
  isNodata?: boolean | ((dataSet: any[]) => boolean);
  colorCallbackFn?: (key: string, d: RectData) => string;
  filter?: {
    limit: number;
    sortingDir: "asc" | "desc";
    date?: string;
  };
  onChartDataProcessed?: (metadata: ChartMetadata) => void;
  onHighlightItem?: (labels: string[]) => void;
  colors?: string[];
  colorsMapping?: { [key: string]: string };
  onColorMappingGenerated?: (colorsMapping: { [key: string]: string }) => void;
}

export default {
  title: "Charts/Vertical Stack Bar Chart",
  component: VerticalStackBarChart,
  tags: ["autodocs"],
  argTypes: {
  },
} as Meta;

const Template: StoryFn<VerticalStackBarChartProps> = (args: VerticalStackBarChartProps) => {
  const [highlightItems, setHighlightItems] = useState<string[]>([]);
  const [disabledItems, setDisabledItems] = useState<string[]>([]);
  const [colorsMapping, setColorsMapping] = useState<{ [key: string]: string }>({});

  const handleHighlightItem = useCallback((labels: string[]) => {
    setHighlightItems(labels);
    console.log('Highlighted items:', labels);
  }, []);

  const handleColorMappingGenerated = useCallback((mapping: { [key: string]: string }) => {
    setColorsMapping(prev => {
      // Only update if mapping actually changed
      if (JSON.stringify(prev) !== JSON.stringify(mapping)) {
        console.log('Generated color mapping:', mapping);
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
      console.log('Disabled items:', newDisabled);
      return newDisabled;
    });
  }, []);

  // Get all unique keys from the dataset for the control buttons
  const allKeys = React.useMemo(() => {
    const keys = new Set<string>();
    args.dataSet?.forEach(ds => {
      ds.series.forEach(s => {
        Object.keys(s).forEach(key => {
          if (key !== "date" && key !== "code") {
            keys.add(key);
          }
        });
      });
    });
    return Array.from(keys);
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
            <li>Hover over bar segments to highlight items</li>
            <li>Click on legend items below to disable/enable data keys</li>
          </ul>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {allKeys.map(key => (
            <button
              key={key}
              onClick={() => toggleDisabledItem(key)}
              style={{
                padding: '8px 16px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                backgroundColor: disabledItems.includes(key) ? '#f0f0f0' : colorsMapping[key] || '#fff',
                color: disabledItems.includes(key) ? '#999' : '#000',
                cursor: 'pointer',
                textDecoration: disabledItems.includes(key) ? 'line-through' : 'none'
              }}
            >
              {key} {disabledItems.includes(key) ? '(Disabled)' : ''}
            </button>
          ))}
        </div>
      </div>
      
      <VerticalStackBarChart 
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
  dataSet: [
    {
      seriesKey: "Africa",
      seriesKeyAbbreviation: "Africa",
      series: [
        { date: "2001", Africa: "666" },
        { date: "2002", Africa: "777" },
        { date: "2003", Africa: "989" },
      ],
    },
    {
      seriesKey: "Non-LDC",
      seriesKeyAbbreviation: "Non-LDC",
      series: [
        { date: "2001", "Non-LDC": "444" },
        { date: "2002", "Non-LDC": "333" },
        { date: "2003", "Non-LDC": "222" },
      ],
    },
    {
      seriesKey: "Sudan",
      seriesKeyAbbreviation: "Sudan",
      series: [
        { date: "2001", Sudan: "789" },
        { date: "2002", Sudan: "456" },
        { date: "2003", Sudan: "123" },
      ],
    },
  ],
  width: 900,
  height: 480,
  margin: { top: 50, right: 50, bottom: 50, left: 50 },
  yAxisFormat: d => `${d}`,
  title: "Vertical Stack Bar Chart with Self-Generated Colors",
  onChartDataProcessed: fn(),
};

// Example with data callback
export const WithDataCallback = () => {
  const [chartData, setChartData] = useState<ChartMetadata | null>(null);
  const [highlightItems, setHighlightItems] = useState<string[]>([]);
  const [disabledItems, setDisabledItems] = useState<string[]>([]);
  const [colorsMapping, setColorsMapping] = useState<{ [key: string]: string }>({});

  const handleHighlightItem = useCallback((labels: string[]) => {
    setHighlightItems(labels);
    console.log('Highlighted items:', labels);
  }, []);

  const handleColorMappingGenerated = useCallback((mapping: { [key: string]: string }) => {
    setColorsMapping(prev => {
      if (JSON.stringify(prev) !== JSON.stringify(mapping)) {
        console.log('Generated color mapping:', mapping);
        return mapping;
      }
      return prev;
    });
  }, []);

  return (
    <div>
      <VerticalStackBarChart
        dataSet={[
            {
              seriesKey: "Africa",
              seriesKeyAbbreviation: "Africa",
              series: [
                { date: "2001", Africa: "55043000" },
                { date: "2002", Africa: "60000000" },
                { date: "2003", Africa: "172065000" },
              ],
            },
            {
              seriesKey: "Non-LDC",
              seriesKeyAbbreviation: "Non-LDC",
              series: [
                { date: "2001", "Non-LDC": "42029000" },
                { date: "2002", "Non-LDC": "38000000" },
                { date: "2003", "Non-LDC": "48000000" },
              ],
            },
          ]}
          width={900}
          height={480}
          margin={{ top: 50, right: 50, bottom: 50, left: 50 }}
          title="Chart with Data Callback"
          colorsMapping={colorsMapping}
          onColorMappingGenerated={handleColorMappingGenerated}
          onHighlightItem={handleHighlightItem}
          onChartDataProcessed={metadata => {
            setChartData(metadata);
          }}
          highlightItems={highlightItems}
          disabledItems={disabledItems}
        />

      {chartData && (
        <div style={{ marginTop: "20px", padding: "10px", border: "1px solid #ccc" }}>
          <h3>Chart Data Available to Parent:</h3>
          <div>
            <strong>X-Axis Domain:</strong> {JSON.stringify(chartData.xAxisDomain)}
          </div>
          <div>
            <strong>Visible Keys:</strong> {JSON.stringify(chartData.visibleItems)}
          </div>
          <div>
            <strong>Rendered Elements:</strong> {Object.keys(chartData.renderedData).length} keys
            with data
          </div>
        </div>
      )}
    </div>
  );
};

export const WithFilteredItems = Template.bind({});
WithFilteredItems.args = {
  ...Primary.args,
  title: "Top 2 Items by Value (2002)",
  filter: {
    limit: 2,
    sortingDir: "desc",
    date: "2002",
  },
  onChartDataProcessed: fn(),
};

export const WithManyDataKeys = Template.bind({});
WithManyDataKeys.args = {
  ...Primary.args,
  title: "Multiple Data Keys Test",
  dataSet: [
    {
      seriesKey: "Region A",
      seriesKeyAbbreviation: "A",
      series: [
        { date: "2020", "Product 1": "100", "Product 2": "200", "Product 3": "150", "Product 4": "75", "Product 5": "225" },
        { date: "2021", "Product 1": "120", "Product 2": "180", "Product 3": "160", "Product 4": "85", "Product 5": "200" },
        { date: "2022", "Product 1": "110", "Product 2": "220", "Product 3": "140", "Product 4": "95", "Product 5": "250" },
      ],
    },
    {
      seriesKey: "Region B", 
      seriesKeyAbbreviation: "B",
      series: [
        { date: "2020", "Product 1": "80", "Product 2": "160", "Product 3": "120", "Product 4": "60", "Product 5": "180" },
        { date: "2021", "Product 1": "90", "Product 2": "140", "Product 3": "130", "Product 4": "70", "Product 5": "160" },
        { date: "2022", "Product 1": "85", "Product 2": "170", "Product 3": "110", "Product 4": "80", "Product 5": "190" },
      ],
    },
  ],
  onChartDataProcessed: fn(),
};

// Generate comprehensive dataset for legend testing
const generateLargeVerticalStackDataset = () => {
  const regions = [
    "North America", "Europe", "Asia Pacific", "Latin America", "Middle East", 
    "Africa", "Oceania", "Central Asia", "Southeast Asia", "Eastern Europe",
    "Western Europe", "Northern Europe", "Southern Europe", "East Asia", "South Asia",
    "Central America", "Caribbean", "South America", "North Africa", "Sub-Saharan Africa",
    "Gulf States", "Levant", "Maghreb", "Horn of Africa", "Central Africa"
  ];
  
  const products = [
    "Smartphones", "Laptops", "Tablets", "Smart Watches", "Gaming Consoles", 
    "TVs", "Speakers", "Headphones", "Cameras", "Drones", "Smart Home", "Software"
  ];
  
  const years = ["2020", "2021", "2022", "2023"];
  
  return regions.map((region, index) => {
    const series = years.map(year => {
      const entry: any = { date: year };
      products.forEach(product => {
        entry[product] = (Math.random() * 1000 + 100).toFixed(0);
      });
      return entry;
    });
    
    return {
      seriesKey: region,
      seriesKeyAbbreviation: region.split(' ').map(word => word[0]).join(''),
      series: series,
    };
  });
};

export const LegendWithFilterControls = {
  render: (args: any) => {
    const [filter, setFilter] = useState({ 
      limit: 10, 
      sortingDir: "desc" as "asc" | "desc",
      date: "2023"
    });
    const [colorsMapping, setColorsMapping] = useState<{ [key: string]: string }>({});
    const [legendData, setLegendData] = useState<any[]>([]);
    const [disabledItems, setDisabledItems] = useState<string[]>([]);

    const handleChartDataProcessed = useCallback((metadata: any) => {
      if (metadata.legendData) {
        setLegendData(metadata.legendData);
      }
    }, []);

    const handleColorMappingGenerated = useCallback((colors: { [key: string]: string }) => {
      setColorsMapping(prev => {
        if (JSON.stringify(prev) !== JSON.stringify(colors)) {
          return colors;
        }
        return prev;
      });
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
          <p>This story tests the new legend-based color assignment approach for VerticalStackBarChart.</p>
          
          <div style={{ display: "flex", gap: "20px", marginBottom: "15px", alignItems: "center", flexWrap: "wrap" }}>
            <div>
              <label style={{ marginRight: "5px" }}>Date Filter:</label>
              <select 
                value={filter.date} 
                onChange={(e) => setFilter(prev => ({ ...prev, date: e.target.value }))}
                style={{ padding: "4px" }}
              >
                <option value="2020">2020</option>
                <option value="2021">2021</option>
                <option value="2022">2022</option>
                <option value="2023">2023</option>
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

            <div>
              <label style={{ marginRight: "5px" }}>Limit:</label>
              <select 
                value={filter.limit} 
                onChange={(e) => setFilter(prev => ({ ...prev, limit: parseInt(e.target.value) }))}
                style={{ padding: "4px" }}
              >
                <option value={8}>Top 8</option>
                <option value={12}>Top 12</option>
                <option value={18}>Top 18</option>
                <option value={25}>All 25</option>
              </select>
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px", marginBottom: "10px", flexWrap: "wrap" }}>
            <button onClick={() => setFilter({ limit: 8, sortingDir: "desc", date: "2023" })}>
              📊 2023: High→Low (8)
            </button>
            <button onClick={() => setFilter({ limit: 12, sortingDir: "asc", date: "2022" })}>
              📈 2022: Low→High (12)
            </button>
            <button onClick={() => setFilter({ limit: 18, sortingDir: "desc", date: "2021" })}>
              💰 2021: High→Low (18)
            </button>
            <button onClick={() => setFilter({ limit: 25, sortingDir: "desc", date: "2020" })}>
              🔄 All 2020: High→Low
            </button>
          </div>

          <div style={{ marginTop: "15px" }}>
            <strong>Legend Data (First 10 items):</strong>
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", 
              gap: "5px", 
              marginTop: "5px",
              maxHeight: "120px",
              overflowY: "auto"
            }}>
              {legendData.slice(0, 10).map((item, index) => (
                <div 
                  key={item.label}
                  style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    padding: "2px 5px",
                    fontSize: "12px",
                    cursor: "pointer",
                    backgroundColor: item.disabled ? "#f5f5f5" : "transparent",
                    textDecoration: item.disabled ? "line-through" : "none"
                  }}
                  onClick={() => toggleItemDisabled(item.label)}
                >
                  <div 
                    style={{ 
                      width: "12px", 
                      height: "12px", 
                      backgroundColor: item.color, 
                      marginRight: "5px",
                      border: "1px solid #ccc"
                    }}
                  />
                  <span>#{index + 1} {item.label}</span>
                </div>
              ))}
            </div>
            {legendData.length > 10 && (
              <p style={{ fontSize: "12px", color: "#666", marginTop: "5px" }}>
                ... and {legendData.length - 10} more items
              </p>
            )}
          </div>
        </div>

        <VerticalStackBarChart
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
    dataSet: generateLargeVerticalStackDataset(),
    width: 900,
    height: 700,
    margin: { top: 50, right: 50, bottom: 100, left: 80 },
    title: "VerticalStackBarChart - Legend-Based Color Assignment Test",
    yAxisFormat: (d: any) => `${(d/1000).toFixed(1)}K`,
    xAxisFormat: (d: any) => d,
  },
};
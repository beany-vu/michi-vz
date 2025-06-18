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
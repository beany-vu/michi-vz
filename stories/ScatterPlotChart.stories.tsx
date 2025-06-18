import React, { useState, useCallback } from "react";
import ScatterPlot from "../src/components/ScatterPlotChart";
import { Meta, StoryFn } from "@storybook/react";
import { fn } from "@storybook/test";
import { MichiVzProvider } from "../src/components/MichiVzProvider";

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
} as Meta;

const Template: StoryFn<ScatterPlotChartProps> = (args: ScatterPlotChartProps) => {
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
            <li>Hover over scatter plot points to highlight items</li>
            <li>Click on legend items below to disable/enable data points</li>
          </ul>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {args.dataSet?.map(dataPoint => (
            <button
              key={dataPoint.label}
              onClick={() => toggleDisabledItem(dataPoint.label)}
              style={{
                padding: '8px 16px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                backgroundColor: disabledItems.includes(dataPoint.label) ? '#f0f0f0' : colorsMapping[dataPoint.label] || '#fff',
                color: disabledItems.includes(dataPoint.label) ? '#999' : '#000',
                cursor: 'pointer',
                textDecoration: disabledItems.includes(dataPoint.label) ? 'line-through' : 'none'
              }}
            >
              {dataPoint.label} {disabledItems.includes(dataPoint.label) ? '(Disabled)' : ''}
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
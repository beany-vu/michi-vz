import React, { useState, useCallback } from "react";
import { Meta, StoryFn } from "@storybook/react";
import { RadarChart, RadarChartProps } from "../src/components/RadarChart";
import { MichiVzProvider } from "../src/components/MichiVzProvider";

const mockData3 = [
  {
    label: "UAE",
    color: "#1F77B4",
    data: [
      {
        date: "01",
        value: "3",
      },
      {
        date: "02",
        value: "3",
      },
      {
        date: "05",
        value: "2",
      },
      {
        date: "06",
        value: "1",
      },
      {
        date: "07",
        value: "1",
      },
      {
        date: "08",
        value: "1",
      },
      {
        date: "09",
        value: "1",
      },
      {
        date: "10",
        value: "1",
      },
      {
        date: "11",
        value: "0",
      },
      {
        date: "12",
        value: "1",
      },
    ],
  },
  {
    label: "France",
    color: "#D62728",
    data: [
      {
        date: "01",
        value: "3",
      },

      {
        date: "06",
        value: "1",
      },
      {
        date: "07",
        value: "1",
      },
      {
        date: "08",
        value: "1",
      },
      {
        date: "09",
        value: "1",
      },
      {
        date: "10",
        value: "1",
      },
      {
        date: "11",
        value: "0",
      },
      {
        date: "12",
        value: "1",
      },
    ],
  },
];

export default {
  title: "Charts/Radar Chart",
  components: RadarChart,
  tags: ["autodocs"],
} as Meta;

const Template: StoryFn<RadarChartProps> = (args: RadarChartProps) => {
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
            <li>Hover over data points or polygons to highlight series</li>
            <li>Click on legend items below to disable/enable series</li>
          </ul>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {args.series?.map(series => (
            <button
              key={series.label}
              onClick={() => toggleDisabledItem(series.label)}
              style={{
                padding: '8px 16px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                backgroundColor: disabledItems.includes(series.label) ? '#f0f0f0' : '#fff',
                color: disabledItems.includes(series.label) ? '#999' : '#000',
                cursor: 'pointer',
                textDecoration: disabledItems.includes(series.label) ? 'line-through' : 'none'
              }}
            >
              {series.label} {disabledItems.includes(series.label) ? '(Disabled)' : ''}
            </button>
          ))}
        </div>
      </div>
      
      <RadarChart 
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
  width: 400,
  height: 400,
  // series: mockData2,
  series: mockData3,
  tooltipFormatter: (item: any) => <>{JSON.stringify(item)}</>,
  radialLabelFormatter: (item: any) => `${item}`,
  poles: {
    range: [0, Math.PI * 3],
    domain: [360, 0],
    // labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    labels: [
      "01",
      "02",
      "03",
      "04",
      "05",
      "06",
      "07",
      "08",
      "09",
      "10",
      "11",
      "12",
    ],
  },
  isLoading: false,
  isNodataComponent: <>ddd</>,
};

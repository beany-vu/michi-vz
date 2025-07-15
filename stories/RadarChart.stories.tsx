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
  argTypes: {
  },
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

// Generate comprehensive dataset for legend testing
const generateLargeRadarDataset = () => {
  const metrics = [
    "Performance", "Reliability", "Security", "Scalability", "Usability", 
    "Maintainability", "Compatibility", "Efficiency", "Portability", "Functionality"
  ];
  
  const systems = [
    "Frontend System", "Backend API", "Database Layer", "Cache Layer", "Search Engine",
    "Authentication Service", "Payment Gateway", "Email Service", "File Storage", "CDN",
    "Load Balancer", "Monitoring System", "Logging Service", "Backup System", "Security Scanner",
    "Analytics Engine", "Recommendation Engine", "Chat System", "Notification Service", "Job Queue",
    "Image Processing", "Video Streaming", "Data Pipeline", "ML Training", "Report Generator",
    "User Management", "Content Management", "Workflow Engine", "Integration Hub", "API Gateway"
  ];

  return systems.map((system, idx) => ({
    label: system,
    color: undefined, // Let the component auto-generate colors
    data: metrics.map((metric, metricIdx) => ({
      date: (metricIdx + 1).toString().padStart(2, '0'),
      value: (Math.random() * 5 + 0.5).toFixed(1), // Random value between 0.5 and 5.5
    })),
  }));
};

export const LegendWithFilterControls = {
  render: (args: any) => {
    const [filter, setFilter] = useState({ 
      seriesLimit: 10, 
      sortingDir: "desc" as "asc" | "desc",
      metric: "Performance" 
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
      setColorsMapping(colors);
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
          <p>This story tests the new legend-based color assignment approach for RadarChart.</p>
          
          <div style={{ display: "flex", gap: "20px", marginBottom: "15px", alignItems: "center", flexWrap: "wrap" }}>
            <div>
              <label style={{ marginRight: "5px" }}>Series Limit:</label>
              <select 
                value={filter.seriesLimit} 
                onChange={(e) => setFilter(prev => ({ ...prev, seriesLimit: parseInt(e.target.value) }))}
                style={{ padding: "4px" }}
              >
                <option value={5}>Top 5</option>
                <option value={10}>Top 10</option>
                <option value={15}>Top 15</option>
                <option value={30}>All 30</option>
              </select>
            </div>
            
            <div>
              <label style={{ marginRight: "5px" }}>Sort By:</label>
              <select 
                value={filter.metric} 
                onChange={(e) => setFilter(prev => ({ ...prev, metric: e.target.value }))}
                style={{ padding: "4px" }}
              >
                <option value="Performance">Performance</option>
                <option value="Reliability">Reliability</option>
                <option value="Security">Security</option>
                <option value="Scalability">Scalability</option>
                <option value="Usability">Usability</option>
              </select>
            </div>

            <div>
              <label style={{ marginRight: "5px" }}>Direction:</label>
              <select 
                value={filter.sortingDir} 
                onChange={(e) => setFilter(prev => ({ ...prev, sortingDir: e.target.value as "asc" | "desc" }))}
                style={{ padding: "4px" }}
              >
                <option value="desc">Highest First</option>
                <option value="asc">Lowest First</option>
              </select>
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px", marginBottom: "10px", flexWrap: "wrap" }}>
            <button onClick={() => setFilter({ seriesLimit: 5, sortingDir: "desc", metric: "Performance" })}>
              🚀 Performance: High→Low (5)
            </button>
            <button onClick={() => setFilter({ seriesLimit: 10, sortingDir: "asc", metric: "Security" })}>
              🔒 Security: Low→High (10)
            </button>
            <button onClick={() => setFilter({ seriesLimit: 15, sortingDir: "desc", metric: "Scalability" })}>
              📈 Scalability: High→Low (15)
            </button>
            <button onClick={() => setFilter({ seriesLimit: 30, sortingDir: "desc", metric: "Usability" })}>
              🔄 All Usability: High→Low
            </button>
          </div>

          <div style={{ marginTop: "15px" }}>
            <strong>Legend Data (First 10 items):</strong>
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
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

        <RadarChart
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
    width: 600,
    height: 600,
    series: generateLargeRadarDataset(),
    tooltipFormatter: (item: any) => <>{JSON.stringify(item)}</>,
    radialLabelFormatter: (item: any) => `${item}`,
    poles: {
      range: [0, Math.PI * 2],
      domain: [6, 0],
      labels: [
        "Performance", "Reliability", "Security", "Scalability", "Usability", 
        "Maintainability", "Compatibility", "Efficiency", "Portability", "Functionality"
      ],
    },
    title: "RadarChart - Legend-Based Color Assignment Test",
    isLoading: false,
    isNodataComponent: <>No data available</>,
  },
};

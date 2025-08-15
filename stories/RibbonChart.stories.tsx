import React, { useState, useCallback } from "react";
import RibbonChart from "../src/components/RibbonChart";
import { MichiVzProvider } from "../src/components/MichiVzProvider";
import { Meta } from "@storybook/react";
import { fn } from "@storybook/test";

// Define the default metadata for the component
export default {
  title: "Charts/Ribbon Chart",
  component: RibbonChart,
  tags: ["autodocs"],
  decorators: [
    Story => (
      <MichiVzProvider
        colorsMapping={{
          dutyFree: "#1F77B4",
          iTariffPeaks: "#17BECF",
          nTariffPeaks: "#FF7F0E",
          nonAdValorem: "#D62728",
          notDutyFree: "#9467BD",
          trQuota: "#8C564B",
        }}
        highlightItems={["Africa"]}
      >
        <Story />
      </MichiVzProvider>
    ),
  ],
} as Meta;

// Create a default story using the template
export const Primary = {
  args: {
    colorsMapping: {
      dutyFree: "#1F77B4",
      iTariffPeaks: "#17BECF",
      nTariffPeaks: "#FF7F0E",
      nonAdValorem: "#D62728",
      notDutyFree: "#9467BD",
      trQuota: "#8C564B",
    },
    keys: ["dutyFree", "iTariffPeaks", "nTariffPeaks", "nonAdValorem", "notDutyFree", "trQuota"],
    series: [
      {
        date: 2020,
        dutyFree: 37.830000000000005,
        iTariffPeaks: 42.14,
        nTariffPeaks: 3.18,
        nonAdValorem: 1.02,
        notDutyFree: 62.17,
        trQuota: 0,
      },
      {
        date: 2021,
        dutyFree: 37.62,
        iTariffPeaks: 42.809999999999995,
        nTariffPeaks: 6.92,
        nonAdValorem: 6.93,
        notDutyFree: 62.38,
        trQuota: 0,
      },
      {
        date: 2022,
        dutyFree: 38.2,
        iTariffPeaks: 42.92,
        nTariffPeaks: 6.05,
        nonAdValorem: 10.16,
        notDutyFree: 61.8,
        trQuota: 0,
      },
      {
        date: 2018,
        dutyFree: 37.95,
        iTariffPeaks: 41.92,
        nTariffPeaks: 0.83,
        nonAdValorem: 0.95,
        notDutyFree: 62.050000000000004,
        trQuota: 0,
      },
      {
        date: 2019,
        dutyFree: 39.67,
        iTariffPeaks: 41.72,
        nTariffPeaks: 0.8999999999999999,
        nonAdValorem: 0.3,
        notDutyFree: 60.33,
        trQuota: 0,
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
    yAxisFormat: d => `${d}`, //
    title: "My Robbin Chart",
    onChartDataProcessed: fn(),
    onLegendDataChange: fn(),
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

    const toggleDisabledItem = useCallback((key: string) => {
      setDisabledItems(prev => {
        const newDisabled = prev.includes(key) ? prev.filter(item => item !== key) : [...prev, key];
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
              <li>Hover over chart ribbons to highlight categories</li>
              <li>Click on legend items below to disable/enable data keys</li>
            </ul>
          </div>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            {args.keys.map((key: string) => (
              <button
                key={key}
                onClick={() => toggleDisabledItem(key)}
                style={{
                  padding: "8px 16px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  backgroundColor: disabledItems.includes(key)
                    ? "#f0f0f0"
                    : colorsMapping[key] || "#fff",
                  color: disabledItems.includes(key) ? "#999" : "#000",
                  cursor: "pointer",
                  textDecoration: disabledItems.includes(key) ? "line-through" : "none",
                }}
              >
                {key} {disabledItems.includes(key) ? "(Disabled)" : ""}
              </button>
            ))}
          </div>
        </div>

        <MichiVzProvider>
          <RibbonChart
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
    keys: ["dutyFree", "iTariffPeaks", "nTariffPeaks", "nonAdValorem", "notDutyFree", "trQuota"],
    series: [
      {
        date: 2020,
        dutyFree: 37.83,
        iTariffPeaks: 42.14,
        nTariffPeaks: 3.18,
        nonAdValorem: 1.02,
        notDutyFree: 62.17,
        trQuota: 0,
      },
      {
        date: 2021,
        dutyFree: 37.62,
        iTariffPeaks: 42.81,
        nTariffPeaks: 6.92,
        nonAdValorem: 6.93,
        notDutyFree: 62.38,
        trQuota: 0,
      },
      {
        date: 2022,
        dutyFree: 38.2,
        iTariffPeaks: 42.92,
        nTariffPeaks: 6.05,
        nonAdValorem: 10.16,
        notDutyFree: 61.8,
        trQuota: 0,
      },
      {
        date: 2018,
        dutyFree: 37.95,
        iTariffPeaks: 41.92,
        nTariffPeaks: 0.83,
        nonAdValorem: 0.95,
        notDutyFree: 62.05,
        trQuota: 0,
      },
      {
        date: 2019,
        dutyFree: 39.67,
        iTariffPeaks: 41.72,
        nTariffPeaks: 0.9,
        nonAdValorem: 0.3,
        notDutyFree: 60.33,
        trQuota: 0,
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
    yAxisFormat: (d: any) => `${d}`,
    title: "Interactive Ribbon Chart with Disable/Enable",
    onChartDataProcessed: fn(),
    onLegendDataChange: fn(),
  },
};

// Comprehensive interactive story with disable/enable functionality
export const DisableEnableColorMapping = {
  render: (args: any) => {
    const [currentHighlight, setCurrentHighlight] = React.useState<string[]>([]);
    const [disabledItems, setDisabledItems] = React.useState<string[]>([]);
    const [colorsMapping, setColorsMapping] = React.useState<{ [key: string]: string }>({});

    const handleColorMappingGenerated = React.useCallback(
      (newMapping: { [key: string]: string }) => {
        setColorsMapping(prev => ({ ...prev, ...newMapping }));
      },
      []
    );

    const toggleDisabled = React.useCallback((key: string) => {
      setDisabledItems(prev =>
        prev.includes(key) ? prev.filter(item => item !== key) : [...prev, key]
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
      } else {
        // disable
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
            <div>
              <strong>Disabled Items:</strong>{" "}
              {disabledItems.length > 0 ? disabledItems.join(", ") : "None"}
            </div>
            <div>
              <strong>Colors Mapping:</strong> {JSON.stringify(colorsMapping, null, 2)}
            </div>
          </div>
        </div>

        <MichiVzProvider>
          <RibbonChart
            {...args}
            onLegendDataChange={args.onLegendDataChange}
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
    keys: ["category1", "category2", "category3", "category4", "category5"],
    series: [
      {
        date: 2018,
        category1: 25.3,
        category2: 32.1,
        category3: 18.5,
        category4: 14.2,
        category5: 9.9,
      },
      {
        date: 2019,
        category1: 27.8,
        category2: 29.4,
        category3: 20.1,
        category4: 12.8,
        category5: 9.9,
      },
      {
        date: 2020,
        category1: 30.2,
        category2: 26.8,
        category3: 22.3,
        category4: 11.5,
        category5: 9.2,
      },
      {
        date: 2021,
        category1: 32.1,
        category2: 24.7,
        category3: 24.8,
        category4: 10.1,
        category5: 8.3,
      },
      {
        date: 2022,
        category1: 34.5,
        category2: 22.9,
        category3: 26.2,
        category4: 9.8,
        category5: 6.6,
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
    yAxisFormat: (d: any) => `${d}%`,
    title: "Test Disable/Enable with Color Mapping Persistence",
    onChartDataProcessed: fn(),
    onLegendDataChange: fn(),
  },
};

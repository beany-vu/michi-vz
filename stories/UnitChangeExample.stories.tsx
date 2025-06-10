import React, { useState } from "react";
import LineChartComponent from "../src/components/LineChart";
import { MichiVzProvider } from "../src/components/MichiVzProvider";

export default {
  title: "Examples/Unit Change Synchronization",
  component: LineChartComponent,
};

const generateData = (multiplier: number) => [
  {
    label: "Revenue",
    color: "#2196F3",
    series: [
      { date: "2019", value: 1500 * multiplier, certainty: true },
      { date: "2020", value: 2200 * multiplier, certainty: true },
      { date: "2021", value: 2800 * multiplier, certainty: true },
      { date: "2022", value: 3200 * multiplier, certainty: true },
    ],
  },
  {
    label: "Costs",
    color: "#FF5722",
    series: [
      { date: "2019", value: 1200 * multiplier, certainty: true },
      { date: "2020", value: 1800 * multiplier, certainty: true },
      { date: "2021", value: 2100 * multiplier, certainty: true },
      { date: "2022", value: 2500 * multiplier, certainty: true },
    ],
  },
];

export const UnitChangeFlashingIssue = {
  render: () => {
    const [unit, setUnit] = useState<"$" | "%">("$");
    const [showDebug, setShowDebug] = useState(false);
    
    // When unit changes, both data and formatter change
    const dataSet = generateData(unit === "$" ? 1 : 0.1);
    const yAxisFormat = (d: number) => `${unit === "$" ? "$" : ""}${d}${unit === "%" ? "%" : ""}`;
    
    return (
      <MichiVzProvider>
        <div>
          <div style={{ marginBottom: 20 }}>
            <button 
              onClick={() => setUnit(unit === "$" ? "%" : "$")}
              style={{
                padding: "10px 20px",
                fontSize: 16,
                marginRight: 10,
                background: "#2196F3",
                color: "white",
                border: "none",
                borderRadius: 4,
                cursor: "pointer",
              }}
            >
              Toggle Unit (Current: {unit})
            </button>
            <label>
              <input
                type="checkbox"
                checked={showDebug}
                onChange={(e) => setShowDebug(e.target.checked)}
              />
              Show debug info
            </label>
          </div>
          
          {showDebug && (
            <div style={{ marginBottom: 20, padding: 10, background: "#f5f5f5", borderRadius: 4 }}>
              <p>Current unit: {unit}</p>
              <p>Data multiplier: {unit === "$" ? "1x" : "0.1x"}</p>
              <p>Y-axis format: {yAxisFormat(100)}</p>
            </div>
          )}
          
          <LineChartComponent
            dataSet={dataSet}
            width={800}
            height={400}
            margin={{ top: 50, right: 50, bottom: 50, left: 80 }}
            yAxisFormat={yAxisFormat}
            xAxisDataType="date_annual"
            title="Revenue vs Costs"
          />
          
          <div style={{ marginTop: 20, padding: 20, background: "#fff3cd", borderRadius: 4 }}>
            <h4>Issue Description:</h4>
            <p>When toggling units, you may notice the axis briefly shows old values with new formatting before updating to new values.</p>
            <p>For example: switching from $ to % might briefly show "$3200%" before updating to "320%"</p>
          </div>
        </div>
      </MichiVzProvider>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "This example demonstrates the axis flashing issue when changing units. The axis formatter updates before the scale domain, causing a brief mismatch.",
      },
    },
  },
};

export const SynchronizedUnitChange = {
  render: () => {
    const [unit, setUnit] = useState<"$" | "%">("$");
    const [showDebug, setShowDebug] = useState(false);
    
    // Use a key to force full re-render when unit changes
    const chartKey = `chart-${unit}`;
    
    const dataSet = generateData(unit === "$" ? 1 : 0.1);
    const yAxisFormat = (d: number) => `${unit === "$" ? "$" : ""}${d}${unit === "%" ? "%" : ""}`;
    
    return (
      <MichiVzProvider>
        <div>
          <div style={{ marginBottom: 20 }}>
            <button 
              onClick={() => setUnit(unit === "$" ? "%" : "$")}
              style={{
                padding: "10px 20px",
                fontSize: 16,
                marginRight: 10,
                background: "#4CAF50",
                color: "white",
                border: "none",
                borderRadius: 4,
                cursor: "pointer",
              }}
            >
              Toggle Unit (Current: {unit})
            </button>
            <label>
              <input
                type="checkbox"
                checked={showDebug}
                onChange={(e) => setShowDebug(e.target.checked)}
              />
              Show debug info
            </label>
          </div>
          
          {showDebug && (
            <div style={{ marginBottom: 20, padding: 10, background: "#f5f5f5", borderRadius: 4 }}>
              <p>Current unit: {unit}</p>
              <p>Chart key: {chartKey}</p>
              <p>Data multiplier: {unit === "$" ? "1x" : "0.1x"}</p>
              <p>Y-axis format: {yAxisFormat(100)}</p>
            </div>
          )}
          
          <LineChartComponent
            key={chartKey} // Force re-render on unit change
            dataSet={dataSet}
            width={800}
            height={400}
            margin={{ top: 50, right: 50, bottom: 50, left: 80 }}
            yAxisFormat={yAxisFormat}
            xAxisDataType="date_annual"
            title="Revenue vs Costs (Synchronized)"
          />
          
          <div style={{ marginTop: 20, padding: 20, background: "#d4edda", borderRadius: 4 }}>
            <h4>Solution:</h4>
            <p>Using a key prop that changes with the unit forces React to unmount and remount the entire chart component.</p>
            <p>This ensures all parts of the chart (axes, scales, data) update together atomically.</p>
          </div>
        </div>
      </MichiVzProvider>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "This example shows how to fix the synchronization issue using a key prop that changes when units change, forcing a complete re-render.",
      },
    },
  },
};

export const DisableTransitionsSolution = {
  render: () => {
    const [unit, setUnit] = useState<"$" | "%">("$");
    const [enableTransitions, setEnableTransitions] = useState(true);
    
    const dataSet = generateData(unit === "$" ? 1 : 0.1);
    const yAxisFormat = (d: number) => `${unit === "$" ? "$" : ""}${d}${unit === "%" ? "%" : ""}`;
    
    return (
      <MichiVzProvider>
        <div>
          <div style={{ marginBottom: 20 }}>
            <button 
              onClick={() => setUnit(unit === "$" ? "%" : "$")}
              style={{
                padding: "10px 20px",
                fontSize: 16,
                marginRight: 10,
                background: "#FF9800",
                color: "white",
                border: "none",
                borderRadius: 4,
                cursor: "pointer",
              }}
            >
              Toggle Unit (Current: {unit})
            </button>
            <label style={{ marginLeft: 10 }}>
              <input
                type="checkbox"
                checked={enableTransitions}
                onChange={(e) => setEnableTransitions(e.target.checked)}
              />
              Enable transitions
            </label>
          </div>
          
          <LineChartComponent
            dataSet={dataSet}
            width={800}
            height={400}
            margin={{ top: 50, right: 50, bottom: 50, left: 80 }}
            yAxisFormat={yAxisFormat}
            xAxisDataType="date_annual"
            title="Revenue vs Costs"
            disableTransitions={!enableTransitions} // This prop would need to be implemented
          />
          
          <div style={{ marginTop: 20, padding: 20, background: "#fff3cd", borderRadius: 4 }}>
            <h4>Alternative Solution:</h4>
            <p>Another approach would be to disable D3 transitions temporarily when units change.</p>
            <p>This would require modifying the axis components to accept a `disableTransitions` prop.</p>
            <p>Note: This example shows the concept but requires implementation in the axis components.</p>
          </div>
        </div>
      </MichiVzProvider>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "This example demonstrates an alternative solution: disabling D3 transitions during unit changes to prevent visual desynchronization.",
      },
    },
  },
};
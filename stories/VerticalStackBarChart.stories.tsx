import React, { useState } from "react";
import VerticalStackBarChart from "../src/components/VerticalStackBarChart";
import { Meta } from "@storybook/react";
import { MichiVzProvider } from "../src/components/MichiVzProvider";

// Define the ChartMetadata interface to match what's in the component
interface ChartMetadata {
  xAxisDomain: string[];
  visibleKeys: string[];
  renderedData: Record<string, any[]>;
}

export default {
  title: "Charts/Vertical Stack Bar Chart",
  component: VerticalStackBarChart,
  tags: ["autodocs"],
  decorators: [
    Story => (
      <MichiVzProvider
        initialColorsMapping={{
          Exports: "green",
          Imports: "red",
          Africa: "orange",
          "Non-LDC": "purple",
          Sudan: "blue",
        }}
      >
        <Story />
      </MichiVzProvider>
    ),
  ],
} as Meta;

export const Primary = {
  args: {
    dataSet: [
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
      {
        seriesKey: "Sudan",
        seriesKeyAbbreviation: "Sudan",
        series: [
          { date: "2001", Sudan: "420290400" },
          { date: "2002", Sudan: "380000400" },
          { date: "2003", Sudan: "80000040" },
        ],
      },
    ],
    width: 900,
    height: 480,
    margin: { top: 50, right: 50, bottom: 50, left: 50 },
    yAxisFormat: d => `${d}`,
    title: "Top DataSet by Total Value",
    filter: { limit: 1, sortingDir: "desc" },
  },
};

// Example with data callback
export const WithDataCallback = () => {
  const [chartData, setChartData] = useState<ChartMetadata | null>(null);

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
        onChartDataProcessed={setChartData}
      />

      {chartData && (
        <div style={{ marginTop: "20px", padding: "10px", border: "1px solid #ccc" }}>
          <h3>Chart Data Available to Parent:</h3>
          <div>
            <strong>X-Axis Domain:</strong> {JSON.stringify(chartData.xAxisDomain)}
          </div>
          <div>
            <strong>Visible Keys:</strong> {JSON.stringify(chartData.visibleKeys)}
          </div>
          <div>
            <strong>Rendered Elements:</strong> {Object.keys(chartData.renderedData).length} keys with data
          </div>
        </div>
      )}
    </div>
  );
};

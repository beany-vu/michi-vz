import React, { useState } from "react";
import VerticalStackBarChart, { RectData } from "../src/components/VerticalStackBarChart";
import { Meta } from "@storybook/react";
import { MichiVzProvider } from "../src/components/MichiVzProvider";
import { fn } from "@storybook/test";

// Define the ChartMetadata interface to match what's in the component
interface ChartMetadata {
  xAxisDomain: string[];
  visibleItems: string[];
  renderedData: Record<string, RectData[]>;
  chartType: "vertical-stack-bar-chart";
}

export default {
  title: "Charts/Vertical Stack Bar Chart",
  component: VerticalStackBarChart,
  tags: ["autodocs"],
  decorators: [
    Story => (
      <MichiVzProvider
        colorsMapping={{
          Exports: "green",
          Imports: "red",
          Africa: "orange",
          "Non-LDC": "purple",
          Sudan: "blue",
        }}
        // disabledItems={["Non-LDC"]}
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
          { date: "2001", Africa: "666",  },
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
    title: "Top DataSet by Total Value",
    filter: { limit: 2, sortingDir: "desc", date: "2003" },
    onChartDataProcessed: data => {
      console.log({ data });
    },
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
        onChartDataProcessed={metadata => {
          console.log(metadata);
          setChartData(metadata);
        }}
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

export const WithTopFilteredItems = {
  args: {
    ...Primary.args,
    title: "Top 3 Items by Value (2002)",
    filter: {
      limit: 3,
      sortingDir: "desc",
      date: "2002",
    },
    onChartDataProcessed: fn(),
  },
};

export const WithBottomFilteredItems = {
  args: {
    ...Primary.args,
    title: "Bottom 2 Items by Value (2001)",
    filter: {
      limit: 2,
      sortingDir: "asc",
      date: "2001",
    },
    onChartDataProcessed: fn(),
  },
};

export const FilteredBySize = {
  args: {
    ...Primary.args,
    title: "Top 8 Items by Circle Size",
    filter: {
      limit: 8,
      criteria: "d",
      sortingDir: "desc",
      date: "202009",
    },
    onChartDataProcessed: fn(),
  },
};

export const FilteredByXValue = {
  args: {
    ...Primary.args,
    title: "Top 5 Items by X-Axis Value",
    filter: {
      limit: 5,
      criteria: "x",
      sortingDir: "desc",
      date: "202009",
    },
    onChartDataProcessed: fn(),
  },
};

export const FilteredByYValue = {
  args: {
    ...Primary.args,
    title: "Bottom 4 Items by Y-Axis Value",
    filter: {
      limit: 4,
      criteria: "y",
      sortingDir: "asc",
      date: "202009",
    },
    onChartDataProcessed: fn(),
  },
};

export const FilteredByBaseValue = {
  args: {
    ...Primary.args,
    title: "Top 5 Items by Base Value",
    filter: {
      limit: 5,
      criteria: "valueBased",
      sortingDir: "desc",
    },
    onChartDataProcessed: fn(),
  },
};

export const FilteredByCompareValue = {
  args: {
    ...Primary.args,
    title: "Top 3 Items by Compare Value",
    filter: {
      limit: 3,
      criteria: "valueCompared",
      sortingDir: "desc",
    },
    onChartDataProcessed: fn(),
  },
};

export const FilteredAscending = {
  args: {
    ...Primary.args,
    title: "Bottom 4 Items by Base Value",
    filter: {
      limit: 4,
      criteria: "valueBased",
      sortingDir: "asc",
    },
    onChartDataProcessed: fn(),
  },
};

export const FilteredByValue1 = {
  args: {
    ...Primary.args,
    title: "Top 3 Items by First Value",
    filter: {
      limit: 3,
      criteria: "value1",
      sortingDir: "desc",
    },
    onChartDataProcessed: fn(),
  },
};

export const FilteredByValue2 = {
  args: {
    ...Primary.args,
    title: "Top 3 Items by Second Value",
    filter: {
      limit: 3,
      criteria: "value2",
      sortingDir: "desc",
    },
    onChartDataProcessed: fn(),
  },
};

export const WithDateFilter = {
  args: {
    ...Primary.args,
    title: "Top 2 Series by Value at 2020",
    filter: {
      limit: 2,
      criteria: "value",
      sortingDir: "desc",
      date: "2020",
    },
    onChartDataProcessed: fn(),
  },
};

export const WithBottomFilter = {
  args: {
    ...Primary.args,
    title: "Bottom 3 Series by Value at 2022",
    filter: {
      limit: 3,
      criteria: "value",
      sortingDir: "asc",
      date: "2022",
    },
    onChartDataProcessed: fn(),
  },
};

export const FilteredByMedian = {
  args: {
    ...Primary.args,
    title: "Top 2 Series by Median Value",
    filter: {
      limit: 2,
      criteria: "valueMedium",
      sortingDir: "desc",
    },
    onChartDataProcessed: fn(),
  },
};

export const FilteredByMaxValue = {
  args: {
    ...Primary.args,
    title: "Top 3 Series by Maximum Value",
    filter: {
      limit: 3,
      criteria: "valueMax",
      sortingDir: "desc",
    },
    onChartDataProcessed: fn(),
  },
};

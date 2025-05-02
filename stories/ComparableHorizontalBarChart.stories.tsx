import React from "react";
import ComparableHorizontalBarChart from "../src/components/ComparableHorizontalBarChart";
import { Meta } from "@storybook/react";
import { MichiVzProvider } from "../src/components/MichiVzProvider";

// Define the default metadata for the component
export default {
  title: "Charts/Comparable Horizontal Bar Chart",
  component: ComparableHorizontalBarChart,
  tags: ["autodocs"],
  decorators: [
    Story => (
      <MichiVzProvider
        colorsMapping={{
          Africa: "red",
          "Congo": "blue",
          Egypt: "green",
          Madagascar: "yellow",
        }}
        visibleItems={["Africa", "Congo", "Egypt", "Madagascar"]}
      >
        <Story />
      </MichiVzProvider>
    ),
  ],
} as Meta;

// Create a default story using the template
export const Primary = {
  args: {
    onChartDataProcessed: (metadata: any) => {
      console.log({ metadata });
    },
    isNoDataComponent: <div>No data</div>,
    dataSet: [
      {
        label: "Africa",
        valueBased: 100,
        valueCompared: 55,
      },
      {
        label: "Egypt",
        valueBased: -23.06,
        valueCompared: -49.59,
      },
      {
        label: "Congo",
        valueBased: 100,
        valueCompared: 55,
      },
    ],
    width: 900,
    height: 400,
    margin: {
      top: 50,
      right: 50,
      bottom: 50,
      left: 150,
    },

    xAxisPredefinedDomain: [-100, 100],
    showCombined: false,
    xAisFormat: d => `${d}`, // Example: format values as percentages
    yAxisFormat: d => `${d}`, // Example: format values as percentages
    title: "My Comparable Vertical Bar Chart",
    tooltipFormatter: (d: unknown) => {
      return JSON.stringify(d);
    },
    children: (
      <defs>
        <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="red" />
          <stop offset="100%" stopColor="blue" />
        </linearGradient>

        <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="red" />
          <stop offset="100%" stopColor="pink" />
        </linearGradient>
      </defs>
    ),
    filter: { limit: 10, criteria: "valueBased", sortingDir: "desc" },
  },
};

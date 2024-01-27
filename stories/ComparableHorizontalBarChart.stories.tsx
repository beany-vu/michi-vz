import React from "react";
import ComparableHorizontalBarChart from "src/components/ComparableHorizontalBarChart";
import { Meta } from "@storybook/react";
import { MichiVzProvider } from "../src/components/MichiVzProvider";

// Define the default metadata for the component
export default {
  title: "Charts/Comparable Horizontal Bar Chart",
  component: ComparableHorizontalBarChart,
  tags: ["autodocs"],
  decorators: [(Story) => (
    <MichiVzProvider
    initialHighlightItems={["Euro"]}>

    <Story />
  </MichiVzProvider>)]
} as Meta;

// Create a default story using the template
export const Primary = {
  args: {
    isNoDataComponent: <div>No data</div>,
    dataSet: [
      {
        "label": "Congo",
        "valueBased": 71508.24,
        "valueCompared": 30710.44
      },
      {
        "label": "Congo, Democratic Republic of",
        "valueBased": 492140.3,
        "valueCompared": 211002.26
      },
      {
        "label": "Egypt",
        "valueBased": 6881171.69,
        "valueCompared": 4039803.91
      },
      {
        "label": "Madagascar",
        "valueBased": 272213.58,
        "valueCompared": 176016.4
      }
    ]
    // xAxisPredefinedDomain: [0, 6881171.69]
    , width: 900, height: 400, margin: {
      top: 50, right: 50, bottom: 50, left: 50
    }, showCombined: false, xAisFormat: (d) => `${d}`,// Example: format values as percentages
    yAxisFormat: (d) => `${d}`,// Example: format values as percentages
    title: "My Comparable Vertical Bar Chart", tooltipFormatter: (d: any) => {
      return JSON.stringify(d);
    }, children: (<defs>
      <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="red" />
        <stop offset="100%" stopColor="blue" />
      </linearGradient>

      <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="red" />
        <stop offset="100%" stopColor="pink" />
      </linearGradient>
    </defs>)
  }
};

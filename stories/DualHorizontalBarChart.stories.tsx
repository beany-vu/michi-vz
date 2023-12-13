import React from "react";
import DualHorizontalBarChart from "../src/components/DualHorizontalBarChart";
import { Meta } from "@storybook/react";
import { MichiVzProvider } from "../src/components/MichiVzProvider";

// Define the default metadata for the component
export default {
  title: "Charts/Dual Horizontal Bar Chart",
  component: DualHorizontalBarChart,
  tags: ["autodocs"],
  decorators: [(Story) => (<MichiVzProvider
      initialColorsMapping={{
        "Africa": "red", "Euro": "purple", "Asia": "orange", "Australia": "green", "North America": "blue"
      }}
      initialColorsBasedMapping={{
        "Africa": "yellow", "Euro": "navy", "Asia": "violet", "Australia": "darkgreen", "North America": "grey"
      }}
      initialHighlightItems={["Euro"]}>
      <Story />
    </MichiVzProvider>)]
} as Meta;

// Create a default story using the template
export const Primary = {
  args: {
    dataSet: [{
      "label": "Africa", color: "blue", "value1": 400, "value2": 200
    }, {
      "label": "Asia", color: "blue", "value1": 350, "value2": 200
    }, {
      "label": "Australia", color: "blue", "value1": null, "value2": 180
    }, {
      "label": "Euro", color: "blue", "value1": 180, "value2": 500
    }, {
      "label": "North America", color: "blue", "value1": null, "value2": null
    }], width: 900, height: 400, margin: {
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

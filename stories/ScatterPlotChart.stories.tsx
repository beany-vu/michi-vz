import React from "react";
import ScatterPlot from "../src/components/ScatterPlotChart.tsx"; // Import your ScatterPlot component
import { Meta } from "@storybook/react";
import { MichiVzProvider } from "../src/components/MichiVzProvider";

export default {
  title: "Charts/Scatter Plot", // Change the title to match your scatter plot
  component: ScatterPlot, // Use your ScatterPlot component
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <MichiVzProvider>
        <Story />
      </MichiVzProvider>
    ),
  ],
} as Meta;

export const Primary = {
  args: {
    // xScale: /* Provide your x-axis scale here */,
    // yScale: /* Provide your y-axis scale here */,
    // data: /* Provide your data points here */,
    width: 900,
    height: 400,
    margin: {
      top: 50,
      right: 50,
      bottom: 50,
      left: 50,
    },
    yAxisDomain: [0, 25],
    xAxisFormat: (d) => `${d}%`,
    xAxisDataType: "number",
    // xAxisDataType: "band",
    yAxisFormat: (d) => `${d}%`,
    title: "My Scatter Plot", // Change the title as needed
    dataSet: [
      {
        year: "202009",
        sector: "10",
        x: 70,
        y: 20.5,
        d: 3860,
        label: "Beauty products & perfumes",
        color: "#1F77B4",
        code: 123,
      }
    ],
    // dataSet: [
    //   {
    //     year: "202009",
    //     sector: "10",
    //     x: 70,
    //     y: 20.5,
    //     d: 60,
    //     label: "Beauty products & perfumes",
    //     color: "#1F77B4",
    //     code: 123,
    //     shape: "square",
    //   },
    //   {
    //     year: "202009",
    //     sector: "22",
    //     x: 64.28571,
    //     y: 8.035714,
    //     d: 60,
    //     label: "Unknown",
    //     color: "#17BECF",
    //   },
    //   {
    //     year: "202009",
    //     sector: "30",
    //     x: 90.90909,
    //     y: 37.585,
    //     d: 60,
    //     label: "Ferrous metals",
    //     color: "#FF7F0E",
    //   },
    // ],
  },
};

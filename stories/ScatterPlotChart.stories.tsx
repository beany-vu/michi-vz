import React from "react";
import ScatterPlot from "../src/components/ScatterPlotChart.tsx"; // Import your ScatterPlot component
import { Meta } from "@storybook/react";
import { fn } from "@storybook/test";
import { MichiVzProvider } from "../src/components/MichiVzProvider";

export default {
  title: "Charts/Scatter Plot", // Change the title to match your scatter plot
  component: ScatterPlot, // Use your ScatterPlot component
  tags: ["autodocs"],
  decorators: [
    Story => (
      <MichiVzProvider>
        <Story />
      </MichiVzProvider>
    ),
  ],
} as Meta;

export const Primary = {
  args: {
    onChartDataProcessed: fn(),
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
    xAxisFormat: d => `${d}%`,
    xAxisDataType: "number",
    // xAxisDataType: "band",
    yAxisFormat: d => `${d}%`,
    title: "My Scatter Plot", // Change the title as needed
    filter: {
      limit: "5",
      date: "202009",
      sortingDir: "desc",
      criteria: "d",
    },
    dataSet: [
      {
        date: "202009",
        sector: "10",
        x: 70,
        y: 20.5,
        d: 3860,
        label: "Beauty products & perfumes",
        color: "#1F77B4",
        code: 123,
      },
      {
        date: "202009",
        sector: "22",
        x: 64.28571,
        y: 8.035714,
        d: 1320,
        label: "Unknown",
        color: "#17BECF",
      },
      {
        date: "202009",
        sector: "30",
        x: 90.90909,
        y: 37.585,
        d: 5330,
        label: "Ferrous metals",
        color: "#FF7F0E",
      },
      {
        date: "202009",
        sector: "48",
        x: 4.761905,
        y: 12.4569,
        d: 2240,
        label: "Machinery",
        color: "#D62728",
      },
      {
        date: "202009",
        sector: "62",
        x: 4,
        y: 12.4569,
        d: 3270,
        label: "Motor vehicles & parts",
        color: "#9467BD",
      },
      {
        date: "202009",
        sector: "68",
        x: 87.5,
        y: 13.33333,
        d: 2420,
        label: "Paper products",
        color: "#8C564B",
      },
      {
        date: "202009",
        sector: "70",
        x: 2.941176,
        y: 0.5,
        d: 1480,
        label: "Pharmaceutical components",
        color: "#E377C2",
      },
      {
        date: "202009",
        sector: "71",
        x: 78.04878,
        y: 9.939024,
        d: 2780,
        label: "Plastics & rubber",
        color: "#7F7F7F",
      },
      {
        date: "202009",
        sector: "92",
        x: 10,
        y: 25,
        d: 10200,
        label: "Tobacco & tobacco products",
        color: "#BCBD22",
      },
      {
        date: "202009",
        sector: "99",
        x: 5,
        y: 3.240741,
        d: 904,
        label: "Waste, n.e.s.",
        color: "#2CA02C",
      },
      {
        date: "202009",
        sector: "101",
        x: 0,
        y: 10,
        d: 206,
        label: "Wood & vegetable material",
        color: "#0CF823",
      },
    ],
    // dataSet: [
    //   {
    //     date: "202009",
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
    //     date: "202009",
    //     sector: "22",
    //     x: 64.28571,
    //     y: 8.035714,
    //     d: 60,
    //     label: "Unknown",
    //     color: "#17BECF",
    //   },
    //   {
    //     date: "202009",
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

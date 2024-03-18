import React from "react";
import LineChartComponent from "../src/components/LineChart";
import { Meta } from "@storybook/react";
import { MichiVzProvider } from "../src/components/MichiVzProvider";

// Define the default metadata for the component
export default {
  title: "Charts/Line Chart",
  component: LineChartComponent,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <MichiVzProvider
        initialColorsMapping={{
          Egypt: "red",
          Euro: "purple",
          "Rest of the World": "orange",
          Africa: "green",
        }}
        initialHighlightItems={["Egypt"]}
      >
        <Story />
      </MichiVzProvider>
    ),
  ],
} as Meta;

// Create a default story using the template
export const Primary = {
  args: {
    dataSet: [
      {
        label: "Africa",
        shape: "square",
        series: [
          {
            year: 2016,
            date: "2016",
            value: 8.200000000000001,
            certainty: false,
          },
          {
            year: 2017,
            date: "2017",
            value: 7.739999999999999,
            certainty: true,
          },
          {
            year: 2018,
            date: "2018",
            value: 7.920000000000001,
            certainty: true,
          },
          {
            year: 2019,
            date: "2019",
            value: 7.6499999999999995,
            certainty: true,
          },
          {
            year: 2020,
            date: "2020",
            value: 6.510000000000001,
            certainty: true,
          },
          {
            year: 2021,
            date: "2021",
            value: 5.99,
            certainty: true,
          },
          {
            year: 2022,
            date: "2022",
            value: 6.1,
            certainty: true,
          },
        ],
      },
      {
        label: "Rest of the World",
        series: [
          {
            year: 2016,
            date: "2016",
            value: 91.8,
            certainty: false,
          },
          {
            year: 2017,
            date: "2017",
            value: 92.25999999999999,
            certainty: true,
          },
          {
            year: 2018,
            date: "2018",
            value: 92.08,
            certainty: true,
          },
          {
            year: 2019,
            date: "2019",
            value: 92.35,
            certainty: true,
          },
          {
            year: 2020,
            date: "2020",
            value: 93.49,
            certainty: true,
          },
          {
            year: 2021,
            date: "2021",
            value: 94.01,
            certainty: true,
          },
          {
            year: 2022,
            date: "2022",
            value: 93.89999999999999,
            certainty: true,
          },
        ],
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
    showCombined: false,
    yAxisFormat: (d) => `${d}%`, // Example: format values as percentages
    xAxisDataType: "date_annual",

    title: "My Line Chart",
    tooltipFormatter: (dataSet, d) => {
      return JSON.stringify(d);
    },
  },
};

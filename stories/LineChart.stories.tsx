import React from "react";
import LineChartComponent from "../src/components/LineChart";
import { Meta } from "@storybook/react";
import { fn } from "@storybook/test";
import { MichiVzProvider } from "../src/components/MichiVzProvider";

// Define the default metadata for the component
export default {
  title: "Charts/Line Chart",
  component: LineChartComponent,
  tags: ["autodocs"],
  decorators: [
    Story => (
      <MichiVzProvider
        colorsMapping={{
          "Country 1": "green",
          "Item 1": "red",
          "Item 2": "purple",
          "Item 3": "orange",
          "Item 4": "green",
          "Item 5": "blue",
          "Item 6": "yellow",
          "Item 7": "brown",
          "Item 8": "pink",
          "Item 9": "cyan",
          "Item 10": "magenta",
          "Item 11": "gray",
          "Item 12": "black",
          "Item 13": "red",
          "Item 14": "purple",
          "Item 15": "orange",
          "Item 16": "green",
          "Item 17": "blue",
          "Item 18": "yellow",
          "Item 19": "brown",
          "Item 20": "pink",
        }}
        // highlightItems={["Item 1"]}
      >
        <Story />
      </MichiVzProvider>
    ),
  ],
} as Meta;

// Create a default story using the template
export const Primary = {
  args: {
    onChartDataProcessed: fn(),
    dataSet: [
      {
        label: "Country 1",
        color: "red",
        series: [
          {
            year: 2002,
            date: "2002",
            value: 24.14,
            certainty: false,
          },
          {
            year: 2003,
            date: "2003",
            value: 20.68,
            certainty: true,
          },
          {
            year: 2004,
            date: "2004",
            value: 29.34,
            certainty: true,
          },
          {
            year: 2017,
            date: "2005",
            value: 33.6,
            certainty: true,
          },
        ],
      },
    ],
    // dataSet: [
    //   {
    //     label: "Item 1",
    //     shape: "circle",
    //     curve: "curveLinear",
    //     series: [
    //       { year: 2016, date: "2016", value: 101, certainty: true },
    //       { year: 2017, date: "2017", value: 201, certainty: true },
    //       { year: 2018, date: "2018", value: 151, certainty: false },
    //     ],
    //   },
    //   {
    //     label: "Item 2",
    //     shape: "circle",
    //     curve: "curveLinear",
    //     series: [
    //       { year: 2016, date: "2016", value: 102, certainty: true },
    //       { year: 2017, date: "2017", value: 22, certainty: true },
    //       { year: 2018, date: "2018", value: 152, certainty: false },
    //     ],
    //   },
    //   {
    //     label: "Item 3",
    //     shape: "circle",
    //     curve: "curveLinear",
    //     series: [
    //       { year: 2016, date: "2016", value: 103, certainty: true },
    //       { year: 2017, date: "2017", value: 3, certainty: true },
    //       { year: 2018, date: "2018", value: 153, certainty: false },
    //     ],
    //   },
    //   {
    //     label: "Item 4",
    //     shape: "circle",
    //     curve: "curveLinear",
    //     series: [
    //       { year: 2016, date: "2016", value: 104, certainty: true },
    //       { year: 2017, date: "2017", value: 204, certainty: true },
    //       { year: 2018, date: "2018", value: 154, certainty: false },
    //     ],
    //   },
    //   {
    //     label: "Item 5",
    //     shape: "circle",
    //     curve: "curveLinear",
    //     series: [
    //       { year: 2016, date: "2016", value: 105, certainty: true },
    //       { year: 2017, date: "2017", value: 205, certainty: true },
    //       { year: 2018, date: "2018", value: 155, certainty: false },
    //     ],
    //   },
    //   {
    //     label: "Item 6",
    //     shape: "circle",
    //     curve: "curveLinear",
    //     series: [
    //       { year: 2016, date: "2016", value: 106, certainty: true },
    //       { year: 2017, date: "2017", value: 206, certainty: true },
    //       { year: 2018, date: "2018", value: 156, certainty: false },
    //     ],
    //   },
    //   {
    //     label: "Item 7",
    //     shape: "circle",
    //     curve: "curveLinear",
    //     series: [
    //       { year: 2016, date: "2016", value: 107, certainty: true },
    //       { year: 2017, date: "2017", value: 27, certainty: true },
    //       { year: 2018, date: "2018", value: 157, certainty: false },
    //     ],
    //   },
    //   {
    //     label: "Item 8",
    //     shape: "circle",
    //     curve: "curveLinear",
    //     series: [
    //       { year: 2016, date: "2016", value: 108, certainty: true },
    //       { year: 2017, date: "2017", value: 208, certainty: true },
    //       { year: 2018, date: "2018", value: 58, certainty: false },
    //     ],
    //   },
    //   {
    //     label: "Item 9",
    //     shape: "circle",
    //     curve: "curveLinear",
    //     series: [
    //       { year: 2016, date: "2016", value: 109, certainty: true },
    //       { year: 2017, date: "2017", value: 209, certainty: true },
    //       { year: 2018, date: "2018", value: 159, certainty: false },
    //     ],
    //   },
    //   {
    //     label: "Item 10",
    //     shape: "circle",
    //     curve: "curveLinear",
    //     series: [
    //       { year: 2016, date: "2016", value: 110, certainty: true },
    //       { year: 2017, date: "2017", value: 210, certainty: true },
    //       { year: 2018, date: "2018", value: 160, certainty: false },
    //     ],
    //   },
    //   {
    //     label: "Item 11",
    //     shape: "circle",
    //     curve: "curveLinear",
    //     series: [
    //       { year: 2016, date: "2016", value: 111, certainty: true },
    //       { year: 2017, date: "2017", value: 211, certainty: true },
    //       { year: 2018, date: "2018", value: 161, certainty: false },
    //     ],
    //   },
    //   {
    //     label: "Item 12",
    //     shape: "circle",
    //     curve: "curveLinear",
    //     series: [
    //       { year: 2016, date: "2016", value: 112, certainty: true },
    //       { year: 2017, date: "2017", value: 212, certainty: true },
    //       { year: 2018, date: "2018", value: 162, certainty: false },
    //     ],
    //   },
    //   {
    //     label: "Item 13",
    //     shape: "circle",
    //     curve: "curveLinear",
    //     series: [
    //       { year: 2016, date: "2016", value: 113, certainty: true },
    //       { year: 2017, date: "2017", value: 213, certainty: true },
    //       { year: 2018, date: "2018", value: 163, certainty: false },
    //     ],
    //   },
    //   {
    //     label: "Item 14",
    //     shape: "circle",
    //     curve: "curveLinear",
    //     series: [
    //       { year: 2016, date: "2016", value: 114, certainty: true },
    //       { year: 2017, date: "2017", value: 214, certainty: true },
    //       { year: 2018, date: "2018", value: 164, certainty: false },
    //     ],
    //   },
    //   {
    //     label: "Item 15",
    //     shape: "circle",
    //     curve: "curveLinear",
    //     series: [
    //       { year: 2016, date: "2016", value: 115, certainty: true },
    //       { year: 2017, date: "2017", value: 215, certainty: true },
    //       { year: 2018, date: "2018", value: 165, certainty: false },
    //     ],
    //   },
    //   {
    //     label: "Item 16",
    //     shape: "circle",
    //     curve: "curveLinear",
    //     series: [
    //       { year: 2016, date: "2016", value: 116, certainty: true },
    //       { year: 2017, date: "2017", value: 216, certainty: true },
    //       { year: 2018, date: "2018", value: 166, certainty: false },
    //     ],
    //   },
    //   {
    //     label: "Item 17",
    //     shape: "circle",
    //     curve: "curveLinear",
    //     series: [
    //       { year: 2016, date: "2016", value: 117, certainty: true },
    //       { year: 2017, date: "2017", value: 217, certainty: true },
    //       { year: 2018, date: "2018", value: 167, certainty: false },
    //     ],
    //   },
    //   {
    //     label: "Item 18",
    //     shape: "circle",
    //     curve: "curveLinear",
    //     series: [
    //       { year: 2016, date: "2016", value: 118, certainty: true },
    //       { year: 2017, date: "2017", value: 218, certainty: true },
    //       { year: 2018, date: "2018", value: 68, certainty: false },
    //     ],
    //   },
    //   {
    //     label: "Item 19",
    //     shape: "circle",
    //     curve: "curveLinear",
    //     series: [
    //       { year: 2016, date: "2016", value: 119, certainty: true },
    //       { year: 2017, date: "2017", value: 219, certainty: true },
    //       { year: 2018, date: "2018", value: 19, certainty: false },
    //     ],
    //   },
    //   {
    //     label: "Item 20",
    //     shape: "circle",
    //     curve: "curveLinear",
    //     series: [
    //       { year: 2016, date: "2016", value: 20, certainty: true },
    //       { year: 2017, date: "2017", value: 220, certainty: true },
    //       { year: 2018, date: "2018", value: 170, certainty: false },
    //     ],
    //   },
    // ],
    width: 900,
    height: 400,
    margin: {
      top: 50,
      right: 50,
      bottom: 50,
      left: 50,
    },
    showCombined: false,
    yAxisFormat: d => `${d}%`, // Example: format values as percentages
    xAxisDataType: "date_annual",

    title: "My Line Chart",
    tooltipFormatter: (dataSet, d) => {
      return JSON.stringify(d);
    },
    filter: { limit: 10, date: "2017", criteria: "value", sortingDir: "desc" },
  },
};

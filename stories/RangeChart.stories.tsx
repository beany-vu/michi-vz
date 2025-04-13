// RangeChart.stories.tsx
import React from "react";
import RangeChartComponent from "../src/components/RangeChart";
import { Meta } from "@storybook/react";
import { MichiVzProvider } from "../src/components/MichiVzProvider";
import { fn } from "@storybook/test";

export default {
  title: "Charts/Range Chart",
  component: RangeChartComponent,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <MichiVzProvider
        initialColorsMapping={{
          Egypt: "red",
          Euro: "purple",
          "Rest of the World": "orange",
          Africa: "purple",
        }}
        initialHighlightItems={["Africa"]}
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
        label: "Africa",
        series: [
          {
            year: 2018,
            date: "2018",
            valueMin: 1,
            valueMax: 12,
            valueMedium: 6,
          },
          {
            year: 2019,
            date: "2019",
            valueMin: 0,
            valueMax: 0.1162,
            valueMedium: 0.1162,
          },
          {
            year: 2020,
            date: "2020",
            valueMin: 2,
            valueMax: 14.1162,
            valueMedium: 14.1162,
          },
          {
            year: 2021,
            date: "2021",
            valueMin: 12,
            valueMax: 12,
            valueMedium: 12,
          },
          {
            year: 2022,
            date: "2022",
            valueMin: 0,
            valueMax: 0.1199,
            valueMedium: 0.1199,
          },
        ],
      },
      // {
      //   "label": "Africa",
      //   "color": "green",
      //   "series": [
      //     {
      //       "year": 2016,
      //       "date": "2016",
      //       "valueMax": 18.5,
      //       "valueMin": 7.8,
      //       "valueMedium": 8.2,
      //       "certainty": false
      //     },
      //     {
      //       "year": 2017,
      //       "date": "2017",
      //       "valueMax": 82.2,
      //       "valueMin": 7.4,
      //       "valueMedium": 7.7,
      //       "certainty": true
      //     },
      //     {
      //       "year": 2018,
      //       "date": "2018",
      //       "valueMax": 38.4,
      //       "valueMin": 7.7,
      //       "valueMedium": 7.9,
      //       "certainty": true
      //     },
      //     // ... (add more data points)
      //   ]
      // },
      // {
      //   "label": "Rest of the World",
      //   "color": "orange",
      //   "series": [
      //     {
      //       "year": 2016,
      //       "date": "2016",
      //       "valueMax": 70.5,
      //       "valueMin": 10.5,
      //       "valueMedium": 52,
      //       "certainty": false
      //     },
      //     {
      //       "year": 2017,
      //       "date": "2017",
      //       "valueMax": 96,
      //       "valueMin": 30.5,
      //       "valueMedium": 63,
      //       "certainty": true
      //     },
      //     {
      //       "year": 2017,
      //       "date": "2018",
      //       "valueMax": 96,
      //       "valueMin": 30.5,
      //       "valueMedium": 63,
      //       "certainty": true
      //     },
      //     {
      //       "year": 2019,
      //       "date": "2019",
      //       "valueMax": 40.8,
      //       "valueMin": 0.8,
      //       "valueMedium": 14.2,
      //       "certainty": true
      //     },
      //   ]
      // }
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
    // yAxisFormat: (d) => `${d}%`, // Example: format values as percentages
    xAxisDataType: "date_annual",

    title: "My Range Chart",
    tooltipFormatter: (dataSet, d) => {
      return JSON.stringify(d);
    },
    onChartDataProcessed: fn(),
  },
};

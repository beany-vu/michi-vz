import AreaChart from "../src/components/AreaChart";
import { Meta } from "@storybook/react";
import { MichiVzProvider } from "../src/components";
import React from "react";

// Define the default metadata for the component
export default {
  title: "Charts/Area Chart",
  component: AreaChart,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <MichiVzProvider
        initialColorsMapping={{
          Processed: "red",
          "Semi-processed": "purple",
          Raw: "orange",
        }}
        initialDisabledItems={["Africa"]}
        initialHighlightItems={["Europe"]}
      >
        <Story />
      </MichiVzProvider>
    ),
  ],
} as Meta;

// Create a default story using the template
export const Primary = {
  args: {
    colorsMapping: {
      Raw: "red",
      "Semi-processed": "blue",
      Processed: "green",
    },
    keys: ["Raw", "Semi-processed", "Processed"],
    series: [
      {
        date: "2018-01",
        Raw: 25.31,
        "Semi-processed": 37.44,
        Processed: 37.25,
      },
      {
        date: "2018-02",
        Raw: 29.23,
        "Semi-processed": 12.29,
        Processed: 58.48,
      },
      {
        date: "2018-03",
        Raw: 35.120000000000005,
        "Semi-processed": 21.64,
        Processed: 43.24,
      },
      {
        date: "2018-04",
        Raw: 14.24,
        "Semi-processed": 49.97,
        Processed: 35.79,
      },
      {
        date: "2018-05",
        Raw: 52.669999999999995,
        "Semi-processed": 21.65,
        Processed: 25.69,
      },
      {
        date: "2018-06",
        Raw: 17.61,
        "Semi-processed": 39.54,
        Processed: 42.85,
      },
      {
        date: "2018-07",
        Raw: 21.37,
        "Semi-processed": 25.669999999999998,
        Processed: 52.96999999999999,
      },
      {
        date: "2018-08",
        Raw: 19.05,
        "Semi-processed": 26.169999999999998,
        Processed: 54.779999999999994,
      },
      {
        date: "2018-09",
        Raw: 17.19,
        "Semi-processed": 36.19,
        Processed: 46.63,
      },
      {
        date: "2018-10",
        Raw: 32.96,
        "Semi-processed": 16.919999999999998,
        Processed: 50.12,
      },
      {
        date: "2018-11",
        Raw: 46.73,
        "Semi-processed": 22.84,
        Processed: 30.43,
      },
      {
        date: "2018-12",
        Raw: 44.85,
        "Semi-processed": 23.549999999999997,
        Processed: 31.59,
      },
      {
        date: "2019-01",
        Raw: 20.03,
        "Semi-processed": 14.38,
        Processed: 65.59,
      },
      {
        date: "2019-02",
        Raw: 16.689999999999998,
        "Semi-processed": 12.120000000000001,
        Processed: 71.19,
      },
      {
        date: "2019-03",
        Raw: 31.03,
        "Semi-processed": 19.63,
        Processed: 49.34,
      },
      {
        date: "2019-04",
        Raw: 10.15,
        "Semi-processed": 37.34,
        Processed: 52.51,
      },
      {
        date: "2019-05",
        Raw: 33.650000000000006,
        "Semi-processed": 23.580000000000002,
        Processed: 42.77,
      },
      {
        date: "2019-06",
        Raw: 36.7,
        "Semi-processed": 13.81,
        Processed: 49.49,
      },
      {
        date: "2019-07",
        Raw: 11.360000000000001,
        "Semi-processed": 15.02,
        Processed: 73.61999999999999,
      },
      {
        date: "2019-08",
        Raw: 16.3,
        "Semi-processed": 26.11,
        Processed: 57.589999999999996,
      },
      {
        date: "2019-09",
        Raw: 33.71,
        "Semi-processed": 33.22,
        Processed: 33.07,
      },
      {
        date: "2019-10",
        Raw: 39.32,
        "Semi-processed": 20.380000000000003,
        Processed: 40.300000000000004,
      },
      {
        date: "2019-11",
        Raw: 50.2,
        "Semi-processed": 14.680000000000001,
        Processed: 35.120000000000005,
      },
      {
        date: "2019-12",
        Raw: 44.12,
        "Semi-processed": 17.28,
        Processed: 38.6,
      },
      {
        date: "2020-01",
        Raw: 9.67,
        "Semi-processed": 26.66,
        Processed: 63.68000000000001,
      },
      {
        date: "2020-02",
        Raw: 9.48,
        "Semi-processed": 27.08,
        Processed: 63.44,
      },
      {
        date: "2020-03",
        Raw: 23.82,
        "Semi-processed": 17.919999999999998,
        Processed: 58.26,
      },
      {
        date: "2020-04",
        Raw: 40.910000000000004,
        "Semi-processed": 44.37,
        Processed: 14.719999999999999,
      },
      {
        date: "2020-05",
        Raw: 72.37,
        "Semi-processed": 7.5600000000000005,
        Processed: 20.080000000000002,
      },
      {
        date: "2020-06",
        Raw: 19.85,
        "Semi-processed": 11.88,
        Processed: 68.27,
      },
      {
        date: "2020-07",
        Raw: 29.56,
        "Semi-processed": 14.81,
        Processed: 55.63,
      },
      {
        date: "2020-08",
        Raw: 21.05,
        "Semi-processed": 18.59,
        Processed: 60.36,
      },
      {
        date: "2020-09",
        Raw: 18.67,
        "Semi-processed": 18.060000000000002,
        Processed: 63.27,
      },
      {
        date: "2020-10",
        Raw: 19.52,
        "Semi-processed": 19.08,
        Processed: 61.39,
      },
      {
        date: "2020-11",
        Raw: 24.67,
        "Semi-processed": 14.39,
        Processed: 60.95,
      },
      {
        date: "2020-12",
        Raw: 11.110000000000001,
        "Semi-processed": 20.47,
        Processed: 68.42,
      },
      {
        date: "2021-01",
        Raw: 20.19,
        "Semi-processed": 13.18,
        Processed: 66.64,
      },
      {
        date: "2021-02",
        Raw: 16.86,
        "Semi-processed": 13.71,
        Processed: 69.43,
      },
      {
        date: "2021-03",
        Raw: 19.650000000000002,
        "Semi-processed": 15.479999999999999,
        Processed: 64.87,
      },
      {
        date: "2021-04",
        Raw: 24.98,
        "Semi-processed": 15.110000000000001,
        Processed: 59.9,
      },
      {
        date: "2021-05",
        Raw: 12.540000000000001,
        "Semi-processed": 23.27,
        Processed: 64.19,
      },
      {
        date: "2021-06",
        Raw: 37.19,
        "Semi-processed": 24.7,
        Processed: 38.11,
      },
      {
        date: "2021-07",
        Raw: 7.23,
        "Semi-processed": 29.89,
        Processed: 62.88,
      },
      {
        date: "2021-08",
        Raw: 9.73,
        "Semi-processed": 29.520000000000003,
        Processed: 60.75000000000001,
      },
      {
        date: "2021-09",
        Raw: 11.360000000000001,
        "Semi-processed": 27.389999999999997,
        Processed: 61.25000000000001,
      },
      {
        date: "2021-10",
        Raw: 11.62,
        "Semi-processed": 27.97,
        Processed: 60.41,
      },
      {
        date: "2021-11",
        Raw: 20.830000000000002,
        "Semi-processed": 25.53,
        Processed: 53.64,
      },
      {
        date: "2021-12",
        Raw: 21.07,
        "Semi-processed": 34.300000000000004,
        Processed: 44.629999999999995,
      },
      {
        date: "2022-01",
        Raw: 21.959999999999997,
        "Semi-processed": 35.32,
        Processed: 42.72,
      },
      {
        date: "2022-02",
        Raw: 17.89,
        "Semi-processed": 27.439999999999998,
        Processed: 54.67999999999999,
      },
      {
        date: "2022-03",
        Raw: 15.559999999999999,
        "Semi-processed": 29.03,
        Processed: 55.410000000000004,
      },
      {
        date: "2022-04",
        Raw: 18.37,
        "Semi-processed": 27.139999999999997,
        Processed: 54.49,
      },
      {
        date: "2022-05",
        Raw: 25.06,
        "Semi-processed": 30.75,
        Processed: 44.190000000000005,
      },
      {
        date: "2022-06",
        Raw: 31.979999999999997,
        "Semi-processed": 23.200000000000003,
        Processed: 44.82,
      },
      {
        date: "2022-07",
        Raw: 10.61,
        "Semi-processed": 20.26,
        Processed: 69.13,
      },
      {
        date: "2022-08",
        Raw: 11.62,
        "Semi-processed": 19.99,
        Processed: 68.4,
      },
      {
        date: "2022-09",
        Raw: 10.040000000000001,
        "Semi-processed": 16.91,
        Processed: 73.05,
      },
      {
        date: "2022-10",
        Raw: 13.059999999999999,
        "Semi-processed": 20.91,
        Processed: 66.03,
      },
      {
        date: "2022-11",
        Raw: 7.62,
        "Semi-processed": 21.83,
        Processed: 70.55,
      },
      {
        date: "2022-12",
        Raw: 11.81,
        "Semi-processed": 15.540000000000001,
        Processed: 72.64,
      },
      {
        date: "2023-01",
        Raw: 9.99,
        "Semi-processed": 14.81,
        Processed: 75.2,
      },
      {
        date: "2023-02",
        Raw: 13.309999999999999,
        "Semi-processed": 7.91,
        Processed: 78.78,
      },
      {
        date: "2023-03",
        Raw: 32.06,
        "Semi-processed": 13.51,
        Processed: 54.44,
      },
      {
        date: "2023-04",
        Raw: 42.11,
        "Semi-processed": 15.57,
        Processed: 42.33,
      },
      {
        date: "2023-05",
        Raw: 37.32,
        "Semi-processed": 12.520000000000001,
        Processed: 50.160000000000004,
      },
      {
        date: "2023-06",
        Raw: 15.14,
        "Semi-processed": 16.520000000000003,
        Processed: 68.33,
      },
      {
        date: "2023-07",
        Raw: 24.39,
        "Semi-processed": 17.98,
        Processed: 57.620000000000005,
      },
      {
        date: "2023-08",
        Raw: 9.51,
        "Semi-processed": 19.18,
        Processed: 71.31,
      },
      {
        date: "2023-09",
        Raw: 9.47,
        "Semi-processed": 22.24,
        Processed: 68.28999999999999,
      },
      {
        date: "2023-10",
        Raw: 8.459999999999999,
        "Semi-processed": 29.270000000000003,
        Processed: 62.27,
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
    yAxisFormat: (d) => `${d}`, //
    title: "My Robbin Chart",
    yAxisDomain: [0, 100],
    xAxisDataType: "date_annual",
  },
};

import React from "react";
import { Meta } from "@storybook/react";
import BarBellChart from "../src/components/BarBellChart";
import { MichiVzProvider } from "../src/components";

const mockData = [
  {
    date: "2020-01",
    step1: 1000,
    step2: 2000,
    step3: 100,
  },
  {
    date: "2020-02",
    step1: 1500,
    step2: 2000,
    step3: 1000,
  },
{
    date: "2020-03",
    step1: 2000,
    step2: 1500,
    step3: 2000,
  },
  {
    date: "2020-04",
    step1: 2500,
    step2: 1000,
    step3: 3000,
  },
  {
    date: "2020-05",
    step1: 3000,
    step2: 500,
    step3: 4000,
  },
  {
    date: "2020-06",
    step1: 3500,
    step2: 0,
    step3: 5000,
  },
  {
    date: "2020-07",
    step1: 4000,
    step2: 0,
    step3: 6000,
  },
  {
    date: "2020-08",
    step1: 4500,
    step2: 0,
    step3: 7000,
  },
  {
    date: "2020-09",
    step1: 5000,
    step2: 0,
    step3: 8000,
  },
  {
    date: "2020-10",
    step1: 5500,
    step2: 10,
    step3: 9000,
  },
  {
    date: "2020-11",
    step1: 6000,
    step2: 100,
    step3: 10000,
  },
  {
    date: "2020-12",
    step1: 500,
    step2: 0,
    step3: 1000,
  },
];

export default {
  title: "Charts/BarBellChart",
  component: BarBellChart,
  decorators: [
    (Story) => (
      <MichiVzProvider initialColorsMapping={{step1: "red", step2: "blue", step3: "pink"}}>
        <Story />
      </MichiVzProvider>
    )
  ]
} as Meta;

export const Primary = {
  args: {
    dataSet: mockData,
    keys: ["step1", "step2", "step3"],
    width: 900,
    height: 500,
    margin: {
      top: 50,
      right: 50,
      bottom: 50,
      left: 50,
    },
    title: "BarBell Chart",
    xAxisFormat: (value: any) => value, // You may need to adjust this based on your actual xAxisFormat function
    yAxisFormat: (value: any) => `${new Date(value).getFullYear()} - ${new Date(value).getMonth() + 1}`, // You may need to adjust this based on your actual yAxisFormat function
    // tooltipFormat: ({ item, series }) => `<div>${JSON.stringify(item)}</div>`,
    showGrid: {
      x: true,
      y: false,
    },
    children: null,
  }
};


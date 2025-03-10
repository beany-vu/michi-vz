import React from "react";
import VerticalStackBarChart from "../src/components/VerticalStackBarChart";
import { Meta } from "@storybook/react";
import { MichiVzProvider } from "../src/components/MichiVzProvider";

export default {
  title: "Charts/Vertical Stack Bar Chart",
  component: VerticalStackBarChart,
  tags: ["autodocs"],
  decorators: [
    Story => (
      <MichiVzProvider
        initialColorsMapping={{
          Exports: "green",
          Imports: "red",
          Africa: "orange",
          "Non-LDC": "purple",
          "Sudan": "blue",
        }}
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
        seriesKey: "Africa",
        seriesKeyAbbreviation: "Africa",
        series: [
          { date: 2001, Africa: 55043000 },
          { date: 2002, Africa: 60000000 },
          { date: 2003, Africa: 172065000 },
        ],
      },
      {
        seriesKey: "Non-LDC",
        seriesKeyAbbreviation: "Non-LDC",
        series: [
          { date: 2001, "Non-LDC": 42029000 },
          { date: 2002, "Non-LDC": 38000000 },
          { date: 2003, "Non-LDC": 48000000 },
        ],
      },
      {
        seriesKey: "Sudan",
        seriesKeyAbbreviation: "Sudan",
        series: [
          { date: 2001, Sudan: 420290400 },
          { date: 2002, Sudan: 380000400 },
          { date: 2003, Sudan: 80000040 },
        ],
      },
    ],
    width: 900,
    height: 480,
    margin: { top: 50, right: 50, bottom: 50, left: 50 },
    yAxisFormat: d => `${d}`,
    title: "Top DataSet by Total Value",
    filter: { limit: 1, sortingDir: "desc" },
  },
};

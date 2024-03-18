import React from "react";
import VerticalStackBarChart from "../src/components/VerticalStackBarChart";
import { Meta } from "@storybook/react";
import { MichiVzProvider } from "../src/components/MichiVzProvider";
// import LineChartComponent from 'src/components/LineChartComponent';

// Define the default metadata for the component
export default {
  title: "Charts/Vertical Stack Bar Chart",
  component: VerticalStackBarChart,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <MichiVzProvider
        initialColorsMapping={{
          Madagascar: "#ff0",
          "Non-LDC": "purple",
          Africa: "orange",
        }}
        initialDisabledItems={["Europe"]}
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
      Africa: "red",
      "Non-LDC": "blue",
      Asia: "green",
    },
    keys: ["Africa", "Non-LDC"],
    dataSet: [
      {
        seriesKey: "exports",
        seriesKeyAbbreviation: "X",
        series: [
          {
            date: 2001,
            Africa: 55043000,
            "Non-LDC": 52029000,
          },
          {
            date: 2002,
            Africa: 38845000,
            "Non-LDC": 36259000,
          },
          {
            date: 2003,
            Africa: 72065000,
            "Non-LDC": 68184000,
          },
          {
            date: 2004,
            Africa: 49430000,
            "Non-LDC": 44885000,
          },
          {
            date: 2005,
            Africa: 34591000,
            "Non-LDC": 27383000,
          },
          {
            date: 2006,
            Africa: 42614000,
            "Non-LDC": 35785000,
          },
          {
            date: 2007,
            Africa: 73025000,
            "Non-LDC": 65233000,
          },
          {
            date: 2008,
            Africa: 72409000,
            "Non-LDC": 64434000,
          },
          {
            date: 2009,
            Africa: 57623000,
            "Non-LDC": 49501000,
          },
          {
            date: 2010,
            Africa: 96652000,
            "Non-LDC": 74377000,
          },
          {
            date: 2011,
            Africa: 85460000,
            "Non-LDC": 72787000,
          },
          {
            date: 2012,
            Africa: 84525000,
            "Non-LDC": 69596000,
          },
          {
            date: 2013,
            Africa: 146841000,
            "Non-LDC": 130649000,
          },
          {
            date: 2014,
            Africa: 187843000,
            "Non-LDC": 170250000,
          },
          {
            date: 2015,
            Africa: 158761000,
            "Non-LDC": 138940000,
          },
          {
            date: 2016,
            Africa: 177270000,
            "Non-LDC": 155546000,
          },
          {
            date: 2017,
            Africa: 216721000,
            "Non-LDC": 197103000,
          },
          {
            date: 2018,
            Africa: 236890000,
            "Non-LDC": 215081000,
          },
          {
            date: 2019,
            Africa: 195539000,
            "Non-LDC": 174568000,
          },
          {
            date: 2020,
            Africa: 127133000,
            "Non-LDC": 112096000,
          },
          {
            date: 2021,
            Africa: 162748000,
            "Non-LDC": 142205000,
          },
          {
            date: 2022,
            Africa: 213893000,
            "Non-LDC": 179994000,
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
    yAxisFormat: (d) => `${d}%`, //
    title: "My Robbin Chart",
  },
};

import AreaChart from "../src/components/AreaChart";
import {Meta} from "@storybook/react";
import {MichiVzProvider} from "../src/components";
import React from "react";

// Define the default metadata for the component
export default {
    title: 'Charts/Area Chart',
    component: AreaChart,
    tags: ['autodocs'],
    decorators: [
        (Story) => (
            <MichiVzProvider
                initialColorsMapping={{
                    "Processed": "red",
                    "Semi-processed": "purple",
                    "Raw": "orange",
                }}
                initialDisabledItems={["Africa"]}
                initialHighlightItems={["Europe"]}>
                <Story/>
            </MichiVzProvider>
        )
    ],
} as Meta

// Create a default story using the template
export const Primary = {
    args: {

        colorsMapping: {
            "Raw": "red",
            "Semi-processed": "blue",
            "Processed": "green",
        },
        keys: [ "Raw", "Semi-processed", "Processed"],
        series: [
          {
            "date": "2001",
            "Raw": 0.04,
            "Semi-processed": 0.13,
            "Processed": 99.83
          },
          {
            "date": "2002",
            "Raw": 18.060000000000002,
            "Semi-processed": 0.8,
            "Processed": 81.13
          },
          {
            "date": "2003",
            "Raw": 0.05,
            "Semi-processed": 0.7100000000000001,
            "Processed": 99.24
          },
          {
            "date": "2004",
            "Raw": 0.01,
            "Semi-processed": 1.37,
            "Processed": 98.61999999999999
          },
          {
            "date": "2005",
            "Raw": null,
            "Semi-processed": 21.89,
            "Processed": 78.11
          },
          {
            "date": "2006",
            "Raw": 0.06999999999999999,
            "Semi-processed": 6.890000000000001,
            "Processed": 93.04
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
        yAxisFormat: (d) => `${d}`,//
        title: 'My Robbin Chart',
        yAxisDomain: [0, 100],
      xAxisDataType: "date_annual",
    },
};

import AreaChart from "../src/components/AreaChart";
import {Meta} from "@storybook/react";
import {MichiVzProvider} from "../src/components/MichiVzProvider";
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
                    "Africa": "red",
                    "Europe": "purple",
                    "Asia": "orange",
                }}
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
            "Africa": "red",
            "Europe": "blue",
            "Asia": "green",
        },
        keys: ["Africa", "Asia", "Europe",],
        "series": [
            {
                "date": 2001,
                "Africa": 100,
                Europe: 130,
                Asia: null,
            },
            {
                "date": 2002,
                "Africa": 400,
                Europe: 230,
                Asia: 100,
            },
            {
                "date": 2003,
                "Africa": 30,
                Europe: 30,
                Asia: 20,
            },
            {
                "date": 2004,
                "Africa": 40,
                Europe: 30,
                Asia: 30,

            },
            {
                "date": 2005,
                "Africa": 50,
                Europe: 30,
                Asia: 40,
            },
            {
                "date": 2006,
                "Africa": 0,
                Europe: 30,
                Asia: 0,
            },
            {
                "date": 2007,
                "Africa": 60,
                Europe: 70,
                Asia: 60,
            },
            {
                "date": 2008,
                "Africa": 30,
                Europe: 30,
                Asia: 30,

            },
            {
                "date": 2009,
                "Africa": null,
                Europe: 30,
                Asia: 0,
            },
            {
                "date": 2010,
                "Africa": 60,
                Europe: 70,
                Asia: 60,
            },
            {
                "date": 2011,
                "Africa": 30,
                Europe: 30,
                Asia: 30,
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
    },
};

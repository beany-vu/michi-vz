import React from 'react';
import LineChartComponent from "../src/components/LineChart";
import {Meta} from "@storybook/react";
import {MichiVzProvider} from "../src/components/MichiVzProvider";

// Define the default metadata for the component
export default {
    title: 'Charts/Line Chart',
    component: LineChartComponent,
    tags: ['autodocs'],
    decorators: [
        (Story) => (
            <MichiVzProvider initialColorsMapping={{
                "Africa": "red",
                "Euro": "purple",
                "Asia": "orange",
            }}
                initialHighlightItems={["Euro"]}>
                <Story/>
            </MichiVzProvider>
        )
    ],
} as Meta;

// Create a default story using the template
export const Primary = {
    args: {
        dataSet: [
            {
                "label": "Africa",
                color: "blue",
                "series": [
                    {
                        "date": 2001,
                        "value": -10,
                        certainty: false,
                    },
                    {
                        "date": 2017,
                        "value": -10,
                        certainty: false,
                    },
                    {
                        "date": 2018,
                        "value": 1.7,
                        certainty: true,
                    },
                    {
                        "date": 2019,
                        "value": -10,
                        certainty: true,
                    },
                    {
                        "date": 2021,
                        "value": 0.7,
                        certainty: false,
                    },
                    {
                        "date": 2022,
                        "value": -10,
                        certainty: true,
                    },
                    {
                        "date": 2023,
                        "value": 7,
                        certainty: true,
                    },
                    {
                        "date": 2025,
                        "value": 7,
                        certainty: false
                    },
                    {
                        "date": 2026,
                        "value": 7,
                        certainty: true
                    },
                    {
                        "date": 2039,
                        "value": -7,
                        certainty: false
                    },
                ]
            },
            {
                "label": "Euro",
                color: "red",
                "series": [
                    {
                        "date": 2010,
                        "value": 3,
                        certainty: false,
                    },
                    {
                        "date": 2011,
                        "value": 3,
                        certainty: true,
                    },

                    {
                        "date": 2018,
                        "value": 3,
                        certainty: false,
                    },
                    {
                        "date": 2019,
                        "value": 3,
                        certainty: true,
                    },
                    {
                        "date": 2021,
                        "value": 3,
                        certainty: false,
                    },
                    {
                        "date": 2022,
                        "value": 3,
                        certainty: true,
                    },
                    {
                        "date": 2023,
                        "value": 3,
                        certainty: true,
                    },

                ]
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
        yAxisFormat: (d) => `${d}%`,// Example: format values as percentages
        title: 'My Line Chart',
        tooltipFormatter: (dataSet, d) => {
            return JSON.stringify(d);
        },
    },
};

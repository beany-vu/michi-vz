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
                "Egypt": "red",
                "Euro": "purple",
                "Asia": "orange",
            }}
                initialHighlightItems={["Egypt"]}>
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
                "label": "Egypt",
                "series": [
                    {
                        "date": "2001",
                        // "date": 2001,
                        "value": "68.45",
                        "certainty": false
                    },
                    {
                        "date": "2002",
                        // "date": 2002,
                        "value": 7,
                        certainty: true,
                    },
                    {
                        "date": "2025",
                        // "date": 2005,
                        "value": 7,
                        certainty: false
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
        xAxisDateType: "date_annual",
        title: 'My Line Chart',
        tooltipFormatter: (dataSet, d) => {
            return JSON.stringify(d);
        },
    },
};

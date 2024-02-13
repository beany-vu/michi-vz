import React from 'react';
import RibbonChart from "../src/components/RibbonChart";
import {MichiVzProvider} from "../src/components/MichiVzProvider";
import {Meta} from '@storybook/react';

// Define the default metadata for the component
export default {
    title: 'Charts/Ribbon Chart',
    component: RibbonChart,
    tags: ['autodocs'],
    decorators: [
        (Story) => (
            <MichiVzProvider
                initialColorsMapping={{
                    dutyFree: "#1F77B4",
                    iTariffPeaks: "#17BECF",
                    nTariffPeaks: "#FF7F0E",
                    nonAdValorem: "#D62728",
                    notDutyFree: "#9467BD",
                    trQuota: "#8C564B",
                }}
                initialHighlightItems={["Africa"]}>
            <Story/>
            </MichiVzProvider>
        )
    ],
} as Meta;

// Create a default story using the template
export const Primary = {
    args: {
        colorsMapping: {
            dutyFree: "#1F77B4",
            iTariffPeaks: "#17BECF",
            nTariffPeaks: "#FF7F0E",
            nonAdValorem: "#D62728",
            notDutyFree: "#9467BD",
            trQuota: "#8C564B",
        },
        keys: ["dutyFree", "iTariffPeaks", "nTariffPeaks", "nonAdValorem", "notDutyFree", "trQuota"],
        "series": [
                {
                    "date": 2020,
                    "dutyFree": 37.830000000000005,
                    "iTariffPeaks": 42.14,
                    "nTariffPeaks": 3.18,
                    "nonAdValorem": 1.02,
                    "notDutyFree": 62.17,
                    "trQuota": 0,

                },
                {
                    "date": 2021,
                    "dutyFree": 37.62,
                    "iTariffPeaks": 42.809999999999995,
                    "nTariffPeaks": 6.92,
                    "nonAdValorem": 6.93,
                    "notDutyFree": 62.38,
                    "trQuota": 0,

                },
                {
                    "date": 2022,
                    "dutyFree": 38.2,
                    "iTariffPeaks": 42.92,
                    "nTariffPeaks": 6.05,
                    "nonAdValorem": 10.16,
                    "notDutyFree": 61.8,
                    "trQuota": 0,

                },
                {
                    "date": 2018,
                    "dutyFree": 37.95,
                    "iTariffPeaks": 41.92,
                    "nTariffPeaks": 0.83,
                    "nonAdValorem": 0.95,
                    "notDutyFree": 62.050000000000004,
                    "trQuota": 0,

                },
                {
                    "date": 2019,
                    "dutyFree": 39.67,
                    "iTariffPeaks": 41.72,
                    "nTariffPeaks": 0.8999999999999999,
                    "nonAdValorem": 0.3,
                    "notDutyFree": 60.33,
                    "trQuota": 0,

                }
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

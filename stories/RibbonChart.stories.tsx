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
                    "Angola": "red",
                    "Cameroon": "blue",
                    "Congo, Democratic Republic of": "orange",
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
            "Angola": "red",
            "Cameroon": "blue",
            "Congo, Democratic Republic of": "green",
        },
        keys: ["Angola", "Cameroon", "Congo, Democratic Republic of"],
        "series": [
            {
                "date": 2001,
                "Angola": 0,
                "Cameroon": 80158,
                "Congo, Democratic Republic of": 0
            },
            {
                "date": 2002,
                "Angola": 0,
                "Cameroon": 94222,
                "Congo, Democratic Republic of": 0
            },
            {
                "date": 2003,
                "Angola": 0,
                "Cameroon": 125793,
                "Congo, Democratic Republic of": 0
            },
            {
                "date": 2004,
                "Angola": 189177,
                "Cameroon": 117840,
                "Congo, Democratic Republic of": 0
            },
            {
                "date": 2005,
                "Angola": 165134,
                "Cameroon": 117576,
                "Congo, Democratic Republic of": 0
            },
            {
                "date": 2006,
                "Angola": 249790,
                "Cameroon": 133130,
                "Congo, Democratic Republic of": 0
            },
            {
                "date": 2007,
                "Angola": 175881,
                "Cameroon": 178204,
                "Congo, Democratic Republic of": 0
            },
            {
                "date": 2008,
                "Angola": 0,
                "Cameroon": 254772,
                "Congo, Democratic Republic of": 0
            },
            {
                "date": 2009,
                "Angola": 506650,
                "Cameroon": 287263,
                "Congo, Democratic Republic of": 0
            },
            {
                "date": 2010,
                "Angola": 249170,
                "Cameroon": 261767,
                "Congo, Democratic Republic of": 0
            },
            {
                "date": 2011,
                "Angola": 379337,
                "Cameroon": 302474,
                "Congo, Democratic Republic of": 0
            },
            {
                "date": 2012,
                "Angola": 615377,
                "Cameroon": 228929,
                "Congo, Democratic Republic of": 0
            },
            {
                "date": 2013,
                "Angola": 506171,
                "Cameroon": 219934,
                "Congo, Democratic Republic of": 0
            },
            {
                "date": 2014,
                "Angola": 600079,
                "Cameroon": 269275,
                "Congo, Democratic Republic of": 0
            },
            {
                "date": 2015,
                "Angola": 330261,
                "Cameroon": 279611,
                "Congo, Democratic Republic of": 249151
            },
            {
                "date": 2016,
                "Angola": 360429,
                "Cameroon": 305050,
                "Congo, Democratic Republic of": 171525
            },
            {
                "date": 2017,
                "Angola": 498322,
                "Cameroon": 231740,
                "Congo, Democratic Republic of": 169311
            },
            {
                "date": 2018,
                "Angola": 408313,
                "Cameroon": 301313,
                "Congo, Democratic Republic of": 142786
            },
            {
                "date": 2019,
                "Angola": 274171,
                "Cameroon": 297302,
                "Congo, Democratic Republic of": 137248
            },
            {
                "date": 2020,
                "Angola": 173969,
                "Cameroon": 317259,
                "Congo, Democratic Republic of": 126883
            },
            {
                "date": 2021,
                "Angola": 161692,
                "Cameroon": 350653,
                "Congo, Democratic Republic of": 204285
            },
            {
                "date": 2022,
                "Angola": 224453,
                "Cameroon": 0,
                "Congo, Democratic Republic of": 316332
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

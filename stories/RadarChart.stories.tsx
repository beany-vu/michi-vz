import React from 'react';
import {Story, Meta} from '@storybook/react';
import {RadarChart, RadarChartProps} from "src/components/RadarChart";
import {MichiVzProvider} from "../src/components/MichiVzProvider";

const mockData2 = [
    {
        "label": "China",
        "color": "#1F77B4",
        "data": [
            {
                "partner": "156",
                "value": "120",
                "date": "Jan"
            },
            {
                "partner": "156",
                "value": "84",
                "date": "Feb"
            },
            {
                "partner": "156",
                "value": "86",
                "date": "Mar"
            },
            {
                "partner": "156",
                "value": "66",
                "date": "Apr"
            },
            {
                "partner": "156",
                "value": "170",
                "date": "May"
            },
            {
                "partner": "156",
                "value": "80",
                "date": "Jun"
            },
            {
                "partner": "156",
                "value": "132",
                "date": "Jul"
            },
            {
                "partner": "156",
                "value": "85",
                "date": "Aug"
            },
            {
                "partner": "156",
                "value": "102",
                "date": "Sep"
            },
            {
                "partner": "156",
                "value": "113",
                "date": "Oct"
            },
            {
                "partner": "156",
                "value": "105",
                "date": "Nov"
            },
            {
                "partner": "156",
                "value": "86",
                "date": "Dec"
            }
        ],
        "partner": "156"
    },
    {
        "label": "UAE",
        "color": "#D62728",
        "data": [
            {
                "partner": "784",
                "value": "235",
                "date": "Jan"
            },
            {
                "partner": "784",
                "value": "245",
                "date": "Feb"
            },
            {
                "partner": "784",
                "value": "284",
                "date": "Mar"
            },
            {
                "partner": "784",
                "value": "259",
                "date": "Apr"
            },
            {
                "partner": "784",
                "value": "484",
                "date": "May"
            },
            {
                "partner": "784",
                "value": "221",
                "date": "Jun"
            },
            {
                "partner": "784",
                "value": "285",
                "date": "Jul"
            },
            {
                "partner": "784",
                "value": "332",
                "date": "Aug"
            },
            {
                "partner": "784",
                "value": "217",
                "date": "Sep"
            },
            {
                "partner": "784",
                "value": "276",
                "date": "Oct"
            },
            {
                "partner": "784",
                "value": "278",
                "date": "Nov"
            },
            {
                "partner": "784",
                "value": "250",
                "date": "Dec"
            }
        ],
        "partner": "784"
    },
    {
        "label": "France",
        "color": "#17BECF",
        "data": [
            {
                "partner": "251",
                "value": "947",
                "date": "Jan"
            },
            {
                "partner": "251",
                "value": "793",
                "date": "Feb"
            },
            {
                "partner": "251",
                "value": "738",
                "date": "Mar"
            },
            {
                "partner": "251",
                "value": "1066",
                "date": "Apr"
            },
            {
                "partner": "251",
                "value": "2317",
                "date": "May"
            },
            {
                "partner": "251",
                "value": "1947",
                "date": "Jun"
            },
            {
                "partner": "251",
                "value": "2117",
                "date": "Jul"
            },
            {
                "partner": "251",
                "value": "1343",
                "date": "Aug"
            },
            {
                "partner": "251",
                "value": "808",
                "date": "Sep"
            },
            {
                "partner": "251",
                "value": "1093",
                "date": "Oct"
            },
            {
                "partner": "251",
                "value": "920",
                "date": "Nov"
            },
            {
                "partner": "251",
                "value": "630",
                "date": "Dec"
            }
        ],
        "partner": "251"
    }
]


export default {
    title: 'Charts/Radar Chart',
    components: RadarChart,
    tags: ['autodocs'],
    decorators: [
        (Story) => (
            <MichiVzProvider initialColorsMapping={{
                "China": "purple",
                "USA": "blue",
                "Germany": "green",
                "France": "#17BECF",
                "UAE": "#D62728",
            }}
                             initialDisabledItems={["China"]}
                             initialHighlightItems={["France"]}>
                <Story/>
            </MichiVzProvider>
        )
    ],
} as Meta;

const Template: Story<RadarChartProps> = (args) => <RadarChart {...args} />;

export const Primary = Template.bind({});
Primary.args = {
    width: 400,
    height: 400,
    seriesData: mockData2,
    poles: {
        range: [0, Math.PI * 3],
        domain: [360, 0],
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    },
    conf: {
        padding: 30,
        tooltipContent: ({item}) => (
            <>
                {JSON.stringify(item)}
            </>),
        radialScale: {
            range: [0, Math.PI * 3],
            domain: [360, 0],
        },

        gridAngle: {
            style: {
                stroke: '#c1c1c1',
                strokeWidth: 1,
            },
            numTicks: 12,
        },
        gridRadial: {
            style: {
                stroke: '#c1c1c1',
                strokeWidth: 0,
                numTicks: 5,
                fill: 'transparent',
                fillOpacity: 0,
                strokeDasharray: '2,2',
            },
            label: {
                style: {
                    color: '#ccc',
                    fontWeight: 'bold',
                },
            },
        },
        axes: {
            topVertical: {
                style: {
                    fontSize: 12,
                    dx: 15,
                    dy: 3,
                    textAnchor: 'end',
                    stroke: 'red',
                    strokeWidth: 0.5,
                },
                formatter: (value) => value,
            },
        },
        seriesData: [
            // line:
        ],
    },
};

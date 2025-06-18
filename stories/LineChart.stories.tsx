import React from "react";
import LineChartComponent from "../src/components/LineChart";
import { Meta } from "@storybook/react";
import { fn } from "@storybook/test";

// Define the default metadata for the component
export default {
  title: "Charts/Line Chart",
  component: LineChartComponent,
  tags: ["autodocs"],
  decorators: [
    Story => {
      return <Story />;
    },
  ],
  argTypes: {
    // Add specific controls for our interactive examples
    filterLimit: {
      control: { type: "range", min: 1, max: 20, step: 1 },
      description: "Number of items to show when filtering",
    },
  },
} as Meta;

// Sample data sets for reuse in stories
const singleSeriesData = [
  {
    label: "Country 1",
    color: "red",
    series: [
      {
        date: "2002",
        value: 24.14,
        certainty: false,
      },
      {
        date: "2003",
        value: 20.68,
        certainty: true,
      },
      {
        date: "2004",
        value: 29.34,
        certainty: true,
      },
      {
        date: "2006",
        value: 33.6,
        certainty: false,
      },
      {
        date: "2007",
        value: 33.6,
        certainty: true,
      },
    ],
  },
];

const multiSeriesData = [
  {
    label: "Item 1",
    shape: "triangle",
    curve: "curveLinear",
    series: [
      { year: 2016, date: "2016", value: 101, certainty: true },
      { year: 2017, date: "2017", value: 201, certainty: true },
      { year: 2018, date: "2018", value: 151, certainty: false },
    ],
  },
  {
    label: "Item 2",
    shape: "triangle",
    curve: "curveLinear",
    series: [
      { year: 2016, date: "2016", value: 102, certainty: true },
      { year: 2017, date: "2017", value: 22, certainty: true },
      { year: 2018, date: "2018", value: 152, certainty: false },
    ],
  },
  {
    label: "Item 3",
    shape: "triangle",
    curve: "curveBumpX",
    series: [
      { year: 2016, date: "2016", value: 103, certainty: true },
      { year: 2017, date: "2017", value: 3, certainty: true },
      { year: 2018, date: "2018", value: 153, certainty: false },
    ],
  },
];

// Enhanced dataset with more varied and realistic patterns
const diverseDataSet = [
  {
    label: "Rising Trend",
    shape: "circle",
    curve: "curveLinear",
    color: "red",
    series: [
      { year: 2016, date: "2016", value: 32, certainty: true },
      { year: 2017, date: "2017", value: 45, certainty: true },
      { year: 2018, date: "2018", value: 78, certainty: true },
      { year: 2019, date: "2019", value: 105, certainty: true },
      { year: 2020, date: "2020", value: 127, certainty: true },
      { year: 2021, date: "2021", value: 158, certainty: false },
      { year: 2022, date: "2022", value: 190, certainty: false },
    ],
  },
  {
    label: "Declining Trend",
    shape: "square",
    curve: "curveLinear",
    color: "blue",
    series: [
      { year: 2016, date: "2016", value: 230, certainty: true },
      { year: 2017, date: "2017", value: 192, certainty: true },
      { year: 2018, date: "2018", value: 145, certainty: true },
      { year: 2019, date: "2019", value: 118, certainty: true },
      { year: 2020, date: "2020", value: 87, certainty: true },
      { year: 2021, date: "2021", value: 54, certainty: false },
      { year: 2022, date: "2022", value: 28, certainty: false },
    ],
  },
  {
    label: "Volatile Pattern",
    shape: "triangle",
    curve: "curveBumpX",
    color: "orange",
    series: [
      { year: 2016, date: "2016", value: 65, certainty: true },
      { year: 2017, date: "2017", value: 120, certainty: true },
      { year: 2018, date: "2018", value: 43, certainty: true },
      { year: 2019, date: "2019", value: 97, certainty: true },
      { year: 2020, date: "2020", value: 35, certainty: true },
      { year: 2021, date: "2021", value: 82, certainty: false },
      { year: 2022, date: "2022", value: 18, certainty: false },
    ],
  },
  {
    label: "High Plateau (Colored Points)",
    shape: "circle",
    curve: "curveLinear",
    color: "yellow",
    series: [
      { year: 2016, date: "2016", value: 45, certainty: true },
      { year: 2017, date: "2017", value: 175, certainty: true },
      { year: 2018, date: "2018", value: 178, certainty: true },
      { year: 2019, date: "2019", value: 172, certainty: true },
      { year: 2020, date: "2020", value: 180, certainty: true },
      { year: 2021, date: "2021", value: 169, certainty: false },
      { year: 2022, date: "2022", value: 53, certainty: false },
    ],
  },
  {
    label: "Sudden Spike",
    shape: "square",
    curve: "curveLinear",
    color: "green",
    series: [
      { year: 2016, date: "2016", value: 42, certainty: true },
      { year: 2017, date: "2017", value: 38, certainty: true },
      { year: 2018, date: "2018", value: 45, certainty: true },
      { year: 2019, date: "2019", value: 215, certainty: true },
      { year: 2020, date: "2020", value: 52, certainty: true },
      { year: 2021, date: "2021", value: 48, certainty: false },
      { year: 2022, date: "2022", value: 41, certainty: false },
    ],
  },
  {
    label: "Steady Low",
    shape: "circle",
    curve: "curveLinear",
    color: "purple",
    series: [
      { year: 2016, date: "2016", value: 12, certainty: true },
      { year: 2017, date: "2017", value: 10, certainty: true },
      { year: 2018, date: "2018", value: 15, certainty: true },
      { year: 2019, date: "2019", value: 18, certainty: true },
      { year: 2020, date: "2020", value: 13, certainty: true },
      { year: 2021, date: "2021", value: 11, certainty: false },
      { year: 2022, date: "2022", value: 14, certainty: false },
    ],
  },
  {
    label: "U-Shaped Recovery",
    shape: "triangle",
    curve: "curveBumpX",
    color: "blue",
    series: [
      { year: 2016, date: "2016", value: 142, certainty: true },
      { year: 2017, date: "2017", value: 98, certainty: true },
      { year: 2018, date: "2018", value: 56, certainty: true },
      { year: 2019, date: "2019", value: 32, certainty: true },
      { year: 2020, date: "2020", value: 68, certainty: true },
      { year: 2021, date: "2021", value: 115, certainty: false },
      { year: 2022, date: "2022", value: 167, certainty: false },
    ],
  },
  {
    label: "Bell Curve",
    shape: "circle",
    curve: "curveLinear",
    color: "pink",
    series: [
      { year: 2016, date: "2016", value: 25, certainty: true },
      { year: 2017, date: "2017", value: 68, certainty: true },
      { year: 2018, date: "2018", value: 135, certainty: true },
      { year: 2019, date: "2019", value: 172, certainty: true },
      { year: 2020, date: "2020", value: 124, certainty: true },
      { year: 2021, date: "2021", value: 73, certainty: false },
      { year: 2022, date: "2022", value: 28, certainty: false },
    ],
  },
  {
    label: "Cyclical Pattern (Heat Map)",
    shape: "square",
    curve: "curveBumpX",
    color: "navy",
    series: [
      { year: 2016, date: "2016", value: 85, certainty: true }, // Light yellow
      { year: 2017, date: "2017", value: 152, certainty: true }, // Orange
      { year: 2018, date: "2018", value: 73, certainty: true }, // Yellow
      { year: 2019, date: "2019", value: 138, certainty: true }, // Deep orange
      { year: 2020, date: "2020", value: 62, certainty: true }, // Light amber
      { year: 2021, date: "2021", value: 125, certainty: false }, // Light orange
      { year: 2022, date: "2022", value: 57, certainty: false }, // Light yellow
    ],
  },
  {
    label: "Slight Incline",
    shape: "circle",
    curve: "curveLinear",
    series: [
      { year: 2016, date: "2016", value: 62, certainty: true },
      { year: 2017, date: "2017", value: 65, certainty: true },
      { year: 2018, date: "2018", value: 70, certainty: true },
      { year: 2019, date: "2019", value: 72, certainty: true },
      { year: 2020, date: "2020", value: 78, certainty: true },
      { year: 2021, date: "2021", value: 83, certainty: false },
      { year: 2022, date: "2022", value: 90, certainty: false },
    ],
  },
  {
    label: "Double Peak",
    shape: "triangle",
    curve: "curveBumpX",
    series: [
      { year: 2016, date: "2016", value: 45, certainty: true },
      { year: 2017, date: "2017", value: 132, certainty: true },
      { year: 2018, date: "2018", value: 68, certainty: true },
      { year: 2019, date: "2019", value: 72, certainty: true },
      { year: 2020, date: "2020", value: 143, certainty: true },
      { year: 2021, date: "2021", value: 58, certainty: false },
      { year: 2022, date: "2022", value: 47, certainty: false },
    ],
  },
  {
    label: "Extreme Growth",
    shape: "circle",
    curve: "curveLinear",
    series: [
      { year: 2016, date: "2016", value: 12, certainty: true },
      { year: 2017, date: "2017", value: 27, certainty: true },
      { year: 2018, date: "2018", value: 42, certainty: true },
      { year: 2019, date: "2019", value: 85, certainty: true },
      { year: 2020, date: "2020", value: 163, certainty: true },
      { year: 2021, date: "2021", value: 245, certainty: false },
      { year: 2022, date: "2022", value: 322, certainty: false },
    ],
  },
  {
    label: "Outlier Year",
    shape: "square",
    curve: "curveBumpX",
    series: [
      { year: 2016, date: "2016", value: 58, certainty: true },
      { year: 2017, date: "2017", value: 62, certainty: true },
      { year: 2018, date: "2018", value: 247, certainty: true },
      { year: 2019, date: "2019", value: 65, certainty: true },
      { year: 2020, date: "2020", value: 73, certainty: true },
      { year: 2021, date: "2021", value: 81, certainty: false },
      { year: 2022, date: "2022", value: 79, certainty: false },
    ],
  },
  {
    label: "Gradual Decline",
    shape: "circle",
    curve: "curveLinear",
    series: [
      { year: 2016, date: "2016", value: 112, certainty: true },
      { year: 2017, date: "2017", value: 104, certainty: true },
      { year: 2018, date: "2018", value: 95, certainty: true },
      { year: 2019, date: "2019", value: 87, certainty: true },
      { year: 2020, date: "2020", value: 82, certainty: true },
      { year: 2021, date: "2021", value: 78, certainty: false },
      { year: 2022, date: "2022", value: 72, certainty: false },
    ],
  },
  {
    label: "Steady High",
    shape: "triangle",
    curve: "curveLinear",
    series: [
      { year: 2016, date: "2016", value: 168, certainty: true },
      { year: 2017, date: "2017", value: 172, certainty: true },
      { year: 2018, date: "2018", value: 165, certainty: true },
      { year: 2019, date: "2019", value: 174, certainty: true },
      { year: 2020, date: "2020", value: 180, certainty: true },
      { year: 2021, date: "2021", value: 173, certainty: false },
      { year: 2022, date: "2022", value: 175, certainty: false },
    ],
  },
  {
    label: "Flat Then Rise",
    shape: "circle",
    curve: "curveLinear",
    series: [
      { year: 2016, date: "2016", value: 45, certainty: true },
      { year: 2017, date: "2017", value: 47, certainty: true },
      { year: 2018, date: "2018", value: 44, certainty: true },
      { year: 2019, date: "2019", value: 48, certainty: true },
      { year: 2020, date: "2020", value: 92, certainty: true },
      { year: 2021, date: "2021", value: 145, certainty: false },
      { year: 2022, date: "2022", value: 196, certainty: false },
    ],
  },
  {
    label: "Choppy Waters",
    shape: "square",
    curve: "curveBumpX",
    series: [
      { year: 2016, date: "2016", value: 82, certainty: true },
      { year: 2017, date: "2017", value: 95, certainty: true },
      { year: 2018, date: "2018", value: 73, certainty: true },
      { year: 2019, date: "2019", value: 105, certainty: true },
      { year: 2020, date: "2020", value: 87, certainty: true },
      { year: 2021, date: "2021", value: 120, certainty: false },
      { year: 2022, date: "2022", value: 93, certainty: false },
    ],
  },
  {
    label: "Erratic Pattern",
    shape: "triangle",
    curve: "curveBumpX",
    series: [
      { year: 2016, date: "2016", value: 118, certainty: true },
      { year: 2017, date: "2017", value: 58, certainty: true },
      { year: 2018, date: "2018", value: 187, certainty: true },
      { year: 2019, date: "2019", value: 32, certainty: true },
      { year: 2020, date: "2020", value: 140, certainty: true },
      { year: 2021, date: "2021", value: 63, certainty: false },
      { year: 2022, date: "2022", value: 155, certainty: false },
    ],
  },
  {
    label: "Consistent Growth",
    shape: "circle",
    curve: "curveLinear",
    series: [
      { year: 2016, date: "2016", value: 35, certainty: true },
      { year: 2017, date: "2017", value: 70, certainty: true },
      { year: 2018, date: "2018", value: 105, certainty: true },
      { year: 2019, date: "2019", value: 140, certainty: true },
      { year: 2020, date: "2020", value: 175, certainty: true },
      { year: 2021, date: "2021", value: 210, certainty: false },
      { year: 2022, date: "2022", value: 245, certainty: false },
    ],
  },
  {
    label: "Rapid Fall",
    shape: "square",
    curve: "curveLinear",
    series: [
      { year: 2016, date: "2016", value: 188, certainty: true },
      { year: 2017, date: "2017", value: 130, certainty: true },
      { year: 2018, date: "2018", value: 85, certainty: true },
      { year: 2019, date: "2019", value: 42, certainty: true },
      { year: 2020, date: "2020", value: 20, certainty: true },
      { year: 2021, date: "2021", value: 15, certainty: false },
      { year: 2022, date: "2022", value: 12, certainty: false },
    ],
  },
];

const largeDataSet = [
  {
    label: "Item 1",
    shape: "circle",
    curve: "curveLinear",
    series: [
      { year: 2016, date: "2016", value: 101, certainty: true },
      { year: 2017, date: "2017", value: 201, certainty: true },
      { year: 2018, date: "2018", value: 151, certainty: false },
    ],
  },
  {
    label: "Item 2",
    shape: "circle",
    curve: "curveLinear",
    series: [
      { year: 2016, date: "2016", value: 102, certainty: true },
      { year: 2017, date: "2017", value: 22, certainty: true },
      { year: 2018, date: "2018", value: 152, certainty: false },
    ],
  },
  {
    label: "Item 3",
    shape: "circle",
    curve: "curveLinear",
    series: [
      { year: 2016, date: "2016", value: 103, certainty: true },
      { year: 2017, date: "2017", value: 3, certainty: true },
      { year: 2018, date: "2018", value: 153, certainty: false },
    ],
  },
  {
    label: "Item 4",
    shape: "circle",
    curve: "curveLinear",
    series: [
      { year: 2016, date: "2016", value: 104, certainty: true },
      { year: 2017, date: "2017", value: 204, certainty: true },
      { year: 2018, date: "2018", value: 154, certainty: false },
    ],
  },
  {
    label: "Item 5",
    shape: "circle",
    curve: "curveLinear",
    series: [
      { year: 2016, date: "2016", value: 105, certainty: true },
      { year: 2017, date: "2017", value: 205, certainty: true },
      { year: 2018, date: "2018", value: 155, certainty: false },
    ],
  },
  {
    label: "Item 6",
    shape: "circle",
    curve: "curveLinear",
    series: [
      { year: 2016, date: "2016", value: 106, certainty: true },
      { year: 2017, date: "2017", value: 206, certainty: true },
      { year: 2018, date: "2018", value: 156, certainty: false },
    ],
  },
  {
    label: "Item 7",
    shape: "circle",
    curve: "curveLinear",
    series: [
      { year: 2016, date: "2016", value: 107, certainty: true },
      { year: 2017, date: "2017", value: 27, certainty: true },
      { year: 2018, date: "2018", value: 157, certainty: false },
    ],
  },
  {
    label: "Item 8",
    shape: "circle",
    curve: "curveLinear",
    series: [
      { year: 2016, date: "2016", value: 108, certainty: true },
      { year: 2017, date: "2017", value: 208, certainty: true },
      { year: 2018, date: "2018", value: 58, certainty: false },
    ],
  },
  {
    label: "Item 9",
    shape: "circle",
    curve: "curveLinear",
    series: [
      { year: 2016, date: "2016", value: 109, certainty: true },
      { year: 2017, date: "2017", value: 209, certainty: true },
      { year: 2018, date: "2018", value: 159, certainty: false },
    ],
  },
  {
    label: "Item 10",
    shape: "circle",
    curve: "curveLinear",
    series: [
      { year: 2016, date: "2016", value: 110, certainty: true },
      { year: 2017, date: "2017", value: 210, certainty: true },
      { year: 2018, date: "2018", value: 160, certainty: false },
    ],
  },
  {
    label: "Item 11",
    shape: "circle",
    curve: "curveLinear",
    series: [
      { year: 2016, date: "2016", value: 111, certainty: true },
      { year: 2017, date: "2017", value: 211, certainty: true },
      { year: 2018, date: "2018", value: 161, certainty: false },
    ],
  },
  {
    label: "Item 12",
    shape: "circle",
    curve: "curveLinear",
    series: [
      { year: 2016, date: "2016", value: 112, certainty: true },
      { year: 2017, date: "2017", value: 212, certainty: true },
      { year: 2018, date: "2018", value: 162, certainty: false },
    ],
  },
  {
    label: "Item 13",
    shape: "circle",
    curve: "curveLinear",
    series: [
      { year: 2016, date: "2016", value: 113, certainty: true },
      { year: 2017, date: "2017", value: 213, certainty: true },
      { year: 2018, date: "2018", value: 163, certainty: false },
    ],
  },
  {
    label: "Item 14",
    shape: "circle",
    curve: "curveLinear",
    series: [
      { year: 2016, date: "2016", value: 114, certainty: true },
      { year: 2017, date: "2017", value: 214, certainty: true },
      { year: 2018, date: "2018", value: 164, certainty: false },
    ],
  },
  {
    label: "Item 15",
    shape: "circle",
    curve: "curveLinear",
    series: [
      { year: 2016, date: "2016", value: 115, certainty: true },
      { year: 2017, date: "2017", value: 215, certainty: true },
      { year: 2018, date: "2018", value: 165, certainty: false },
    ],
  },
  {
    label: "Item 16",
    shape: "circle",
    curve: "curveLinear",
    series: [
      { year: 2016, date: "2016", value: 116, certainty: true },
      { year: 2017, date: "2017", value: 216, certainty: true },
      { year: 2018, date: "2018", value: 166, certainty: false },
    ],
  },
  {
    label: "Item 17",
    shape: "circle",
    curve: "curveLinear",
    series: [
      { year: 2016, date: "2016", value: 117, certainty: true },
      { year: 2017, date: "2017", value: 217, certainty: true },
      { year: 2018, date: "2018", value: 167, certainty: false },
    ],
  },
  {
    label: "Item 18",
    shape: "circle",
    curve: "curveLinear",
    series: [
      { year: 2016, date: "2016", value: 118, certainty: true },
      { year: 2017, date: "2017", value: 218, certainty: true },
      { year: 2018, date: "2018", value: 68, certainty: false },
    ],
  },
  {
    label: "Item 19",
    shape: "circle",
    curve: "curveLinear",
    series: [
      { year: 2016, date: "2016", value: 119, certainty: true },
      { year: 2017, date: "2017", value: 219, certainty: true },
      { year: 2018, date: "2018", value: 19, certainty: false },
    ],
  },
  {
    label: "Item 20",
    shape: "circle",
    curve: "curveLinear",
    series: [
      { year: 2016, date: "2016", value: 20, certainty: true },
      { year: 2017, date: "2017", value: 220, certainty: true },
      { year: 2018, date: "2018", value: 170, certainty: false },
    ],
  },
];

// Add a new dataset with colors for individual data points
const colorPerPointDataSet = [
  {
    label: "Temperature Variations",
    shape: "circle",
    curve: "curveLinear",
    series: [
      { date: "2016", value: 35, certainty: true, color: "#2196F3" }, // Cool
      { date: "2017", value: 65, certainty: true, color: "#4CAF50" }, // Moderate
      { date: "2018", value: 85, certainty: true, color: "#FF9800" }, // Warm
      { date: "2019", value: 95, certainty: true, color: "#F44336" }, // Hot
      { date: "2020", value: 75, certainty: true, color: "#FF9800" }, // Warm
      { date: "2021", value: 55, certainty: false, color: "#4CAF50" }, // Moderate
      { date: "2022", value: 30, certainty: false, color: "#2196F3" }, // Cool
    ],
  },
  {
    label: "Performance Metrics",
    shape: "square",
    curve: "curveLinear",
    series: [
      { date: "2016", value: 42, certainty: true, color: "#F44336" }, // Poor
      { date: "2017", value: 58, certainty: true, color: "#FF9800" }, // Below Average
      { date: "2018", value: 67, certainty: true, color: "#FFEB3B" }, // Average
      { date: "2019", value: 82, certainty: true, color: "#4CAF50" }, // Good
      { date: "2020", value: 94, certainty: true, color: "#2196F3" }, // Excellent
      { date: "2021", value: 88, certainty: false, color: "#4CAF50" }, // Good
      { date: "2022", value: 75, certainty: false, color: "#FFEB3B" }, // Average
    ],
  },
  {
    label: "Risk Assessment",
    shape: "triangle",
    curve: "curveBumpX",
    series: [
      { date: "2016", value: 120, certainty: true, color: "#F44336" }, // High Risk
      { date: "2017", value: 95, certainty: true, color: "#FF9800" }, // Medium Risk
      { date: "2018", value: 65, certainty: true, color: "#4CAF50" }, // Low Risk
      { date: "2019", value: 85, certainty: true, color: "#FF9800" }, // Medium Risk
      { date: "2020", value: 110, certainty: true, color: "#F44336" }, // High Risk
      { date: "2021", value: 75, certainty: false, color: "#FF9800" }, // Medium Risk
      { date: "2022", value: 55, certainty: false, color: "#4CAF50" }, // Low Risk
    ],
  },
];

// Common props for all charts
const commonProps = {
  width: 900,
  height: 400,
  margin: {
    top: 50,
    right: 50,
    bottom: 50,
    left: 50,
  },
  onChartDataProcessed: fn(),
  onHighlightItem: fn(),
  onColorMappingGenerated: fn(),
  yAxisFormat: d => `${d}%`,
  xAxisDataType: "date_annual",
  tooltipFormatter: (d, series, dataSet) => {
    return `
      <div style="background: #fff; padding: 8px; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
        <div style="font-weight: bold; margin-bottom: 4px;">${d.label}</div>
        <div>Date: ${d.date}</div>
        <div>Value: ${d.value}%</div>
      </div>
    `;
  },
};

// Create a default story using the template
export const Primary = {
  args: {
    ...commonProps,
    dataSet: [
      {
        label: "Africa",
        shape: "circle",
        color: "#4287f5",
        series: [
          {
            year: 2015,
            date: "2015",
            value: -63.85,
            certainty: false,
            code: "1001",
          },
          {
            year: 2016,
            date: "2016",
            value: -64.01,
            certainty: true,
            code: "1001",
          },
          {
            year: 2017,
            date: "2017",
            value: -63.84,
            certainty: true,
            code: "1001",
          },
          {
            year: 2018,
            date: "2018",
            value: -89.53,
            certainty: true,
            code: "1001",
          },
          {
            year: 2019,
            date: "2019",
            value: -53.03,
            certainty: true,
            code: "1001",
          },
          {
            year: 2020,
            date: "2020",
            value: -84.09,
            certainty: true,
            code: "1001",
          },
          {
            year: 2021,
            date: "2021",
            value: -43.87,
            certainty: true,
            code: "1001",
          },
        ],
      },
      {
        label: "Rest of the World",
        shape: "square",
        color: "#42f554",
        series: [
          {
            year: 2015,
            date: "2015",
            value: -86.95,
            certainty: false,
            code: "1002",
          },
          {
            year: 2016,
            date: "2016",
            value: -75.09,
            certainty: true,
            code: "1002",
          },
          {
            year: 2017,
            date: "2017",
            value: -69.48,
            certainty: true,
            code: "1002",
          },
          {
            year: 2018,
            date: "2018",
            value: -64.23,
            certainty: true,
            code: "1002",
          },
          {
            year: 2019,
            date: "2019",
            value: -62.17,
            certainty: true,
            code: "1002",
          },
          {
            year: 2020,
            date: "2020",
            value: -86.63,
            certainty: true,
            code: "1002",
          },
          {
            year: 2021,
            date: "2021",
            value: -88.95,
            certainty: true,
            code: "1002",
          },
        ],
      },
    ],
    filter: null,
  },
};

// Example with no filter applied
export const NoFilter = {
  args: {
    ...commonProps,
    dataSet: singleSeriesData,
    title: "Line Chart with No Filter",
    filter: null,
  },
};

// Multiple series example with filter
export const MultiSeries = {
  args: {
    ...commonProps,
    dataSet: multiSeriesData,
    title: "Multi-Series Line Chart",
    filter: { limit: 2, date: "2017", criteria: "value", sortingDir: "desc" },
  },
};

// Multiple series example with no filter
export const MultiSeriesNoFilter = {
  args: {
    ...commonProps,
    dataSet: multiSeriesData,
    title: "Multi-Series Line Chart (No Filter)",
    filter: null,
  },
};

// Larger dataset with ascending filter
export const LargeDataSetAscending = {
  args: {
    ...commonProps,
    dataSet: largeDataSet,
    title: "Large Dataset (Ascending Filter)",
    filter: { limit: 5, date: "2017", criteria: "value", sortingDir: "asc" },
  },
};

// Larger dataset with descending filter
export const LargeDataSetDescending = {
  args: {
    ...commonProps,
    dataSet: largeDataSet,
    title: "Large Dataset (Descending Filter)",
    filter: { limit: 5, date: "2017", criteria: "value", sortingDir: "desc" },
  },
};

// Larger dataset with filter at different date point
export const FilterByDifferentDate = {
  args: {
    ...commonProps,
    dataSet: largeDataSet,
    title: "Filter by 2018 Data",
    filter: { limit: 5, date: "2018", criteria: "value", sortingDir: "desc" },
  },
};

// Example showing combined view
export const CombinedView = {
  args: {
    ...commonProps,
    dataSet: multiSeriesData,
    title: "Combined View with Hover Effects",
    filter: null,
    showCombined: true,
  },
};

// Different shapes and curves example
export const DifferentShapesAndCurves = {
  args: {
    ...commonProps,
    dataSet: [
      {
        label: "Circle Series",
        shape: "circle",
        curve: "curveLinear",
        color: "#4287f5",
        series: [
          { date: "2016", value: 100, certainty: true },
          { date: "2017", value: 150, certainty: true },
          { date: "2018", value: 120, certainty: true },
          { date: "2019", value: 180, certainty: true },
          { date: "2020", value: 140, certainty: true },
        ],
      },
      {
        label: "Square Series",
        shape: "square",
        curve: "curveBumpX",
        color: "#f54242",
        series: [
          { date: "2016", value: 80, certainty: true },
          { date: "2017", value: 130, certainty: true },
          { date: "2018", value: 200, certainty: true },
          { date: "2019", value: 160, certainty: true },
          { date: "2020", value: 120, certainty: true },
        ],
      },
      {
        label: "Triangle Series",
        shape: "triangle",
        curve: "curveLinear",
        color: "#42f554",
        series: [
          { date: "2016", value: 60, certainty: true },
          { date: "2017", value: 110, certainty: true },
          { date: "2018", value: 80, certainty: true },
          { date: "2019", value: 140, certainty: true },
          { date: "2020", value: 100, certainty: true },
        ],
      },
    ],
    title: "Different Shapes and Curves",
    filter: null,
  },
  parameters: {
    docs: {
      description: {
        story:
          "This example shows different marker shapes (circle, square, triangle) with different curve types (linear and bumpX).",
      },
    },
  },
};

// Monthly data example
export const MonthlyData = {
  args: {
    ...commonProps,
    dataSet: [
      {
        label: "Monthly Trends",
        color: "blue",
        series: [
          { date: "2022-01", value: 45.2, certainty: true },
          { date: "2022-02", value: 48.6, certainty: true },
          { date: "2022-03", value: 52.1, certainty: true },
          { date: "2022-04", value: 55.8, certainty: true },
          { date: "2022-05", value: 60.3, certainty: true },
          { date: "2022-06", value: 63.7, certainty: true },
          { date: "2022-07", value: 61.2, certainty: false },
          { date: "2022-08", value: 58.4, certainty: false },
          { date: "2022-09", value: 53.9, certainty: false },
          { date: "2022-10", value: 49.7, certainty: false },
          { date: "2022-11", value: 46.5, certainty: false },
          { date: "2022-12", value: 43.8, certainty: false },
        ],
      },
    ],
    title: "Monthly Data Example",
    xAxisDataType: "date_monthly",
    filter: null,
  },
};

// Add a new story demonstrating color per data point
export const ColorPerDataPoint = {
  args: {
    ...commonProps,
    dataSet: colorPerPointDataSet,
    title: "Color Per Data Point",
    filter: null,
  },
  parameters: {
    docs: {
      description: {
        story:
          "This example demonstrates setting individual colors for each data point in a series. The colors can represent categories or thresholds (like temperature ranges, performance levels, or risk assessments).",
      },
    },
  },
};

// Update the InteractiveFilterLimit example to use the enhanced colorPerPointDataSet
export const InteractiveFilterLimit = {
  args: {
    ...commonProps,
    dataSet: [...diverseDataSet.slice(0, 17), ...colorPerPointDataSet],
    title: "Interactive Filter Limit with Diverse Data Patterns",
    filterLimit: 5, // Initial value for the slider
  },
  // Use render function to dynamically create the component with the slider value
  render: args => {
    const { filterLimit, ...rest } = args;
    return (
      <LineChartComponent
        key={`chart-${filterLimit}`} // Add a key that changes with filterLimit to force full re-render
        {...rest}
        filter={{
          limit: filterLimit,
          date: "2017",
          criteria: "value",
          sortingDir: "desc",
        }}
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "This example uses a dataset with diverse patterns (rising trends, declining trends, cyclical patterns, sudden spikes, plateaus, etc.) to better illustrate how the filter limit affects which data series are displayed. Some series include per-point coloring. Try adjusting the slider to see different patterns emerge.",
      },
    },
  },
};

// Update the description for the PointColorExample
export const PointColorExample = {
  args: {
    ...commonProps,
    dataSet: colorPerPointDataSet,
    title: "Data Points with Individual Colors",
    filter: null,
  },
  parameters: {
    docs: {
      description: {
        story:
          "This example shows how to assign individual colors to data points within a series. This is useful for visualizing categorical data or status changes where color represents meaning, such as temperature ranges, performance levels, or risk assessments.",
      },
    },
  },
};

// Story with many X-axis ticks
export const ManyTicks = {
  args: {
    ...commonProps,
    dataSet: diverseDataSet,
    title: "Chart with Many X-Axis Ticks (Annual Data)",
    xAxisDataType: "date_annual", // Ensure correct data type
    ticks: 30, // Set a high number of ticks
    filter: null,
  },
  parameters: {
    docs: {
      description: {
        story:
          "This example demonstrates how the chart renders when a high number of ticks is requested for the x-axis. This can be useful for testing label overlap and tick density.",
      },
    },
  },
};

// Add a new story for triangle shapes
export const TriangleShapes = {
  args: {
    ...commonProps,
    dataSet: [
      {
        label: "Triangle Series 1",
        shape: "triangle",
        curve: "curveLinear",
        color: "#FF5733",
        series: [
          { date: "2016", value: 50, certainty: true },
          { date: "2017", value: 75, certainty: true },
          { date: "2018", value: 60, certainty: true },
          { date: "2019", value: 85, certainty: true },
          { date: "2020", value: 70, certainty: true },
        ],
      },
      {
        label: "Triangle Series 2",
        shape: "triangle",
        curve: "curveBumpX",
        color: "#33FF57",
        series: [
          { date: "2016", value: 30, certainty: true },
          { date: "2017", value: 45, certainty: true },
          { date: "2018", value: 35, certainty: true },
          { date: "2019", value: 55, certainty: true },
          { date: "2020", value: 40, certainty: true },
        ],
      },
      {
        label: "Circle Reference",
        shape: "circle",
        curve: "curveLinear",
        color: "#3357FF",
        series: [
          { date: "2016", value: 40, certainty: true },
          { date: "2017", value: 60, certainty: true },
          { date: "2018", value: 45, certainty: true },
          { date: "2019", value: 70, certainty: true },
          { date: "2020", value: 55, certainty: true },
        ],
      },
    ],
    title: "Triangle Shape Test",
    filter: null,
  },
  parameters: {
    docs: {
      description: {
        story:
          "This example demonstrates the triangle shape markers with different curves and colors. Includes a circle series for comparison.",
      },
    },
  },
};

// Add a new story for button hover interaction
export const ButtonHoverInteraction = {
  args: {
    ...commonProps,
    filterLimit: 3,
    dataSet: [
      {
        label: "Performance",
        shape: "circle",
        curve: "curveLinear",
        color: "#2196F3",
        index: 0,
        series: [
          { date: "2019", value: 75, certainty: true },
          { date: "2020", value: 82, certainty: true },
          { date: "2021", value: 90, certainty: true },
          { date: "2022", value: 85, certainty: false },
        ],
      },
      {
        label: "Efficiency",
        shape: "square",
        curve: "curveLinear",
        color: "#4CAF50",
        index: 1,
        series: [
          { date: "2019", value: 60, certainty: true },
          { date: "2020", value: 75, certainty: true },
          { date: "2021", value: 85, certainty: true },
          { date: "2022", value: 80, certainty: false },
        ],
      },
      {
        label: "Quality",
        shape: "triangle",
        curve: "curveBumpX",
        color: "#FF9800",
        index: 2,
        series: [
          { date: "2019", value: 85, certainty: true },
          { date: "2020", value: 88, certainty: true },
          { date: "2021", value: 92, certainty: true },
          { date: "2022", value: 95, certainty: false },
        ],
      },
      {
        label: "Innovation",
        shape: "circle",
        curve: "curveLinear",
        color: "#9C27B0",
        index: 3,
        series: [
          { date: "2019", value: 45, certainty: true },
          { date: "2020", value: 52, certainty: true },
          { date: "2021", value: 68, certainty: true },
          { date: "2022", value: 72, certainty: false },
        ],
      },
      {
        label: "Customer Satisfaction",
        shape: "square",
        curve: "curveLinear",
        color: "#FF5722",
        index: 4,
        series: [
          { date: "2019", value: 80, certainty: true },
          { date: "2020", value: 78, certainty: true },
          { date: "2021", value: 82, certainty: true },
          { date: "2022", value: 88, certainty: false },
        ],
      },
    ],
    title: "Interactive Button Hover Example",
    filter: {
      limit: 5,
      date: "2021",
      criteria: "value",
      sortingDir: "desc",
    },
  },
  argTypes: {
    filterLimit: {
      control: { type: "range", min: 1, max: 5, step: 1 },
      description: "Number of items to show",
    },
  },
  render: args => {
    const [currentHighlight, setCurrentHighlight] = React.useState<string[]>([]);
    const [filterDate, setFilterDate] = React.useState("2021");
    
    console.log("Current highlight state:", currentHighlight);

    // Get all available dates from the dataset
    const availableDates = React.useMemo(() => {
      const dates = new Set<string>();
      args.dataSet.forEach(item => {
        item.series.forEach(point => {
          dates.add(point.date.toString());
        });
      });
      return Array.from(dates).sort();
    }, [args.dataSet]);

    // Create filtered dataset based on limit and date
    const filteredDataSet = React.useMemo(() => {
      return {
        ...args,
        filter: {
          limit: args.filterLimit || 5,
          date: filterDate,
          criteria: "value",
          sortingDir: "desc",
        },
      };
    }, [args, filterDate]);

    // Create a fixed colors mapping that won't change with highlighting
    const fixedColorsMapping = React.useMemo(() => {
      const mapping = {};
      filteredDataSet.dataSet.forEach(item => {
        mapping[item.label] = item.color || "#ccc";
      });
      return mapping;
    }, [filteredDataSet.dataSet]);

    // Style for the controls container
    const controlsContainerStyle = {
      display: "flex",
      gap: "20px",
      marginBottom: "20px",
      alignItems: "center",
    };

    // Style for the select controls
    const selectStyle = {
      padding: "8px 12px",
      borderRadius: "4px",
      border: "1px solid #ccc",
      fontSize: "14px",
      minWidth: "120px",
    };

    // Style for the button container
    const buttonContainerStyle = {
      display: "flex",
      gap: "10px",
      marginBottom: "20px",
      flexWrap: "wrap" as const,
    };

    // Style for individual buttons
    const buttonStyle = (label: string) => ({
      padding: "8px 16px",
      border: "2px solid",
      borderColor: fixedColorsMapping[label] || "#ccc",
      borderRadius: "4px",
      background: currentHighlight.includes(label) ? fixedColorsMapping[label] : "white",
      color: currentHighlight.includes(label) ? "white" : fixedColorsMapping[label],
      cursor: "pointer",
      transition: "all 0.3s ease",
      fontWeight: 500,
    });

    // Style for labels
    const labelStyle = {
      fontSize: "14px",
      fontWeight: 500,
    };

    return (
      <div>
        <div style={controlsContainerStyle}>
          <div>
            <label style={labelStyle}>Reference Date: </label>
            <select
              value={filterDate}
              onChange={e => setFilterDate(e.target.value)}
              style={selectStyle}
            >
              {availableDates.map(date => (
                <option key={date} value={date}>
                  {date}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div style={buttonContainerStyle}>
          {filteredDataSet.dataSet.map(item => (
            <button
              key={item.label}
              style={buttonStyle(item.label)}
              onMouseEnter={() => setCurrentHighlight([item.label])}
              onMouseLeave={() => setCurrentHighlight([])}
            >
              {item.label}
            </button>
          ))}
          <button
            style={{
              padding: "8px 16px",
              border: "2px solid #666",
              borderRadius: "4px",
              background: currentHighlight.length === args.filterLimit ? "#666" : "white",
              color: currentHighlight.length === args.filterLimit ? "white" : "#666",
              cursor: "pointer",
              transition: "all 0.3s ease",
              fontWeight: 500,
            }}
            onMouseEnter={() => setCurrentHighlight(filteredDataSet.dataSet.map(d => d.label))}
            onMouseLeave={() => setCurrentHighlight([])}
          >
            Show All
          </button>
        </div>
        <LineChartComponent {...filteredDataSet} highlightItems={currentHighlight} colorsMapping={fixedColorsMapping} />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "This example demonstrates button-based hover interaction with the line chart using props. Use the slider in the controls panel to adjust how many lines to show, and select which date to use as reference for the filtering. Hover over the buttons to highlight corresponding lines and data points. The 'Show All' button highlights all visible series simultaneously.",
      },
    },
  },
};

// Add a new story for testing same data-label with different shapes
export const SameDataLabelDifferentShapes = {
  args: {
    ...commonProps,
    dataSet: [
      {
        label: "Performance Metrics",
        shape: "circle",
        curve: "curveLinear",
        index: 0,
        series: [
          { date: "2019", value: 75, certainty: true },
          { date: "2020", value: 82, certainty: true },
          { date: "2021", value: 90, certainty: true },
          { date: "2022", value: 85, certainty: false },
        ],
      },
      {
        label: "Performance Metrics", // Same label
        shape: "triangle", // Different shape
        curve: "curveLinear",
        index: 1,
        series: [
          { date: "2019", value: 65, certainty: true },
          { date: "2020", value: 72, certainty: true },
          { date: "2021", value: 80, certainty: true },
          { date: "2022", value: 75, certainty: false },
        ],
      },
      {
        label: "Other Metric",
        shape: "square",
        curve: "curveLinear",
        index: 2,
        series: [
          { date: "2019", value: 45, certainty: true },
          { date: "2020", value: 52, certainty: true },
          { date: "2021", value: 58, certainty: true },
          { date: "2022", value: 62, certainty: false },
        ],
      },
    ],
    title: "Same Label Different Shapes Test",
  },
  parameters: {
    docs: {
      description: {
        story:
          "This example demonstrates how the chart handles multiple datasets with the same label but different shapes and colors. When hovering over a line or shape, all elements with the same data-label should be highlighted together.",
      },
    },
  },
  render: args => {
    const [currentHighlight, setCurrentHighlight] = React.useState<string[]>([
      "Performance Metrics",
    ]);

    // Style for the button container
    const buttonContainerStyle = {
      display: "flex",
      gap: "10px",
      marginBottom: "20px",
      flexWrap: "wrap" as const,
    };

    // Style for individual buttons
    const buttonStyle = (label: string) => ({
      padding: "8px 16px",
      border: "2px solid",
      borderRadius: "4px",
      cursor: "pointer",
      transition: "all 0.3s ease",
      fontWeight: 500,
    });

    // Get unique labels with proper typing
    const uniqueLabels = Array.from(new Set(args.dataSet.map(d => d.label as string))) as string[];

    return (
      <div>
        <div style={buttonContainerStyle}>
          {uniqueLabels.map(label => (
            <button
              key={label}
              style={buttonStyle(label)}
              onMouseEnter={() => setCurrentHighlight([label])}
              onMouseLeave={() => setCurrentHighlight([])}
            >
              {label}
            </button>
          ))}
          <button
            style={{
              padding: "8px 16px",
              border: "2px solid #666",
              borderRadius: "4px",
              background: currentHighlight.length === uniqueLabels.length ? "#666" : "white",
              color: currentHighlight.length === uniqueLabels.length ? "white" : "#666",
              cursor: "pointer",
              transition: "all 0.3s ease",
              fontWeight: 500,
            }}
            onMouseEnter={() => setCurrentHighlight(uniqueLabels)}
            onMouseLeave={() => setCurrentHighlight([])}
          >
            Show All
          </button>
        </div>
        <LineChartComponent {...args} highlightItems={currentHighlight} />
      </div>
    );
  },
};

export const Monthly = {
  args: {
    dataSet: [
      {
        label: "Monthly Sales",
        series: [
          { date: "2023-01-01", value: 100, certainty: true },
          { date: "2023-02-01", value: 120, certainty: true },
          { date: "2023-03-01", value: 90, certainty: true },
          { date: "2023-04-01", value: 130, certainty: true },
          { date: "2023-05-01", value: 110, certainty: true },
        ],
      },
    ],
    width: 700,
    height: 400,
    margin: { top: 50, right: 50, bottom: 50, left: 50 },
    showCombined: false,
    yAxisFormat: (d: any) => `${d}`,
    xAxisDataType: "date_monthly",
    title: "Monthly Data (Small Range)",
    tooltipFormatter: (dataSet: any, d: any) => JSON.stringify(d),
  },
};

export const ManyMonths = {
  args: {
    dataSet: [
      {
        label: "Long Monthly Series",
        series: Array.from({ length: 36 }, (_, i) => {
          const date = new Date(2021, i, 1);
          return {
            date: date.toISOString().slice(0, 10),
            value: 100 + Math.round(Math.sin(i / 3) * 30 + Math.random() * 20),
            certainty: true,
          };
        }),
      },
    ],
    width: 700,
    height: 400,
    margin: { top: 50, right: 50, bottom: 50, left: 50 },
    showCombined: false,
    yAxisFormat: (d: any) => `${d}`,
    xAxisDataType: "date_monthly",
    title: "Monthly Data (Many Months)",
    tooltipFormatter: (dataSet: any, d: any) => JSON.stringify(d),
  },
};

// Dataset for disable/enable testing
const testDataSetForDisabling = [
  {
    label: "Series A",
    shape: "circle",
    curve: "curveLinear",
    color: "#FF6B35", // Orange
    series: [
      { date: "2019", value: 45, certainty: true },
      { date: "2020", value: 55, certainty: true },
      { date: "2021", value: 65, certainty: true },
      { date: "2022", value: 75, certainty: false },
    ],
  },
  {
    label: "Series B",
    shape: "square",
    curve: "curveLinear",
    color: "#4ECDC4", // Teal
    series: [
      { date: "2019", value: 30, certainty: true },
      { date: "2020", value: 40, certainty: true },
      { date: "2021", value: 50, certainty: true },
      { date: "2022", value: 60, certainty: false },
    ],
  },
  {
    label: "Series C",
    shape: "triangle",
    curve: "curveBumpX",
    color: "#45B7D1", // Blue
    series: [
      { date: "2019", value: 60, certainty: true },
      { date: "2020", value: 70, certainty: true },
      { date: "2021", value: 80, certainty: true },
      { date: "2022", value: 90, certainty: false },
    ],
  },
  {
    label: "Series D",
    shape: "circle",
    curve: "curveLinear",
    color: "#96CEB4", // Light Green
    series: [
      { date: "2019", value: 25, certainty: true },
      { date: "2020", value: 35, certainty: true },
      { date: "2021", value: 45, certainty: true },
      { date: "2022", value: 55, certainty: false },
    ],
  },
  {
    label: "Series E",
    shape: "square",
    curve: "curveLinear",
    color: "#FFEAA7", // Yellow
    series: [
      { date: "2019", value: 50, certainty: true },
      { date: "2020", value: 45, certainty: true },
      { date: "2021", value: 40, certainty: true },
      { date: "2022", value: 35, certainty: false },
    ],
  },
];

// Story for testing disabled items with color mapping persistence
export const DisableEnableColorMapping = {
  args: {
    ...commonProps,
    dataSet: testDataSetForDisabling,
    title: "Test Disable/Enable with Color Mapping",
    filter: null,
  },
  render: args => {
    const [currentHighlight, setCurrentHighlight] = React.useState<string[]>([]);
    const [disabledItems, setDisabledItems] = React.useState<string[]>([]);
    const [colorsMapping, setColorsMapping] = React.useState<{ [key: string]: string }>({});
    
    console.log("Current disabled items:", disabledItems);
    console.log("Current colors mapping:", colorsMapping);

    // Handle color mapping generation
    const handleColorMappingGenerated = React.useCallback((newMapping: { [key: string]: string }) => {
      console.log("New color mapping generated:", newMapping);
      setColorsMapping(prev => ({ ...prev, ...newMapping }));
    }, []);

    // Toggle disabled state for an item
    const toggleDisabled = React.useCallback((label: string) => {
      setDisabledItems(prev => 
        prev.includes(label) 
          ? prev.filter(item => item !== label)
          : [...prev, label]
      );
    }, []);

    // Style for the controls container
    const controlsContainerStyle = {
      display: "flex",
      flexDirection: "column" as const,
      gap: "15px",
      marginBottom: "20px",
      padding: "15px",
      border: "1px solid #e0e0e0",
      borderRadius: "8px",
      backgroundColor: "#f9f9f9",
    };

    // Style for button groups
    const buttonGroupStyle = {
      display: "flex",
      gap: "10px",
      flexWrap: "wrap" as const,
      alignItems: "center",
    };

    // Style for section labels
    const sectionLabelStyle = {
      fontSize: "14px",
      fontWeight: "bold" as const,
      color: "#333",
      marginBottom: "5px",
    };

    // Style for individual buttons
    const buttonStyle = (label: string, type: "highlight" | "disable") => {
      const baseStyle = {
        padding: "8px 16px",
        border: "2px solid",
        borderRadius: "4px",
        cursor: "pointer",
        transition: "all 0.3s ease",
        fontWeight: 500,
        fontSize: "12px",
      };

      if (type === "highlight") {
        const isHighlighted = currentHighlight.includes(label);
        const color = colorsMapping[label] || "#666";
        return {
          ...baseStyle,
          borderColor: color,
          background: isHighlighted ? color : "white",
          color: isHighlighted ? "white" : color,
        };
      } else { // disable
        const isDisabled = disabledItems.includes(label);
        return {
          ...baseStyle,
          borderColor: isDisabled ? "#dc3545" : "#28a745",
          background: isDisabled ? "#dc3545" : "#28a745",
          color: "white",
        };
      }
    };

    // Info panel style
    const infoPanelStyle = {
      padding: "10px",
      backgroundColor: "#e9ecef",
      borderRadius: "4px",
      fontSize: "12px",
      fontFamily: "monospace",
    };

    return (
      <div>
        <div style={controlsContainerStyle}>
          <div>
            <div style={sectionLabelStyle}>Highlight Controls:</div>
            <div style={buttonGroupStyle}>
              {testDataSetForDisabling.map(item => (
                <button
                  key={`highlight-${item.label}`}
                  style={buttonStyle(item.label, "highlight")}
                  onMouseEnter={() => setCurrentHighlight([item.label])}
                  onMouseLeave={() => setCurrentHighlight([])}
                >
                  {item.label}
                </button>
              ))}
              <button
                style={{
                  padding: "8px 16px",
                  border: "2px solid #666",
                  borderRadius: "4px",
                  background: currentHighlight.length === testDataSetForDisabling.length ? "#666" : "white",
                  color: currentHighlight.length === testDataSetForDisabling.length ? "white" : "#666",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  fontWeight: 500,
                  fontSize: "12px",
                }}
                onMouseEnter={() => setCurrentHighlight(testDataSetForDisabling.map(d => d.label))}
                onMouseLeave={() => setCurrentHighlight([])}
              >
                Show All
              </button>
            </div>
          </div>
          
          <div>
            <div style={sectionLabelStyle}>Disable/Enable Controls:</div>
            <div style={buttonGroupStyle}>
              {testDataSetForDisabling.map(item => (
                <button
                  key={`disable-${item.label}`}
                  style={buttonStyle(item.label, "disable")}
                  onClick={() => toggleDisabled(item.label)}
                >
                  {disabledItems.includes(item.label) ? "Enable" : "Disable"} {item.label}
                </button>
              ))}
              <button
                style={{
                  padding: "8px 16px",
                  border: "2px solid #6c757d",
                  borderRadius: "4px",
                  background: "#6c757d",
                  color: "white",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  fontWeight: 500,
                  fontSize: "12px",
                }}
                onClick={() => setDisabledItems([])}
              >
                Enable All
              </button>
            </div>
          </div>
          
          <div style={infoPanelStyle}>
            <div><strong>Disabled Items:</strong> {disabledItems.length > 0 ? disabledItems.join(", ") : "None"}</div>
            <div><strong>Colors Mapping:</strong> {JSON.stringify(colorsMapping, null, 2)}</div>
          </div>
        </div>
        
        <LineChartComponent 
          {...args} 
          onColorMappingGenerated={handleColorMappingGenerated}
          colorsMapping={colorsMapping}
          highlightItems={currentHighlight}
          disabledItems={disabledItems}
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "This story tests the disable/enable functionality with color mapping persistence. The key issue being tested is that disabled items should retain their colors in the color mapping even when they're not visible in the chart. Use the 'Disable' buttons to hide series and observe that their colors remain consistent when re-enabled.",
      },
    },
  },
};

// Story for testing dynamic color assignment
export const DynamicColorAssignment = {
  args: {
    ...commonProps,
    dataSet: testDataSetForDisabling,
    title: "Test Dynamic Color Assignment",
    filter: null,
  },
  render: args => {
    const [disabledItems, setDisabledItems] = React.useState<string[]>([]);
    const [colorsMapping, setColorsMapping] = React.useState<{ [key: string]: string }>({});
    const [colorAssignmentLog, setColorAssignmentLog] = React.useState<string[]>([]);
    
    // Handle color mapping generation with logging
    const handleColorMappingGenerated = React.useCallback((newMapping: { [key: string]: string }) => {
      const timestamp = new Date().toLocaleTimeString();
      const logEntry = `${timestamp}: ${JSON.stringify(newMapping)}`;
      setColorAssignmentLog(prev => [logEntry, ...prev.slice(0, 9)]); // Keep last 10 entries
      setColorsMapping(prev => ({ ...prev, ...newMapping }));
    }, []);

    // Toggle disabled state for an item
    const toggleDisabled = React.useCallback((label: string) => {
      setDisabledItems(prev => 
        prev.includes(label) 
          ? prev.filter(item => item !== label)
          : [...prev, label]
      );
    }, []);

    // Style for the controls container
    const controlsContainerStyle = {
      display: "flex",
      flexDirection: "column" as const,
      gap: "15px",
      marginBottom: "20px",
      padding: "15px",
      border: "1px solid #e0e0e0",
      borderRadius: "8px",
      backgroundColor: "#f9f9f9",
    };

    // Style for button groups
    const buttonGroupStyle = {
      display: "flex",
      gap: "10px",
      flexWrap: "wrap" as const,
      alignItems: "center",
    };

    // Style for section labels
    const sectionLabelStyle = {
      fontSize: "14px",
      fontWeight: "bold" as const,
      color: "#333",
      marginBottom: "5px",
    };

    // Style for disable buttons
    const disableButtonStyle = (label: string) => {
      const isDisabled = disabledItems.includes(label);
      return {
        padding: "8px 16px",
        border: "2px solid",
        borderRadius: "4px",
        cursor: "pointer",
        transition: "all 0.3s ease",
        fontWeight: 500,
        fontSize: "12px",
        borderColor: isDisabled ? "#dc3545" : "#28a745",
        background: isDisabled ? "#dc3545" : "#28a745",
        color: "white",
      };
    };

    // Log panel style
    const logPanelStyle = {
      padding: "10px",
      backgroundColor: "#f8f9fa",
      borderRadius: "4px",
      fontSize: "11px",
      fontFamily: "monospace",
      maxHeight: "200px",
      overflowY: "auto" as const,
      border: "1px solid #dee2e6",
    };

    return (
      <div>
        <div style={controlsContainerStyle}>
          <div>
            <div style={sectionLabelStyle}>Disable/Enable Controls (Watch Color Assignment):</div>
            <div style={buttonGroupStyle}>
              {testDataSetForDisabling.map(item => (
                <button
                  key={`disable-${item.label}`}
                  style={disableButtonStyle(item.label)}
                  onClick={() => toggleDisabled(item.label)}
                >
                  {disabledItems.includes(item.label) ? "Enable" : "Disable"} {item.label}
                </button>
              ))}
              <button
                style={{
                  padding: "8px 16px",
                  border: "2px solid #6c757d",
                  borderRadius: "4px",
                  background: "#6c757d",
                  color: "white",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  fontWeight: 500,
                  fontSize: "12px",
                }}
                onClick={() => setDisabledItems([])}
              >
                Enable All
              </button>
              <button
                style={{
                  padding: "8px 16px",
                  border: "2px solid #ffc107",
                  borderRadius: "4px",
                  background: "#ffc107",
                  color: "black",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  fontWeight: 500,
                  fontSize: "12px",
                }}
                onClick={() => {
                  setColorsMapping({});
                  setColorAssignmentLog([]);
                }}
              >
                Reset Colors
              </button>
            </div>
          </div>
          
          <div>
            <div style={sectionLabelStyle}>Color Assignment Log:</div>
            <div style={logPanelStyle}>
              {colorAssignmentLog.length === 0 ? (
                <div style={{ color: "#6c757d" }}>No color assignments yet...</div>
              ) : (
                colorAssignmentLog.map((entry, index) => (
                  <div key={index} style={{ marginBottom: "2px" }}>
                    {entry}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        
        <LineChartComponent 
          {...args} 
          onColorMappingGenerated={handleColorMappingGenerated}
          colorsMapping={colorsMapping}
          disabledItems={disabledItems}
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "This story demonstrates how colors are dynamically assigned to series and shows the fix for the color mapping issue. The log shows when color mappings are generated. Before the fix, disabled items would lose their colors. After the fix, all items (including disabled ones) retain their assigned colors.",
      },
    },
  },
};

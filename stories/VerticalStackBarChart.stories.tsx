import React, { useState } from "react";
import VerticalStackBarChart, { RectData } from "../src/components/VerticalStackBarChart";
import { Meta } from "@storybook/react";
import { MichiVzProvider } from "../src/components/MichiVzProvider";
import { fn } from "@storybook/test";
import { arc } from "d3";
import { P } from "storybook/internal/components";

// Define the ChartMetadata interface to match what's in the component
interface ChartMetadata {
  xAxisDomain: string[];
  visibleItems: string[];
  renderedData: Record<string, RectData[]>;
  chartType: "vertical-stack-bar-chart";
}

export default {
  title: "Charts/Vertical Stack Bar Chart",
  component: VerticalStackBarChart,
  tags: ["autodocs"],
  decorators: [
    Story => (
      <MichiVzProvider
        colorsMapping={{
          Exports: "green",
          Imports: "red",
          Africa: "orange",
          "Non-LDC": "purple",
          Sudan: "blue",
        }}
        // disabledItems={["Non-LDC"]}
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
          { date: "2001", Africa: "666" },
          { date: "2002", Africa: "777" },
          { date: "2003", Africa: "989" },
        ],
      },
      {
        seriesKey: "Non-LDC",
        seriesKeyAbbreviation: "Non-LDC",
        series: [
          { date: "2001", "Non-LDC": "444" },
          { date: "2002", "Non-LDC": "333" },
          { date: "2003", "Non-LDC": "222" },
        ],
      },
      {
        seriesKey: "Sudan",
        seriesKeyAbbreviation: "Sudan",
        series: [
          { date: "2001", Sudan: "789" },
          { date: "2002", Sudan: "456" },
          { date: "2003", Sudan: "123" },
        ],
      },
    ],
    width: 900,
    height: 480,
    margin: { top: 50, right: 50, bottom: 50, left: 50 },
    yAxisFormat: d => `${d}`,
    title: "Top DataSet by Total Value",
    filter: { limit: 2, sortingDir: "desc", date: "2003" },
    onChartDataProcessed: data => {
      // console.log({ data });
    },
  },
};

// Example with data callback
export const WithDataCallback = () => {
  const [chartData, setChartData] = useState<ChartMetadata | null>(null);

  return (
    <div>
      <VerticalStackBarChart
        dataSet={[
          {
            seriesKey: "Africa",
            seriesKeyAbbreviation: "Africa",
            series: [
              { date: "2001", Africa: "55043000" },
              { date: "2002", Africa: "60000000" },
              { date: "2003", Africa: "172065000" },
            ],
          },
          {
            seriesKey: "Non-LDC",
            seriesKeyAbbreviation: "Non-LDC",
            series: [
              { date: "2001", "Non-LDC": "42029000" },
              { date: "2002", "Non-LDC": "38000000" },
              { date: "2003", "Non-LDC": "48000000" },
            ],
          },
        ]}
        width={900}
        height={480}
        margin={{ top: 50, right: 50, bottom: 50, left: 50 }}
        title="Chart with Data Callback"
        onChartDataProcessed={metadata => {
          // console.log(metadata);
          setChartData(metadata);
        }}
      />

      {chartData && (
        <div style={{ marginTop: "20px", padding: "10px", border: "1px solid #ccc" }}>
          <h3>Chart Data Available to Parent:</h3>
          <div>
            <strong>X-Axis Domain:</strong> {JSON.stringify(chartData.xAxisDomain)}
          </div>
          <div>
            <strong>Visible Keys:</strong> {JSON.stringify(chartData.visibleItems)}
          </div>
          <div>
            <strong>Rendered Elements:</strong> {Object.keys(chartData.renderedData).length} keys
            with data
          </div>
        </div>
      )}
    </div>
  );
};

export const WithTopFilteredItems = {
  args: {
    ...Primary.args,
    title: "Top 3 Items by Value (2002)",
    filter: {
      limit: 3,
      sortingDir: "desc",
      date: "2002",
    },
    onChartDataProcessed: fn(),
  },
};

export const WithBottomFilteredItems = {
  args: {
    ...Primary.args,
    title: "Bottom 2 Items by Value (2001)",
    filter: {
      limit: 2,
      sortingDir: "asc",
      date: "2001",
    },
    onChartDataProcessed: fn(),
  },
};

export const FilteredBySize = {
  args: {
    ...Primary.args,
    title: "Top 8 Items by Circle Size",
    filter: {
      limit: 8,
      criteria: "d",
      sortingDir: "desc",
      date: "202009",
    },
    onChartDataProcessed: fn(),
  },
};

export const FilteredByXValue = {
  args: {
    ...Primary.args,
    title: "Top 5 Items by X-Axis Value",
    filter: {
      limit: 5,
      criteria: "x",
      sortingDir: "desc",
      date: "202009",
    },
    onChartDataProcessed: fn(),
  },
};

export const FilteredByYValue = {
  args: {
    ...Primary.args,
    title: "Bottom 4 Items by Y-Axis Value",
    filter: {
      limit: 4,
      criteria: "y",
      sortingDir: "asc",
      date: "202009",
    },
    onChartDataProcessed: fn(),
  },
};

export const FilteredByBaseValue = {
  args: {
    ...Primary.args,
    title: "Top 5 Items by Base Value",
    filter: {
      limit: 5,
      criteria: "valueBased",
      sortingDir: "desc",
    },
    onChartDataProcessed: fn(),
  },
};

export const FilteredByCompareValue = {
  args: {
    ...Primary.args,
    title: "Top 3 Items by Compare Value",
    filter: {
      limit: 3,
      criteria: "valueCompared",
      sortingDir: "desc",
    },
    onChartDataProcessed: fn(),
  },
};

export const FilteredAscending = {
  args: {
    ...Primary.args,
    title: "Bottom 4 Items by Base Value",
    filter: {
      limit: 4,
      criteria: "valueBased",
      sortingDir: "asc",
    },
    onChartDataProcessed: fn(),
  },
};

export const FilteredByValue1 = {
  args: {
    ...Primary.args,
    title: "Top 3 Items by First Value",
    filter: {
      limit: 3,
      criteria: "value1",
      sortingDir: "desc",
    },
    onChartDataProcessed: fn(),
  },
};

export const FilteredByValue2 = {
  args: {
    ...Primary.args,
    title: "Top 3 Items by Second Value",
    filter: {
      limit: 3,
      criteria: "value2",
      sortingDir: "desc",
    },
    onChartDataProcessed: fn(),
  },
};

export const WithDateFilter = {
  args: {
    ...Primary.args,
    title: "Top 2 Series by Value at 2020",
    filter: {
      limit: 2,
      criteria: "value",
      sortingDir: "desc",
      date: "2020",
    },
    onChartDataProcessed: fn(),
  },
};

export const WithBottomFilter = {
  args: {
    ...Primary.args,
    title: "Bottom 3 Series by Value at 2022",
    filter: {
      limit: 3,
      criteria: "value",
      sortingDir: "asc",
      date: "2022",
    },
    onChartDataProcessed: fn(),
  },
};

export const FilteredByMedian = {
  args: {
    ...Primary.args,
    title: "Top 2 Series by Median Value",
    filter: {
      limit: 2,
      criteria: "valueMedium",
      sortingDir: "desc",
    },
    onChartDataProcessed: fn(),
  },
};

export const FilteredByMaxValue = {
  args: {
    ...Primary.args,
    title: "Top 3 Series by Maximum Value",
    filter: {
      limit: 3,
      criteria: "valueMax",
      sortingDir: "desc",
    },
    onChartDataProcessed: fn(),
  },
};

export const MassiveDataSet = {
  args: {
    ...Primary.args,
    title: "Massive Data Set",
    filter: {
      limit: 5,
      criteria: "value",
      sortingDir: "desc",
      date: "2023",
    },
    dataSet: [
      {
        seriesKey: "Aircrafts, spacecrafts & parts",
        series: [
          {
            date: 2017,
            "Aircrafts, spacecrafts & parts": 299000,
            code: 301,
          },
          {
            date: 2018,
            "Aircrafts, spacecrafts & parts": 1461000,
            code: 301,
          },
          {
            date: 2019,
            "Aircrafts, spacecrafts & parts": 1986000,
            code: 301,
          },
          {
            date: 2020,
            "Aircrafts, spacecrafts & parts": 295000,
            code: 301,
          },
          {
            date: 2021,
            "Aircrafts, spacecrafts & parts": 14000,
            code: 301,
          },
          {
            date: 2022,
            "Aircrafts, spacecrafts & parts": 3214000,
            code: 301,
          },
          {
            date: 2023,
            "Aircrafts, spacecrafts & parts": 1942000,
            code: 301,
          },
        ],
      },
      {
        seriesKey: "Animal products (not edible)",
        series: [
          {
            date: 2017,
            "Animal products (not edible)": 0,
            code: 303,
          },
          {
            date: 2018,
            "Animal products (not edible)": 0,
            code: 303,
          },
          {
            date: 2019,
            "Animal products (not edible)": 7000,
            code: 303,
          },
          {
            date: 2020,
            code: 303,
          },
          {
            date: 2021,
            "Animal products (not edible)": 0,
            code: 303,
          },
          {
            date: 2022,
            "Animal products (not edible)": 18000,
            code: 303,
          },
          {
            date: 2023,
            "Animal products (not edible)": 22000,
            code: 303,
          },
        ],
      },
      {
        seriesKey: "Apparel",
        series: [
          {
            date: 2017,
            Apparel: 51317000,
            code: 304,
          },
          {
            date: 2018,
            Apparel: 57411000,
            code: 304,
          },
          {
            date: 2019,
            Apparel: 65091000,
            code: 304,
          },
          {
            date: 2020,
            Apparel: 51407000,
            code: 304,
          },
          {
            date: 2021,
            Apparel: 72960000,
            code: 304,
          },
          {
            date: 2022,
            Apparel: 91659000,
            code: 304,
          },
          {
            date: 2023,
            Apparel: 83262000,
            code: 304,
          },
        ],
      },
      {
        seriesKey: "Arms & ammunition",
        series: [
          {
            date: 2017,
            "Arms & ammunition": 1000,
            code: 305,
          },
          {
            date: 2018,
            "Arms & ammunition": 8000,
            code: 305,
          },
          {
            date: 2019,
            "Arms & ammunition": 3000,
            code: 305,
          },
          {
            date: 2020,
            code: 305,
          },
          {
            date: 2021,
            "Arms & ammunition": 0,
            code: 305,
          },
          {
            date: 2022,
            "Arms & ammunition": 0,
            code: 305,
          },
          {
            date: 2023,
            code: 305,
          },
        ],
      },
      {
        seriesKey: "Beauty products & perfumes",
        series: [
          {
            date: 2017,
            "Beauty products & perfumes": 3599000,
            code: 306,
          },
          {
            date: 2018,
            "Beauty products & perfumes": 4276000,
            code: 306,
          },
          {
            date: 2019,
            "Beauty products & perfumes": 3857000,
            code: 306,
          },
          {
            date: 2020,
            "Beauty products & perfumes": 4997000,
            code: 306,
          },
          {
            date: 2021,
            "Beauty products & perfumes": 6431000,
            code: 306,
          },
          {
            date: 2022,
            "Beauty products & perfumes": 4986000,
            code: 306,
          },
          {
            date: 2023,
            "Beauty products & perfumes": 2776000,
            code: 306,
          },
        ],
      },
      {
        seriesKey: "Beverages (alcoholic)",
        series: [
          {
            date: 2017,
            "Beverages (alcoholic)": 155000,
            code: 307,
          },
          {
            date: 2018,
            "Beverages (alcoholic)": 61000,
            code: 307,
          },
          {
            date: 2019,
            "Beverages (alcoholic)": 231000,
            code: 307,
          },
          {
            date: 2020,
            "Beverages (alcoholic)": 90000,
            code: 307,
          },
          {
            date: 2021,
            "Beverages (alcoholic)": 58000,
            code: 307,
          },
          {
            date: 2022,
            "Beverages (alcoholic)": 111000,
            code: 307,
          },
          {
            date: 2023,
            "Beverages (alcoholic)": 94000,
            code: 307,
          },
        ],
      },
      {
        seriesKey: "Beverages (not alcoholic)",
        series: [
          {
            date: 2017,
            "Beverages (not alcoholic)": 21000,
            code: 308,
          },
          {
            date: 2018,
            "Beverages (not alcoholic)": 15000,
            code: 308,
          },
          {
            date: 2019,
            "Beverages (not alcoholic)": 26000,
            code: 308,
          },
          {
            date: 2020,
            "Beverages (not alcoholic)": 51000,
            code: 308,
          },
          {
            date: 2021,
            "Beverages (not alcoholic)": 68000,
            code: 308,
          },
          {
            date: 2022,
            "Beverages (not alcoholic)": 144000,
            code: 308,
          },
          {
            date: 2023,
            "Beverages (not alcoholic)": 213000,
            code: 308,
          },
        ],
      },
      {
        seriesKey: "Bicycles, carriages & parts",
        series: [
          {
            date: 2017,
            "Bicycles, carriages & parts": 1000,
            code: 309,
          },
          {
            date: 2018,
            "Bicycles, carriages & parts": 4000,
            code: 309,
          },
          {
            date: 2019,
            "Bicycles, carriages & parts": 2000,
            code: 309,
          },
          {
            date: 2020,
            "Bicycles, carriages & parts": 2000,
            code: 309,
          },
          {
            date: 2021,
            "Bicycles, carriages & parts": 3000,
            code: 309,
          },
          {
            date: 2022,
            "Bicycles, carriages & parts": 0,
            code: 309,
          },
          {
            date: 2023,
            "Bicycles, carriages & parts": 0,
            code: 309,
          },
        ],
      },
      {
        seriesKey: "Boats & parts",
        series: [
          {
            date: 2017,
            "Boats & parts": 115000,
            code: 310,
          },
          {
            date: 2018,
            "Boats & parts": 46000,
            code: 310,
          },
          {
            date: 2019,
            "Boats & parts": 67000,
            code: 310,
          },
          {
            date: 2020,
            "Boats & parts": 6000,
            code: 310,
          },
          {
            date: 2021,
            "Boats & parts": 102000,
            code: 310,
          },
          {
            date: 2022,
            "Boats & parts": 5000,
            code: 310,
          },
          {
            date: 2023,
            "Boats & parts": 59000,
            code: 310,
          },
        ],
      },
      {
        seriesKey: "Carpets",
        series: [
          {
            date: 2017,
            Carpets: 13000,
            code: 311,
          },
          {
            date: 2018,
            Carpets: 3000,
            code: 311,
          },
          {
            date: 2019,
            Carpets: 28000,
            code: 311,
          },
          {
            date: 2020,
            Carpets: 2000,
            code: 311,
          },
          {
            date: 2021,
            Carpets: 1000,
            code: 311,
          },
          {
            date: 2022,
            Carpets: 0,
            code: 311,
          },
          {
            date: 2023,
            Carpets: 2000,
            code: 311,
          },
        ],
      },
      {
        seriesKey: "Ceramic articles",
        series: [
          {
            date: 2017,
            "Ceramic articles": 23000,
            code: 312,
          },
          {
            date: 2018,
            "Ceramic articles": 3000,
            code: 312,
          },
          {
            date: 2019,
            "Ceramic articles": 11000,
            code: 312,
          },
          {
            date: 2020,
            "Ceramic articles": 1000,
            code: 312,
          },
          {
            date: 2021,
            "Ceramic articles": 3000,
            code: 312,
          },
          {
            date: 2022,
            "Ceramic articles": 3000,
            code: 312,
          },
          {
            date: 2023,
            "Ceramic articles": 2000,
            code: 312,
          },
        ],
      },
      {
        seriesKey: "Cereals (except wheat & rice)",
        series: [
          {
            date: 2017,
            "Cereals (except wheat & rice)": 7000,
            code: 313,
          },
          {
            date: 2018,
            "Cereals (except wheat & rice)": 0,
            code: 313,
          },
          {
            date: 2019,
            "Cereals (except wheat & rice)": 6000,
            code: 313,
          },
          {
            date: 2020,
            "Cereals (except wheat & rice)": 2000,
            code: 313,
          },
          {
            date: 2021,
            "Cereals (except wheat & rice)": 3000,
            code: 313,
          },
          {
            date: 2022,
            "Cereals (except wheat & rice)": 0,
            code: 313,
          },
          {
            date: 2023,
            "Cereals (except wheat & rice)": 0,
            code: 313,
          },
        ],
      },
      {
        seriesKey: "Cereals (processed)",
        series: [
          {
            date: 2017,
            "Cereals (processed)": 26000,
            code: 314,
          },
          {
            date: 2018,
            "Cereals (processed)": 35000,
            code: 314,
          },
          {
            date: 2019,
            "Cereals (processed)": 64000,
            code: 314,
          },
          {
            date: 2020,
            "Cereals (processed)": 56000,
            code: 314,
          },
          {
            date: 2021,
            "Cereals (processed)": 41000,
            code: 314,
          },
          {
            date: 2022,
            "Cereals (processed)": 103000,
            code: 314,
          },
          {
            date: 2023,
            "Cereals (processed)": 9000,
            code: 314,
          },
        ],
      },
      {
        seriesKey: "Chemicals",
        series: [
          {
            date: 2017,
            Chemicals: 66000,
            code: 315,
          },
          {
            date: 2018,
            Chemicals: 147000,
            code: 315,
          },
          {
            date: 2019,
            Chemicals: 80000,
            code: 315,
          },
          {
            date: 2020,
            Chemicals: 93000,
            code: 315,
          },
          {
            date: 2021,
            Chemicals: 76000,
            code: 315,
          },
          {
            date: 2022,
            Chemicals: 148000,
            code: 315,
          },
          {
            date: 2023,
            Chemicals: 100000,
            code: 315,
          },
        ],
      },
      {
        seriesKey: "Cocoa beans & products",
        series: [
          {
            date: 2017,
            "Cocoa beans & products": 381000,
            code: 316,
          },
          {
            date: 2018,
            "Cocoa beans & products": 103000,
            code: 316,
          },
          {
            date: 2019,
            "Cocoa beans & products": 1000,
            code: 316,
          },
          {
            date: 2020,
            "Cocoa beans & products": 444000,
            code: 316,
          },
          {
            date: 2021,
            "Cocoa beans & products": 573000,
            code: 316,
          },
          {
            date: 2022,
            "Cocoa beans & products": 1350000,
            code: 316,
          },
          {
            date: 2023,
            "Cocoa beans & products": 260000,
            code: 316,
          },
        ],
      },
      {
        seriesKey: "Coffee",
        series: [
          {
            date: 2017,
            Coffee: 1341000,
            code: 317,
          },
          {
            date: 2018,
            Coffee: 0,
            code: 317,
          },
          {
            date: 2019,
            Coffee: 5000,
            code: 317,
          },
          {
            date: 2020,
            Coffee: 2851000,
            code: 317,
          },
          {
            date: 2021,
            Coffee: 190000,
            code: 317,
          },
          {
            date: 2022,
            Coffee: 0,
            code: 317,
          },
          {
            date: 2023,
            Coffee: 0,
            code: 317,
          },
        ],
      },
      {
        seriesKey: "Cotton (fabric)",
        series: [
          {
            date: 2017,
            "Cotton (fabric)": 863000,
            code: 318,
          },
          {
            date: 2018,
            "Cotton (fabric)": 1006000,
            code: 318,
          },
          {
            date: 2019,
            "Cotton (fabric)": 1255000,
            code: 318,
          },
          {
            date: 2020,
            "Cotton (fabric)": 916000,
            code: 318,
          },
          {
            date: 2021,
            "Cotton (fabric)": 1310000,
            code: 318,
          },
          {
            date: 2022,
            "Cotton (fabric)": 3392000,
            code: 318,
          },
          {
            date: 2023,
            "Cotton (fabric)": 4651000,
            code: 318,
          },
        ],
      },
      {
        seriesKey: "Crops n.e.s.",
        series: [
          {
            date: 2017,
            "Crops n.e.s.": 8474000,
            code: 319,
          },
          {
            date: 2018,
            "Crops n.e.s.": 16853000,
            code: 319,
          },
          {
            date: 2019,
            "Crops n.e.s.": 21349000,
            code: 319,
          },
          {
            date: 2020,
            "Crops n.e.s.": 7082000,
            code: 319,
          },
          {
            date: 2021,
            "Crops n.e.s.": 251000,
            code: 319,
          },
          {
            date: 2022,
            "Crops n.e.s.": 624000,
            code: 319,
          },
          {
            date: 2023,
            "Crops n.e.s.": 361000,
            code: 319,
          },
        ],
      },
      {
        seriesKey: "Dairy products",
        series: [
          {
            date: 2017,
            "Dairy products": 1000,
            code: 320,
          },
          {
            date: 2018,
            "Dairy products": 0,
            code: 320,
          },
          {
            date: 2019,
            "Dairy products": 0,
            code: 320,
          },
          {
            date: 2020,
            "Dairy products": 21000,
            code: 320,
          },
          {
            date: 2021,
            "Dairy products": 214000,
            code: 320,
          },
          {
            date: 2022,
            "Dairy products": 168000,
            code: 320,
          },
          {
            date: 2023,
            "Dairy products": 152000,
            code: 320,
          },
        ],
      },
      {
        seriesKey: "Eggs, honey and edible animal products n.e.s.",
        series: [
          {
            date: 2017,
            "Eggs, honey and edible animal products n.e.s.": 43000,
            code: 321,
          },
          {
            date: 2018,
            "Eggs, honey and edible animal products n.e.s.": 92000,
            code: 321,
          },
          {
            date: 2019,
            "Eggs, honey and edible animal products n.e.s.": 54000,
            code: 321,
          },
          {
            date: 2020,
            "Eggs, honey and edible animal products n.e.s.": 37000,
            code: 321,
          },
          {
            date: 2021,
            "Eggs, honey and edible animal products n.e.s.": 38000,
            code: 321,
          },
          {
            date: 2022,
            "Eggs, honey and edible animal products n.e.s.": 8000,
            code: 321,
          },
          {
            date: 2023,
            "Eggs, honey and edible animal products n.e.s.": 12000,
            code: 321,
          },
        ],
      },
      {
        seriesKey: "Electronic equipment",
        series: [
          {
            date: 2017,
            "Electronic equipment": 693000,
            code: 322,
          },
          {
            date: 2018,
            "Electronic equipment": 510000,
            code: 322,
          },
          {
            date: 2019,
            "Electronic equipment": 641000,
            code: 322,
          },
          {
            date: 2020,
            "Electronic equipment": 167000,
            code: 322,
          },
          {
            date: 2021,
            "Electronic equipment": 455000,
            code: 322,
          },
          {
            date: 2022,
            "Electronic equipment": 70000,
            code: 322,
          },
          {
            date: 2023,
            "Electronic equipment": 1000000,
            code: 322,
          },
        ],
      },
      {
        seriesKey: "Ferrous metals",
        series: [
          {
            date: 2017,
            "Ferrous metals": 31000,
            code: 323,
          },
          {
            date: 2018,
            "Ferrous metals": 203000,
            code: 323,
          },
          {
            date: 2019,
            "Ferrous metals": 40000,
            code: 323,
          },
          {
            date: 2020,
            "Ferrous metals": 1000,
            code: 323,
          },
          {
            date: 2021,
            "Ferrous metals": 45000,
            code: 323,
          },
          {
            date: 2022,
            "Ferrous metals": 16000,
            code: 323,
          },
          {
            date: 2023,
            "Ferrous metals": 21000,
            code: 323,
          },
        ],
      },
      {
        seriesKey: "Fertilizers",
        series: [
          {
            date: 2017,
            Fertilizers: 11108000,
            code: 324,
          },
          {
            date: 2018,
            Fertilizers: 12031000,
            code: 324,
          },
          {
            date: 2019,
            Fertilizers: 10684000,
            code: 324,
          },
          {
            date: 2020,
            Fertilizers: 2644000,
            code: 324,
          },
          {
            date: 2021,
            Fertilizers: 16718000,
            code: 324,
          },
          {
            date: 2022,
            Fertilizers: 22659000,
            code: 324,
          },
          {
            date: 2023,
            Fertilizers: 10852000,
            code: 324,
          },
        ],
      },
      {
        seriesKey: "Fish & shellfish",
        series: [
          {
            date: 2017,
            "Fish & shellfish": 4643000,
            code: 325,
          },
          {
            date: 2018,
            "Fish & shellfish": 4010000,
            code: 325,
          },
          {
            date: 2019,
            "Fish & shellfish": 4176000,
            code: 325,
          },
          {
            date: 2020,
            "Fish & shellfish": 3272000,
            code: 325,
          },
          {
            date: 2021,
            "Fish & shellfish": 1937000,
            code: 325,
          },
          {
            date: 2022,
            "Fish & shellfish": 3113000,
            code: 325,
          },
          {
            date: 2023,
            "Fish & shellfish": 5317000,
            code: 325,
          },
        ],
      },
      {
        seriesKey: "Fish products (processed)",
        series: [
          {
            date: 2017,
            "Fish products (processed)": 709000,
            code: 326,
          },
          {
            date: 2018,
            "Fish products (processed)": 4957000,
            code: 326,
          },
          {
            date: 2019,
            "Fish products (processed)": 2536000,
            code: 326,
          },
          {
            date: 2020,
            "Fish products (processed)": 311000,
            code: 326,
          },
          {
            date: 2021,
            "Fish products (processed)": 2736000,
            code: 326,
          },
          {
            date: 2022,
            "Fish products (processed)": 379000,
            code: 326,
          },
          {
            date: 2023,
            "Fish products (processed)": 641000,
            code: 326,
          },
        ],
      },
      {
        seriesKey: "Flax, hemp and natural fabric n.e.s.",
        series: [
          {
            date: 2017,
            "Flax, hemp and natural fabric n.e.s.": 0,
            code: 327,
          },
          {
            date: 2018,
            "Flax, hemp and natural fabric n.e.s.": 0,
            code: 327,
          },
          {
            date: 2019,
            "Flax, hemp and natural fabric n.e.s.": 4000,
            code: 327,
          },
          {
            date: 2020,
            "Flax, hemp and natural fabric n.e.s.": 8000,
            code: 327,
          },
          {
            date: 2021,
            "Flax, hemp and natural fabric n.e.s.": 10000,
            code: 327,
          },
          {
            date: 2022,
            "Flax, hemp and natural fabric n.e.s.": 207000,
            code: 327,
          },
          {
            date: 2023,
            "Flax, hemp and natural fabric n.e.s.": 240000,
            code: 327,
          },
        ],
      },
      {
        seriesKey: "Food products n.e.s. (processed or preserved)",
        series: [
          {
            date: 2017,
            "Food products n.e.s. (processed or preserved)": 4113000,
            code: 328,
          },
          {
            date: 2018,
            "Food products n.e.s. (processed or preserved)": 4236000,
            code: 328,
          },
          {
            date: 2019,
            "Food products n.e.s. (processed or preserved)": 2934000,
            code: 328,
          },
          {
            date: 2020,
            "Food products n.e.s. (processed or preserved)": 4287000,
            code: 328,
          },
          {
            date: 2021,
            "Food products n.e.s. (processed or preserved)": 2245000,
            code: 328,
          },
          {
            date: 2022,
            "Food products n.e.s. (processed or preserved)": 3764000,
            code: 328,
          },
          {
            date: 2023,
            "Food products n.e.s. (processed or preserved)": 6235000,
            code: 328,
          },
        ],
      },
      {
        seriesKey: "Footwear",
        series: [
          {
            date: 2017,
            Footwear: 26000,
            code: 329,
          },
          {
            date: 2018,
            Footwear: 53000,
            code: 329,
          },
          {
            date: 2019,
            Footwear: 23000,
            code: 329,
          },
          {
            date: 2020,
            Footwear: 13000,
            code: 329,
          },
          {
            date: 2021,
            Footwear: 24000,
            code: 329,
          },
          {
            date: 2022,
            Footwear: 96000,
            code: 329,
          },
          {
            date: 2023,
            Footwear: 42000,
            code: 329,
          },
        ],
      },
      {
        seriesKey: "Fossil fuels",
        series: [
          {
            date: 2017,
            "Fossil fuels": 10840000,
            code: 330,
          },
          {
            date: 2018,
            "Fossil fuels": 13460000,
            code: 330,
          },
          {
            date: 2019,
            "Fossil fuels": 15409000,
            code: 330,
          },
          {
            date: 2020,
            "Fossil fuels": 5933000,
            code: 330,
          },
          {
            date: 2021,
            "Fossil fuels": 5328000,
            code: 330,
          },
          {
            date: 2022,
            "Fossil fuels": 14690000,
            code: 330,
          },
          {
            date: 2023,
            "Fossil fuels": 18340000,
            code: 330,
          },
        ],
      },
      {
        seriesKey: "Fruits",
        series: [
          {
            date: 2017,
            Fruits: 13000,
            code: 331,
          },
          {
            date: 2018,
            Fruits: 28000,
            code: 331,
          },
          {
            date: 2019,
            Fruits: 32000,
            code: 331,
          },
          {
            date: 2020,
            Fruits: 25000,
            code: 331,
          },
          {
            date: 2021,
            Fruits: 18000,
            code: 331,
          },
          {
            date: 2022,
            Fruits: 14000,
            code: 331,
          },
          {
            date: 2023,
            Fruits: 107000,
            code: 331,
          },
        ],
      },
      {
        seriesKey: "Glass articles",
        series: [
          {
            date: 2017,
            "Glass articles": 9000,
            code: 332,
          },
          {
            date: 2018,
            "Glass articles": 11000,
            code: 332,
          },
          {
            date: 2019,
            "Glass articles": 8000,
            code: 332,
          },
          {
            date: 2020,
            "Glass articles": 2000,
            code: 332,
          },
          {
            date: 2021,
            "Glass articles": 1000,
            code: 332,
          },
          {
            date: 2022,
            "Glass articles": 683000,
            code: 332,
          },
          {
            date: 2023,
            "Glass articles": 13000,
            code: 332,
          },
        ],
      },
      {
        seriesKey: "Hazardous waste",
        series: [
          {
            date: 2017,
            "Hazardous waste": 0,
            code: 333,
          },
          {
            date: 2018,
            "Hazardous waste": 0,
            code: 333,
          },
          {
            date: 2019,
            "Hazardous waste": 0,
            code: 333,
          },
          {
            date: 2020,
            "Hazardous waste": 0,
            code: 333,
          },
          {
            date: 2021,
            "Hazardous waste": 6000,
            code: 333,
          },
          {
            date: 2022,
            "Hazardous waste": 0,
            code: 333,
          },
          {
            date: 2023,
            "Hazardous waste": 0,
            code: 333,
          },
        ],
      },
      {
        seriesKey: "Home textiles",
        series: [
          {
            date: 2017,
            "Home textiles": 67000,
            code: 334,
          },
          {
            date: 2018,
            "Home textiles": 49000,
            code: 334,
          },
          {
            date: 2019,
            "Home textiles": 47000,
            code: 334,
          },
          {
            date: 2020,
            "Home textiles": 33000,
            code: 334,
          },
          {
            date: 2021,
            "Home textiles": 32000,
            code: 334,
          },
          {
            date: 2022,
            "Home textiles": 48000,
            code: 334,
          },
          {
            date: 2023,
            "Home textiles": 39000,
            code: 334,
          },
        ],
      },
      {
        seriesKey: "Jewellery & precious metal articles",
        series: [
          {
            date: 2017,
            "Jewellery & precious metal articles": 205000,
            code: 335,
          },
          {
            date: 2018,
            "Jewellery & precious metal articles": 251000,
            code: 335,
          },
          {
            date: 2019,
            "Jewellery & precious metal articles": 303000,
            code: 335,
          },
          {
            date: 2020,
            "Jewellery & precious metal articles": 94000,
            code: 335,
          },
          {
            date: 2021,
            "Jewellery & precious metal articles": 241000,
            code: 335,
          },
          {
            date: 2022,
            "Jewellery & precious metal articles": 281000,
            code: 335,
          },
          {
            date: 2023,
            "Jewellery & precious metal articles": 155000,
            code: 335,
          },
        ],
      },
      {
        seriesKey: "Live animals (except poultry)",
        series: [
          {
            date: 2017,
            "Live animals (except poultry)": 11000,
            code: 336,
          },
          {
            date: 2018,
            "Live animals (except poultry)": 6000,
            code: 336,
          },
          {
            date: 2019,
            "Live animals (except poultry)": 2000,
            code: 336,
          },
          {
            date: 2020,
            "Live animals (except poultry)": 0,
            code: 336,
          },
          {
            date: 2021,
            code: 336,
          },
          {
            date: 2022,
            "Live animals (except poultry)": 0,
            code: 336,
          },
          {
            date: 2023,
            "Live animals (except poultry)": 20000,
            code: 336,
          },
        ],
      },
      {
        seriesKey: "Live animals (poultry)",
        series: [
          {
            date: 2017,
            "Live animals (poultry)": 42000,
            code: 337,
          },
          {
            date: 2018,
            "Live animals (poultry)": 80000,
            code: 337,
          },
          {
            date: 2019,
            "Live animals (poultry)": 23000,
            code: 337,
          },
          {
            date: 2020,
            "Live animals (poultry)": 0,
            code: 337,
          },
          {
            date: 2021,
            "Live animals (poultry)": 0,
            code: 337,
          },
          {
            date: 2022,
            "Live animals (poultry)": 0,
            code: 337,
          },
          {
            date: 2023,
            "Live animals (poultry)": 0,
            code: 337,
          },
        ],
      },
      {
        seriesKey: "Live plants, flowers, foliage",
        series: [
          {
            date: 2017,
            "Live plants, flowers, foliage": 0,
            code: 338,
          },
          {
            date: 2018,
            "Live plants, flowers, foliage": 0,
            code: 338,
          },
          {
            date: 2019,
            "Live plants, flowers, foliage": 0,
            code: 338,
          },
          {
            date: 2020,
            "Live plants, flowers, foliage": 0,
            code: 338,
          },
          {
            date: 2021,
            "Live plants, flowers, foliage": 3000,
            code: 338,
          },
          {
            date: 2022,
            "Live plants, flowers, foliage": 3000,
            code: 338,
          },
          {
            date: 2023,
            code: 338,
          },
        ],
      },
      {
        seriesKey: "Machinery, electricity",
        series: [
          {
            date: 2017,
            "Machinery, electricity": 5201000,
            code: 339,
          },
          {
            date: 2018,
            "Machinery, electricity": 8279000,
            code: 339,
          },
          {
            date: 2019,
            "Machinery, electricity": 972000,
            code: 339,
          },
          {
            date: 2020,
            "Machinery, electricity": 2261000,
            code: 339,
          },
          {
            date: 2021,
            "Machinery, electricity": 1578000,
            code: 339,
          },
          {
            date: 2022,
            "Machinery, electricity": 1682000,
            code: 339,
          },
          {
            date: 2023,
            "Machinery, electricity": 2166000,
            code: 339,
          },
        ],
      },
      {
        seriesKey: "Metal products",
        series: [
          {
            date: 2017,
            "Metal products": 723000,
            code: 342,
          },
          {
            date: 2018,
            "Metal products": 556000,
            code: 342,
          },
          {
            date: 2019,
            "Metal products": 1463000,
            code: 342,
          },
          {
            date: 2020,
            "Metal products": 626000,
            code: 342,
          },
          {
            date: 2021,
            "Metal products": 1115000,
            code: 342,
          },
          {
            date: 2022,
            "Metal products": 1818000,
            code: 342,
          },
          {
            date: 2023,
            "Metal products": 697000,
            code: 342,
          },
        ],
      },
      {
        seriesKey: "Metals (except ferrous & precious)",
        series: [
          {
            date: 2017,
            "Metals (except ferrous & precious)": 23889000,
            code: 343,
          },
          {
            date: 2018,
            "Metals (except ferrous & precious)": 31109000,
            code: 343,
          },
          {
            date: 2019,
            "Metals (except ferrous & precious)": 11045000,
            code: 343,
          },
          {
            date: 2020,
            "Metals (except ferrous & precious)": 4192000,
            code: 343,
          },
          {
            date: 2021,
            "Metals (except ferrous & precious)": 6771000,
            code: 343,
          },
          {
            date: 2022,
            "Metals (except ferrous & precious)": 8068000,
            code: 343,
          },
          {
            date: 2023,
            "Metals (except ferrous & precious)": 3000,
            code: 343,
          },
        ],
      },
      {
        seriesKey: "Mineral products",
        series: [
          {
            date: 2017,
            "Mineral products": 858000,
            code: 344,
          },
          {
            date: 2018,
            "Mineral products": 560000,
            code: 344,
          },
          {
            date: 2019,
            "Mineral products": 740000,
            code: 344,
          },
          {
            date: 2020,
            "Mineral products": 605000,
            code: 344,
          },
          {
            date: 2021,
            "Mineral products": 2458000,
            code: 344,
          },
          {
            date: 2022,
            "Mineral products": 3456000,
            code: 344,
          },
          {
            date: 2023,
            "Mineral products": 1107000,
            code: 344,
          },
        ],
      },
      {
        seriesKey: "Mineral resources",
        series: [
          {
            date: 2017,
            "Mineral resources": 38000,
            code: 345,
          },
          {
            date: 2018,
            "Mineral resources": 73000,
            code: 345,
          },
          {
            date: 2019,
            "Mineral resources": 30000,
            code: 345,
          },
          {
            date: 2020,
            "Mineral resources": 11000,
            code: 345,
          },
          {
            date: 2021,
            "Mineral resources": 51000,
            code: 345,
          },
          {
            date: 2022,
            "Mineral resources": 40000,
            code: 345,
          },
          {
            date: 2023,
            "Mineral resources": 27000,
            code: 345,
          },
        ],
      },
      {
        seriesKey: "Miscellanous manufactured products",
        series: [
          {
            date: 2017,
            "Miscellanous manufactured products": 733000,
            code: 346,
          },
          {
            date: 2018,
            "Miscellanous manufactured products": 731000,
            code: 346,
          },
          {
            date: 2019,
            "Miscellanous manufactured products": 880000,
            code: 346,
          },
          {
            date: 2020,
            "Miscellanous manufactured products": 1276000,
            code: 346,
          },
          {
            date: 2021,
            "Miscellanous manufactured products": 758000,
            code: 346,
          },
          {
            date: 2022,
            "Miscellanous manufactured products": 715000,
            code: 346,
          },
          {
            date: 2023,
            "Miscellanous manufactured products": 899000,
            code: 346,
          },
        ],
      },
      {
        seriesKey: "Motor vehicles & parts",
        series: [
          {
            date: 2017,
            "Motor vehicles & parts": 652000,
            code: 347,
          },
          {
            date: 2018,
            "Motor vehicles & parts": 1139000,
            code: 347,
          },
          {
            date: 2019,
            "Motor vehicles & parts": 654000,
            code: 347,
          },
          {
            date: 2020,
            "Motor vehicles & parts": 1732000,
            code: 347,
          },
          {
            date: 2021,
            "Motor vehicles & parts": 196000,
            code: 347,
          },
          {
            date: 2022,
            "Motor vehicles & parts": 305000,
            code: 347,
          },
          {
            date: 2023,
            "Motor vehicles & parts": 473000,
            code: 347,
          },
        ],
      },
      {
        seriesKey: "Musical instruments & parts",
        series: [
          {
            date: 2017,
            "Musical instruments & parts": 14000,
            code: 348,
          },
          {
            date: 2018,
            "Musical instruments & parts": 7000,
            code: 348,
          },
          {
            date: 2019,
            "Musical instruments & parts": 9000,
            code: 348,
          },
          {
            date: 2020,
            "Musical instruments & parts": 0,
            code: 348,
          },
          {
            date: 2021,
            "Musical instruments & parts": 1000,
            code: 348,
          },
          {
            date: 2022,
            "Musical instruments & parts": 3000,
            code: 348,
          },
          {
            date: 2023,
            "Musical instruments & parts": 6000,
            code: 348,
          },
        ],
      },
      {
        seriesKey: "Nuts",
        series: [
          {
            date: 2017,
            Nuts: 53000,
            code: 350,
          },
          {
            date: 2018,
            Nuts: 67000,
            code: 350,
          },
          {
            date: 2019,
            Nuts: 71000,
            code: 350,
          },
          {
            date: 2020,
            Nuts: 49000,
            code: 350,
          },
          {
            date: 2021,
            Nuts: 87000,
            code: 350,
          },
          {
            date: 2022,
            Nuts: 46000,
            code: 350,
          },
          {
            date: 2023,
            Nuts: 103000,
            code: 350,
          },
        ],
      },
      {
        seriesKey: "Oil seeds",
        series: [
          {
            date: 2017,
            "Oil seeds": 257000,
            code: 351,
          },
          {
            date: 2018,
            "Oil seeds": 182000,
            code: 351,
          },
          {
            date: 2019,
            "Oil seeds": 393000,
            code: 351,
          },
          {
            date: 2020,
            "Oil seeds": 177000,
            code: 351,
          },
          {
            date: 2021,
            "Oil seeds": 345000,
            code: 351,
          },
          {
            date: 2022,
            "Oil seeds": 304000,
            code: 351,
          },
          {
            date: 2023,
            "Oil seeds": 495000,
            code: 351,
          },
        ],
      },
      {
        seriesKey: "Optical products, watches & medical instruments",
        series: [
          {
            date: 2017,
            "Optical products, watches & medical instruments": 1245000,
            code: 352,
          },
          {
            date: 2018,
            "Optical products, watches & medical instruments": 565000,
            code: 352,
          },
          {
            date: 2019,
            "Optical products, watches & medical instruments": 392000,
            code: 352,
          },
          {
            date: 2020,
            "Optical products, watches & medical instruments": 192000,
            code: 352,
          },
          {
            date: 2021,
            "Optical products, watches & medical instruments": 382000,
            code: 352,
          },
          {
            date: 2022,
            "Optical products, watches & medical instruments": 594000,
            code: 352,
          },
          {
            date: 2023,
            "Optical products, watches & medical instruments": 520000,
            code: 352,
          },
        ],
      },
      {
        seriesKey: "Paper products",
        series: [
          {
            date: 2017,
            "Paper products": 3110000,
            code: 353,
          },
          {
            date: 2018,
            "Paper products": 4461000,
            code: 353,
          },
          {
            date: 2019,
            "Paper products": 2135000,
            code: 353,
          },
          {
            date: 2020,
            "Paper products": 2431000,
            code: 353,
          },
          {
            date: 2021,
            "Paper products": 3530000,
            code: 353,
          },
          {
            date: 2022,
            "Paper products": 1960000,
            code: 353,
          },
          {
            date: 2023,
            "Paper products": 2548000,
            code: 353,
          },
        ],
      },
      {
        seriesKey: "Pearls & (semi-)precious stones",
        series: [
          {
            date: 2017,
            "Pearls & (semi-)precious stones": 84000,
            code: 354,
          },
          {
            date: 2018,
            "Pearls & (semi-)precious stones": 161000,
            code: 354,
          },
          {
            date: 2019,
            "Pearls & (semi-)precious stones": 331000,
            code: 354,
          },
          {
            date: 2020,
            "Pearls & (semi-)precious stones": 23000,
            code: 354,
          },
          {
            date: 2021,
            "Pearls & (semi-)precious stones": 150000,
            code: 354,
          },
          {
            date: 2022,
            "Pearls & (semi-)precious stones": 124000,
            code: 354,
          },
          {
            date: 2023,
            "Pearls & (semi-)precious stones": 130000,
            code: 354,
          },
        ],
      },
      {
        seriesKey: "Pharmaceutical components",
        series: [
          {
            date: 2017,
            "Pharmaceutical components": 316000,
            code: 355,
          },
          {
            date: 2018,
            "Pharmaceutical components": 296000,
            code: 355,
          },
          {
            date: 2019,
            "Pharmaceutical components": 201000,
            code: 355,
          },
          {
            date: 2020,
            "Pharmaceutical components": 115000,
            code: 355,
          },
          {
            date: 2021,
            "Pharmaceutical components": 2000,
            code: 355,
          },
          {
            date: 2022,
            "Pharmaceutical components": 23000,
            code: 355,
          },
          {
            date: 2023,
            "Pharmaceutical components": 364000,
            code: 355,
          },
        ],
      },
      {
        seriesKey: "Plastics & rubber",
        series: [
          {
            date: 2017,
            "Plastics & rubber": 864000,
            code: 356,
          },
          {
            date: 2018,
            "Plastics & rubber": 1452000,
            code: 356,
          },
          {
            date: 2019,
            "Plastics & rubber": 1283000,
            code: 356,
          },
          {
            date: 2020,
            "Plastics & rubber": 1054000,
            code: 356,
          },
          {
            date: 2021,
            "Plastics & rubber": 1188000,
            code: 356,
          },
          {
            date: 2022,
            "Plastics & rubber": 1326000,
            code: 356,
          },
          {
            date: 2023,
            "Plastics & rubber": 1054000,
            code: 356,
          },
        ],
      },
      {
        seriesKey: "Precious metals",
        series: [
          {
            date: 2017,
            "Precious metals": 3000,
            code: 358,
          },
          {
            date: 2018,
            code: 358,
          },
          {
            date: 2019,
            "Precious metals": 0,
            code: 358,
          },
          {
            date: 2020,
            code: 358,
          },
          {
            date: 2021,
            code: 358,
          },
          {
            date: 2022,
            code: 358,
          },
          {
            date: 2023,
            code: 358,
          },
        ],
      },
      {
        seriesKey: "Pulses",
        series: [
          {
            date: 2017,
            Pulses: 1810000,
            code: 361,
          },
          {
            date: 2018,
            Pulses: 951000,
            code: 361,
          },
          {
            date: 2019,
            Pulses: 1189000,
            code: 361,
          },
          {
            date: 2020,
            Pulses: 1885000,
            code: 361,
          },
          {
            date: 2021,
            Pulses: 2167000,
            code: 361,
          },
          {
            date: 2022,
            Pulses: 2116000,
            code: 361,
          },
          {
            date: 2023,
            Pulses: 1784000,
            code: 361,
          },
        ],
      },
      {
        seriesKey: "Rice",
        series: [
          {
            date: 2017,
            Rice: 0,
            code: 363,
          },
          {
            date: 2018,
            Rice: 1000,
            code: 363,
          },
          {
            date: 2019,
            Rice: 4000,
            code: 363,
          },
          {
            date: 2020,
            Rice: 2000,
            code: 363,
          },
          {
            date: 2021,
            Rice: 2000,
            code: 363,
          },
          {
            date: 2022,
            Rice: 22000,
            code: 363,
          },
          {
            date: 2023,
            Rice: 0,
            code: 363,
          },
        ],
      },
      {
        seriesKey: "Seeds for sowing",
        series: [
          {
            date: 2017,
            "Seeds for sowing": 0,
            code: 364,
          },
          {
            date: 2018,
            "Seeds for sowing": 1000,
            code: 364,
          },
          {
            date: 2019,
            "Seeds for sowing": 0,
            code: 364,
          },
          {
            date: 2020,
            "Seeds for sowing": 0,
            code: 364,
          },
          {
            date: 2021,
            "Seeds for sowing": 4000,
            code: 364,
          },
          {
            date: 2022,
            "Seeds for sowing": 0,
            code: 364,
          },
          {
            date: 2023,
            "Seeds for sowing": 0,
            code: 364,
          },
        ],
      },
      {
        seriesKey: "Silk (fabric)",
        series: [
          {
            date: 2017,
            code: 365,
          },
          {
            date: 2018,
            code: 365,
          },
          {
            date: 2019,
            code: 365,
          },
          {
            date: 2020,
            "Silk (fabric)": 0,
            code: 365,
          },
          {
            date: 2021,
            code: 365,
          },
          {
            date: 2022,
            "Silk (fabric)": 0,
            code: 365,
          },
          {
            date: 2023,
            "Silk (fabric)": 3000,
            code: 365,
          },
        ],
      },
      {
        seriesKey: "Skins, leather & products thereof",
        series: [
          {
            date: 2017,
            "Skins, leather & products thereof": 177000,
            code: 366,
          },
          {
            date: 2018,
            "Skins, leather & products thereof": 234000,
            code: 366,
          },
          {
            date: 2019,
            "Skins, leather & products thereof": 214000,
            code: 366,
          },
          {
            date: 2020,
            "Skins, leather & products thereof": 209000,
            code: 366,
          },
          {
            date: 2021,
            "Skins, leather & products thereof": 201000,
            code: 366,
          },
          {
            date: 2022,
            "Skins, leather & products thereof": 211000,
            code: 366,
          },
          {
            date: 2023,
            "Skins, leather & products thereof": 292000,
            code: 366,
          },
        ],
      },
      {
        seriesKey: "Spices",
        series: [
          {
            date: 2017,
            Spices: 57965000,
            code: 367,
          },
          {
            date: 2018,
            Spices: 48802000,
            code: 367,
          },
          {
            date: 2019,
            Spices: 23233000,
            code: 367,
          },
          {
            date: 2020,
            Spices: 8223000,
            code: 367,
          },
          {
            date: 2021,
            Spices: 15042000,
            code: 367,
          },
          {
            date: 2022,
            Spices: 18825000,
            code: 367,
          },
          {
            date: 2023,
            Spices: 21613000,
            code: 367,
          },
        ],
      },
      {
        seriesKey: "Sugar",
        series: [
          {
            date: 2017,
            Sugar: 8669000,
            code: 368,
          },
          {
            date: 2018,
            Sugar: 5951000,
            code: 368,
          },
          {
            date: 2019,
            Sugar: 6389000,
            code: 368,
          },
          {
            date: 2020,
            Sugar: 5806000,
            code: 368,
          },
          {
            date: 2021,
            Sugar: 1556000,
            code: 368,
          },
          {
            date: 2022,
            Sugar: 2081000,
            code: 368,
          },
          {
            date: 2023,
            Sugar: 5694000,
            code: 368,
          },
        ],
      },
      {
        seriesKey: "Synthetic textile fabric",
        series: [
          {
            date: 2017,
            "Synthetic textile fabric": 329000,
            code: 369,
          },
          {
            date: 2018,
            "Synthetic textile fabric": 446000,
            code: 369,
          },
          {
            date: 2019,
            "Synthetic textile fabric": 1186000,
            code: 369,
          },
          {
            date: 2020,
            "Synthetic textile fabric": 231000,
            code: 369,
          },
          {
            date: 2021,
            "Synthetic textile fabric": 355000,
            code: 369,
          },
          {
            date: 2022,
            "Synthetic textile fabric": 128000,
            code: 369,
          },
          {
            date: 2023,
            "Synthetic textile fabric": 175000,
            code: 369,
          },
        ],
      },
      {
        seriesKey: "Tea & mate",
        series: [
          {
            date: 2017,
            "Tea & mate": 86000,
            code: 370,
          },
          {
            date: 2018,
            "Tea & mate": 43000,
            code: 370,
          },
          {
            date: 2019,
            "Tea & mate": 0,
            code: 370,
          },
          {
            date: 2020,
            "Tea & mate": 100000,
            code: 370,
          },
          {
            date: 2021,
            "Tea & mate": 25000,
            code: 370,
          },
          {
            date: 2022,
            code: 370,
          },
          {
            date: 2023,
            code: 370,
          },
        ],
      },
      {
        seriesKey: "Textile fabric n.e.s.",
        series: [
          {
            date: 2017,
            "Textile fabric n.e.s.": 5000,
            code: 371,
          },
          {
            date: 2018,
            "Textile fabric n.e.s.": 3000,
            code: 371,
          },
          {
            date: 2019,
            "Textile fabric n.e.s.": 2000,
            code: 371,
          },
          {
            date: 2020,
            "Textile fabric n.e.s.": 6000,
            code: 371,
          },
          {
            date: 2021,
            "Textile fabric n.e.s.": 11000,
            code: 371,
          },
          {
            date: 2022,
            "Textile fabric n.e.s.": 15000,
            code: 371,
          },
          {
            date: 2023,
            "Textile fabric n.e.s.": 2000,
            code: 371,
          },
        ],
      },
      {
        seriesKey: "Textile products n.e.s.",
        series: [
          {
            date: 2017,
            "Textile products n.e.s.": 269000,
            code: 372,
          },
          {
            date: 2018,
            "Textile products n.e.s.": 282000,
            code: 372,
          },
          {
            date: 2019,
            "Textile products n.e.s.": 393000,
            code: 372,
          },
          {
            date: 2020,
            "Textile products n.e.s.": 317000,
            code: 372,
          },
          {
            date: 2021,
            "Textile products n.e.s.": 291000,
            code: 372,
          },
          {
            date: 2022,
            "Textile products n.e.s.": 325000,
            code: 372,
          },
          {
            date: 2023,
            "Textile products n.e.s.": 124000,
            code: 372,
          },
        ],
      },
      {
        seriesKey: "Tobacco products",
        series: [
          {
            date: 2017,
            "Tobacco products": 2000,
            code: 374,
          },
          {
            date: 2018,
            "Tobacco products": 3000,
            code: 374,
          },
          {
            date: 2019,
            "Tobacco products": 20000,
            code: 374,
          },
          {
            date: 2020,
            "Tobacco products": 0,
            code: 374,
          },
          {
            date: 2021,
            "Tobacco products": 21000,
            code: 374,
          },
          {
            date: 2022,
            "Tobacco products": 9000,
            code: 374,
          },
          {
            date: 2023,
            "Tobacco products": 0,
            code: 374,
          },
        ],
      },
      {
        seriesKey: "Trains & parts",
        series: [
          {
            date: 2017,
            code: 375,
          },
          {
            date: 2018,
            "Trains & parts": 0,
            code: 375,
          },
          {
            date: 2019,
            "Trains & parts": 2000,
            code: 375,
          },
          {
            date: 2020,
            "Trains & parts": 10000,
            code: 375,
          },
          {
            date: 2021,
            "Trains & parts": 6000,
            code: 375,
          },
          {
            date: 2022,
            "Trains & parts": 8000,
            code: 375,
          },
          {
            date: 2023,
            "Trains & parts": 0,
            code: 375,
          },
        ],
      },
      {
        seriesKey: "Vegetable oils & fats",
        series: [
          {
            date: 2017,
            "Vegetable oils & fats": 1000,
            code: 376,
          },
          {
            date: 2018,
            "Vegetable oils & fats": 336000,
            code: 376,
          },
          {
            date: 2019,
            "Vegetable oils & fats": 146000,
            code: 376,
          },
          {
            date: 2020,
            "Vegetable oils & fats": 94000,
            code: 376,
          },
          {
            date: 2021,
            "Vegetable oils & fats": 1213000,
            code: 376,
          },
          {
            date: 2022,
            "Vegetable oils & fats": 5353000,
            code: 376,
          },
          {
            date: 2023,
            "Vegetable oils & fats": 1930000,
            code: 376,
          },
        ],
      },
      {
        seriesKey: "Vegetables",
        series: [
          {
            date: 2017,
            Vegetables: 428000,
            code: 377,
          },
          {
            date: 2018,
            Vegetables: 710000,
            code: 377,
          },
          {
            date: 2019,
            Vegetables: 1418000,
            code: 377,
          },
          {
            date: 2020,
            Vegetables: 1551000,
            code: 377,
          },
          {
            date: 2021,
            Vegetables: 1763000,
            code: 377,
          },
          {
            date: 2022,
            Vegetables: 1705000,
            code: 377,
          },
          {
            date: 2023,
            Vegetables: 2084000,
            code: 377,
          },
        ],
      },
      {
        seriesKey: "Vegetal residues & animal feed",
        series: [
          {
            date: 2017,
            "Vegetal residues & animal feed": 126000,
            code: 378,
          },
          {
            date: 2018,
            "Vegetal residues & animal feed": 40000,
            code: 378,
          },
          {
            date: 2019,
            "Vegetal residues & animal feed": 0,
            code: 378,
          },
          {
            date: 2020,
            "Vegetal residues & animal feed": 0,
            code: 378,
          },
          {
            date: 2021,
            "Vegetal residues & animal feed": 21000,
            code: 378,
          },
          {
            date: 2022,
            "Vegetal residues & animal feed": 0,
            code: 378,
          },
          {
            date: 2023,
            "Vegetal residues & animal feed": 24000,
            code: 378,
          },
        ],
      },
      {
        seriesKey: "Vegetal textile fibers",
        series: [
          {
            date: 2017,
            "Vegetal textile fibers": 5639000,
            code: 379,
          },
          {
            date: 2018,
            "Vegetal textile fibers": 3167000,
            code: 379,
          },
          {
            date: 2019,
            "Vegetal textile fibers": 5050000,
            code: 379,
          },
          {
            date: 2020,
            "Vegetal textile fibers": 4580000,
            code: 379,
          },
          {
            date: 2021,
            "Vegetal textile fibers": 5019000,
            code: 379,
          },
          {
            date: 2022,
            "Vegetal textile fibers": 6588000,
            code: 379,
          },
          {
            date: 2023,
            "Vegetal textile fibers": 5038000,
            code: 379,
          },
        ],
      },
      {
        seriesKey: "Waste, n.e.s.",
        series: [
          {
            date: 2017,
            "Waste, n.e.s.": 93000,
            code: 380,
          },
          {
            date: 2018,
            "Waste, n.e.s.": 35000,
            code: 380,
          },
          {
            date: 2019,
            "Waste, n.e.s.": 2000,
            code: 380,
          },
          {
            date: 2020,
            "Waste, n.e.s.": 18000,
            code: 380,
          },
          {
            date: 2021,
            "Waste, n.e.s.": 6000,
            code: 380,
          },
          {
            date: 2022,
            "Waste, n.e.s.": 2000,
            code: 380,
          },
          {
            date: 2023,
            "Waste, n.e.s.": 13000,
            code: 380,
          },
        ],
      },
      {
        seriesKey: "Wood",
        series: [
          {
            date: 2017,
            Wood: 3366000,
            code: 382,
          },
          {
            date: 2018,
            Wood: 4223000,
            code: 382,
          },
          {
            date: 2019,
            Wood: 4135000,
            code: 382,
          },
          {
            date: 2020,
            Wood: 3987000,
            code: 382,
          },
          {
            date: 2021,
            Wood: 4107000,
            code: 382,
          },
          {
            date: 2022,
            Wood: 3685000,
            code: 382,
          },
          {
            date: 2023,
            Wood: 3459000,
            code: 382,
          },
        ],
      },
      {
        seriesKey: "Wood products",
        series: [
          {
            date: 2017,
            "Wood products": 410000,
            code: 383,
          },
          {
            date: 2018,
            "Wood products": 478000,
            code: 383,
          },
          {
            date: 2019,
            "Wood products": 400000,
            code: 383,
          },
          {
            date: 2020,
            "Wood products": 226000,
            code: 383,
          },
          {
            date: 2021,
            "Wood products": 191000,
            code: 383,
          },
          {
            date: 2022,
            "Wood products": 363000,
            code: 383,
          },
          {
            date: 2023,
            "Wood products": 520000,
            code: 383,
          },
        ],
      },
      {
        seriesKey: "Wool & animal hair (fabric)",
        series: [
          {
            date: 2017,
            "Wool & animal hair (fabric)": 50000,
            code: 384,
          },
          {
            date: 2018,
            "Wool & animal hair (fabric)": 137000,
            code: 384,
          },
          {
            date: 2019,
            "Wool & animal hair (fabric)": 172000,
            code: 384,
          },
          {
            date: 2020,
            "Wool & animal hair (fabric)": 1000,
            code: 384,
          },
          {
            date: 2021,
            "Wool & animal hair (fabric)": 0,
            code: 384,
          },
          {
            date: 2022,
            "Wool & animal hair (fabric)": 37000,
            code: 384,
          },
          {
            date: 2023,
            "Wool & animal hair (fabric)": 8000,
            code: 384,
          },
        ],
      },
    ],
  },
};

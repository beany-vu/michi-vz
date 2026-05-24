import React from "react";
import VerticalStackBarChart from "../src/components/VerticalStackBarChart";
import { Meta } from "@storybook/react";
import { fn } from "@storybook/test";

// Storybook stories for the VerticalStackBarChart component — a lean, curated
// showcase. Each story demonstrates a real part-to-whole analytical question
// with realistic, well-labelled data, not exhaustive prop coverage.

// --- Shared data ------------------------------------------------------------

// Electricity generation mix (TWh) for one country across four years. Each
// energy source is a series; per year its bar segment stacks into the total —
// the canonical "how is the whole composed, and how does that shift?" dataset.
const energyMixDataSet = [
  {
    seriesKey: "Coal",
    seriesKeyAbbreviation: "Coal",
    series: [
      { date: "2019", Coal: "162" },
      { date: "2020", Coal: "141" },
      { date: "2021", Coal: "118" },
      { date: "2022", Coal: "97" },
    ],
  },
  {
    seriesKey: "Natural Gas",
    seriesKeyAbbreviation: "Gas",
    series: [
      { date: "2019", "Natural Gas": "138" },
      { date: "2020", "Natural Gas": "145" },
      { date: "2021", "Natural Gas": "152" },
      { date: "2022", "Natural Gas": "149" },
    ],
  },
  {
    seriesKey: "Nuclear",
    seriesKeyAbbreviation: "Nuclear",
    series: [
      { date: "2019", Nuclear: "95" },
      { date: "2020", Nuclear: "93" },
      { date: "2021", Nuclear: "91" },
      { date: "2022", Nuclear: "88" },
    ],
  },
  {
    seriesKey: "Wind",
    seriesKeyAbbreviation: "Wind",
    series: [
      { date: "2019", Wind: "64" },
      { date: "2020", Wind: "78" },
      { date: "2021", Wind: "96" },
      { date: "2022", Wind: "121" },
    ],
  },
  {
    seriesKey: "Solar",
    seriesKeyAbbreviation: "Solar",
    series: [
      { date: "2019", Solar: "21" },
      { date: "2020", Solar: "29" },
      { date: "2021", Solar: "41" },
      { date: "2022", Solar: "58" },
    ],
  },
];

// Quarterly revenue (USD millions) split across product lines, for two
// business regions. Each year's bar stacks the five product lines, so a single
// chart can compare regions and the composition within each.
const revenueByRegionDataSet = [
  {
    seriesKey: "EMEA",
    seriesKeyAbbreviation: "EMEA",
    series: [
      { date: "2021", Cloud: "210", Hardware: "180", Licenses: "140", Services: "95", Support: "70" },
      { date: "2022", Cloud: "265", Hardware: "172", Licenses: "128", Services: "108", Support: "76" },
      { date: "2023", Cloud: "324", Hardware: "161", Licenses: "112", Services: "121", Support: "82" },
    ],
  },
  {
    seriesKey: "Americas",
    seriesKeyAbbreviation: "AMER",
    series: [
      { date: "2021", Cloud: "298", Hardware: "205", Licenses: "176", Services: "132", Support: "88" },
      { date: "2022", Cloud: "371", Hardware: "198", Licenses: "159", Services: "147", Support: "94" },
      { date: "2023", Cloud: "452", Hardware: "189", Licenses: "141", Services: "168", Support: "101" },
    ],
  },
];

// Headcount by department across a portfolio of companies — used to stress the
// legend, filtering and color generation with many series and keys.
const headcountByCompanyDataSet = (() => {
  const companies = [
    "Aperture Labs", "Initech", "Hooli", "Soylent Corp", "Stark Industries",
    "Wayne Enterprises", "Wonka Industries", "Cyberdyne Systems", "Tyrell Corp",
    "Massive Dynamic", "Umbrella Corp", "Globex", "Acme Co", "Pied Piper",
    "Vandelay Industries", "Gekko & Co", "Oscorp", "Nakatomi Trading",
  ];
  const departments = [
    "Engineering", "Sales", "Marketing", "Customer Support",
    "Finance", "Operations", "Human Resources", "Research & Development",
  ];
  const years = ["2020", "2021", "2022", "2023"];

  return companies.map(company => ({
    seriesKey: company,
    seriesKeyAbbreviation: company
      .split(" ")
      .map(word => word[0])
      .join(""),
    series: years.map(year => {
      const entry: { date: string; [key: string]: string } = { date: year };
      departments.forEach(dept => {
        entry[dept] = (Math.random() * 900 + 100).toFixed(0);
      });
      return entry;
    }),
  }));
})();

// Common props shared by the args-based stories.
const commonProps = {
  width: 900,
  height: 480,
  margin: { top: 50, right: 50, bottom: 50, left: 60 },
  yAxisFormat: (d: number) => `${d}`,
  onChartDataProcessed: fn(),
  onHighlightItem: fn(),
  onColorMappingGenerated: fn(),
  onLegendDataChange: fn(),
};

export default {
  title: "Charts/Vertical Stack Bar Chart",
  component: VerticalStackBarChart,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "**VerticalStackBarChart** turns a discrete category or time period into a single bar whose segments stack to the total — the chart to reach for when the question is *part-to-whole*: how is a whole composed, and how does that composition shift across periods? " +
          "It expects a `dataSet`: an array of series, each with a `seriesKey` and a `series` array of records keyed `{ date, [key]: value }` — every non-`date` key becomes a stacked segment, and a series can carry several keys to compare side-by-side groups per category. " +
          "Colors are auto-generated and reported via `onColorMappingGenerated`, while `filter` ranks and trims series by total value at a chosen date. " +
          "Reach for it over a line chart when the magnitude *and* the mix both matter — energy generation by source, revenue by product line, headcount by department.",
      },
    },
  },
  args: {
    onChartDataProcessed: fn(),
    onHighlightItem: fn(),
    onColorMappingGenerated: fn(),
    onLegendDataChange: fn(),
  },
} as Meta<typeof VerticalStackBarChart>;

// --- Stories ----------------------------------------------------------------

// Headline showcase: a changing composition over time.
export const Primary = {
  args: {
    ...commonProps,
    dataSet: energyMixDataSet,
    title: "Electricity Generation Mix by Source (TWh)",
    yAxisFormat: (d: number) => `${d} TWh`,
  },
  parameters: {
    docs: {
      description: {
        story:
          "The defining use case: each year is one bar, each energy source a stacked segment, and the whole bar is total generation. The story reads at a glance — coal shrinks year over year while wind and solar climb to fill the gap, a decarbonising grid that holds roughly steady total output. Hover any segment for its value and the series highlight.",
      },
    },
  },
};

// Side-by-side series groups: composition compared across two regions.
export const ComparingComposition = {
  args: {
    ...commonProps,
    dataSet: revenueByRegionDataSet,
    title: "Revenue by Product Line — EMEA vs Americas (USD M)",
    yAxisFormat: (d: number) => `$${d}M`,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Two regions, three years, five product lines per bar. Because a series can carry multiple keys, one chart answers two questions at once: which region is larger, and how each region's revenue mix is shifting. Cloud is the growth engine in both, but it is a markedly bigger share of the Americas total — exactly the contrast a flat total would hide.",
      },
    },
  },
};

// Combined tooltip — read the whole stack at one hover.
export const FullStackTooltip = {
  args: {
    ...commonProps,
    dataSet: revenueByRegionDataSet,
    title: "Revenue by Product Line — Full-Stack Tooltip",
    yAxisFormat: (d: number) => `$${d}M`,
    showCombined: true,
    tooltipFormatter: (d: { item: { date?: string | null }; seriesKey: string }) =>
      `<div style="padding:6px"><strong>${d.seriesKey}</strong> — FY${d.item?.date ?? ""}</div>`,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Stacked bars make totals easy but individual segments hard to read precisely. `showCombined` surfaces every product line for the hovered bar in a single tooltip, so an analyst can compare the parts without eyeballing segment heights. `tooltipFormatter` tailors the heading to the report's fiscal-year labelling.",
      },
    },
  },
};

// Filter — rank and trim a crowded dataset to the leaders.
export const RankingTopContributors = {
  args: {
    ...commonProps,
    dataSet: headcountByCompanyDataSet,
    width: 900,
    height: 560,
    margin: { top: 50, right: 50, bottom: 70, left: 70 },
    title: "Largest Employers by Total Headcount (2023)",
    yAxisFormat: (d: number) => `${(d / 1000).toFixed(1)}K`,
    filter: { limit: 6, sortingDir: "desc" as const, date: "2023" },
  },
  parameters: {
    docs: {
      description: {
        story:
          "With eighteen companies in the dataset, every bar would be too thin to read. The `filter` prop ranks series by total value at a chosen date and keeps the top N — here the six largest employers by 2023 headcount — so the analyst surfaces the leaders without pre-trimming the data upstream. Filtering also drives legend ordering.",
      },
    },
  },
};

// Chained part-to-whole over many periods at full scale.
export const HeadcountByDepartment = {
  args: {
    ...commonProps,
    dataSet: headcountByCompanyDataSet,
    width: 1000,
    height: 620,
    margin: { top: 50, right: 50, bottom: 90, left: 80 },
    title: "Workforce Composition by Department (Headcount)",
    yAxisFormat: (d: number) => `${(d / 1000).toFixed(1)}K`,
  },
  parameters: {
    docs: {
      description: {
        story:
          "The full eighteen-company portfolio with eight departments stacked per bar across four years. At this density the chart shows organisational scale and how the departmental mix differs between firms — engineering-heavy versus sales-heavy workforces stand out by segment thickness. Colors and legend order are generated by the chart and emitted through `onColorMappingGenerated`.",
      },
    },
  },
};

// SVG vs Canvas renderer parity check — same dataset, both backends stacked.
export const RendererComparison = {
  render: (args: React.ComponentProps<typeof VerticalStackBarChart>) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      <div>
        <h4 style={{ margin: "0 0 8px", font: "600 13px sans-serif" }}>renderer=&quot;svg&quot;</h4>
        <VerticalStackBarChart {...args} renderer="svg" />
      </div>
      <div>
        <h4 style={{ margin: "0 0 8px", font: "600 13px sans-serif" }}>
          renderer=&quot;canvas&quot;
        </h4>
        <VerticalStackBarChart {...args} renderer="canvas" />
      </div>
    </div>
  ),
  args: {
    ...commonProps,
    dataSet: revenueByRegionDataSet,
    title: "Revenue by Product Line — EMEA vs Americas (USD M)",
    yAxisFormat: (d: number) => `$${d}M`,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Parity check for the opt-in Canvas 2D renderer. The same dataset is rendered twice — `renderer=\"svg\"` (the default, one `<rect>` per segment) above and `renderer=\"canvas\"` (all segments painted on a single `<canvas>`) below. Bars, side-by-side series groups, rounded corners, series labels, highlight dimming and the hover/click tooltip should look and behave identically; canvas mode trades the retained SVG nodes for a single canvas so large datasets stay smooth.",
      },
    },
  },
};

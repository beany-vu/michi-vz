import React from "react";
import VerticalStackBarChart from "../src/components/VerticalStackBarChart";
import { Meta } from "@storybook/react-webpack5";
import { fn } from "storybook/test";

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

// Monthly transportation cost share for two cost categories across 26 months
// — dense enough that horizontal x-axis labels can't all fit, triggering the
// auto-rotate-and-overlap behaviour in XaxisBand.
const monthlyTransportationCostDataSet = (() => {
  // Deterministic pseudo-random so the snapshot is stable across reruns.
  let seed = 17;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  const months: string[] = [];
  for (let year = 2022; year <= 2024; year++) {
    const startMonth = year === 2022 ? 4 : 1;
    const endMonth = year === 2024 ? 5 : 12;
    for (let month = startMonth; month <= endMonth; month++) {
      months.push(`${String(month).padStart(2, "0")}-${year}`);
    }
  }

  return [
    {
      seriesKey: "External Freight",
      seriesKeyAbbreviation: "E",
      series: months.map(date => ({ date, "External Freight": (4 + rand() * 9).toFixed(2) })),
    },
    {
      seriesKey: "Insurance",
      seriesKeyAbbreviation: "I",
      series: months.map(date => ({ date, Insurance: (0.1 + rand() * 1.2).toFixed(2) })),
    },
  ];
})();

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
  margin: { top: 50, right: 50, bottom: 70, left: 80 },
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
          "**VerticalStackBarChart** turns a discrete category or time period into a single bar whose segments stack to the total, the chart to reach for when the question is *part-to-whole*: how is a whole composed, and how does that composition shift across periods? " +
          "It expects a `dataSet`: an array of series, each with a `seriesKey` and a `series` array of records keyed `{ date, [key]: value }`. Every non-`date` key becomes a stacked segment, and a series can carry several keys to compare side-by-side groups per category. " +
          "Colors are auto-generated and reported via `onColorMappingGenerated`, while `filter` ranks and trims series by total value at a chosen date. " +
          "Reach for it over a line chart when the magnitude *and* the mix both matter: energy generation by source, revenue by product line, headcount by department.",
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
          "Each year is one bar, each energy source a coloured segment within it, and the whole bar is total electricity generated. Coal shrinks year over year while wind and solar climb to fill the gap. It is a decarbonising grid where the total stays roughly flat. The chart shows magnitude *and* mix in one read; hover any segment for the underlying value.",
      },
    },
  },
};

// Side-by-side series groups: composition compared across two regions.
export const ComparingComposition = {
  args: {
    ...commonProps,
    dataSet: revenueByRegionDataSet,
    title: "Revenue by Product Line: EMEA vs Americas (USD M)",
    yAxisFormat: (d: number) => `$${d}M`,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Revenue for two regions across three years, with each bar split into five product lines. One view answers two questions at once: which region is bigger overall, and how the mix differs between them. Cloud is the growth engine in both regions but takes a markedly larger share of the Americas total. A flat total would hide that distinction entirely.",
      },
    },
  },
};

// Combined tooltip — read the whole stack at one hover.
export const FullStackTooltip = {
  args: {
    ...commonProps,
    dataSet: revenueByRegionDataSet,
    title: "Revenue by Product Line: Full-Stack Tooltip",
    yAxisFormat: (d: number) => `$${d}M`,
    showCombined: true,
    tooltipFormatter: (d: { item: { date?: string | null }; seriesKey: string }) =>
      `<div style="padding:6px"><strong>${d.seriesKey}</strong>: FY${d.item?.date ?? ""}</div>`,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Stacked bars make totals easy but make individual segment heights hard to read precisely. `showCombined` pops a single tooltip listing every product line for the hovered bar, so an analyst can read the parts directly instead of estimating segment heights by eye. `tooltipFormatter` here also relabels the heading as `FY2023`-style to match a finance report.",
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
          "Eighteen companies' worth of data, trimmed to the six largest employers by 2023 headcount. The `filter` prop ranks series by total at a chosen date and keeps the top N, so the analyst surfaces the leaders without having to pre-trim the dataset upstream. The same ranking drives legend order.",
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
          "The full eighteen-company portfolio with eight departments stacked per bar across four years, the dense unfiltered view. Bar height shows organisational scale while segment thickness reveals which firms are engineering-heavy versus sales-heavy at a glance. Colours and legend order are generated by the chart and emitted via `onColorMappingGenerated`.",
      },
    },
  },
};

// Dense monthly data — x-axis labels auto-rotate so none disappear.
export const AutoRotatingXAxisLabels = {
  args: {
    ...commonProps,
    dataSet: monthlyTransportationCostDataSet,
    renderer: "canvas" as const,
    width: 1100,
    height: 480,
    margin: { top: 50, right: 50, bottom: 50, left: 60 },
    title: "Transportation Cost Share: 26 Months",
    yAxisFormat: (d: number) => `${d}%`,
  },
  parameters: {
    docs: {
      description: {
        story:
          "26 monthly bars side-by-side, too many for the dates to sit horizontally without colliding. Instead of dropping every other label, the chart measures the width available and tilts them to -45° so every month stays visible and the time sequence is never broken. The bottom margin auto-expands to fit; pass `xAxisLabelMode=\"horizontal\"` to opt out and revert to the legacy skip-with-dots behaviour.",
      },
    },
  },
};

// Explicit, fixed stacking order — pin the layers by their latest-year value so
// the stack doesn't reshuffle between periods. Product lines ranked by their
// latest-year (2023) total across both regions, largest first.
const LATEST_REVENUE_YEAR = "2023";
const revenueKeysByLatestYearDesc = (() => {
  const totals: { [key: string]: number } = {};
  revenueByRegionDataSet.forEach(ds => {
    const row = ds.series.find(s => s.date === LATEST_REVENUE_YEAR);
    if (!row) return;
    Object.entries(row).forEach(([key, value]) => {
      if (key !== "date") totals[key] = (totals[key] ?? 0) + Number(value);
    });
  });
  return Object.keys(totals).sort((a, b) => totals[b] - totals[a]);
})();

// Largest category anchored at the bottom, fixed across periods.
export const FixedOrderByLatestYear = {
  args: {
    ...commonProps,
    dataSet: revenueByRegionDataSet,
    title: "Revenue by Product Line: Fixed Order (Largest at Bottom)",
    yAxisFormat: (d: number) => `$${d}M`,
    keys: revenueKeysByLatestYearDesc,
    keysOrder: "bottomToTop" as const,
  },
  parameters: {
    docs: {
      description: {
        story:
          "By default a stacked bar orders its segments by the data's insertion order, so the visual stack can reshuffle between periods and frustrate year-over-year comparison. Here `keys` pins an explicit order — the product lines ranked by their latest-year (2023) total — and `keysOrder=\"bottomToTop\"` anchors the largest line (Cloud) at the bottom of every bar. The order is identical across 2021–2023, so a reader can track each layer's growth without the stack rearranging underneath them.",
      },
    },
  },
};


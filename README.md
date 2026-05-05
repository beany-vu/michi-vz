# michi-vz

**Ready-made charts for React.** Drop in a component, pass your data, get a polished chart powered by [D3](https://d3js.org/) and TypeScript.

[![npm](https://img.shields.io/npm/v/michi-vz.svg)](https://www.npmjs.com/package/michi-vz)
[![GitHub](https://img.shields.io/badge/GitHub-michi--vz-181717?logo=github)](https://github.com/beany-vu/michi-vz)

> Repository: **<https://github.com/beany-vu/michi-vz>**

---

## Why use it?

- **Just works.** No glue code between React and D3 — pass `data`, get a chart.
- **Looks consistent.** A single `MichiVzProvider` themes every chart in your app.
- **Built for dashboards.** Cross-chart highlighting, shared color mappings, and disabled-item filtering are first-class.
- **Typed end-to-end.** Full TypeScript types for every prop and data shape.

## Charts included

| Chart | Use it for |
| --- | --- |
| `LineChart` | Trends over time |
| `AreaChart` | Filled trends, stacked totals |
| `BarBellChart` | Comparing two values per category |
| `RadarChart` | Multi-axis comparisons |
| `RangeChart` | Min/max ranges over a series |
| `RibbonChart` | Flowing band visualizations |
| `ScatterPlotChart` | Two-variable distributions |
| `VerticalStackBarChart` | Stacked bars over time |
| `ComparableHorizontalBarChart` | Side-by-side ranking |
| `DualHorizontalBarChart` | Two-direction comparisons |
| `GapChart` | Gap-between-values displays |

## Install

```bash
npm install michi-vz
```

## Quick start

```jsx
import { LineChart, MichiVzProvider } from "michi-vz";

<MichiVzProvider>
  <LineChart
    dataSet={[
      {
        seriesKey: "Sales",
        series: [
          { date: "2024", Sales: 120 },
          { date: "2025", Sales: 180 },
          { date: "2026", Sales: 240 },
        ],
      },
    ]}
    width={600}
    height={300}
  />
</MichiVzProvider>
```

That's the whole quickstart — see [Storybook](https://beany-vu.github.io/michi-vz/) for live examples of every chart.

## Color control

Three ways to color your charts, pick what fits:

1. **Auto** — pass nothing, the chart picks colors for you.
2. **Explicit** — pass `colorsMapping={{ Sales: "#1f77b4" }}`.
3. **External** — pass `skipColorMappingDispatch` when something else (CSS rules, Redux, etc.) owns colors. The chart then waits for your colors instead of flashing wrong ones on first paint.

```jsx
<LineChart
  dataSet={...}
  colorsMapping={externalColors}
  skipColorMappingDispatch  // chart will not emit its own mapping
/>
```

## Cross-chart sync

For dashboards where hovering one chart highlights every chart, lift state up — either with `MichiVzProvider`, Redux, or your own context — and pass `highlightItems` / `disabledItems` to each chart. See the [Storybook examples](https://beany-vu.github.io/michi-vz/) for working patterns.

## Requirements

- React **19+**
- A bundler that handles ESM (Vite, Next.js, webpack 5, etc.)

## Contributing

```bash
npm install
npm run storybook    # play with components on :6006
npm run test         # run the test suite
npm run build        # produce dist/
```

Issues and PRs welcome at [github.com/beany-vu/michi-vz](https://github.com/beany-vu/michi-vz).

## License

ISC © Hoang VQ

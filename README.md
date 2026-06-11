# michi-vz

**Ready-made charts for React.** Drop in a component, pass your data, get a polished chart built on [D3](https://d3js.org/) and TypeScript.

[![npm](https://img.shields.io/npm/v/michi-vz.svg)](https://www.npmjs.com/package/michi-vz)
[![GitHub](https://img.shields.io/badge/GitHub-michi--vz-181717?logo=github)](https://github.com/beany-vu/michi-vz)

**Live examples and full docs: [beany-vu.github.io/michi-vz](https://beany-vu.github.io/michi-vz/)**

## Why

- **No glue code.** Pass `data`, get a chart. React and D3 are already wired together.
- **Consistent theming.** One `MichiVzProvider` colors and styles every chart in your app.
- **Built for dashboards.** Cross-chart highlighting, shared color mappings, and disabled-item filtering are first-class, not afterthoughts.
- **Typed end to end.** Every prop and data shape ships with TypeScript types.

## Charts

`LineChart` `AreaChart` `BarBellChart` `RadarChart` `RangeChart` `RibbonChart` `ScatterPlotChart` `VerticalStackBarChart` `ComparableHorizontalBarChart` `DualHorizontalBarChart` `GapChart`

See each one running with editable props in [Storybook](https://beany-vu.github.io/michi-vz/).

## Quick start

```bash
npm install michi-vz
```

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

That's the whole setup. Need React 19+ and an ESM bundler (Vite, Next.js, webpack 5).

## Going further

- **Color control.** Let charts auto-pick colors, pass `colorsMapping`, or hand off control entirely with `skipColorMappingDispatch` when CSS or a store owns colors.
- **Cross-chart sync.** Lift `highlightItems` and `disabledItems` into shared state so hovering one chart highlights the rest.

Both have working examples in [Storybook](https://beany-vu.github.io/michi-vz/).

## Contributing

```bash
npm install
npm run storybook    # components on :6006
npm run test         # test suite
npm run build        # produce dist/
```

Issues and PRs welcome.

## License

ISC © Hoang VQ

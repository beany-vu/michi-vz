# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React-based data visualization library (michi-vz) that provides various chart components built with D3.js and TypeScript. The library is published to npm and uses Storybook for component development and documentation.

**Important:** This project uses React 19.

## Common Commands

### Development
```bash
npm install              # Install dependencies
npm run build           # Build the library (tsc && tsc-alias)
npm run lint            # Run ESLint with TypeScript support
npm run test            # Run Jest tests with coverage
npm run test:watch      # Run tests in watch mode
npm run storybook       # Start Storybook on port 6006
npm run build-storybook # Build static Storybook
npm run deploy-storybook # Deploy Storybook to GitHub Pages
```

### Testing Specific Files
```bash
npm test -- LineChart.test.tsx           # Run specific test file
npm test -- --watch LineChart.test.tsx   # Watch specific test file
npm test -- --coverage=false             # Run tests without coverage
```

## Architecture

### Component Structure
Charts are organized as individual components in `src/components/`, each with:
- Main component file (e.g., `LineChart.tsx`)
- Associated hooks in `src/components/hooks/` (complex charts like LineChart have dedicated subdirectories)
- Tests in `src/components/__tests__/`
- Storybook stories in `stories/`

### Chart Components Available
- LineChart, AreaChart, BarBellChart, RadarChart
- RangeChart, RibbonChart, ScatterPlotChart
- VerticalStackBarChart, ComparableHorizontalBarChart, DualHorizontalBarChart

### Context Provider
The `MichiVzProvider` component provides theme and color configuration context to all charts. It should wrap chart components when custom theming is needed.

### Testing Environment
- Jest is configured with React 19 compatibility
- Tests use React Testing Library with a custom test-utils wrapper
- D3 modules are automatically mocked
- 15-second timeout configured for async React rendering

### Build Output
- Library builds to `dist/` with TypeScript declarations
- Entry point: `dist/index.js`
- All components are exported from `src/components/index.ts`

### Note for development
- On adding new features, remember to has default value if needed to avoid breaking other parts of the lib

## Canvas renderer: consumer CSS contract

Charts that opt into `renderer="canvas"` resolve mark colors via an SVG probe element (`src/components/hooks/canvas/resolveMarkColors.ts`). The contract is narrower than SVG and easy to violate:

- **The probe only reads `fill` and `stroke`** (passed in `colorProp`, which may be `["fill", "stroke"]` to try fill first then fall back to stroke). Each property is skipped if its computed value is `none`, empty, or starts with `url(` (SVG pattern/gradient — canvas can't paint those). The first usable value wins; otherwise the consumer-supplied `fallback` is used.
- **`opacity`, `visibility`, `display`, `transform` and other CSS are NOT read.** Rules like `.value-based { opacity: 0; visibility: hidden; }` hide nothing in canvas — the probe still reads a real `fill`/`stroke` from the matched rule (or the XML attribute fallback) and the renderer paints it.
- **To hide a mark in canvas mode**, set both `fill: transparent` and `stroke: transparent`. `"transparent"` resolves to `rgba(0, 0, 0, 0)` which is a valid, "usable" color the probe picks → renderer paints a fully transparent shape.
- **Sub-bar charts (e.g. `ComparableHorizontalBarChart`)**: each sub-bar (`value-based`, `value-compared`) is probed independently. Consumer CSS must cover **all visible sub-bars** under `skipColorMappingDispatch`, because the chart's internal `finalColorsMapping` defaults to `"transparent"` for unmapped labels (the spread order means it overrides any `MichiVzProvider` context colors). Missing CSS for one sub-bar → that sub-bar is invisible.
- **The probe matches by `data-label-safe`, built with `sanitizeForClassName`** (`/[^a-z0-9]/gi → "_"`, in `src/components/hooks/lineChart/lineChartUtils.ts`). A consumer that builds its own `data-label-safe` / per-label CSS selector with a DIFFERENT transform (e.g. replacing spaces/punctuation with `"-"`) targets a selector the probe element does NOT carry → no match → the `transparent` fallback → invisible, *even though the `<style>` block is present*. If you synthesize a legend or inject per-label CSS consumer-side, use the SAME `sanitizeForClassName` (better: export it and import it, don't re-derive). A second, related blank: the injected CSS is keyed to a legend that has gone **stale** (right rule, but the previous render's labels). Real case: thd `BorderCrossingTime` — a within-indicator steps change left stale legend labels, and its synthetic fallback used `-` instead of `_`, so step labels with spaces painted transparent.

When debugging an invisible canvas chart, first check what CSS rules the consumer is injecting against `.{markClassName}[data-label-safe="..."]` — most "blank chart" regressions come down to a missing / `url(...)`-only `<style>` block, a **sanitizer mismatch** on `data-label-safe`, or **stale** legend labels.

## VerticalStackBarChart: marker rect `hasOwnProperty` rule

`prepareStackedData` iterates `effectiveKeys` (the union of all keys across all visible DataSets) per yearData. The `missingDataMarker` feature must distinguish two cases that both produce `value === undefined`:

1. **Data gap** — the key IS a property of `yearData` (with `null` / `NaN` / `undefined`). This DataSet "owns" the key but has no value for this date. Emit a marker.
2. **Different DataSet's slot** — the key is NOT a property of `yearData`. It belongs to another DataSet entirely; its bar (or its own marker) belongs in that DataSet's slot, not here.

The marker emission is guarded with `Object.prototype.hasOwnProperty.call(yearData, key)`. Without this guard, every yearData gets a stub for every key it doesn't own → a continuous "strip" of stubs across the bottom of the chart in every group's slot. Tests in `__tests__/VerticalStackBarChart.test.tsx` cover both cases — keep them passing if you refactor the marker emission.

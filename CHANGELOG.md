# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed
- **📊 Rotated band-axis labels are no longer clipped at the bottom edge.**
  `XaxisBand` now measures the longest rendered tick label and reports the
  bottom margin it needs via `onAxisModeChange(mode, requiredBottomMargin)`
  (backward-compatible second argument). `ScatterPlotChart`, `RibbonChart` and
  `VerticalStackBarChart` grow their effective bottom margin to
  `max(margin.bottom, requiredBottomMargin)`, so long category labels (e.g.
  "Sao Tome and Principe" rotated -45°) render fully inside the SVG instead of
  being cropped. The consumer-passed `margin.bottom` remains the minimum; the
  plot area shrinks only by what the labels actually need.


### Changed
- **📊 `VerticalStackBarChart` now floors small bars so tiny data stays visible.**
  `minBarHeight` (new, default `15`) floors a non-zero segment's height;
  `minBarWidth` default was raised `1` → `5` so thin bars in dense charts keep a
  visible thickness. This is a **visual change**: existing charts with small
  segments or very narrow bands will show the minimum where they previously
  showed (almost) nothing. The height floor only affects segments whose natural
  height is below it; taller bars are unchanged. Segments are stacked with a
  running pixel cursor, so floored segments push their neighbors up rather than
  overlap, which means a stack full of tiny values may extend slightly past the
  axis top. Literal `0` values (and missing values) are never floored. Set
  `minBarHeight={0}` / `minBarWidth={0}` to restore the old behavior. Applies to
  both the SVG and canvas renderers.
- **📊 `ComparableHorizontalBarChart` bar-length floor is now configurable and
  defaults to 5px** (was a hardcoded 3px). A bar's length encodes its value, so
  tiny values were clamped to 3px; the new `minBarWidth` prop controls this and
  raising the default 3 → 5 is a small **visual change** for charts with very
  small values. Set `minBarWidth={3}` to keep the old length. Applies to both
  the SVG and canvas renderers.
- **📈 Default line curve is now `curveMonotoneX`** (was `curveBumpX`) for
  `LineChart` and `RangeChart`. It passes through every point, follows the data's
  local slope without overshoot, and renders a 2-point series as a straight line
  instead of an S-bend. `AreaChart` already used `curveMonotoneX` (unchanged).
  - To keep the old look, set `curve: "curveBumpX"` — per-series on `LineChart`
    (`dataSet[].curve`), or chart-level on `AreaChart` / `RangeChart` (`curve` prop).
  - Supported values: `"curveMonotoneX"` (default), `"curveBumpX"`, `"curveLinear"`.
  - Both the SVG and canvas renderers honor the setting identically.

### Added
- **`minBarHeight` prop on `VerticalStackBarChart`** (default `15`) controlling the
  minimum drawn height of non-zero stacked segments. Mirrors `minBarWidth` (whose
  default was raised to `5`). Pass `0` to opt out of the floor.
- **`minBarHeightZero` prop on `VerticalStackBarChart`** (default `0`, opt-in) — a
  separate, smaller floor applied only to segments whose value is exactly `0`, so
  a present-but-zero entry can show a thin stub instead of vanishing. Kept distinct
  from `minBarHeight` so real-but-small values and true zeros read differently.
  Stubs stack like any segment; missing values (null/undefined) are unaffected
  (use `missingDataMarker` for those).
- **`minBarWidth` prop on `ComparableHorizontalBarChart`** (default `5`)
  controlling the minimum drawn bar length, replacing the previous hardcoded 3px.
  Pass `0` to opt out of the floor.
- **`curve` prop on `AreaChart` and `RangeChart`** (chart-level) for choosing the
  interpolation. Previously both hardcoded their curve with no override.
- **`detectGaps` (opt-in) on `LineChart`**: auto-detects missing time periods and
  renders them as dashed straight segments, without per-point `certainty` flags.
  When on, each series is normalized (sorted, de-duplicated keeping the last,
  invalid points dropped) and any interval larger than the expected step is
  dashed. The expected step defaults to 1 for `date_annual`/`date_monthly`; pass
  `expectedStep` to override, and it is required for `xAxisDataType="number"`. A
  detected gap overrides an explicit `certainty: true`; it never overrides
  `certainty: false`. Default off, so existing charts are unchanged.

### Fixed
- **`YaxisBand` no longer fades all tick labels to 0.3** when the consumer omits
  `hoveredItem` (e.g. `ComparableHorizontalBarChart`, which never wires hover).
  The no-hover guard `hoveredItem === null` failed for an `undefined` prop and
  dimmed every label on first paint; `hoveredItem` now defaults to `null`.

## [0.6.17] - 2026-06-16

### Added
- **📊 `VerticalStackBarChart` accepts an explicit `keys` ordering.** A new
  optional `keys?: string[]` prop sets the canonical order for the stack,
  legend and colour assignment: prop order wins for keys present in the data,
  data keys the prop omits are appended (never dropped), and entries not in the
  data are ignored. A companion `keysOrder?: "topToBottom" | "bottomToTop"`
  (default `"topToBottom"`) chooses which end of the array anchors the bottom of
  the stack — pass keys sorted descending with `"bottomToTop"` to keep the
  largest category at the bottom and the order fixed across periods. Both props
  are optional and default to the previous insertion-order behaviour, so
  existing charts are unaffected.

## [0.6.3] - 2026-05-24

### Changed
- **🎨 `RadarChart` canvas hover-dot opacity**: the pole-point circle on a
  hovered/highlighted series is now fully opaque (`1.0`, was `0.3`) so the
  vertex under the cursor reads as a clear marker. Diverges from the SVG
  renderer's historical 0.3 — intentional, since the canvas hover affordance
  benefits from a stronger visual anchor.

## [0.6.2] - 2026-05-24

### Changed
- **🎨 `RadarChart` canvas `dimmed` visual tuning**: the dim factor is now
  `0.2` (was `0.3`) and non-dimmed series get a thicker stroke (`3px` vs `2px`)
  when the chart has any `dimmed: true` series. The thicker stroke is gated on
  "anyone is dimmed" so consumers that never set the field keep the original
  `2px` stroke (backward compatible). Goal: push the visual hierarchy harder
  between the highlighted subset and the faded background.

## [0.6.1] - 2026-05-24

### Added
- **🎨 `dimmed` per-series field on `RadarChart` (canvas renderer)**: opt-in
  visual fade for individual series, applied at paint time on `<canvas>`.
  - Set `dimmed: true` on any series item and that polygon (and its pole
    points) paint at reduced alpha (0.3 by default).
  - Independent of and composable with `highlightItems` — the two effects
    multiply, so a dimmed-and-non-highlighted series is faintest.
  - Intended for "highlight a subset, fade the rest" UX patterns that are
    data-driven (e.g. "all years except the current one") and can't be
    expressed via `highlightItems` (which is typically reserved for hover).
  - Default `undefined` preserves the original behaviour. Backward compatible.
  - Canvas-only: SVG consumers can achieve the same effect via CSS targeting
    `<g class="series" data-label="...">` nodes.

## [0.5.47] - 2026-05-02

### Added
- **🎨 `skipColorMappingDispatch` prop on all chart components**: opt-in
  "wait-for-legend" / external-color mode for consumers that own colors via
  CSS injection or a Redux-side color generator.
  - Available on `LineChart`, `AreaChart`, `BarBellChart`,
    `ComparableHorizontalBarChart`, `DualHorizontalBarChart`, `GapChart`,
    `RadarChart`, `ScatterPlotChart`, `VerticalStackBarChart`.
  - When `true`:
    - The chart does NOT call `onColorMappingGenerated`, preventing the
      auto-generated COLORS-array mapping from leaking into the consumer's
      legend store.
    - Labels with no entry in `colorsMapping` and no `item.color` resolve to
      `"transparent"` rather than the COLORS palette, eliminating the
      "wrong colors flash" before the consumer's CSS / Redux colors arrive.
    - Labels that DO have `item.color` or `colorsMapping[label]` set paint
      with their proper color from frame 1.
  - Default `false` preserves the original behaviour. Backward compatible.
  - See README "External-color mode" section for full details.

## [0.5.2] - 2025-06-17

### Fixed
- **🐛 GapChart Critical Fix**: Completely removed animation logic from `useGapChartAnimation` hook to prevent infinite loops
  - Simplified hook now returns static values without state management
  - Eliminates "Maximum update depth exceeded" errors in GapChart usage
  - Maintains API compatibility while removing problematic animation features

### Added
- **🔍 Better Debugging**: Enhanced build process with source maps and unminified output
  - Added source maps (`sourceMap: true`, `declarationMap: true`) for better stack traces in consuming projects
  - Stack traces now show original TypeScript file names instead of minified ones
  - Added `inlineSources: true` for embedded source content
  - New build commands: `build:files`, `build:debug`, `build:trace`, `type-check`

---

## [0.5.1] - 2025-06-17

### Fixed
- **🐛 Critical Bug Fixes**: Resolved infinite loop issues in LineChart and GapChart components that were causing "Maximum update depth exceeded" errors
  - Fixed `useLineChartMetadataExpose` hook by removing function callbacks from dependency array
  - Fixed `useLineChartPathsShapesRendering` hook by removing unstable function dependencies  
  - Fixed `useGapChartAnimation` hook by removing problematic `requestAnimationFrame` state updates
  - Fixed `useGapChartMetadata` hook by removing callback functions from dependency arrays
  - Fixed `useColorMapping` hook to avoid function dependencies

### Removed
- **🧹 Dead Code Cleanup**: Removed unused files and folders to reduce bundle size and confusion
  - Removed `/src/redux/` folder (contained empty `chartMetadataSlice.ts`)
  - Removed `/src/reducer.ts` (unused useReducer implementation)
  - Removed `/src/workers/chartWorker.ts` (unused web worker)
  - Removed `/src/utils/chartEvents.ts` (empty file)
  - Removed `/src/helper.js` (contained only empty function)
  - Removed `/src/index.d.js` (unused type export file)

### Changed  
- **📝 Code Quality**: Improved code quality and linting compliance
  - Removed unused `useChartContext` imports from 5 chart components
  - Fixed unused variables in test files and hook implementations
  - Updated `@ts-ignore` comments to `@ts-expect-error` for better TypeScript compliance
  - Commented out unused code rather than deleting for future reference
  - Reduced linting errors from 35 to 13 (63% improvement)

### Technical Notes
- **⚡ Performance**: Charts should now render without infinite re-render loops
- **🔧 Build**: TypeScript compilation and build process remains stable
- **🧪 Tests**: All existing tests continue to pass
- **📦 Bundle**: Smaller bundle size due to dead code removal

---

## Previous Versions

*This changelog was started on 2025-06-17. For changes prior to this date, please refer to the git commit history.*
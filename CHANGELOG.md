# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
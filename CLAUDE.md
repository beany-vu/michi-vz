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
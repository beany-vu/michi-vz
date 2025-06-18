# Overview

A React-based data visualization library built with D3.js and TypeScript.

## Recent Updates (v0.5.2)
- ✅ **Fixed infinite loop issues** in LineChart and GapChart components 
- ✅ **Improved stability** - resolved "Maximum update depth exceeded" errors
- ✅ **Better debugging** - added source maps for clearer stack traces in consuming projects
- ✅ **Code cleanup** - removed unused Redux/worker files for smaller bundle size
- ✅ **Better performance** - optimized useEffect dependencies across components

## Tech Stack
- `react`/`typescript`
- `storybook` for component development
- `eslint` and `prettier` to harmonize the code base
- `styled-components` for styling
- `d3` for data visualization

# Project structure

    - `/src`: all source files go here
        - `/components`: individual components shared across the project
        - `/components/__tests__`: test files for components
    - `/node_modules`: handled by npm, don't touch this
    - `stories`: contains stories for storybook

# Configure your project

1. **Install dependencies**:
   ```
   npm install
   ```

2. **Configure TypeScript**:
   - The `tsconfig.json` file is already set up to handle both source code and Storybook stories
   - Make sure your stories match the component interfaces to avoid type errors

3. **Setup Storybook**:
   - Storybook is configured to run on port 6006
   - Component stories should be placed in the `stories/` directory
   - Use the MichiVzProvider to provide theme and color settings for your components

4. **Linting and Formatting**:
   - Run `npm run lint` to check for linting errors
   - Run `npm run lint:fix` to automatically fix linting issues

# Testing

1. **Running Tests**:
   ```
   npm run test          # Run all tests
   npm run test:watch    # Run tests in watch mode
   npm run test -- -u    # Update snapshots
   ```

2. **Test Structure**:
   - Tests are located in `src/components/__tests__/`
   - Each component should have a corresponding `ComponentName.test.tsx` file
   - Utility functions and mocks are in `test-utils.tsx`
   - Global mocks for React 19 are in `setupTests.js`

3. **React 19 Compatibility**:
   - Tests are set up to handle React 19's concurrent rendering features
   - We use longer timeouts for async operations due to React 19's rendering behavior
   - Some React 19 APIs are mocked in the test environment for stability
   - Make sure to use the latest `@testing-library/react` (v15+) for compatibility

4. **Writing Tests**:
   - Use the `customRender` function from test-utils to render components with the MichiVzProvider
   - SVG methods used by D3 are automatically mocked
   - Sample data is provided for common chart types
   - Use `waitFor` with increased timeouts for React 19 asynchronous rendering

5. **Code Coverage**:
   ```
   npm run test -- --coverage
   ```
   - This will generate a coverage report in the `/coverage` directory

# Color Management & State Integration

## Self-Generated Colors

Both `AreaChart` and `LineChart` support automatic color generation:

```jsx
// Automatic color generation
<AreaChart
  keys={["Sales", "Marketing", "Development"]}
  colors={["#1f77b4", "#ff7f0e", "#2ca02c"]} // Optional custom palette
  onColorMappingGenerated={(colors) => {
    // colors = { "Sales": "#1f77b4", "Marketing": "#ff7f0e", "Development": "#2ca02c" }
    console.log("Generated colors:", colors);
  }}
  {...otherProps}
/>
```

## Redux Integration Pattern

Use `onColorMappingGenerated` to store colors in Redux for cross-chart synchronization:

```jsx
// Redux slice
const chartSlice = createSlice({
  name: 'charts',
  initialState: { colorMappings: {}, highlightItems: [] },
  reducers: {
    setColorMapping: (state, action) => {
      const { chartId, colors } = action.payload;
      state.colorMappings[chartId] = colors;
    },
    setHighlightItems: (state, action) => {
      state.highlightItems = action.payload;
    }
  }
});

// Component usage
const Dashboard = () => {
  const dispatch = useDispatch();
  const { colorMappings, highlightItems } = useSelector(state => state.charts);

  return (
    <div>
      {/* Master chart generates colors */}
      <AreaChart
        onColorMappingGenerated={(colors) => 
          dispatch(setColorMapping({ chartId: 'global', colors }))
        }
        onHighlightItem={(items) => dispatch(setHighlightItems(items))}
        {...chart1Props}
      />
      
      {/* Slave charts use generated colors */}
      <AreaChart
        colorsMapping={colorMappings.global || {}}
        {...chart2Props}
      />
      <LineChart
        colorsMapping={colorMappings.global || {}}
        {...chart3Props}
      />
    </div>
  );
};
```

## Color Management Options

1. **Self-Generated (Default)**: Charts automatically assign colors from palette
2. **Explicit Mapping**: Provide specific colors via `colorsMapping` prop
3. **Context-Based**: Use `MichiVzProvider` for shared colors across charts
4. **Hybrid**: Combine context + component-specific overrides

## Interactive Features

- **Highlighting**: Use `onHighlightItem` callback and `highlightItems` prop/context
- **Disabled Items**: Use `disabledItems` prop/context to hide categories
- **Cross-Chart Sync**: Store state in Redux/context for synchronized interactions

See Storybook examples for detailed implementation patterns.

# Console commands

## Development
- `npm run storybook`: start dev server  
- `npm run test`: run tests
- `npm run test:watch`: run tests in watch mode

## Building  
- `npm run build`: standard build with prettier output
- `npm run build:files`: build with file listing (shows all processed files)
- `npm run build:debug`: build with performance metrics and timing breakdown
- `npm run build:trace`: build with module resolution tracing
- `npm run type-check`: type checking only (no file output)

## Linting
- `npm run lint`: check for linting errors
- `npm run lint:fix`: automatically fix linting issues

## Publishing
- `npm publish`: publish the package to npm (update package.json version first)

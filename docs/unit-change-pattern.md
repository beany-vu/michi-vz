# Unit Change Pattern for michi-vz Charts

## Problem

When changing units (e.g., from dollars to percentages), charts can experience a visual "flash" where:
1. The axis formatter updates with the new unit format
2. The old data values are briefly shown with the new format (e.g., "$3200%" instead of "320%")
3. Then the new data values are rendered

This happens because:
- D3.js uses imperative DOM updates
- React manages declarative state updates
- Axis transitions (750ms) can cause timing mismatches
- Formatters and data may update in different render cycles

## Solution: Key Prop Pattern

The most reliable solution is to use a `key` prop that changes when units change. This forces React to completely unmount and remount the chart component, ensuring all updates happen atomically.

### Implementation

```jsx
const [unit, setUnit] = useState("$");

// Generate appropriate data based on unit
const dataSet = generateData(unit === "$" ? 1 : 0.01);

// Create formatter based on unit
const yAxisFormat = (d) => `${unit === "$" ? "$" : ""}${d}${unit === "%" ? "%" : ""}`;

// Use key prop to force re-render on unit change
<LineChart
  key={`chart-${unit}`}  // ← Critical: Changes with unit
  dataSet={dataSet}
  yAxisFormat={yAxisFormat}
  // ... other props
/>
```

## Apply to All Chart Types

This pattern should be used with ALL chart components in michi-vz:

### Charts with Y-Axis Formatting
```jsx
// LineChart, AreaChart, ScatterPlotChart, RangeChart
<ChartComponent
  key={`chart-${unit}`}
  dataSet={dataSet}
  yAxisFormat={yAxisFormat}
  // ...
/>

// VerticalStackBarChart
<VerticalStackBarChart
  key={`chart-${unit}`}
  dataSet={dataSet}
  yAxisFormat={yAxisFormat}
  // ...
/>
```

### Charts with X-Axis Formatting
```jsx
// ComparableHorizontalBarChart, DualHorizontalBarChart, BarBellChart
<ChartComponent
  key={`chart-${unit}`}
  dataSet={dataSet}
  xAxisFormat={xAxisFormat}
  // ...
/>
```

### Charts with Custom Value Formatting
```jsx
// GapChart
<GapChart
  key={`chart-${unit}`}
  data={data}
  valueFormat={valueFormat}
  // ...
/>

// RadarChart (typically uses fixed scales)
<RadarChart
  key={`chart-${unit}`}
  dataSet={dataSet}
  // ...
/>

// RibbonChart (uses value in data)
<RibbonChart
  key={`chart-${unit}`}
  dataSet={dataSet}
  // ...
/>
```

## Complete Example

```jsx
import React, { useState } from 'react';
import { LineChart, MichiVzProvider } from 'michi-vz';

function Dashboard() {
  const [unit, setUnit] = useState("$");
  
  // Adjust data multiplier based on unit
  const multiplier = unit === "$" ? 1 : 0.01;
  
  // Generate data with appropriate values
  const dataSet = rawData.map(item => ({
    ...item,
    series: item.series.map(point => ({
      ...point,
      value: point.value * multiplier
    }))
  }));
  
  // Create formatter for the current unit
  const yAxisFormat = (d) => {
    if (unit === "$") return `$${d.toLocaleString()}`;
    return `${d}%`;
  };
  
  return (
    <MichiVzProvider>
      <button onClick={() => setUnit(unit === "$" ? "%" : "$")}>
        Toggle Unit ({unit})
      </button>
      
      <LineChart
        key={`revenue-chart-${unit}`}
        dataSet={dataSet}
        yAxisFormat={yAxisFormat}
        width={800}
        height={400}
        title="Revenue Trends"
      />
    </MichiVzProvider>
  );
}
```

## Why This Works

1. **Complete Re-render**: The changing key forces React to treat it as a completely new component
2. **Atomic Updates**: All parts of the chart (scales, axes, data) are created fresh together
3. **No Transition Issues**: Old transitions are cancelled when the component unmounts
4. **Simple Implementation**: Just one line of code (the key prop) solves the problem

## Alternative Approaches

While the key prop pattern is recommended, here are alternatives:

1. **Disable Transitions**: Modify axis components to accept a `disableTransitions` prop
2. **Synchronize State**: Use `useReducer` to ensure data and formatters update together
3. **Custom Hook**: Create a hook that manages unit changes and returns synchronized props

However, the key prop pattern remains the simplest and most reliable solution.
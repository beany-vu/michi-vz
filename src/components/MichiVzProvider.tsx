import React, { createContext, useContext, ReactNode } from "react";

/**
 * Config for the LineChart single-point guide line, shared between the
 * MichiVzProvider context (global default) and the LineChart `singlePointLine`
 * prop (per-chart override).
 *  - `false` (or omitted) → off
 *  - `true`               → on, using the uncertainty look (series color, "4,4", width 2.5)
 *  - object               → on, with the given fields overriding those defaults
 */
export type SinglePointLineConfig =
  | boolean
  | { stroke?: string; strokeWidth?: number; strokeDasharray?: string };

// 1. Define the types for our context
interface ChartContextProps {
  disabledItems: string[];
  highlightItems: string[];
  colorsMapping: { [key: string]: string };
  colorsBasedMapping: { [key: string]: string };
  categoryMetadata: { [key: string]: { color?: string; label?: string } };
  hiddenItems: string[];
  visibleItems: string[];
  availableItems: string[];
  /**
   * Font family used by canvas-rendered text in charts (e.g. the series-key
   * abbreviation labels under VerticalStackBarChart's bars). Must be a literal
   * font stack. CSS variables like `var(--foo)` don't resolve in canvas
   * `ctx.font`. SVG-rendered text inherits font from page CSS as usual and
   * does NOT consult this value. Default: `"sans-serif"`.
   */
  fontFamily: string;
  /**
   * Global default for the LineChart single-point guide line (a full-plot-width
   * horizontal dashed line + dot for series with exactly one data point). Each
   * LineChart's `singlePointLine` prop overrides this (including `false` to
   * disable it for one chart). LineChart-only; other charts ignore it.
   * Default: `false`.
   */
  singlePointLine: SinglePointLineConfig;
}

// 2. Provide default values for the context
const defaultChartContext: ChartContextProps = {
  disabledItems: [],
  highlightItems: [],
  colorsMapping: {},
  colorsBasedMapping: {},
  categoryMetadata: {},
  hiddenItems: [],
  visibleItems: [],
  availableItems: [],
  fontFamily: "sans-serif",
  singlePointLine: false,
};

const MichiVzContext = createContext<ChartContextProps>(defaultChartContext);

// 3. Define the ChartProvider
interface MichiVzProps {
  children: ReactNode;
  disabledItems?: string[];
  highlightItems?: string[];
  colorsMapping?: { [key: string]: string };
  colorsBasedMapping?: { [key: string]: string };
  categoryMetadata?: { [key: string]: { color: string; label: string } };
  hiddenItems?: string[];
  visibleItems?: string[];
  availableItems?: string[];
  fontFamily?: string;
  singlePointLine?: SinglePointLineConfig;
}

export const MichiVzProvider: React.FC<MichiVzProps> = ({
  children,
  disabledItems = [],
  highlightItems = [],
  colorsMapping = {},
  colorsBasedMapping = {},
  categoryMetadata = {},
  hiddenItems = [],
  visibleItems = [],
  availableItems = visibleItems,
  fontFamily = "sans-serif",
  singlePointLine = false,
}) => {
  const contextValue = {
    disabledItems,
    highlightItems,
    colorsMapping,
    colorsBasedMapping,
    categoryMetadata,
    hiddenItems,
    visibleItems,
    availableItems,
    fontFamily,
    singlePointLine,
  };

  return <MichiVzContext.Provider value={contextValue}>{children}</MichiVzContext.Provider>;
};

// 4. Create a custom hook for easier access
export const useChartContext = (): ChartContextProps => {
  return useContext(MichiVzContext);
};

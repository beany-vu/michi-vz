import React, { createContext, useContext, ReactNode } from "react";

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
   * font stack — CSS variables like `var(--foo)` don't resolve in canvas
   * `ctx.font`. SVG-rendered text inherits font from page CSS as usual and
   * does NOT consult this value. Default: `"sans-serif"`.
   */
  fontFamily: string;
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
  };

  return <MichiVzContext.Provider value={contextValue}>{children}</MichiVzContext.Provider>;
};

// 4. Create a custom hook for easier access
export const useChartContext = (): ChartContextProps => {
  return useContext(MichiVzContext);
};

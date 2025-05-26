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
  };

  return <MichiVzContext.Provider value={contextValue}>{children}</MichiVzContext.Provider>;
};

// 4. Create a custom hook for easier access
export const useChartContext = (): ChartContextProps => {
  return useContext(MichiVzContext);
};

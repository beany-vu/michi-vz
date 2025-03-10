import React, { createContext, useState, useContext, ReactNode } from "react";

// 1. Define the types for our context
interface ChartContextProps {
  disabledItems: string[];
  setDisabledItems: React.Dispatch<React.SetStateAction<string[]>>;
  highlightItems: string[];
  setHighlightItems: React.Dispatch<React.SetStateAction<string[]>>;
  colorsMapping: { [key: string]: string };
  setColorsMapping: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>;
  colorsBasedMapping: { [key: string]: string };
  setColorsBasedMapping: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>;
  categoryMetadata: { [key: string]: { color?: string; label?: string } };
  setCategoryMetadata: React.Dispatch<
    React.SetStateAction<{ [key: string]: { color?: string; label?: string } }>
  >;
  hiddenItems: string[];
  setHiddenItems: React.Dispatch<React.SetStateAction<string[]>>;
  visibleItems: string[]; // <-- new prop type
  setVisibleItems: React.Dispatch<React.SetStateAction<string[]>>; // <-- new setter
}

// 2. Provide default values for the context
const defaultChartContext: ChartContextProps = {
  disabledItems: [],
  setDisabledItems: () => {},
  highlightItems: [],
  setHighlightItems: () => {},
  colorsMapping: {},
  setColorsMapping: () => {},
  colorsBasedMapping: {},
  setColorsBasedMapping: () => {},
  categoryMetadata: {},
  setCategoryMetadata: () => {},
  hiddenItems: [],
  setHiddenItems: () => {},
  visibleItems: [], // <-- new prop
  setVisibleItems: () => {}, // <-- new setter
};

const MichiVzContext = createContext<ChartContextProps>(defaultChartContext);

// 3. Define the ChartProvider
interface MichiVzProps {
  children: ReactNode;
  initialDisabledItems?: string[];
  initialHighlightItems?: string[];
  initialColorsMapping?: { [key: string]: string };
  initialColorsBasedMapping?: { [key: string]: string };
  initialCategoryMetadata?: { [key: string]: { color: string; label: string } };
  initialVisibleItems?: string[]; // <-- add initial visible items if needed
}

export const MichiVzProvider: React.FC<MichiVzProps> = ({
  children,
  initialDisabledItems = [],
  initialHighlightItems = [],
  initialColorsMapping = {},
  initialColorsBasedMapping = {},
  initialCategoryMetadata = {},
  initialVisibleItems = [], // <-- add initial visible items if needed
}) => {
  const [disabledItems, setDisabledItems] = useState<string[]>(initialDisabledItems);
  const [highlightItems, setHighlightItems] = useState<string[]>(initialHighlightItems);
  const [colorsMapping, setColorsMapping] = useState<{ [key: string]: string }>(initialColorsMapping);
  const [colorsBasedMapping, setColorsBasedMapping] = useState<{ [key: string]: string }>(
    initialColorsBasedMapping
  );
  const [categoryMetadata, setCategoryMetadata] = useState<{
    [key: string]: { color: string; label: string };
  }>(initialCategoryMetadata);
  const [hiddenItems, setHiddenItems] = useState<string[]>([]);
  const [visibleItems, setVisibleItems] = useState<string[]>(initialVisibleItems); // <-- new state

  return (
    <MichiVzContext.Provider
      value={{
        disabledItems,
        setDisabledItems,
        highlightItems,
        setHighlightItems,
        colorsMapping,
        setColorsMapping,
        colorsBasedMapping,
        setColorsBasedMapping,
        categoryMetadata,
        setCategoryMetadata, // <-- added this line
        hiddenItems,
        setHiddenItems,
        visibleItems,
        setVisibleItems,
      }}
    >
      {children}
    </MichiVzContext.Provider>
  );
};

// 4. Create a custom hook for easier access
export const useChartContext = (): ChartContextProps => {
  return useContext(MichiVzContext);
};

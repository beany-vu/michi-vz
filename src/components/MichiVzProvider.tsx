import React, { createContext, useState, useContext, ReactNode } from "react";

// 1. Define the types for our context
interface ChartContextProps {
  disabledItems: string[];
  setDisabledItems: React.Dispatch<React.SetStateAction<string[]>>;
  highlightItems: string[];
  setHighlightItems: React.Dispatch<React.SetStateAction<string[]>>;
  colorsMapping: { [key: string]: string };
  setColorsMapping: React.Dispatch<
    React.SetStateAction<{ [key: string]: string }>
  >;
  colorsBasedMapping: { [key: string]: string };
  setColorsBasedMapping: React.Dispatch<
    React.SetStateAction<{ [key: string]: string }>
  >;
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
};

const MichiVzContext = createContext<ChartContextProps>(defaultChartContext);

// 3. Define the ChartProvider
interface MichiVzProps {
  children: ReactNode;
  initialDisabledItems?: string[];
  initialHighlightItems?: string[];
  initialColorsMapping?: { [key: string]: string };
  initialColorsBasedMapping?: { [key: string]: string };
}

export const MichiVzProvider: React.FC<MichiVzProps> = ({
  children,
  initialDisabledItems = [],
  initialHighlightItems = [],
  initialColorsMapping = {},
  initialColorsBasedMapping = {},
}) => {
  const [disabledItems, setDisabledItems] =
    useState<string[]>(initialDisabledItems);
  const [highlightItems, setHighlightItems] = useState<string[]>(
    initialHighlightItems,
  );
  const [colorsMapping, setColorsMapping] = useState<{ [key: string]: string }>(
    initialColorsMapping,
  );
  const [colorsBasedMapping, setColorsBasedMapping] = useState<{
    [key: string]: string;
  }>(initialColorsBasedMapping);
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

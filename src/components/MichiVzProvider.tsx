import React, { createContext, useState, useContext, ReactNode, useCallback, useMemo, useEffect } from "react";

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
  visibleItems: string[]; // <-- renamed from visibleKeys
  setVisibleItems: React.Dispatch<React.SetStateAction<string[]>>; // <-- renamed from setVisibleKeys
  availableItems: string[]; // <-- new property to store initial state
  setAvailableItems: React.Dispatch<React.SetStateAction<string[]>>; // <-- setter for availableItems
  resetState: () => void; // Add reset function type
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
  visibleItems: [], // <-- renamed from visibleKeys
  setVisibleItems: () => {}, // <-- renamed from setVisibleKeys
  availableItems: [], // <-- add default value
  setAvailableItems: () => {}, // <-- add default setter
  resetState: () => {}, // Add default reset function
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
  initialVisibleItems?: string[]; // <-- renamed from initialVisibleKeys
  initialAvailableItems?: string[]; // <-- add prop for initial available items
}

export const MichiVzProvider: React.FC<MichiVzProps> = ({
  children,
  initialDisabledItems = [],
  initialHighlightItems = [],
  initialColorsMapping = {},
  initialColorsBasedMapping = {},
  initialCategoryMetadata = {},
  initialVisibleItems = [], // <-- renamed from initialVisibleKeys
  initialAvailableItems = initialVisibleItems, // <-- default to initialVisibleItems if not provided
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
  const [visibleItems, setVisibleItems] = useState<string[]>(initialVisibleItems); // <-- renamed from visibleKeys
  const [availableItems, setAvailableItems] = useState<string[]>(initialAvailableItems); // <-- add state for available items

  // Add reset function
  const resetState = useCallback(() => {
    setDisabledItems([]);
    setHighlightItems([]);
    setColorsMapping({});
    setColorsBasedMapping({});
    setCategoryMetadata({});
    setHiddenItems([]);
    setVisibleItems([]);
    setAvailableItems([]);
  }, []); // Empty dependency array since we only need the setter functions which are stable

  // Memoize state setters to prevent unnecessary re-renders
  const memoizedSetDisabledItems = useCallback((value: React.SetStateAction<string[]>) => {
    setDisabledItems(prev => {
      const newValue = typeof value === "function" ? value(prev) : value;
      return JSON.stringify(prev) === JSON.stringify(newValue) ? prev : newValue;
    });
  }, []);

  const memoizedSetHighlightItems = useCallback((value: React.SetStateAction<string[]>) => {
    setHighlightItems(prev => {
      const newValue = typeof value === "function" ? value(prev) : value;
      return JSON.stringify(prev) === JSON.stringify(newValue) ? prev : newValue;
    });
  }, []);

  const memoizedSetColorsMapping = useCallback((value: React.SetStateAction<{ [key: string]: string }>) => {
    setColorsMapping(prev => {
      const newValue = typeof value === "function" ? value(prev) : value;
      return JSON.stringify(prev) === JSON.stringify(newValue) ? prev : newValue;
    });
  }, []);

  const memoizedSetColorsBasedMapping = useCallback(
    (value: React.SetStateAction<{ [key: string]: string }>) => {
      setColorsBasedMapping(prev => {
        const newValue = typeof value === "function" ? value(prev) : value;
        return JSON.stringify(prev) === JSON.stringify(newValue) ? prev : newValue;
      });
    },
    []
  );

  const memoizedSetCategoryMetadata = useCallback(
    (value: React.SetStateAction<{ [key: string]: { color: string; label: string } }>) => {
      setCategoryMetadata(prev => {
        const newValue = typeof value === "function" ? value(prev) : value;
        return JSON.stringify(prev) === JSON.stringify(newValue) ? prev : newValue;
      });
    },
    []
  );

  const memoizedSetHiddenItems = useCallback((value: React.SetStateAction<string[]>) => {
    setHiddenItems(prev => {
      const newValue = typeof value === "function" ? value(prev) : value;
      return JSON.stringify(prev) === JSON.stringify(newValue) ? prev : newValue;
    });
  }, []);

  const memoizedSetVisibleItems = useCallback((value: React.SetStateAction<string[]>) => { // <-- renamed from memoizedSetVisibleKeys
    setVisibleItems(prev => { // <-- renamed from setVisibleKeys
      const newValue = typeof value === "function" ? value(prev) : value;
      return JSON.stringify(prev) === JSON.stringify(newValue) ? prev : newValue;
    });
  }, []);

  // Update the memoizedSetAvailableItems to be more focused
  const memoizedSetAvailableItems = useCallback((value: React.SetStateAction<string[]>) => {
    setAvailableItems(prev => {
      const newValue = typeof value === "function" ? value(prev) : value;
      return JSON.stringify(prev) === JSON.stringify(newValue) ? prev : newValue;
    });
  }, []); // Keep empty dependency array as we only need the stable setter function

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      disabledItems,
      setDisabledItems: memoizedSetDisabledItems,
      highlightItems,
      setHighlightItems: memoizedSetHighlightItems,
      colorsMapping,
      setColorsMapping: memoizedSetColorsMapping,
      colorsBasedMapping,
      setColorsBasedMapping: memoizedSetColorsBasedMapping,
      categoryMetadata,
      setCategoryMetadata: memoizedSetCategoryMetadata,
      hiddenItems,
      setHiddenItems: memoizedSetHiddenItems,
      visibleItems, // <-- renamed from visibleKeys
      setVisibleItems: memoizedSetVisibleItems, // <-- renamed from setVisibleKeys
      availableItems, // <-- add to context value
      setAvailableItems: memoizedSetAvailableItems, // <-- add setter to context value
      resetState, // Add reset function to context
    }),
    [
      disabledItems,
      highlightItems,
      colorsMapping,
      colorsBasedMapping,
      categoryMetadata,
      hiddenItems,
      visibleItems, // <-- renamed from visibleKeys
      availableItems, // <-- add to dependencies
      memoizedSetDisabledItems,
      memoizedSetHighlightItems,
      memoizedSetColorsMapping,
      memoizedSetColorsBasedMapping,
      memoizedSetCategoryMetadata,
      memoizedSetHiddenItems,
      memoizedSetVisibleItems, // <-- renamed from memoizedSetVisibleKeys
      memoizedSetAvailableItems, // <-- add memoized setter to dependencies
      resetState, // Add reset function to dependencies
    ]
  );

  return <MichiVzContext.Provider value={contextValue}>{children}</MichiVzContext.Provider>;
};

// 4. Create a custom hook for easier access
export const useChartContext = (): ChartContextProps => {
  return useContext(MichiVzContext);
};

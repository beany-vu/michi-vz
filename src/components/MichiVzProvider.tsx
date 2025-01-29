import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useCallback,
} from "react";

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
  categoryMetadata: { [key: string]: { color?: string; label?: string } };
  setCategoryMetadata: React.Dispatch<
    React.SetStateAction<{ [key: string]: { color?: string; label?: string } }>
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
  categoryMetadata: {},
  setCategoryMetadata: () => {},
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
}

export const MichiVzProvider: React.FC<MichiVzProps> = ({
  children,
  initialDisabledItems = [],
  initialHighlightItems = [],
  initialColorsMapping = {},
  initialColorsBasedMapping = {},
  initialCategoryMetadata = {},
}) => {
  const [disabledItems, setDisabledItemsState] =
    useState<string[]>(initialDisabledItems);
  const [highlightItems, setHighlightItemsState] = useState<string[]>(
    initialHighlightItems,
  );
  const [colorsMapping, setColorsMappingState] = useState<{
    [key: string]: string;
  }>(initialColorsMapping);
  const [colorsBasedMapping, setColorsBasedMappingState] = useState<{
    [key: string]: string;
  }>(initialColorsBasedMapping);
  const [categoryMetadata, setCategoryMetadataState] = useState<{
    [key: string]: { color: string; label: string };
  }>(initialCategoryMetadata);

  const setDisabledItems = useCallback(
    (items: string[]) => setDisabledItemsState(items),
    [],
  );
  const setHighlightItems = useCallback(
    (items: string[]) => setHighlightItemsState(items),
    [],
  );
  const setColorsMapping = useCallback(
    (mapping: { [key: string]: string }) => setColorsMappingState(mapping),
    [],
  );
  const setColorsBasedMapping = useCallback(
    (mapping: { [key: string]: string }) => setColorsBasedMappingState(mapping),
    [],
  );
  const setCategoryMetadata = useCallback(
    (metadata: { [key: string]: { color: string; label: string } }) =>
      setCategoryMetadataState(metadata),
    [],
  );

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
        setCategoryMetadata,
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

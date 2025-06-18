import { useMemo } from "react";

export const useGapChartColors = (
  labels: string[],
  colors: string[] = [],
  colorsMapping?: Record<string, string>,
  colorMode: "label" | "shape" = "label",
  shapeColorsMapping?: {
    value1?: string;
    value2?: string;
    gap?: string;
  }
) => {
  // Cache for generated colors (currently unused but kept for future optimization)
  // const colorCacheRef = useRef<Record<string, string>>({});

  // Default color palette if none provided
  const defaultColors = [
    "#1f77b4",
    "#ff7f0e",
    "#2ca02c",
    "#d62728",
    "#9467bd",
    "#8c564b",
    "#e377c2",
    "#7f7f7f",
    "#bcbd22",
    "#17becf",
  ];

  // Generate colors for all labels upfront
  const generatedColorsMapping = useMemo(() => {
    const colorPalette = colors.length > 0 ? colors : defaultColors;
    const newMapping = { ...colorsMapping };
    let colorIndex = Object.keys(colorsMapping || {}).length;

    for (const label of labels) {
      if (!newMapping[label]) {
        newMapping[label] = colorPalette[colorIndex % colorPalette.length];
        colorIndex++;
      }
    }

    return newMapping;
  }, [labels, colors, colorsMapping]);

  const getColor = useMemo(() => {
    return (label: string) => {
      const colorPalette = colors.length > 0 ? colors : defaultColors;

      // In shape mode with explicit shape colors, use the first color as default
      if (colorMode === "shape" && shapeColorsMapping) {
        return shapeColorsMapping.gap || colorPalette[0];
      }

      // Use generated color mapping
      return generatedColorsMapping[label] || colorPalette[0];
    };
  }, [generatedColorsMapping, colorMode, shapeColorsMapping, colors]);

  const getShapeColor = useMemo(() => {
    return (shapeType: "value1" | "value2" | "gap", label?: string) => {
      // Use provided colors or default colors
      const colorPalette = colors.length > 0 ? colors : defaultColors;

      // In shape mode, use shape-specific colors
      if (colorMode === "shape") {
        if (shapeColorsMapping && shapeColorsMapping[shapeType]) {
          return shapeColorsMapping[shapeType];
        }
        // Default colors for shapes if not explicitly mapped
        switch (shapeType) {
          case "value1":
            return colorPalette[0];
          case "value2":
            return colorPalette[1] || colorPalette[0];
          case "gap":
            return colorPalette[2] || colorPalette[0];
          default:
            return colorPalette[0];
        }
      }

      // In label mode, use the label's color
      if (label) {
        return generatedColorsMapping[label] || colorPalette[0];
      }

      return colorPalette[0];
    };
  }, [colorMode, shapeColorsMapping, colors, generatedColorsMapping]);

  return { getColor, getShapeColor, generatedColorsMapping };
};

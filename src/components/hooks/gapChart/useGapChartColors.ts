import { useMemo, useRef } from "react";

export const useGapChartColors = (
  _labels: string[],
  colors: string[] = [],
  colorsMapping?: Record<string, string>,
  colorMode: "label" | "shape" = "label",
  shapeColorsMapping?: {
    value1?: string;
    value2?: string;
    gap?: string;
  }
) => {
  // Cache for generated colors
  const colorCacheRef = useRef<Record<string, string>>({});

  // Default color palette if none provided
  const defaultColors = [
    "#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd",
    "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf"
  ];

  const getColor = useMemo(() => {
    return (label: string) => {
      // Use provided colors or default colors
      const colorPalette = colors.length > 0 ? colors : defaultColors;

      // In shape mode with explicit shape colors, use the first color as default
      if (colorMode === "shape" && shapeColorsMapping) {
        return shapeColorsMapping.gap || colorPalette[0];
      }

      // First check if there's a predefined color mapping
      if (colorsMapping && colorsMapping[label]) {
        return colorsMapping[label];
      }

      // Check cache
      if (colorCacheRef.current[label]) {
        return colorCacheRef.current[label];
      }

      // Generate new color from the colors array
      const colorIndex = Object.keys(colorCacheRef.current).length % colorPalette.length;
      const color = colorPalette[colorIndex];

      // Cache the color
      colorCacheRef.current[label] = color;

      return color;
    };
  }, [colors, colorsMapping, colorMode, shapeColorsMapping]);

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
        return getColor(label);
      }

      return colorPalette[0];
    };
  }, [colorMode, shapeColorsMapping, colors, getColor]);

  return { getColor, getShapeColor };
};

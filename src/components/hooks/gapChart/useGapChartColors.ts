import { useMemo, useRef } from "react";

export const useGapChartColors = (
  _labels: string[],
  colors: string[],
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

  const getColor = useMemo(() => {
    return (label: string) => {
      // In shape mode with explicit shape colors, use the first color as default
      if (colorMode === "shape" && shapeColorsMapping) {
        return shapeColorsMapping.gap || colors[0];
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
      const colorIndex = Object.keys(colorCacheRef.current).length % colors.length;
      const color = colors[colorIndex];

      // Cache the color
      colorCacheRef.current[label] = color;

      return color;
    };
  }, [colors, colorsMapping, colorMode, shapeColorsMapping]);

  const getShapeColor = useMemo(() => {
    return (shapeType: "value1" | "value2" | "gap", label?: string) => {
      // In shape mode, use shape-specific colors
      if (colorMode === "shape") {
        if (shapeColorsMapping && shapeColorsMapping[shapeType]) {
          return shapeColorsMapping[shapeType];
        }
        // Default colors for shapes if not explicitly mapped
        switch (shapeType) {
          case "value1":
            return colors[0];
          case "value2":
            return colors[1];
          case "gap":
            return colors[2] || colors[0];
          default:
            return colors[0];
        }
      }

      // In label mode, use the label's color
      if (label) {
        return getColor(label);
      }

      return colors[0];
    };
  }, [colorMode, shapeColorsMapping, colors, getColor]);

  return { getColor, getShapeColor };
};

import { useMemo, useRef } from "react";

export const useGapChartColors = (
  labels: string[],
  colors: string[],
  colorsMapping?: Record<string, string>
) => {
  // Cache for generated colors
  const colorCacheRef = useRef<Record<string, string>>({});

  const getColor = useMemo(() => {
    return (label: string) => {
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
  }, [colors, colorsMapping]);

  return { getColor };
};


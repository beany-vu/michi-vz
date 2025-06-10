import { useCallback } from "react";
import * as d3 from "d3";

export const useGapChartShapes = () => {
  const getShapePath = useCallback((shape: string, size: number = 14) => {
    switch (shape) {
      case "circle":
        // Make circle smaller - use 0.8x the size to match square visually
        return d3
          .symbol()
          .type(d3.symbolCircle)
          .size(size * 0.8 * (size * 0.8))();
      case "square":
        // Return null for square - it will be rendered as rect element
        return null;
      case "triangle":
        return d3
          .symbol()
          .type(d3.symbolTriangle)
          .size(size * size)();
      default:
        return d3
          .symbol()
          .type(d3.symbolCircle)
          .size(size * 0.8 * (size * 0.8))();
    }
  }, []);

  // Helper to get rect dimensions for square shape
  const getSquareDimensions = useCallback((size: number = 14) => {
    // Return dimensions that match the visual size of the path-based square
    const halfSize = size / 2;
    return {
      x: -halfSize,
      y: -halfSize,
      width: size,
      height: size,
    };
  }, []);

  return { getShapePath, getSquareDimensions };
};

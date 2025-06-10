import { useMemo } from "react";
import { ScaleBand, ScaleLinear, ScaleTime } from "d3";

interface DataItem {
  label: string;
  code?: string;
  value1: number;
  value2: number;
  difference: number;
  date: string;
}

interface UseGapChartRendererProps {
  processedDataSet: DataItem[];
  xScale: ScaleLinear<number, number> | ScaleTime<number, number>;
  yScale: ScaleBand<string>;
  getColor: (label: string) => string;
  getShapeColor: (type: "value1" | "value2" | "gap", label: string) => string;
  colorMode: "label" | "shape";
  highlightItems: string[];
  shapeValue1: "circle" | "square" | "triangle";
  shapeValue2: "circle" | "square" | "triangle";
  hoveredYItem: string | null;
  animationState?: {
    entering: Set<string>;
    exiting: Set<string>;
    updating: Set<string>;
  };
  getItemOpacity?: (label: string, defaultOpacity: number) => number;
  getItemTransform?: (label: string) => string;
  shouldTransition?: (label: string) => boolean;
}

export const useGapChartRenderer = ({
  processedDataSet,
  xScale,
  yScale,
  getColor,
  getShapeColor,
  colorMode,
  highlightItems,
  shapeValue1,
  shapeValue2,
  hoveredYItem,
  animationState,
  getItemOpacity,
  getItemTransform,
  shouldTransition,
}: UseGapChartRendererProps) => {
  const renderData = useMemo(() => {
    const elements = processedDataSet.map((d, i) => {
      const y = yScale(d.label) || 0;
      const barHeight = yScale.bandwidth();

      // Get colors based on color mode
      const gapColor = colorMode === "shape" ? getShapeColor("gap", d.label) : getColor(d.label);
      const value1Color =
        colorMode === "shape" ? getShapeColor("value1", d.label) : getColor(d.label);
      const value2Color =
        colorMode === "shape" ? getShapeColor("value2", d.label) : getColor(d.label);

      // Calculate positions
      const x1 = xScale(Math.min(d.value1, d.value2));
      const x2 = xScale(Math.max(d.value1, d.value2));
      const barWidth = x2 - x1;

      // Determine if highlighted
      const isHighlighted = highlightItems.length === 0 || highlightItems.includes(d.label);

      // Determine opacity based on hover state and animation
      const baseBarOpacity =
        hoveredYItem !== null
          ? hoveredYItem === d.label
            ? isHighlighted
              ? 0.7
              : 0.3
            : 0.3
          : isHighlighted
            ? 0.7
            : 0.3;

      const baseMarkerOpacity =
        hoveredYItem !== null ? (hoveredYItem === d.label ? 1 : 0.3) : isHighlighted ? 1 : 0.3;

      // Apply animation opacity if available
      const barOpacity = getItemOpacity ? getItemOpacity(d.label, baseBarOpacity) : baseBarOpacity;
      const markerOpacity = getItemOpacity
        ? getItemOpacity(d.label, baseMarkerOpacity)
        : baseMarkerOpacity;
      const itemTransform = getItemTransform ? getItemTransform(d.label) : "scale(1)";
      const hasTransition = shouldTransition ? shouldTransition(d.label) : false;

      return {
        d,
        i,
        y,
        barHeight,
        gapColor,
        value1Color,
        value2Color,
        x1,
        x2,
        barWidth,
        barOpacity,
        markerOpacity,
        itemTransform,
        hasTransition,
      };
    });

    // Separate shapes by type for layering
    const squares: typeof elements = [];
    const nonSquares: typeof elements = [];

    elements.forEach(element => {
      const hasSquareValue1 = shapeValue1 === "square";
      const hasSquareValue2 = shapeValue2 === "square";

      if (hasSquareValue1 || hasSquareValue2) {
        squares.push(element);
      }
      if (!hasSquareValue1 || !hasSquareValue2) {
        nonSquares.push(element);
      }
    });

    return {
      elements,
      squares,
      nonSquares,
    };
  }, [
    processedDataSet,
    xScale,
    yScale,
    getColor,
    getShapeColor,
    colorMode,
    highlightItems,
    shapeValue1,
    shapeValue2,
    hoveredYItem,
    animationState,
    getItemOpacity,
    getItemTransform,
    shouldTransition,
  ]);

  return renderData;
};

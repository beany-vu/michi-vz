import { useMemo, useRef, useEffect } from "react";
import isEqual from "lodash/isEqual";
import { LegendItem } from "src/types/data";

export interface GapChartLegendItem {
  type: "value1" | "value2" | "gap";
  label: string;
  color?: string;
  shape?: "circle" | "square" | "triangle";
  visible?: boolean;
}

interface UseGapChartLegendProps {
  shapesLabelsMapping?: {
    value1?: string;
    value2?: string;
    gap?: string;
  };
  shapeValue1: "circle" | "square" | "triangle";
  shapeValue2: "circle" | "square" | "triangle";
  colorMode: "label" | "shape";
  shapeColorsMapping?: {
    value1?: string;
    value2?: string;
    gap?: string;
  };
  legendFormatter?: (items: GapChartLegendItem[]) => GapChartLegendItem[];
  onLegendDataChange?: (legendData: LegendItem[]) => void;
}

export const useGapChartLegend = ({
  shapesLabelsMapping,
  shapeValue1,
  shapeValue2,
  colorMode,
  shapeColorsMapping,
  legendFormatter,
  onLegendDataChange,
}: UseGapChartLegendProps) => {
  const lastLegendDataSentRef = useRef<LegendItem[] | null>(null);
  const legendItems = useMemo(() => {
    if (!shapesLabelsMapping) return [];

    // Prepare default legend items
    const defaultLegendItems: GapChartLegendItem[] = [];

    if (shapesLabelsMapping.value1) {
      defaultLegendItems.push({
        type: "value1",
        label: shapesLabelsMapping.value1,
        shape: shapeValue1,
        color:
          colorMode === "shape" && shapeColorsMapping?.value1 ? shapeColorsMapping.value1 : "#666",
        visible: true,
      });
    }

    if (shapesLabelsMapping.gap) {
      defaultLegendItems.push({
        type: "gap",
        label: shapesLabelsMapping.gap,
        color: colorMode === "shape" && shapeColorsMapping?.gap ? shapeColorsMapping.gap : "#999",
        visible: true,
      });
    }

    if (shapesLabelsMapping.value2) {
      defaultLegendItems.push({
        type: "value2",
        label: shapesLabelsMapping.value2,
        shape: shapeValue2,
        color:
          colorMode === "shape" && shapeColorsMapping?.value2 ? shapeColorsMapping.value2 : "#666",
        visible: true,
      });
    }

    // Apply formatter if provided
    const items = legendFormatter
      ? legendFormatter(defaultLegendItems).filter(item => item.visible !== false)
      : defaultLegendItems;

    return items;
  }, [
    shapesLabelsMapping,
    shapeValue1,
    shapeValue2,
    colorMode,
    shapeColorsMapping,
    legendFormatter,
  ]);

  // Convert internal legend items to global LegendItem format for callback
  const globalLegendItems = useMemo(() => {
    return legendItems.map((item, index) => ({
      label: item.label,
      color: item.color || "#666",
      order: index,
      disabled: item.visible === false,
    }));
  }, [legendItems]);

  // Expose legend data to parent component
  useEffect(() => {
    if (onLegendDataChange && !isEqual(globalLegendItems, lastLegendDataSentRef.current)) {
      lastLegendDataSentRef.current = [...globalLegendItems];
      onLegendDataChange(globalLegendItems);
    }
  }, [globalLegendItems, onLegendDataChange]);

  return { legendItems, globalLegendItems };
};

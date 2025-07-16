import { useEffect, useRef, useMemo } from "react";
import { LineChartDataItem } from "../../../types/data";

const useGenerateColorMapping = (
  dataSet: LineChartDataItem[],
  colors: string[],
  existingMapping: { [key: string]: string } = {},
  onColorMappingGenerated?: (colorsMapping: { [key: string]: string }) => void
) => {
  const colorMappingRef = useRef<{ [key: string]: string }>({});

  // Generate initial color mapping synchronously to avoid empty mapping on first render
  const initialColorMapping = useMemo(() => {
    // If we have an existing mapping, use it
    if (Object.keys(existingMapping).length > 0) {
      return { ...existingMapping };
    }

    const newMapping: { [key: string]: string } = {};
    let colorIndex = 0;

    // First, preserve existing colors for items that already have them
    dataSet.forEach(item => {
      if (item.color) {
        newMapping[item.label] = item.color;
      }
    });

    // Then assign colors to items that don't have them yet
    // Get unique labels to avoid duplicate color assignments
    const uniqueLabels = [...new Set(dataSet.map(item => item.label))];
    uniqueLabels.forEach(label => {
      if (!newMapping[label]) {
        newMapping[label] = colors[colorIndex % colors.length];
        colorIndex++;
      }
    });

    return newMapping;
  }, [dataSet, colors, existingMapping]);

  // Initialize the ref with the initial mapping
  useEffect(() => {
    colorMappingRef.current = initialColorMapping;
  }, [initialColorMapping]);

  useEffect(() => {
    // If we have an existing mapping, use it
    if (Object.keys(existingMapping).length > 0) {
      colorMappingRef.current = { ...existingMapping };
      return;
    }

    const newMapping: { [key: string]: string } = { ...colorMappingRef.current };
    let colorIndex = 0;

    // First, preserve existing colors for items that already have them
    dataSet.forEach(item => {
      if (item.color) {
        newMapping[item.label] = item.color;
      }
    });

    // Then assign colors to items that don't have them yet
    // Get unique labels to avoid duplicate color assignments
    const uniqueLabels = [...new Set(dataSet.map(item => item.label))];
    uniqueLabels.forEach(label => {
      if (!newMapping[label]) {
        newMapping[label] = colors[colorIndex % colors.length];
        colorIndex++;
      }
    });

    // Only update if the mapping has changed
    if (JSON.stringify(newMapping) !== JSON.stringify(colorMappingRef.current)) {
      colorMappingRef.current = newMapping;
      if (onColorMappingGenerated) {
        onColorMappingGenerated(newMapping);
      }
    }
  }, [dataSet, colors, existingMapping, onColorMappingGenerated]);

  // Return the initial mapping to ensure colors are available on first render
  return initialColorMapping;
};

export default useGenerateColorMapping;

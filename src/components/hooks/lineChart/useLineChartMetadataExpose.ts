import { useEffect, useRef } from "react";
import isEqual from "lodash/isEqual";
import { DataPoint, ChartMetadata, LegendItem } from "../../../types/data";
import { sanitizeForClassName } from "./lineChartUtils";

// Hook for exposing chart metadata including legend data
const useLineChartMetadataExpose = (
  dataSet: any,
  xAxisDataType: any,
  yScale: any,
  disabledItems: string[],
  lineData: any,
  filter: any,
  onChartDataProcessed: ((metadata: ChartMetadata) => void) | undefined,
  renderCompleteRef: any,
  prevChartDataRef: any,
  colorsMapping: { [key: string]: string },
  defaultColors: string[],
  onColorMappingGenerated?: (colorsMapping: { [key: string]: string }) => void,
  onLegendDataChange?: (legendData: LegendItem[]) => void,
  topNItems?: any
) => {
  // Keep track of the chart ID
  // Track if we've dispatched our first event
  const firstEventDispatchedRef = useRef(false);
  // Track the last metadata sent to prevent infinite loops
  const lastMetadataSentRef = useRef<ChartMetadata | null>(null);
  const lastLegendDataSentRef = useRef<LegendItem[] | null>(null);

  useEffect(() => {
    // Log whether render is complete for debugging

    if (renderCompleteRef.current) {
      // Extract all dates from all series
      const allDates = dataSet.flatMap(set =>
        set.series.map(point => (xAxisDataType === "number" ? point.date : String(point.date)))
      );

      // Create unique dates array
      const uniqueDates = [...new Set(allDates)];

      // Use topNItems if available, otherwise use the original logic
      let visibleSeries: string[];
      const sortValues: { [key: string]: number } = {};

      if (topNItems && topNItems.length > 0) {
        // Use the pre-filtered topNItems from useFilteredDataSet
        visibleSeries = topNItems.map(d => d.label);

        // Calculate sort values for the topNItems
        if (filter?.date) {
          visibleSeries.forEach(label => {
            const data = topNItems.find(d => d.label === label);
            const value =
              data?.series.find(d => String(d.date) === String(filter.date))?.value || 0;
            sortValues[label] = value;
          });
        }
      } else {
        // Fallback to original logic
        visibleSeries = dataSet.map(d => d.label);

        if (filter?.date) {
          // Calculate sort values for all series
          visibleSeries.forEach(label => {
            const data = dataSet.find(d => d.label === label);
            const value =
              data?.series.find(d => String(d.date) === String(filter.date))?.value || 0;
            sortValues[label] = value;
          });

          visibleSeries = visibleSeries.sort((a, b) => {
            const aValue = sortValues[a];
            const bValue = sortValues[b];
            return filter.sortingDir === "desc" ? bValue - aValue : aValue - bValue;
          });

          // Apply limit if specified
          if (filter.limit) {
            visibleSeries = visibleSeries.slice(0, filter.limit);
          }
        }
      }

      // Generate legend data in the same order as visibleSeries (which is sorted by filter)
      // Include ALL items (both enabled and disabled) for complete legend
      const legendData = visibleSeries
        .filter(label => dataSet.find(d => d.label === label)?.series.length > 0)
        .map((label, index) => {
          // Assign colors based on legend order using DEFAULT_COLORS
          const colorIndex = index % defaultColors.length;
          const baseColor = defaultColors[colorIndex];

          // Calculate opacity for repeat items beyond color palette
          const repeatCycle = Math.floor(index / defaultColors.length);
          const opacity = Math.max(0.1, 1 - repeatCycle * 0.1);

          // Create color with opacity if needed
          const finalColor =
            repeatCycle > 0
              ? `${baseColor}${Math.round(opacity * 255)
                  .toString(16)
                  .padStart(2, "0")}`
              : baseColor;

          return {
            label,
            color: finalColor,
            order: index,
            disabled: disabledItems.includes(label),
            dataLabelSafe: sanitizeForClassName(label),
            sortValue: sortValues[label],
          };
        });

      // Generate new color mapping based on legend order
      const newColorMapping: { [key: string]: string } = {};
      legendData.forEach(item => {
        newColorMapping[item.label] = item.color;
      });

      // Update color mapping if it has changed
      if (!isEqual(newColorMapping, colorsMapping) && onColorMappingGenerated) {
        onColorMappingGenerated(newColorMapping);
      }

      const currentMetadata: ChartMetadata = {
        xAxisDomain: uniqueDates.map(String),
        yAxisDomain: yScale.domain() as [number, number],
        visibleItems: visibleSeries.filter(
          label =>
            !disabledItems.includes(label) &&
            dataSet.find(d => d.label === label)?.series.length > 0
        ),
        renderedData: lineData.reduce(
          (acc, item) => {
            // Only include data for visible series
            if (item.points.length > 0 && visibleSeries.includes(item.label)) {
              acc[item.label] = item.points;
            }
            return acc;
          },
          {} as { [key: string]: DataPoint[] }
        ),
        chartType: "line-chart",
        legendData: legendData,
      };

      // Check if data has actually changed
      const hasChanged =
        !prevChartDataRef.current ||
        JSON.stringify(prevChartDataRef.current.xAxisDomain) !==
          JSON.stringify(currentMetadata.xAxisDomain) ||
        JSON.stringify(prevChartDataRef.current.yAxisDomain) !==
          JSON.stringify(currentMetadata.yAxisDomain) ||
        JSON.stringify(prevChartDataRef.current.visibleItems) !==
          JSON.stringify(currentMetadata.visibleItems) ||
        JSON.stringify(Object.keys(prevChartDataRef.current.renderedData).sort()) !==
          JSON.stringify(Object.keys(currentMetadata.renderedData).sort());

      // Always update the ref with latest metadata
      prevChartDataRef.current = currentMetadata;

      // Only emit event/call callback if data has changed
      // Also always emit on first render when data is available
      if (hasChanged || !firstEventDispatchedRef.current) {
        firstEventDispatchedRef.current = true;

        // Call the callback if it exists (for backward compatibility)
        // But only if the metadata is actually different from what we last sent
        if (onChartDataProcessed) {
          if (!isEqual(currentMetadata, lastMetadataSentRef.current)) {
            lastMetadataSentRef.current = { ...currentMetadata };
            onChartDataProcessed(currentMetadata);
          }
        }

        // Call legend data callback if it exists and data has changed
        if (onLegendDataChange) {
          if (!isEqual(legendData, lastLegendDataSentRef.current)) {
            lastLegendDataSentRef.current = [...legendData];
            onLegendDataChange(legendData);
          }
        }
      }
    }
  }, [
    dataSet,
    xAxisDataType,
    yScale,
    disabledItems,
    lineData,
    filter,
    colorsMapping,
    defaultColors,
    onColorMappingGenerated,
    onLegendDataChange,
    topNItems,
  ]);
};

export default useLineChartMetadataExpose;

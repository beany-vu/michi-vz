import { useEffect, useRef } from "react";
import { DataPoint, ChartMetadata } from "src/types/data";
import { CHART_EVENTS } from "src/types/events";

// We'll use the project's built-in event system
const useLineChartMetadataExpose = (
  dataSet,
  xAxisDataType,
  yScale,
  disabledItems,
  lineData,
  filter,
  onChartDataProcessed,
  renderCompleteRef,
  prevChartDataRef,
  chartId?: string // Optional chartId to identify which chart emitted the event
) => {
  // Keep track of the chart ID
  const chartIdRef = useRef(chartId || `chart-${Math.random().toString(36).substring(2, 9)}`);
  // Track if we've dispatched our first event
  const firstEventDispatchedRef = useRef(false);

  useEffect(() => {
    // Log whether render is complete for debugging
    console.log(
      "useLineChartMetadataExpose: renderCompleteRef.current =",
      renderCompleteRef.current
    );

    if (renderCompleteRef.current) {
      // Extract all dates from all series
      const allDates = dataSet.flatMap(set =>
        set.series.map(point => (xAxisDataType === "number" ? point.date : String(point.date)))
      );

      // Create unique dates array
      const uniqueDates = [...new Set(allDates)];

      // Sort and filter series based on values at the filter date if filter exists
      let visibleSeries = dataSet.map(d => d.label);
      if (filter?.date) {
        visibleSeries = visibleSeries.sort((a, b) => {
          const aData = dataSet.find(d => d.label === a);
          const bData = dataSet.find(d => d.label === b);
          const aValue =
            aData?.series.find(d => String(d.date) === String(filter.date))?.value || 0;
          const bValue =
            bData?.series.find(d => String(d.date) === String(filter.date))?.value || 0;
          return filter.sortingDir === "desc" ? bValue - aValue : aValue - bValue;
        });

        // Apply limit if specified
        if (filter.limit) {
          visibleSeries = visibleSeries.slice(0, filter.limit);
        }
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
        if (onChartDataProcessed) {
          onChartDataProcessed(currentMetadata);
        }

        // Use the project's native event system only
        try {
          console.log("Creating chart metadata event:", CHART_EVENTS.METADATA_CHANGED);

          // Create and dispatch the native event
          const event = new CustomEvent(CHART_EVENTS.METADATA_CHANGED, {
            bubbles: true,
            cancelable: true,
            detail: {
              chartId: chartIdRef.current,
              metadata: currentMetadata,
            },
          });

          // Dispatch event from document
          console.log("Dispatching native event with data:", {
            chartId: chartIdRef.current,
            metadata: JSON.stringify(currentMetadata).substring(0, 100) + "...",
          });
          const dispatchResult = document.dispatchEvent(event);
          console.log("Event dispatched, result:", dispatchResult);
        } catch (error) {
          console.error("Error dispatching chart metadata event:", error);
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
    onChartDataProcessed,
    prevChartDataRef,
  ]);
};

export default useLineChartMetadataExpose;

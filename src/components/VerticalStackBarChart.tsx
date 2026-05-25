import React, { useMemo, useRef, useCallback, useLayoutEffect, useEffect, useState } from "react";
import * as d3 from "d3";
import isEqual from "lodash/isEqual";
import Title from "./shared/Title";
import XaxisBand from "./shared/XaxisBand";
import type { AxisMode } from "./shared/xaxisBand/chooseAxisMode";
import YaxisLinear from "./shared/YaxisLinear";
import LoadingIndicator from "./shared/LoadingIndicator";
import { useDisplayIsNodata } from "./hooks/useDisplayIsNodata";
import styled from "styled-components";
import { sanitizeForClassName } from "./hooks/lineChart/lineChartUtils";
import { LegendItem } from "../types/data";
import TooltipHint from "src/components/shared/TooltipHint";
import { DEFAULT_COLORS } from "./shared/colors";
import MichiVzCredit from "./shared/MichiVzCredit";
import useVerticalStackBarChartCanvasRendering from "./hooks/verticalStackBarChart/useVerticalStackBarChartCanvasRendering";
import { useChartContext } from "./MichiVzProvider";

function getColor(mappedColor?: string, dataColor?: string): string {
  const FALLBACK_COLOR = "rgba(253, 253, 253, 0.5)";
  if (mappedColor) return mappedColor;
  if (dataColor) return dataColor;
  return FALLBACK_COLOR;
}

const VerticalStackBarChartStyled = styled.div`
  position: relative;
  rect {
    transition: x 0.1s ease-out, y 0.1s ease-out, width 0.1s ease-out, height 0.1s ease-out;
  }
}`;

interface DataPoint {
  date: string | null;
  [key: string]: string | null | undefined;
}

interface DataSet {
  seriesKey: string;
  seriesKeyAbbreviation: string;
  series: DataPoint[];
  label?: string;
}

interface TooltipData {
  item: DataPoint;
  key: string;
  seriesKey: string;
  series: DataPoint[];
  /** True when this hover targets a missing-data stub bar (no real value). */
  isMissing?: boolean;
}

// Add the ChartMetadata interface to define what data we'll expose
interface ChartMetadata {
  xAxisDomain: string[];
  visibleItems: string[];
  renderedData: { [key: string]: RectData[] };
  chartType: "vertical-stack-bar-chart";
  legendData?: { label: string; color: string; order: number; disabled?: boolean }[];
}

interface Props {
  dataSet: DataSet[];
  width: number;
  height: number;
  margin: { top: number; right: number; bottom: number; left: number };
  title?: string;
  xAxisFormat?: (d: number) => string;
  yAxisFormat?: (d: number) => string;
  xAxisDomain?: [string, string];
  yAxisDomain?: [number, number];
  tooltipFormatter?: (tooltipData: TooltipData) => string;
  showCombined?: boolean;
  children?: React.ReactNode;
  isLoading?: boolean;
  isLoadingComponent?: React.ReactNode;
  isNodataComponent?: React.ReactNode;
  isNodata?: boolean | ((dataSet: DataSet[]) => boolean);
  colorCallbackFn?: (key: string, d: RectData) => string;
  /**
   * Minimum drawn width (px) for each bar. When the dataset is dense the band
   * scale shrinks each bar; without a floor they become sub-pixel and vanish
   * (worst on the Canvas renderer). The bar width is clamped to at least this
   * value — when that exceeds the available band, bars overlap rather than
   * disappear. Default `1` keeps every bar visible with negligible effect on
   * non-dense charts.
   */
  minBarWidth?: number;
  /**
   * When set, draws a thin stub bar of `height` pixels for any
   * (date × series × key) where the key is selected (not in `disabledItems`)
   * but its value is missing/null/NaN. Signals "selected but no data" rather
   * than silently omitting the bar; the stub uses the series' resolved color
   * and sits on the zero line. Tooltip data for stub bars carries
   * `isMissing: true` so `tooltipFormatter` can render an appropriate
   * "data not available" message. Default: undefined (no stubs).
   */
  missingDataMarker?: { height: number };
  // New: filter prop for sorting entire DataSet based on total value
  filter?: {
    limit: number;
    sortingDir: "asc" | "desc";
    date?: string;
  };
  // New: callback to expose chart metadata to parent component
  onChartDataProcessed?: (metadata: ChartMetadata) => void;
  onHighlightItem?: (labels: string[]) => void;
  // colors is the color palette for new generated colors
  colors?: string[];
  // colorsMapping is the color mapping for existing colors
  // the purpose is to share the same color mapping between charts
  colorsMapping?: { [key: string]: string };
  // Callback to notify parent about generated color mapping
  onColorMappingGenerated?: (colorsMapping: { [key: string]: string }) => void;
  /**
   * When true, the chart opts into "wait-for-legend" / external-color mode:
   *  - it does NOT call `onColorMappingGenerated` (no Redux ping-pong with the
   *    consumer's legend store)
   *  - the auto-generated COLORS-array fallback is replaced with `"transparent"`
   *    so any label without an entry in `colorsMapping` and no `item.color`
   *    paints invisibly until the consumer provides its color (typically via
   *    CSS rules with `!important`, or a Redux-side color generator that feeds
   *    both chart and legend from a single source of truth)
   *  - labels that DO have `item.color` or are in `colorsMapping` paint with
   *    their proper color from frame 1
   *
   * Set this when the chart is wrapped by an external coloring system. Without
   * it, the chart's auto-generated COLORS-array mapping leaks into the
   * consumer's legend store and produces a visible mismatch (chart and legend
   * disagree on what color a given label should be).
   *
   * Default `false` preserves backward-compatible behaviour.
   */
  skipColorMappingDispatch?: boolean;
  // Callback to notify parent about legend data changes
  onLegendDataChange?: (legendData: LegendItem[]) => void;
  // highlightItems and disabledItems as props for better performance
  highlightItems?: string[];
  disabledItems?: string[];
  /**
   * Rendering backend for the stacked bars.
   *  - "svg" (default): the original SVG/D3 rendering, unchanged.
   *  - "canvas": draw the stacked bars + series labels onto a <canvas>, for
   *    large datasets (many dates × series × keys). Axes, title and the
   *    tooltip are unchanged in both modes.
   */
  renderer?: "svg" | "canvas";
  /**
   * Controls x-axis label crowding behavior.
   *  - "auto" (default): labels render horizontally if they fit; rotate to -45°
   *    if not; fall back to evenly-spaced sampling if even rotation overflows.
   *  - "horizontal": forces the legacy skip-with-dots behavior.
   */
  xAxisLabelMode?: "auto" | "horizontal";
}

export interface RectData {
  key: string;
  height: number;
  width: number;
  y: number;
  x: number;
  data: DataPoint;
  fill: string;
  seriesKey: string;
  seriesKeyAbbreviation: string;
  value: number | null;
  date: number;
  code?: string;
  /** True when this rect is a missing-data stub (rendered via `missingDataMarker`). */
  isMissing?: boolean;
}

const MARGIN = { top: 50, right: 50, bottom: 50, left: 50 };
const WIDTH = 900;
const HEIGHT = 480;

// const reducer = (state, action) => {
//   if (action.type ===)
// }

const VerticalStackBarChart: React.FC<Props> = ({
  dataSet,
  width = WIDTH,
  height = HEIGHT,
  margin = MARGIN,
  title,
  xAxisFormat,
  yAxisFormat,
  xAxisDomain,
  yAxisDomain,
  tooltipFormatter,
  showCombined = false,
  children,
  isLoading = false,
  isLoadingComponent,
  isNodataComponent,
  isNodata,
  colorCallbackFn,
  minBarWidth = 1,
  missingDataMarker,
  filter,
  onChartDataProcessed,
  onHighlightItem,
  colors = DEFAULT_COLORS,
  colorsMapping = {},
  onColorMappingGenerated,
  skipColorMappingDispatch = false,
  onLegendDataChange,
  highlightItems = [],
  disabledItems = [],
  renderer = "svg",
  xAxisLabelMode = "auto",
}) => {
  const chartRef = useRef<SVGSVGElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const tooltipContentRef = useRef<HTMLDivElement>(null);
  const renderCompleteRef = useRef(false);
  const prevChartDataRef = useRef<ChartMetadata | null>(null);
  const lastLegendDataRef = useRef<LegendItem[] | null>(null);

  // Use ref to capture latest tooltipFormatter to avoid stale closure issues
  const tooltipFormatterRef = useRef(tooltipFormatter);
  tooltipFormatterRef.current = tooltipFormatter;
  const onHighlightItemRef = useRef(onHighlightItem);
  const [isTooltipSticky, setIsTooltipSticky] = useState(false);

  const [axisMode, setAxisMode] = useState<AxisMode>("horizontal");

  const ROTATED_BOTTOM_RESERVE = 50;
  const effectiveMargin = useMemo(
    () => ({
      ...margin,
      bottom: margin.bottom + (axisMode === "rotated" ? ROTATED_BOTTOM_RESERVE : 0),
    }),
    [margin, axisMode]
  );

  // Update refs when props change
  onHighlightItemRef.current = onHighlightItem;

  // First, get all keys from the dataset
  const allKeys = useMemo(() => {
    return Array.from(
      new Set(
        dataSet
          .map(ds => ds.series.map(s => Object.keys(s)))
          .flat(2)
          .filter(d => d !== "date" && d !== "code")
      )
    );
  }, [dataSet]);

  // Generate colors for keys that don't have colors in colorsMapping
  const generatedColorsMapping = useMemo(() => {
    const newMapping = { ...colorsMapping };

    if (allKeys && allKeys.length > 0) {
      // Assign colors to new items only
      let colorIndex = Object.keys(colorsMapping).length;
      for (const key of allKeys) {
        if (!newMapping[key]) {
          newMapping[key] = skipColorMappingDispatch ? "transparent" : colors[colorIndex % colors.length];
          colorIndex++;
        }
      }
    }

    return newMapping;
  }, [allKeys, colorsMapping, colors]);

  // Notify parent about generated color mapping with infinite loop protection
  const lastColorMappingSentRef = useRef<{ [key: string]: string }>({});
  const onColorMappingGeneratedRef = useRef(onColorMappingGenerated);
  onColorMappingGeneratedRef.current = onColorMappingGenerated;

  useLayoutEffect(() => {
    if (
      !skipColorMappingDispatch &&
      onColorMappingGeneratedRef.current &&
      !isEqual(generatedColorsMapping, lastColorMappingSentRef.current)
    ) {
      lastColorMappingSentRef.current = { ...generatedColorsMapping };
      onColorMappingGeneratedRef.current(generatedColorsMapping);
    }
  }, [generatedColorsMapping]);

  // Modified: effectiveKeys should filter out hidden items
  const effectiveKeys = useMemo(() => {
    return allKeys.filter(key => !disabledItems.includes(key));
  }, [allKeys, disabledItems]);

  // NEW: compute filteredDataSet from the entire dataSet by summing all numeric properties (except "date" and "code")
  const filteredDataSet = useMemo(() => {
    if (!filter) return dataSet;
    // For each DataSet, compute total sum over its series
    const computed = dataSet.map(ds => {
      const total = ds.series.reduce((sum, dp) => {
        // sum all non-date properties as numbers
        return (
          sum +
          Object.entries(dp).reduce((acc, [key, value]) => {
            return key !== "date" && key !== "code" ? acc + Number(value || 0) : acc;
          }, 0)
        );
      }, 0);
      return { ...ds, total };
    });
    const sorted = computed.sort((a, b) =>
      filter.sortingDir === "desc" ? b.total - a.total : a.total - b.total
    );
    return sorted.slice(0, filter.limit);
  }, [dataSet, filter]);

  // Use allKeys as the main keys reference
  const keys = allKeys;

  // Replace usage of dataSet with filteredDataSet:
  const flattenedDataSet = useMemo(() => {
    return filteredDataSet
      .map(({ series }) => series)
      .flat()
      .map(dataPoint => {
        // Convert the DataPoint object to an array of [key, value] pairs.
        const entries = Object.entries(dataPoint);
        // Filter out the keys that are present in the disabledItems array.
        const filteredEntries = entries.filter(([key]) => !disabledItems.includes(key));
        // Convert the filtered [key, value] pairs back to an object.
        return Object.fromEntries(filteredEntries);
      });
  }, [filteredDataSet, disabledItems]);

  // xScale
  const extractDates = (data: DataPoint): string => String(data.date);
  const dates = useMemo(
    () => flattenedDataSet.map(extractDates),
    [flattenedDataSet, disabledItems]
  );

  const xScale = useMemo(
    () =>
      d3
        .scaleBand()
        .domain(xAxisDomain ?? dates)
        .range([margin.left, width - margin.right])
        .padding(0.1),
    [flattenedDataSet, width, height, margin, disabledItems]
  );

  // yScale
  const yScaleDomain = useMemo(() => {
    if (yAxisDomain) {
      return yAxisDomain;
    }

    const totalValuePerYear: number[] = flattenedDataSet.map(yearData =>
      effectiveKeys.reduce((acc, key) => {
        // Parse the value safely, handling string values
        const value = yearData[key];
        if (value === undefined || value === null) {
          return acc;
        }
        const numericValue = typeof value === "string" ? parseFloat(value) : value;
        return acc + (isNaN(numericValue) ? 0 : numericValue);
      }, 0)
    );
    const minValue = Math.min(...totalValuePerYear) < 0 ? Math.min(...totalValuePerYear) : 0;
    const maxValue = Math.max(...totalValuePerYear);
    return [minValue, maxValue];
  }, [flattenedDataSet, effectiveKeys]);

  const yScale = useMemo(
    () =>
      d3
        .scaleLinear()
        .domain(yScaleDomain)
        .range([height - effectiveMargin.bottom, effectiveMargin.top])
        .clamp(true)
        .nice(),
    [flattenedDataSet, width, height, effectiveMargin, disabledItems]
  );

  // Memoize the stacked data preparation
  const prepareStackedData = useCallback(
    (rawDataSet: DataSet[]): { [p: string]: RectData[] } => {
      const stackedData = effectiveKeys
        .filter(key => !disabledItems.includes(key))
        .reduce(
          (acc, key) => {
            acc[key] = [];
            return acc;
          },
          {} as { [key: string]: RectData[] }
        );

      // Get the actual number of visible series for width calculation
      const visibleSeriesCount = rawDataSet.filter(
        dataItem => !disabledItems.includes(dataItem.seriesKey)
      ).length;

      rawDataSet
        .filter(dataItem => !disabledItems.includes(dataItem.seriesKey))
        .forEach((dataItem, groupIndex) => {
          const series = dataItem.series;
          // Use visibleSeriesCount instead of total stackedData length
          const groupWidth = xScale.bandwidth() / visibleSeriesCount;

          series.forEach(yearData => {
            let y0 = 0;
            effectiveKeys
              .filter(key => !disabledItems.includes(key))
              .reverse()
              .forEach(key => {
                const value = yearData[key];
                const numericValue =
                  typeof value === "string" ? parseFloat(value) : (value as number);
                const isMissingValue =
                  value === undefined || value === null || isNaN(numericValue);

                if (isMissingValue) {
                  // Stub marker (opt-in via `missingDataMarker`): a thin bar on
                  // the zero line that says "selected but no data here". y0 is
                  // intentionally left untouched so the marker doesn't shift
                  // the stack height for any real bars below/above it.
                  //
                  // hasOwnProperty guard: only emit a marker if the key is
                  // explicitly present on this data point (with a null/NaN/
                  // undefined value). A key that is simply absent from the
                  // data point means "this DataSet doesn't own this key" — its
                  // bar belongs to a different DataSet's slot, not this one,
                  // so emitting a marker here would paint a stub in every
                  // group's slot for every other group's missing key.
                  const isExplicitlyMissing = Object.prototype.hasOwnProperty.call(yearData, key);
                  if (missingDataMarker && isExplicitlyMissing) {
                    const markerHeight = missingDataMarker.height;
                    const markerRect = {
                      key,
                      height: markerHeight,
                      width: Math.max(groupWidth - 4, minBarWidth),
                      y: yScale(0) - markerHeight,
                      x:
                        xScale(String(yearData.date)) +
                        groupWidth * groupIndex +
                        groupWidth / 2 -
                        groupWidth / 2 +
                        2,
                      fill: getColor(generatedColorsMapping[key]),
                      data: yearData,
                      seriesKey: dataItem.seriesKey,
                      seriesKeyAbbreviation: dataItem.seriesKeyAbbreviation,
                      value: null,
                      date: yearData.date,
                      code: yearData.code,
                      isMissing: true,
                    };
                    stackedData[key].push(markerRect as unknown as RectData);
                  }
                  return;
                }

                const y1 = parseFloat(String(y0)) + numericValue;
                const rawHeight = yScale(y0) - yScale(y1);
                // Only apply minimum height if the value exists (even if it's 0)
                const itemHeight =
                  value !== undefined && value !== null ? Math.max(0, rawHeight) : 0;
                const rectData = {
                  key,
                  height: itemHeight,
                  // Clamp to `minBarWidth` so dense datasets (tiny band width)
                  // don't shrink bars to sub-pixel and make them disappear.
                  width: Math.max(groupWidth - 4, minBarWidth),
                  y: yScale(y1),
                  x:
                    xScale(String(yearData.date)) +
                    groupWidth * groupIndex +
                    groupWidth / 2 -
                    groupWidth / 2 +
                    2,
                  fill: getColor(generatedColorsMapping[key]),
                  data: yearData,
                  seriesKey: dataItem.seriesKey,
                  seriesKeyAbbreviation: dataItem.seriesKeyAbbreviation,
                  value: numericValue,
                  date: yearData.date,
                  code: yearData.code,
                };
                y0 = y1;
                stackedData[key].push(rectData as unknown as RectData);
              });
          });
        });

      return stackedData;
    },
    [
      effectiveKeys,
      disabledItems,
      xScale,
      yScale,
      generatedColorsMapping,
      minBarWidth,
      missingDataMarker,
    ]
  );

  // Memoize the stacked rect data
  const stackedRectData = useMemo(
    () => prepareStackedData(filteredDataSet),
    [prepareStackedData, filteredDataSet]
  );

  // Memoize the tooltip content generation
  const generateTooltipContent = useCallback(
    (
      key: string,
      seriesKey: string,
      data: DataPoint,
      series: DataPoint[],
      isMissing?: boolean
    ) => {
      if (tooltipFormatterRef.current) {
        return tooltipFormatterRef.current({
          item: data,
          key: key,
          seriesKey: seriesKey,
          series: series,
          isMissing: isMissing,
        });
      }

      if (!showCombined) {
        return `
                <div style="background: #fff; padding: 5px">
                    <p>${data.date} - ${seriesKey}</p>
                    ${data[key] ? `<p style="color:${getColor(generatedColorsMapping[key])}">${key}: ${data[key]}</p>` : "N/A"}
                </div>`;
      }
      return `
                <div style="background: #fff; padding: 5px">
                    <p>${data.date} - ${seriesKey}</p>
                    ${Object.keys(data)
                      .filter(key => key !== "date" && key !== "code")
                      .sort()
                      .map(
                        key =>
                          `<p style="color:${getColor(generatedColorsMapping[key])}">${key}: ${data[key] ?? "N/A"}</p>`
                      )
                      .join("")}
                </div>`;
    },
    [showCombined, generatedColorsMapping]
  );

  // Memoize the tooltip position update
  const updateTooltipPosition = useCallback((event: React.MouseEvent) => {
    if (!tooltipRef.current) return;
    const [x, y] = d3.pointer(event);
    const tooltip = tooltipRef.current;
    const tooltipWidth = tooltip.getBoundingClientRect().width;
    const tooltipHeight = tooltip.getBoundingClientRect().height;

    tooltip.style.left = `${x - tooltipWidth / 2}px`;
    tooltip.style.top = `${y - tooltipHeight - 10}px`;
  }, []);

  // Memoize the mouse event handlers
  const handleDataSelection = useCallback(
    (key: string, d: RectData) => {
      if (tooltipRef.current) {
        tooltipRef.current.style.visibility = "visible";

        if (tooltipContentRef.current) {
          tooltipContentRef.current.innerHTML = generateTooltipContent(
            d.key,
            d.seriesKey,
            d.data,
            stackedRectData[key]
              .filter(item => item.seriesKey === d.seriesKey)
              .map(item => ({
                label: item.key,
                value: item.value ?? null,
                date: item.date,
                code: item.code,
              })) as unknown as DataPoint[],
            d.isMissing
          );
        }
      }
    },
    [generateTooltipContent, stackedRectData]
  );

  // Memoize the mouse event handlers
  const handleMouseOver = useCallback(
    (key: string, d: RectData) => {
      onHighlightItem([key]);
      if (tooltipRef.current && !isTooltipSticky) {
        handleDataSelection(key, d);
      }
    },
    [onHighlightItem, isTooltipSticky, handleDataSelection]
  );

  const handleMouseOut = useCallback(() => {
    onHighlightItem?.([]);
    if (tooltipRef.current && !isTooltipSticky) {
      tooltipRef.current.style.visibility = "hidden";
    }
  }, [onHighlightItem, isTooltipSticky]);

  // Canvas renderer — active only when renderer="canvas". Reuses the existing
  // prepareStackedData() output and tooltip-content generator so stacking and
  // tooltip behaviour are renderer-agnostic.
  const { fontFamily } = useChartContext();
  const canvasTooltip = useVerticalStackBarChartCanvasRendering({
    enabled: renderer === "canvas",
    canvasRef,
    svgRef: chartRef,
    tooltipRef,
    tooltipContentRef,
    width,
    height,
    margin,
    stackedRectData,
    keys,
    highlightItems,
    colorCallbackFn,
    fontFamily,
    generateTooltipContent,
    onHighlightItem,
  });

  const displayIsNodata = useDisplayIsNodata({
    dataSet: dataSet,
    isLoading: isLoading,
    isNodataComponent: isNodataComponent,
    isNodata: isNodata,
  });

  // Replace the previous useEffect with useLayoutEffect for data callback
  useLayoutEffect(() => {
    renderCompleteRef.current = true;
  }, []);

  // Use a separate useEffect to call the callback after rendering
  useLayoutEffect(() => {
    if (renderCompleteRef.current && onChartDataProcessed) {
      // First get all data that has values
      const allRenderedData = Object.fromEntries(
        Object.entries(stackedRectData).filter(([, array]) => {
          const hasData = array.length > 0;
          return hasData;
        })
      );

      // Get all keys that have data
      let renderedKeys = Object.keys(allRenderedData);

      // If we have a filter date and limit, sort and limit the keys
      if (filter?.date && filter?.limit) {
        renderedKeys = renderedKeys
          .sort((a, b) => {
            const aData = stackedRectData[a]?.find(d => String(d.date) === String(filter.date));
            const bData = stackedRectData[b]?.find(d => String(d.date) === String(filter.date));
            const aValue = aData?.value ?? 0;
            const bValue = bData?.value ?? 0;

            return filter.sortingDir === "desc" ? bValue - aValue : aValue - bValue;
          })
          .slice(0, filter.limit);
      }

      // Sort keys based on filter criteria for consistent legend ordering
      // Keep track of original top N keys for legend (including disabled items)
      let topNKeys = allKeys;
      const sortValues: { [key: string]: number } = {};

      if (filter) {
        // Calculate sort values for all keys using original data (including disabled items)
        // Calculate raw sum values directly from the dataset for accurate sorting
        allKeys.forEach(key => {
          if (filter.date) {
            // Calculate sum across all series for this key and date
            let totalValue = 0;
            filteredDataSet.forEach(dataItem => {
              const yearData = dataItem.series.find(s => String(s.date) === String(filter.date));
              if (yearData && yearData[key] !== undefined && yearData[key] !== null) {
                const numericValue =
                  typeof yearData[key] === "string"
                    ? parseFloat(yearData[key] as string)
                    : yearData[key];
                if (!isNaN(numericValue as number)) {
                  totalValue += numericValue as number;
                }
              }
            });
            sortValues[key] = totalValue;
          } else {
            sortValues[key] = 0;
          }
        });

        topNKeys = allKeys.sort((a, b) => {
          if (filter.date) {
            const aValue = sortValues[a];
            const bValue = sortValues[b];
            return filter.sortingDir === "desc" ? bValue - aValue : aValue - bValue;
          }
          return 0;
        });

        // Apply limit to get top N keys for legend generation
        if (filter.limit) {
          topNKeys = topNKeys.slice(0, filter.limit);
        }
      }

      // Generate legend data based on top N keys (include disabled items)
      const legendData = topNKeys.map((key, index) => {
        // Use existing color from colorsMapping if available, otherwise assign new color
        let finalColor = colorsMapping[key];

        if (!finalColor) {
          // Assign colors based on legend order using DEFAULT_COLORS
          const colorIndex = index % DEFAULT_COLORS.length;
          const baseColor = DEFAULT_COLORS[colorIndex];

          // Calculate opacity for repeat items beyond color palette
          const repeatCycle = Math.floor(index / DEFAULT_COLORS.length);
          const opacity = Math.max(0.1, 1 - repeatCycle * 0.1);

          // Create color with opacity if needed
          finalColor =
            repeatCycle > 0
              ? `${baseColor}${Math.round(opacity * 255)
                  .toString(16)
                  .padStart(2, "0")}`
              : baseColor;
        }

        return {
          label: key,
          color: finalColor,
          order: index,
          disabled: disabledItems.includes(key),
          dataLabelSafe: sanitizeForClassName(key),
          sortValue: sortValues[key],
        };
      });

      // Generate new color mapping based on legend order
      const newColorMapping: { [key: string]: string } = {};
      legendData.forEach(item => {
        newColorMapping[item.label] = item.color;
      });

      // Update color mapping if it has changed
      if (!isEqual(newColorMapping, generatedColorsMapping) && onColorMappingGeneratedRef.current) {
        onColorMappingGeneratedRef.current(newColorMapping);
      }

      // Call legend data callback if it exists and data has changed
      if (onLegendDataChange && !isEqual(legendData, lastLegendDataRef.current)) {
        lastLegendDataRef.current = [...legendData];
        onLegendDataChange(legendData);
      }

      // Create the current metadata with filtered data and UNIQUE xAxisDomain
      const currentMetadata: ChartMetadata = {
        xAxisDomain: [...new Set(xAxisDomain ?? dates)],
        visibleItems: renderedKeys,
        renderedData: allRenderedData,
        chartType: "vertical-stack-bar-chart",
        legendData: legendData,
      }; // Check if the data has actually changed
      const hasChanged =
        !prevChartDataRef.current ||
        !isEqual(prevChartDataRef.current.xAxisDomain, currentMetadata.xAxisDomain) ||
        !isEqual(prevChartDataRef.current.visibleItems, currentMetadata.visibleItems) ||
        !isEqual(
          Object.keys(prevChartDataRef.current.renderedData).sort(),
          Object.keys(currentMetadata.renderedData).sort()
        );

      // Always update the ref with latest metadata
      prevChartDataRef.current = currentMetadata;

      // Only call callback if data has changed
      if (hasChanged) {
        onChartDataProcessed(currentMetadata);
      }
    }
  }, [xAxisDomain, dates, stackedRectData, filter, onChartDataProcessed, allKeys, disabledItems]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isTooltipSticky) {
        const tooltipElement = (event.target as HTMLElement).closest(".tooltip");
        const anchorEl = (event.target as HTMLElement).closest(".bar");

        if (!tooltipElement && !anchorEl) {
          if (tooltipRef.current) {
            tooltipRef.current.style.visibility = "hidden";
          }

          setTimeout(() => {
            setIsTooltipSticky(false);
          }, 100);
        }
      }
    };

    if (isTooltipSticky) {
      document.addEventListener("click", handleClickOutside);
      return () => {
        document.removeEventListener("click", handleClickOutside);
      };
    }
  }, [handleMouseOut, isTooltipSticky]);

  return (
    <VerticalStackBarChartStyled>
      <div
        ref={tooltipRef}
        className={"tooltip"}
        style={{
          position: "absolute",
          background: "white",
          padding: "5px",
          zIndex: 1000,
          visibility: "hidden",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          borderRadius: "4px",
          border: "1px solid #ddd",
        }}
      >
        <div ref={tooltipContentRef} className="tooltip-content" />
        {!isTooltipSticky && !canvasTooltip.isSticky && <TooltipHint />}
      </div>

      <svg
        className={"chart"}
        ref={chartRef}
        width={width}
        height={height}
        style={{ overflow: "visible", position: "relative" }}
        // In canvas mode the canvas hook owns hover/leave handling via native
        // listeners and respects its own sticky-pin state. Binding React's
        // onMouseOut here would hide the pinned tooltip whenever the cursor
        // crosses an svg descendant (axis tick, label) since the parent's
        // isTooltipSticky stays false while the canvas hook is the source of
        // truth for sticky in canvas mode.
        onMouseOut={renderer === "canvas" ? undefined : handleMouseOut}
      >
        <MichiVzCredit />
        {children}
        <Title x={width / 2} y={MARGIN.top / 2}>
          {title}
        </Title>
        {filteredDataSet.length > 0 && !isLoading && (
          <>
            <XaxisBand
              xScale={xScale}
              height={height}
              margin={effectiveMargin}
              xAxisFormat={xAxisFormat}
              xAxisLabelMode={xAxisLabelMode}
              onAxisModeChange={setAxisMode}
            />
            <YaxisLinear
              yScale={yScale}
              width={width}
              height={height}
              margin={margin}
              highlightZeroLine={true}
              yAxisFormat={yAxisFormat}
            />
          </>
        )}
        {/* Stacked bars + series labels: SVG renderer only. In canvas mode
            these are painted on the <canvas> behind the SVG instead. */}
        {renderer !== "canvas" && (
        <g>
          {keys.map(key => {
            return (
              <g key={key}>
                {stackedRectData[key] &&
                  stackedRectData[key].map((d: RectData, i: number) => (
                    <React.Fragment key={`item-${i}`}>
                      <rect
                        x={d.x}
                        y={d.y}
                        width={d.width}
                        height={d.height}
                        fill={colorCallbackFn?.(key, d) ?? d.fill ?? "transparent"}
                        rx={2}
                        stroke={"#fff"}
                        className={`bar`}
                        data-value-zero={d.value === 0}
                        data-label={key}
                        data-label-safe={sanitizeForClassName(key)}
                        opacity={
                          highlightItems.length === 0 || highlightItems.includes(key) ? 1 : 0.2
                        }
                        onMouseOver={() => handleMouseOver(key, d)}
                        onMouseMove={event => {
                          if (isTooltipSticky) return;
                          updateTooltipPosition(event);
                        }}
                        onMouseOut={handleMouseOut}
                        onClick={event => {
                          handleDataSelection(key, d);
                          updateTooltipPosition(event);
                          setIsTooltipSticky(true);
                        }}
                      />
                      {d.seriesKeyAbbreviation && (
                        <text
                          x={d.x + d.width / 2}
                          y={height - effectiveMargin.bottom + 15}
                          textAnchor="middle"
                          fontSize="12"
                          fill="#000"
                          className={"x-axis-label"}
                        >
                          <tspan>{d.seriesKeyAbbreviation}</tspan>
                        </text>
                      )}
                    </React.Fragment>
                  ))}
              </g>
            );
          })}
        </g>
        )}
      </svg>

      {renderer === "canvas" && (
        <canvas
          ref={canvasRef}
          className="vertical-stack-bar-canvas"
          style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}
        />
      )}

      {isLoading && isLoadingComponent && <>{isLoadingComponent}</>}
      {isLoading && !isLoadingComponent && <LoadingIndicator />}
      {displayIsNodata && <>{isNodataComponent}</>}
    </VerticalStackBarChartStyled>
  );
};

export default VerticalStackBarChart;

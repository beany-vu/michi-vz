import React, { useMemo, useRef, useCallback, useLayoutEffect } from "react";
import * as d3 from "d3";
import isEqual from "lodash/isEqual";
import Title from "./shared/Title";
import XaxisBand from "./shared/XaxisBand";
import YaxisLinear from "./shared/YaxisLinear";
import LoadingIndicator from "./shared/LoadingIndicator";
import { useDisplayIsNodata } from "./hooks/useDisplayIsNodata";
import styled from "styled-components";
import { sanitizeForClassName } from "./hooks/lineChart/lineChartUtils";
import { LegendItem } from "../types/data";

const DEFAULT_COLORS = [
  "#1f77b4",
  "#ff7f0e",
  "#2ca02c",
  "#d62728",
  "#9467bd",
  "#8c564b",
  "#e377c2",
  "#7f7f7f",
  "#bcbd22",
  "#17becf",
];

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
  // Callback to notify parent about legend data changes
  onLegendDataChange?: (legendData: LegendItem[]) => void;
  // highlightItems and disabledItems as props for better performance
  highlightItems?: string[];
  disabledItems?: string[];
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
  filter,
  onChartDataProcessed,
  onHighlightItem,
  colors = DEFAULT_COLORS,
  colorsMapping = {},
  onColorMappingGenerated,
  onLegendDataChange,
  highlightItems = [],
  disabledItems = [],
}) => {
  const chartRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const renderCompleteRef = useRef(false);
  const prevChartDataRef = useRef<ChartMetadata | null>(null);
  const lastLegendDataRef = useRef<LegendItem[] | null>(null);
  const onHighlightItemRef = useRef(onHighlightItem);

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
          newMapping[key] = colors[colorIndex % colors.length];
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
        .range([height - margin.bottom, margin.top])
        .clamp(true)
        .nice(),
    [flattenedDataSet, width, height, margin, disabledItems]
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
                // Skip if value is undefined or null
                if (value === undefined || value === null) {
                  return;
                }

                // Parse the value to float safely, handling string values
                const numericValue = typeof value === "string" ? parseFloat(value) : value;

                // Skip if the parsed value is NaN
                if (isNaN(numericValue)) {
                  return;
                }

                const y1 = parseFloat(String(y0)) + numericValue;
                const rawHeight = yScale(y0) - yScale(y1);
                // Only apply minimum height if the value exists (even if it's 0)
                const itemHeight =
                  value !== undefined && value !== null ? Math.max(3, rawHeight) : 0;
                const rectData = {
                  key,
                  height: itemHeight,
                  width: groupWidth - 4,
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
    [effectiveKeys, disabledItems, xScale, yScale, generatedColorsMapping]
  );

  // Memoize the stacked rect data
  const stackedRectData = useMemo(
    () => prepareStackedData(filteredDataSet),
    [prepareStackedData, filteredDataSet]
  );

  // Memoize the tooltip content generation
  const generateTooltipContent = useCallback(
    (key: string, seriesKey: string, data: DataPoint, series: DataPoint[]) => {
      if (tooltipFormatter) {
        return tooltipFormatter({
          item: data,
          key: key,
          seriesKey: seriesKey,
          series: series,
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
    [tooltipFormatter, showCombined, generatedColorsMapping]
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
  const handleMouseOver = useCallback(
    (key: string, d: RectData) => {
      onHighlightItem([key]);
      if (tooltipRef.current) {
        tooltipRef.current.style.visibility = "visible";
        tooltipRef.current.innerHTML = generateTooltipContent(
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
            })) as unknown as DataPoint[]
        );
      }
    },
    [onHighlightItem, generateTooltipContent, stackedRectData]
  );

  const handleMouseOut = useCallback(() => {
    onHighlightItem?.([]);
    if (tooltipRef.current) {
      tooltipRef.current.style.visibility = "hidden";
    }
  }, [onHighlightItem]);

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

  return (
    <VerticalStackBarChartStyled>
      <div
        ref={tooltipRef}
        className={"tooltip"}
        style={{
          position: "absolute",
          background: "white",
          padding: "5px",
          pointerEvents: "none",
          zIndex: 1000,
          visibility: "hidden",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          borderRadius: "4px",
          border: "1px solid #ddd",
        }}
      />

      <svg
        className={"chart"}
        ref={chartRef}
        width={width}
        height={height}
        style={{ overflow: "visible" }}
        onMouseOut={handleMouseOut}
      >
        {children}
        <Title x={width / 2} y={MARGIN.top / 2}>
          {title}
        </Title>
        {filteredDataSet.length > 0 && !isLoading && (
          <>
            <XaxisBand xScale={xScale} height={height} margin={margin} xAxisFormat={xAxisFormat} />
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
                        onMouseMove={updateTooltipPosition}
                        onMouseOut={handleMouseOut}
                      />
                      {d.seriesKeyAbbreviation && (
                        <text
                          x={d.x + d.width / 2}
                          y={height - margin.bottom + 15}
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
      </svg>
      {isLoading && isLoadingComponent && <>{isLoadingComponent}</>}
      {isLoading && !isLoadingComponent && <LoadingIndicator />}
      {displayIsNodata && <>{isNodataComponent}</>}
    </VerticalStackBarChartStyled>
  );
};

export default VerticalStackBarChart;

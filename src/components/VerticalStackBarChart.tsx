import React, { useMemo, useRef, useEffect, useCallback, useState, useLayoutEffect } from "react";
import * as d3 from "d3";
import Title from "./shared/Title";
import XaxisBand from "./shared/XaxisBand";
import YaxisLinear from "./shared/YaxisLinear";
import { useChartContext } from "./MichiVzProvider";
import LoadingIndicator from "./shared/LoadingIndicator";
import { useDisplayIsNodata } from "./hooks/useDisplayIsNodata";
import styled from "styled-components";

const VerticalStackBarChartStyled = styled.div`
  position: relative;
  rect {
    transition: all 0.1s ease-out;
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
  visibleKeys: string[];
  renderedData: { [key: string]: RectData[] };
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
}

const MARGIN = { top: 50, right: 50, bottom: 50, left: 50 };
const WIDTH = 900;
const HEIGHT = 480;

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
}) => {
  const {
    colorsMapping,
    highlightItems,
    setHighlightItems,
    disabledItems,
    setHiddenItems,
    hiddenItems,
    visibleItems,
    setVisibleItems,
  } = useChartContext();
  const chartRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const renderCompleteRef = useRef(false);
  // Add ref for previous data comparison
  const prevChartDataRef = useRef<ChartMetadata | null>(null);

  // Compute all keys present in the dataset (excluding "date")
  const allKeys = useMemo(() => {
    return Array.from(
      new Set(
        dataSet
          .map(ds => ds.series.map(s => Object.keys(s)))
          .flat(2)
          .filter(d => d !== "date")
      )
    );
  }, [dataSet]);

  // Modified: effectiveKeys should consider visibleItems but not be affected by disabledItems
  const effectiveKeys = useMemo(() => {
    // If visibleItems is provided, use it as a filter for keys
    // But don't filter by disabledItems here - that happens in rendering
    if (visibleItems.length > 0) {
      return allKeys.filter(key => visibleItems.includes(key));
    }
    return allKeys;
  }, [allKeys, visibleItems]); // Remove disabledItems from dependency array

  // NEW: compute filteredDataSet from the entire dataSet by summing all numeric properties (except "date")
  const filteredDataSet = useMemo(() => {
    if (!filter) return dataSet;
    // For each DataSet, compute total sum over its series
    const computed = dataSet.map(ds => {
      const total = ds.series.reduce((sum, dp) => {
        // sum all non-date properties as numbers
        return (
          sum +
          Object.entries(dp).reduce((acc, [key, value]) => {
            return key !== "date" ? acc + Number(value || 0) : acc;
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

  // UPDATED: Recalculate hiddenItems without using disabledItems
  const keys = useMemo(() => {
    return Array.from(
      new Set(
        dataSet
          .map(ds => ds.series.map(s => Object.keys(s)))
          .flat(2)
          .filter(d => d !== "date")
      )
    );
  }, [dataSet]);

  const seriesKeys = useMemo(() => {
    return Array.from(new Set(dataSet.map(ds => ds.seriesKey)));
  }, [dataSet]);

  const filteredKeys = useMemo(() => {
    return Array.from(
      new Set(
        filteredDataSet
          .map(ds => ds.series.map(s => Object.keys(s)))
          .flat(2)
          .filter(d => d !== "date")
      )
    );
  }, [filteredDataSet]);

  const hiddenKeys = useMemo(() => {
    return [...keys.filter(key => !filteredKeys.includes(key))];
  }, [keys, filteredKeys, seriesKeys]);

  const visibleKeys = useMemo(() => {
    return keys.filter(key => filteredKeys.includes(key));
  }, [keys, filteredKeys]);

  useEffect(() => {
    if (JSON.stringify(hiddenKeys) !== JSON.stringify(hiddenItems)) {
      setHiddenItems(hiddenKeys);
    }
  }, [hiddenKeys, setHiddenItems, hiddenItems]);

  useEffect(() => {
    if (JSON.stringify(visibleKeys) !== JSON.stringify(visibleItems)) {
      setVisibleItems(visibleKeys);
    }
  }, [visibleKeys, setVisibleItems, visibleItems]);

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
  const dates = useMemo(() => flattenedDataSet.map(extractDates), [flattenedDataSet, disabledItems]);

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
        .filter(key => !disabledItems.includes(key) && !hiddenItems.includes(key))
        .reduce(
          (acc, key) => {
            acc[key] = [];
            return acc;
          },
          {} as { [key: string]: RectData[] }
        );

      rawDataSet
        .filter(
          dataItem => !hiddenItems.includes(dataItem.seriesKey) && !disabledItems.includes(dataItem.seriesKey)
        )
        .forEach((dataItem, groupIndex) => {
          const series = dataItem.series;
          const groupWidth = xScale.bandwidth() / Object.keys(stackedData).length;

          series.forEach(yearData => {
            let y0 = 0;
            effectiveKeys
              .filter(key => !disabledItems.includes(key) && !hiddenItems.includes(key))
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
                const itemHeight = value !== undefined && value !== null ? Math.max(3, rawHeight) : 0;
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
                  fill: colorsMapping[key],
                  data: yearData,
                  seriesKey: dataItem.seriesKey,
                  seriesKeyAbbreviation: dataItem.seriesKeyAbbreviation,
                  value: numericValue,
                  date: yearData.date,
                };
                y0 = y1;
                stackedData[key].push(rectData as unknown as RectData);
              });
          });
        });

      return stackedData;
    },
    [effectiveKeys, disabledItems, hiddenItems, xScale, yScale, colorsMapping]
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
                    ${data[key] ? `<p style="color:${colorsMapping[key]}">${key}: ${data[key]}</p>` : "N/A"}
                </div>`;
      }
      return `
                <div style="background: #fff; padding: 5px">
                    <p>${data.date} - ${seriesKey}</p>
                    ${Object.keys(data)
                      .filter(key => key !== "date")
                      .sort()
                      .map(key => `<p style="color:${colorsMapping[key]}">${key}: ${data[key] ?? "N/A"}</p>`)
                      .join("")}
                </div>`;
    },
    [tooltipFormatter, showCombined, colorsMapping]
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
      setHighlightItems([key]);
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
            })) as unknown as DataPoint[]
        );
      }
    },
    [setHighlightItems, generateTooltipContent, stackedRectData]
  );

  const handleMouseOut = useCallback(() => {
    setHighlightItems([]);
    if (tooltipRef.current) {
      tooltipRef.current.style.visibility = "hidden";
    }
  }, [setHighlightItems]);

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
  useEffect(() => {
    if (renderCompleteRef.current && onChartDataProcessed) {
      // Filter out keys with empty arrays
      const filteredRenderedData = Object.fromEntries(
        Object.entries(stackedRectData).filter(([_, array]) => array.length > 0)
      );

      // Sort visibleKeys based on values at the filter date if filter exists
      let sortedVisibleKeys = visibleKeys;
      if (filter?.date) {
        sortedVisibleKeys = [...visibleKeys].sort((a, b) => {
          const aValue = stackedRectData[a]?.find(d => String(d.date) === String(filter.date))?.value || 0;
          const bValue = stackedRectData[b]?.find(d => String(d.date) === String(filter.date))?.value || 0;
          return filter.sortingDir === "desc" ? bValue - aValue : aValue - bValue;
        });
      }

      // Create the current metadata with filtered data and UNIQUE xAxisDomain
      const currentMetadata: ChartMetadata = {
        xAxisDomain: [...new Set(xAxisDomain ?? dates)],
        visibleKeys: sortedVisibleKeys,
        renderedData: filteredRenderedData,
      };

      // Check if the data has actually changed
      const hasChanged =
        !prevChartDataRef.current ||
        JSON.stringify(prevChartDataRef.current.xAxisDomain) !==
          JSON.stringify(currentMetadata.xAxisDomain) ||
        JSON.stringify(prevChartDataRef.current.visibleKeys) !==
          JSON.stringify(currentMetadata.visibleKeys) ||
        JSON.stringify(Object.keys(prevChartDataRef.current.renderedData).sort()) !==
          JSON.stringify(Object.keys(currentMetadata.renderedData).sort());

      // Only call the callback if data has changed
      if (hasChanged) {
        // Update the ref before calling the callback
        prevChartDataRef.current = currentMetadata;

        // Call callback with a slight delay to ensure DOM updates are complete
        const timeoutId = setTimeout(() => {
          onChartDataProcessed(currentMetadata);
        }, 0);

        return () => clearTimeout(timeoutId);
      }
    }
  }, [xAxisDomain, dates, visibleKeys, stackedRectData, filter, onChartDataProcessed]);

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
        <XaxisBand xScale={xScale} height={height} margin={margin} xAxisFormat={xAxisFormat} />
        <YaxisLinear
          yScale={yScale}
          width={width}
          height={height}
          margin={margin}
          highlightZeroLine={true}
          yAxisFormat={yAxisFormat}
        />
        <g>
          {keys.map(key => {
            if (hiddenItems.includes(key)) return null;

            return (
              <g key={key}>
                {stackedRectData[key] &&
                  stackedRectData[key]
                    .filter(d => !hiddenItems.includes(d.seriesKey))
                    .map((d: RectData, i: number) => (
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
                          opacity={highlightItems.length === 0 || highlightItems.includes(key) ? 1 : 0.2}
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

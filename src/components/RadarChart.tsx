import React, { useEffect, useMemo, useRef, useState, useLayoutEffect } from "react";
import * as d3 from "d3";
import styled from "styled-components";
import range from "lodash/range";
import isEqual from "lodash/isEqual";
import LoadingIndicator from "./shared/LoadingIndicator";
import { useDisplayIsNodata } from "./hooks/useDisplayIsNodata";
import { sanitizeForClassName } from "./hooks/lineChart/lineChartUtils";

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

const Polygon = styled.polygon`
  stroke-linejoin: round;
  pointer-events: stroke;
  transition: all 0.2s ease-out;
`;

const DataPointStyled = styled.circle`
  transition: opacity 0.3s ease-out;
`;

const DataPoints = styled.g`
  &.highlight {
    ${DataPointStyled} {
      opacity: 1;
      pointer-events: auto;
    }
  }
`;

const Tooltip = styled.div`
  position: absolute;
  padding: 8px 12px;
  border-radius: 4px;
  pointer-events: none;
  z-index: 1000;
  transition: opacity 0.3s;
  font-size: 12px;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border: 1px solid #e0e0e0;
  max-width: 200px;
  white-space: nowrap;
  transform: translate(-50%, -100%);
  margin-top: -10px;
`;

interface DataPoint {
  label: string;
  value: number;
  data: {
    value: number;
    date: string;
  }[];
  color?: string;
}

interface ChartMetadata {
  xAxisDomain: string[];
  yAxisDomain: [number, number];
  visibleItems: string[];
  renderedData: { [key: string]: DataPoint[] };
  chartType: "radar-chart";
  legendData?: { label: string; color: string; order: number; disabled?: boolean }[];
}

export interface RadarChartProps {
  width: number;
  height: number;
  tooltipFormatter?: (data: { date: string; value: number; series: never[] }) => React.ReactNode;
  poleLabelFormatter?: (data: string) => string;
  radialLabelFormatter?: (data: number) => string;
  series: DataPoint[];
  // The poles within the radar chart to present data in circular form
  poles?: {
    domain: number[];
    range: number[];
    labels: string[];
  };
  children?: React.ReactNode;
  isLoading?: boolean;
  isLoadingComponent?: React.ReactNode;
  isNodataComponent?: React.ReactNode;
  isNodata?: boolean | ((dataSet: DataPoint[]) => boolean);
  onChartDataProcessed?: (metadata: ChartMetadata) => void;
  onHighlightItem?: (labels: string[]) => void;
  tooltipContainerStyle?: React.CSSProperties;
  // colors is the color palette for new generated colors
  colors?: string[];
  // colorsMapping is the color mapping for existing colors
  // the purpose is to share the same color mapping between charts
  colorsMapping?: { [key: string]: string };
  // Callback to notify parent about generated color mapping
  onColorMappingGenerated?: (colorsMapping: { [key: string]: string }) => void;
  // highlightItems and disabledItems as props for better performance
  highlightItems?: string[];
  disabledItems?: string[];
  // filter for sorting and limiting series data
  filter?: {
    seriesLimit?: number;
    sortingDir?: "asc" | "desc";
    metric?: string;
  };
  // Whether to show filled areas (default: true)
  showFilled?: boolean;
  // Fill opacity for the polygon areas (default: 0.2)
  fillOpacity?: number;
}

export const RadarChart: React.FC<RadarChartProps> = ({
  width,
  height,
  series,
  poles,
  tooltipFormatter,
  poleLabelFormatter,
  radialLabelFormatter,
  children,
  isLoading = false,
  isLoadingComponent,
  isNodataComponent,
  isNodata,
  onChartDataProcessed,
  onHighlightItem,
  tooltipContainerStyle,
  colors = DEFAULT_COLORS,
  colorsMapping = {},
  onColorMappingGenerated,
  highlightItems = [],
  disabledItems = [],
  filter,
  showFilled = false,
  fillOpacity = 0.4,
}) => {
  const svgRef = useRef(null);
  const [tooltipData, setTooltipData] = useState<{
    date: string;
    value: number;
    series: never[];
  } | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const renderCompleteRef = useRef(false);
  const prevChartDataRef = useRef<ChartMetadata | null>(null);

  // Process series data based on filter
  const filteredSeries = useMemo(() => {
    if (!series || series.length === 0) return series;
    
    let processed = [...series];
    
    // Apply filtering and sorting based on filter props
    if (filter?.metric && filter.metric !== "Performance") {
      // Find the metric in the poles labels to get the correct index
      const metricIndex = poles?.labels?.findIndex(label => label === filter.metric);
      if (metricIndex !== undefined && metricIndex >= 0) {
        // Sort by the specified metric
        processed = processed.sort((a, b) => {
          const aValue = parseFloat(String(a.data[metricIndex]?.value || "0"));
          const bValue = parseFloat(String(b.data[metricIndex]?.value || "0"));
          return filter.sortingDir === "asc" ? aValue - bValue : bValue - aValue;
        });
      }
    } else {
      // Default sorting by Performance (first metric)
      processed = processed.sort((a, b) => {
        const aValue = parseFloat(String(a.data[0]?.value || "0"));
        const bValue = parseFloat(String(b.data[0]?.value || "0"));
        return filter?.sortingDir === "asc" ? aValue - bValue : bValue - aValue;
      });
    }
    
    // Apply series limit
    if (filter?.seriesLimit && filter.seriesLimit > 0) {
      processed = processed.slice(0, filter.seriesLimit);
    }
    
    return processed;
  }, [series, filter, poles?.labels]);

  const yScaleDomain = useMemo(() => {
    if (!filteredSeries) return [0, 30];
    return [
      0,
      Math.max(
        ...filteredSeries
          .filter((d: DataPoint) => !disabledItems.includes(d.label))
          .map((d: DataPoint) => d.data)
          .flat()
          .map(d => {
            const parsedValue = parseFloat(String(d.value));
            return isNaN(parsedValue) ? 0 : parsedValue;
          })
      ),
    ];
  }, [filteredSeries, disabledItems]);

  const yScale = useMemo(() => {
    return d3
      .scaleLinear()
      .domain(yScaleDomain)
      .range([0, height / 2 - 30]);
  }, [poles, height]);

  const anglesDateMapping = useMemo(
    () =>
      poles?.labels?.reduce((res: { [x: string]: number }, cur: string, i: number) => {
        res[cur] = (i / poles.labels.length) * 2 * Math.PI;
        return res;
      }, {}),
    [poles?.labels]
  );

  const genPolygonPoints = (
    data: { value: number; date: string }[],
    scale: (n: number) => number
  ) => {
    const points: { x: number; y: number; date: string; value: number }[] = new Array(
      data.length
    ).fill({
      x: null,
      y: null,
      date: null,
      value: null,
    });

    const pointString: string = data.reduce((res, cur, i) => {
      if (i > data.length) return res;

      // Use 0 as value for missing data points (center of radar)
      const value = cur?.value ? parseFloat(String(cur.value)) : 0;
      if (isNaN(value)) {
        return res;
      }

      // Adjusting starting angle by subtracting Math.PI / 2
      const angle = anglesDateMapping[cur.date];
      if (angle === undefined) {
        return res; // Skip if angle is not defined
      }
      // Now include the center of the radar chart in your calculations.
      const xVal = Math.round(width / 2 + scale(value) * Math.sin(angle));
      const yVal = Math.round(height / 2 + scale(value) * Math.cos(angle) * -1);

      points[i] = { x: xVal, y: yVal, date: cur.date, value: value };
      res += `${xVal},${yVal} `;
      return res;
    }, "");

    return { points, pointString };
  };

  // Generate colors for series that don't have colors in colorsMapping
  const generatedColorsMapping = useMemo(() => {
    const newMapping = { ...colorsMapping };
    let colorIndex = Object.keys(colorsMapping).length;

    if (filteredSeries && filteredSeries.length > 0) {
      // Extract unique labels without year suffixes for color mapping
      const uniqueLabels = [...new Set(filteredSeries.map(dataSet => {
        // Remove year suffix (e.g., "China-2021" -> "China")
        return dataSet.label.replace(/-\d{4}$/, '');
      }))];

      // Assign colors to unique labels only
      for (const uniqueLabel of uniqueLabels) {
        if (!newMapping[uniqueLabel]) {
          newMapping[uniqueLabel] = colors[colorIndex % colors.length];
          colorIndex++;
        }
      }
    }

    return newMapping;
  }, [filteredSeries, colorsMapping, colors]);

  // Notify parent about generated color mapping with infinite loop protection
  const lastColorMappingSentRef = useRef<{ [key: string]: string }>({});
  useLayoutEffect(() => {
    if (
      onColorMappingGenerated &&
      !isEqual(generatedColorsMapping, lastColorMappingSentRef.current)
    ) {
      lastColorMappingSentRef.current = { ...generatedColorsMapping };
      onColorMappingGenerated(generatedColorsMapping);
    }
  }, [generatedColorsMapping, onColorMappingGenerated]);

  const processedSeries =
    filteredSeries && filteredSeries.length > 0
      ? filteredSeries
          // sort disabled items first
          .filter((d: DataPoint) => !disabledItems.includes(d.label))
          .map((item: DataPoint) => ({
            ...genPolygonPoints(item.data, yScale),
            ...item,
          }))
      : [];

  useEffect(() => {
    const svg = d3.select(svgRef.current);

    svg.selectAll(".radial-label").remove();
    svg.selectAll(".radial-circle").remove();
    svg.selectAll(".pole-label").remove();

    // Drawing radial lines
    const numRadialTicks = 12;
    for (let i = 0; i < numRadialTicks; i++) {
      const angle = (i / numRadialTicks) * 2 * Math.PI;
      const x1 = width / 2;
      const y1 = height / 2;
      const x2 = width / 2 + Math.sin(angle) * (height / 2 - 30);
      const y2 = height / 2 - Math.cos(angle) * (height / 2 - 30);
      const line = d3.line()([
        [x1, y1],
        [x2, y2],
      ]);
      svg.append("path").attr("d", line).attr("stroke", "#c1c1c1").attr("stroke-width", 1).lower();
    }

    // Drawing radial circles
    const numCircleTicks = 6; // Or any other desired number.
    const circleRadii = range(1, numCircleTicks + 1).map(
      value => (height / 2) * (value / numCircleTicks)
    );

    circleRadii.forEach((radius, i) => {
      const tickValue = yScale.invert(radius - 30);
      const currentRadiusForLbl = radius - 30;
      const labelY = height / 2 - currentRadiusForLbl;

      svg
        .append("circle")
        .attr("class", "radial-circle")
        .attr("cx", width / 2)
        .attr("cy", height / 2)
        .attr("r", radius - 30)
        .attr("fill", "transparent")
        .attr("stroke", "#c1c1c1")
        .attr("stroke-width", 1)
        .style("pointer-events", "none")
        .attr("stroke-dasharray", "2,2");

      // Add tick label
      svg
        .append("text")
        .attr("class", "radial-label")
        .attr("x", width / 2)
        .attr("y", labelY) // Adjust vertical alignment as needed
        .attr("text-anchor", "end")
        .style("pointer-events", "none")
        .each(function () {
          const textElement = d3.select(this);
          if (radialLabelFormatter) {
            textElement.text(radialLabelFormatter(tickValue));
          } else {
            textElement.text(i === 0 ? i : tickValue.toFixed(1));
          }
        })
        .raise();
    });

    // Drawing labels
    const labelRadius = height / 2 - 5; // Adjust this as needed

    poles?.labels?.forEach((label: string, i: number) => {
      const angle = (i / poles.labels.length) * 2 * Math.PI;
      const lx = width / 2 + Math.sin(angle) * labelRadius;
      const ly = height / 2 - Math.cos(angle) * labelRadius;
      svg
        .append("text")
        .attr("class", "pole-label")
        .style("pointer-events", "none")
        .attr("x", lx)
        .attr("y", ly)
        .attr("dy", ".35em") // Adjust vertical alignment here
        .attr("text-anchor", () => {
          if (i === poles.labels.length / 2) return "middle";
          else if (lx < width / 2) return "end";
          else if (lx > width / 2) return "start";
          return "middle";
        })
        .text(poleLabelFormatter ? poleLabelFormatter(label) : label);
    });
  }, [width, height, filteredSeries, poles]);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll(".series").attr("opacity", highlightItems.length === 0 ? 1 : 0.5);
    svg.selectAll(".data-point").attr("opacity", 0);
    if (showFilled) {
      svg.selectAll(".series polygon").attr("fill-opacity", fillOpacity);
    }

    highlightItems.forEach((item: string) => {
      svg.selectAll(`.series[data-label="${item}"]`).attr("opacity", 1).raise();
      if (showFilled) {
        svg.selectAll(`.series[data-label="${item}"] polygon`).attr("fill-opacity", Math.min(fillOpacity * 2, 0.6));
      }
      svg.selectAll(`.data-point[data-label="${item}"]`).attr("opacity", 0.3).raise();
      svg.selectAll(".radial-label").raise();
    });
  }, [highlightItems, showFilled, fillOpacity]);

  const displayIsNodata = useDisplayIsNodata({
    dataSet: filteredSeries,
    isLoading: isLoading,
    isNodataComponent: isNodataComponent,
    isNodata: isNodata,
  });

  useLayoutEffect(() => {
    renderCompleteRef.current = true;
  }, []);

  useEffect(() => {
    if (renderCompleteRef.current && onChartDataProcessed) {
      // Ensure unique labels in poles.labels
      const uniquePoleLabels = poles?.labels ? [...new Set(poles.labels)] : [];

      // Generate legend data with colors based on unique labels (deduplicated)
      const uniqueSeriesLabels = [...new Set(filteredSeries?.map(item => {
        // Remove year suffix (e.g., "China-2021" -> "China")
        return item.label.replace(/-\d{4}$/, '');
      }) || [])];

      const legendData = uniqueSeriesLabels.map((uniqueLabel, index) => {
        // Use existing color from generatedColorsMapping if available, otherwise assign new color
        let finalColor = generatedColorsMapping[uniqueLabel];
        
        if (!finalColor) {
          // Assign colors based on legend order using DEFAULT_COLORS
          const colorIndex = index % colors.length;
          const baseColor = colors[colorIndex];

          // Calculate opacity for repeat items beyond color palette
          const repeatCycle = Math.floor(index / colors.length);
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
          label: uniqueLabel,
          color: finalColor,
          order: index,
          disabled: disabledItems.includes(uniqueLabel),
          dataLabelSafe: sanitizeForClassName(uniqueLabel),
          sortValue: undefined, // RadarChart doesn't have sorting
        };
      });

      const currentMetadata: ChartMetadata = {
        xAxisDomain: poles?.labels ? poles.labels.map(String) : [],
        yAxisDomain: yScale.domain() as [number, number],
        visibleItems: uniqueSeriesLabels.filter(label => !disabledItems.includes(label)),
        renderedData: {
          [uniquePoleLabels[0] || "default"]: filteredSeries || [],
        },
        chartType: "radar-chart",
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

      // Only call callback if data has changed
      if (hasChanged) {
        onChartDataProcessed(currentMetadata);
      }
    }
  }, [filteredSeries, poles, processedSeries, disabledItems, onChartDataProcessed]);

  return (
    <div style={{ position: "relative" }}>
      <Tooltip
        ref={tooltipRef}
        style={{
          opacity: tooltipData ? 1 : 0,
          ...tooltipContainerStyle,
        }}
        className="tooltip"
      >
        {tooltipData && (
          <>
            {tooltipFormatter ? (
              tooltipFormatter({
                date: tooltipData.date,
                value: tooltipData.value,
                series: tooltipData.series,
              })
            ) : (
              <>
                <strong>Date:</strong> {tooltipData.date}
                <br />
                <strong>Value:</strong> {tooltipData.value}
              </>
            )}
          </>
        )}
      </Tooltip>

      <svg
        width={width}
        height={height}
        style={{ overflow: "visible" }}
        ref={svgRef}
        onMouseOut={event => {
          event.preventDefault();
          event.stopPropagation();
          onHighlightItem([]);
          setTooltipData(null);
        }}
      >
        {children}
        {processedSeries.map(({ label, pointString, points, color }, i: number) => (
          <g
            key={`series-${i}`}
            data-label={label}
            data-label-safe={sanitizeForClassName(label)}
            className={`series`}
          >
            <Polygon
              points={pointString}
              fill={showFilled ? getColor(generatedColorsMapping[label.replace(/-\d{4}$/, '')], color) : "transparent"}
              fillOpacity={showFilled ? fillOpacity : 0}
              data-label={label}
              data-label-safe={sanitizeForClassName(label)}
              stroke={getColor(generatedColorsMapping[label.replace(/-\d{4}$/, '')], color)}
              strokeWidth={2}
              onMouseEnter={event => {
                event.preventDefault();
                onHighlightItem([label]);
              }}
              onMouseOut={event => {
                event.preventDefault();
                onHighlightItem([]);
              }}
            />
            <DataPoints className={`data-points data-points-${i}`}>
              {points.map(
                (
                  point: {
                    x: string | number | null | undefined;
                    y: string | number | null | undefined;
                    date: string;
                    value: number;
                  },
                  j: number
                ) => (
                  <g key={`data-point-${j}`}>
                    {point.x !== null && point.y !== null && (
                      <DataPointStyled
                        className={`data-point data-point-${i}`}
                        data-label={label}
                        data-label-safe={sanitizeForClassName(label)}
                        r={5}
                        cx={point.x}
                        cy={point.y}
                        stroke="#fff"
                        strokeWidth={2}
                        fill={getColor(generatedColorsMapping[label.replace(/-\d{4}$/, '')], color)}
                        onMouseEnter={e => {
                          onHighlightItem([label]);
                          setTooltipData({
                            date: point.date,
                            value: point.value,
                            series: points as never[],
                          });
                          if (tooltipRef.current) {
                            const tooltip = tooltipRef.current;
                            const svgRect = svgRef.current.getBoundingClientRect();
                            const x = e.clientX - svgRect.left;
                            const y = e.clientY - svgRect.top;

                            tooltip.style.left = `${x}px`;
                            tooltip.style.top = `${y}px`;
                          }
                        }}
                        onMouseOut={() => {
                          onHighlightItem([]);
                          setTooltipData(null);
                        }}
                      />
                    )}
                  </g>
                )
              )}
            </DataPoints>
          </g>
        ))}
      </svg>
      {isLoading && isLoadingComponent && <>{isLoadingComponent}</>}
      {isLoading && !isLoadingComponent && <LoadingIndicator />}
      {displayIsNodata && <>{isNodataComponent}</>}
    </div>
  );
};

export default RadarChart;

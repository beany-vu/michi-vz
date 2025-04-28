import React, {
  useEffect,
  useMemo,
  useRef,
  Suspense,
  useCallback,
  useLayoutEffect,
  FC,
  useState,
} from "react";
import * as d3 from "d3";
import { ScaleTime } from "d3";
import { DataPoint } from "../types/data";
import Title from "./shared/Title";
import YaxisLinear from "./shared/YaxisLinear";
import XaxisLinear from "./shared/XaxisLinear";
import { useChartContext } from "./MichiVzProvider";
import { ScaleLinear } from "d3-scale";
import LoadingIndicator from "./shared/LoadingIndicator";
import { useDisplayIsNodata } from "./hooks/useDisplayIsNodata";
import styled from "styled-components";

// Extend the Window interface for custom properties
declare global {
  interface Window {
    hoverResetTimer?: number; // Add optional timer ID
  }
}

const MARGIN = { top: 50, right: 50, bottom: 50, left: 50 };
const WIDTH = 900 - MARGIN.left - MARGIN.right;
const HEIGHT = 480 - MARGIN.top - MARGIN.bottom;
const DASH_LENGTH = 4;
const DASH_SEPARATOR_LENGTH = 4;

const LineChartContainer = styled.div`
  position: relative;
  contain: layout paint;
  content-visibility: auto;
  path {
    transition:
      stroke 0.3s ease-out,
      opacity 0.3s ease-out;
    transition-behavior: allow-discrete;
    will-change: stroke, opacity, d;
  }

  circle,
  rect,
  path.data-point {
    transition:
      fill 0.3s ease-out,
      stroke 0.3s ease-out,
      opacity 0.3s ease-out;
    will-change: fill, stroke, opacity;
  }

  .data-group {
    transition: opacity 0.3s ease-out;
  }

  /* Enhanced line-overlay styling for better hover targeting */
  .line-overlay {
    stroke-linecap: round;
    stroke-linejoin: round;
    cursor: pointer;
    /* Critical for proper hover behavior */
    pointer-events: stroke;
    /* Always ensure it's visible for hover but transparent visually */
    opacity: 0.05 !important;
  }
`;

interface LineChartProps {
  dataSet: {
    label: string;
    color: string;
    shape?: "circle" | "square" | "triangle";
    curve?: "curveBumpX" | "curveLinear";
    series: DataPoint[];
  }[];
  width: number;
  height: number;
  margin: { top: number; right: number; bottom: number; left: number };
  title?: string;
  yAxisDomain?: [number, number];
  yAxisFormat?: (d: number) => string;
  xAxisFormat?: (d: number) => string;
  xAxisDataType: "number" | "date_annual" | "date_monthly";
  tooltipFormatter?: (
    d: DataPoint,
    series: DataPoint[],
    dataSet: {
      label: string;
      color: string;
      shape?: "circle" | "square" | "triangle";
      series: DataPoint[];
    }[]
  ) => string;
  showCombined?: boolean;
  children?: React.ReactNode;
  isLoading?: boolean;
  isLoadingComponent?: React.ReactNode;
  isNodataComponent?: React.ReactNode;
  isNodata?:
    | boolean
    | ((
        dataSet: {
          label: string;
          color: string;
          series: DataPoint[];
        }[]
      ) => boolean);
  filter?: {
    limit: number;
    date: number | string;
    criteria: string;
    sortingDir: "asc" | "desc";
  };
  onChartDataProcessed?: (metadata: ChartMetadata) => void;
  onHighlightItem: (labels: string[]) => void;
  ticks?: number;
}

interface ChartMetadata {
  xAxisDomain: string[];
  yAxisDomain: [number, number];
  visibleItems: string[];
  renderedData: { [key: string]: DataPoint[] };
  chartType: "line-chart";
}

const LineChart: FC<LineChartProps> = ({
  dataSet,
  filter,
  title,
  width = WIDTH,
  height = HEIGHT,
  margin = MARGIN,
  yAxisDomain,
  yAxisFormat,
  xAxisDataType = "number",
  xAxisFormat,
  tooltipFormatter = (d: DataPoint) => `<div>${d.label} - ${d.date}: ${d.value}</div>`,
  showCombined = false,
  children,
  isLoading = false,
  isLoadingComponent,
  isNodataComponent,
  isNodata,
  onChartDataProcessed,
  onHighlightItem,
  ticks = 5,
}) => {
  const { colorsMapping, highlightItems, disabledItems } = useChartContext();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const renderCompleteRef = useRef(false);
  const prevChartDataRef = useRef<ChartMetadata | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const isInitialMount = useRef(true); // Track initial mount

  // Animation constants
  const TRANSITION_DURATION = 400;
  const TRANSITION_EASE = d3.easeQuadOut;

  // Use this constant for the fallback semi-transparent color
  const FALLBACK_COLOR = "rgba(253, 253, 253, 0.5)";

  // Helper function to get the appropriate color
  const getColor = useCallback(
    (mappedColor: string | undefined, dataColor: string | undefined): string => {
      if (mappedColor) return mappedColor;
      if (dataColor) return dataColor;
      return FALLBACK_COLOR;
    },
    []
  );

  // Add this helper function to sanitize labels for CSS class names
  const sanitizeForClassName = useCallback((str: string): string => {
    return str.replace(/[^a-z0-9]/gi, "_");
  }, []);

  const filteredDataSet = useMemo(() => {
    // If no filter is provided, return the entire dataset excluding disabled items
    if (!filter) {
      return dataSet.filter(d => !disabledItems.includes(d.label));
    }

    // Start with the base dataset, excluding disabled items
    let result = dataSet.filter(d => !disabledItems.includes(d.label));

    // Apply filter logic if filter exists
    result = result
      .filter(item => {
        const targetPoint = item.series.find(d => d.date.toString() === filter.date.toString());
        return targetPoint !== undefined;
      })
      .sort((a, b) => {
        const aPoint = a.series.find(d => d.date.toString() === filter.date.toString());
        const bPoint = b.series.find(d => d.date.toString() === filter.date.toString());
        const aVal = aPoint ? Number(aPoint[filter.criteria]) : 0;
        const bVal = bPoint ? Number(bPoint[filter.criteria]) : 0;
        return filter.sortingDir === "desc" ? bVal - aVal : aVal - bVal;
      })
      .slice(0, filter.limit);

    // Pre-process each dataset to ensure valid points for line rendering
    return result.map(item => ({
      ...item,
      series: item.series.filter(point => point.value !== null && point.value !== undefined),
    }));
  }, [dataSet, filter, disabledItems]);

  const yScale = useMemo(
    () =>
      d3
        .scaleLinear()
        .domain(
          yAxisDomain
            ? yAxisDomain
            : [
                d3.min(
                  filteredDataSet.flatMap(({ series }) => series.filter(dd => dd.value !== null)),
                  d => d.value
                ) || 0,
                d3.max(
                  filteredDataSet.flatMap(({ series }) => series.filter(dd => dd.value !== null)),
                  d => d.value
                ) || 1,
              ]
        )
        .range([height - margin.bottom, margin.top])
        .clamp(true)
        .nice(),
    [filteredDataSet, height, margin, yAxisDomain]
  );

  const xScale = useMemo(() => {
    if (xAxisDataType === "number") {
      return d3
        .scaleLinear()
        .domain([
          d3.min(filteredDataSet.flatMap(item => item.series.map(d => d.date as number))) || 0,
          d3.max(filteredDataSet.flatMap(item => item.series.map(d => d.date as number))) || 1,
        ])
        .range([margin.left, width - margin.right])
        .clamp(true)
        .nice();
    }

    if (xAxisDataType === "date_annual") {
      // sometimes the first tick is missing, so do a hack here
      const minDate = d3.min(
        filteredDataSet.flatMap(item => item.series.map(d => new Date(`${d.date}-01-01`)))
      );
      const maxDate = d3.max(
        filteredDataSet.flatMap(item => item.series.map(d => new Date(`${d.date}`)))
      );

      return d3
        .scaleTime()
        .domain([minDate || 0, maxDate || 1])
        .range([margin.left, width - margin.right]);
    }

    const minDate = d3.min(filteredDataSet.flatMap(item => item.series.map(d => new Date(d.date))));
    const maxDate = d3.max(filteredDataSet.flatMap(item => item.series.map(d => new Date(d.date))));

    return d3
      .scaleTime()
      .domain([minDate || 0, maxDate || 1])
      .range([margin.left, width - margin.right]);
  }, [filteredDataSet, width, margin, xAxisDataType]);

  const getYValueAtX = useCallback((series: DataPoint[], x: number | Date): number | undefined => {
    if (x instanceof Date) {
      const dataPoint = series.find(d => new Date(d.date).getTime() === x.getTime());
      return dataPoint ? dataPoint.value : undefined;
    }

    const dataPoint = series.find(d => Number(d.date) === x);
    return dataPoint ? dataPoint.value : undefined;
  }, []);

  const getPathLengthAtX = useCallback((path: SVGPathElement, x: number) => {
    const l = path.getTotalLength();
    const precision = 90;
    if (!path || path.getTotalLength() === 0) {
      return 0;
    }
    for (let i = 0; i <= precision; i++) {
      const pos = path.getPointAtLength((l * i) / precision);
      if (pos.x >= x) return (l * i) / precision;
    }
  }, []);

  const getDashArrayMemoized = useMemo(() => {
    return (
      series: DataPoint[],
      pathNode: SVGPathElement,
      xScale: ScaleLinear<number, number> | ScaleTime<number, number>
    ) => {
      const totalLength = pathNode.getTotalLength();
      const lengths = series.map(d => getPathLengthAtX(pathNode, xScale(new Date(d.date))));

      const dashArray = [];

      for (let i = 1; i <= series.length; i++) {
        const segmentLength =
          i === series.length - 1 ? totalLength - lengths[i - 1] : lengths[i] - lengths[i - 1];

        if (!series[i]?.certainty) {
          const dashes = Math.floor(segmentLength / (DASH_LENGTH + DASH_SEPARATOR_LENGTH));
          const remainder = Math.ceil(
            segmentLength - dashes * (DASH_LENGTH + DASH_SEPARATOR_LENGTH)
          );

          for (let j = 0; j < dashes; j++) {
            dashArray.push(DASH_LENGTH);
            dashArray.push(DASH_SEPARATOR_LENGTH);
          }

          if (remainder > 0) dashArray.push(remainder);
        } else {
          if (dashArray.length % 2 === 1) {
            dashArray.push(0);
            dashArray.push(segmentLength);
          } else {
            dashArray.push(segmentLength);
          }
        }
      }
      return dashArray.join(",");
    };
  }, [DASH_LENGTH, DASH_SEPARATOR_LENGTH]);

  const line = useCallback(
    ({ d, curve }: { d: Iterable<DataPoint>; curve: string }) => {
      return d3
        .line<DataPoint>()
        .x(d => {
          if (xAxisDataType === "number") {
            return xScale(Number(d.date));
          } else if (xAxisDataType === "date_annual") {
            return xScale(new Date(`${d.date}-01-01`));
          } else {
            return xScale(new Date(d.date));
          }
        })
        .y(d => yScale(d.value))
        .curve(d3?.[curve] ?? d3.curveBumpX)(d);
    },
    [xScale, yScale, xAxisDataType]
  );

  const lineData = useMemo(
    () =>
      dataSet.map(set => ({
        label: set.label,
        color: set.color,
        points: set.series,
      })),
    [dataSet]
  );

  // Track context changes independently
  const prevHighlightItems = useRef<string[]>([]);
  const prevDisabledItems = useRef<string[]>([]);
  const prevColorsMapping = useRef<{ [key: string]: string }>({});

  // Update context refs without triggering effects
  useEffect(() => {
    prevHighlightItems.current = highlightItems;
  }, [highlightItems]);

  useEffect(() => {
    prevDisabledItems.current = disabledItems;
  }, [disabledItems]);

  useEffect(() => {
    prevColorsMapping.current = colorsMapping;
  }, [colorsMapping]);

  // Update the useEffect that responds to highlightItems changes for consistency
  useLayoutEffect(() => {
    const svg = d3.select(svgRef.current);
    if (!svg.node()) return;

    // When no items are highlighted, all items should be fully visible
    if (highlightItems.length === 0) {
      svg.selectAll(".data-group").transition().duration(300).style("opacity", 1);
      // Ensure line-overlays are always 0.05 opacity
      svg.selectAll(".line-overlay").transition().duration(300).style("opacity", 0.05);
    } else {
      // First set all groups to low opacity
      svg.selectAll(".data-group").transition().duration(300).style("opacity", 0.05);

      // Then highlight all elements with the selected labels
      highlightItems.forEach(label => {
        svg
          .selectAll(`[data-label="${label}"]:not(.line-overlay)`)
          .transition()
          .duration(300)
          .style("opacity", 1);
      });

      // Ensure line-overlays are always 0.05 opacity
      svg.selectAll(".line-overlay").transition().duration(300).style("opacity", 0.05);
    }
  }, [highlightItems, svgRef]);

  // Improve both handleItemHighlight and the line overlay event handlers to ensure ALL data points are properly faded
  const handleItemHighlight = useCallback(
    (labels: string[]) => {
      // Direct DOM manipulation for immediate visual feedback
      const svg = d3.select(svgRef.current);
      if (svg.node() && labels.length > 0) {
        // First fade ALL elements - both lines and points
        svg.selectAll(".data-group").transition().duration(200).style("opacity", 0.05);
        svg
          .selectAll("circle, rect, path.data-point")
          .transition()
          .duration(200)
          .style("opacity", 0.05);

        // Then highlight all elements with the specified labels (except line-overlays)
        labels.forEach(label => {
          svg
            .selectAll(`[data-label="${label}"]:not(.line-overlay)`)
            .transition()
            .duration(200)
            .style("opacity", 1);
          // Explicitly target all shapes by type to ensure nothing is missed
          svg
            .selectAll(
              `circle[data-label="${label}"], rect[data-label="${label}"], path.data-point[data-label="${label}"]`
            )
            .transition()
            .duration(200)
            .style("opacity", 1);
        });

        // Ensure line-overlays are always 0.05 opacity
        svg.selectAll(".line-overlay").transition().duration(200).style("opacity", 0.05);
      } else if (svg.node()) {
        // Reset all opacities when no items are highlighted
        svg.selectAll(".data-group").transition().duration(200).style("opacity", 1);
        svg
          .selectAll("circle, rect, path.data-point")
          .transition()
          .duration(200)
          .style("opacity", 1);

        // Ensure line-overlays are always 0.05 opacity
        svg.selectAll(".line-overlay").transition().duration(200).style("opacity", 0.05);
      }

      onHighlightItem(labels);

      // Reset hover state after a delay to allow for normal processing later
      clearTimeout(window.hoverResetTimer);
      window.hoverResetTimer = window.setTimeout(() => {
        // setIsHovering(false);
      }, 1000); // 1 second delay to ensure hover state is fully complete
    },
    [onHighlightItem, svgRef]
  );

  // Only show loading state during initial component mount or when explicitly isLoading is true
  // Process data changes internally without showing loading overlay
  useEffect(() => {
    // Only show processing indicator on initial mount, not on subsequent data changes
    if (isInitialMount.current) {
      setIsProcessing(true);

      const initialTimer = setTimeout(() => {
        setIsProcessing(false);
        isInitialMount.current = false;
      }, TRANSITION_DURATION);

      return () => clearTimeout(initialTimer);
    }
  }, [TRANSITION_DURATION]);

  // Separate data processing effect that doesn't show loading overlay
  useEffect(() => {
    // Process data changes without showing loading overlay
    // Internal-only state for cleanup and synchronization
    const processingTimer = setTimeout(() => {
      // This just manages cleanup timing, doesn't affect UI
    }, TRANSITION_DURATION);

    return () => clearTimeout(processingTimer);
  }, [dataSet, filter, width, height, TRANSITION_DURATION]);

  // Calculate whether to show the loading indicator
  // Only show on initial load or explicit isLoading
  const showLoadingIndicator = isLoading || (isProcessing && isInitialMount.current);

  const visibleDataSets = useMemo(() => {
    return filteredDataSet.filter(d => d.series.length > 1);
  }, [filteredDataSet]);

  // Ensure we have clean data point removal when filter changes
  useEffect(() => {
    // This effect specifically runs when filter or dataset changes
    // It ensures all old data points are properly removed

    const svg = d3.select(svgRef.current);
    if (!svg.node()) return;

    // First, remove all existing data points before any new ones are rendered
    // Use a more aggressive selector to ensure all old points are removed
    svg.selectAll(".data-group:not(.line):not(.line-overlay)").remove();

    // This ensures a clean slate for new data points to be rendered
    // The main rendering effect will then add the correct points back
  }, [filter, dataSet]); // Only run when filter or dataset changes

  // Also update the handleMouseOut to restore opacity directly
  const handleMouseOut = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();

      // Keep hover state true briefly to prevent flicker
      // setIsHovering(true);

      // Directly manage opacity through D3 before clearing highlight
      const svg = d3.select(svgRef.current);
      if (svg.node()) {
        // Reset all groups to full opacity
        svg.selectAll(".data-group").transition().duration(300).style("opacity", 1);
        // Ensure line-overlays are always 0.05 opacity
        svg.selectAll(".line-overlay").transition().duration(300).style("opacity", 0.05);
      }

      // Clear highlight in context
      onHighlightItem([]);

      if (tooltipRef?.current) {
        tooltipRef.current.style.visibility = "hidden";
      }

      // Reset hover state after a small delay
      setTimeout(() => {
        // setIsHovering(false);
      }, 300);
    },
    [onHighlightItem, svgRef]
  );

  // Reset hover state on mouse out from the chart
  const handleChartMouseOut = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();

      // Ensure hover state is set
      // setIsHovering(true);

      // Clear highlight
      onHighlightItem([]);

      if (tooltipRef?.current) {
        tooltipRef.current.style.visibility = "hidden";
      }

      // Reset hover state after a small delay
      setTimeout(() => {
        // setIsHovering(false);
      }, 200);
    },
    [onHighlightItem]
  );

  // Main rendering effect
  useEffect(() => {
    const svg = d3.select(svgRef.current);

    // Instead of removing all lines, use D3 update pattern
    // Create a key function that uniquely identifies each dataset
    const keyFn = (d: (typeof filteredDataSet)[0]) => d.label;

    // Line paths - main paths
    const linePaths = svg.selectAll(".line").data(visibleDataSets, keyFn);

    // Exit - remove lines that no longer exist
    linePaths.exit().remove();

    // Update - update existing lines
    linePaths
      .attr("d", d =>
        line({
          d: d.series,
          curve: d?.curve ?? "curveBumpX",
        })
      )
      .each(function (d) {
        const pathNode = this as SVGPathElement;
        const dashArray = getDashArrayMemoized(d.series, pathNode, xScale);
        d3.select(this).attr("stroke-dasharray", dashArray);
      });

    // Enter - add new lines
    linePaths
      .enter()
      .append("path")
      .attr("class", (d, i) => `line line-${i} data-group data-group-${i}`)
      .attr("data-label", d => d.label)
      .attr("data-label-safe", d => sanitizeForClassName(d.label))
      .attr("d", d =>
        line({
          d: d.series,
          curve: d?.curve ?? "curveBumpX",
        })
      )
      .attr("stroke", "transparent")
      .attr("stroke-width", 2.5)
      .attr("fill", "none")
      .attr("pointer-events", "none")
      .attr("transition", "stroke 0.5s ease-out, opacity 0.5s ease-out")
      .attr("stroke", d => getColor(colorsMapping[d.label], d.color))
      .attr("opacity", 0)
      .each(function (d) {
        const pathNode = this as SVGPathElement;
        const dashArray = getDashArrayMemoized(d.series, pathNode, xScale);
        d3.select(this).attr("stroke-dasharray", dashArray);
      })
      .transition()
      .duration(TRANSITION_DURATION)
      .ease(TRANSITION_EASE)
      .attr("stroke", d => getColor(colorsMapping[d.label], d.color))
      .attr("opacity", 1);

    // Line overlays - handle similarly
    const lineOverlays = svg.selectAll(".line-overlay").data(visibleDataSets, keyFn);

    // Exit - remove overlays that no longer exist
    lineOverlays.exit().remove();

    // Update - update existing overlays
    lineOverlays.attr("d", d =>
      line({
        d: d.series,
        curve: d?.curve ?? "curveBumpX",
      })
    );

    // Enter - add new overlays
    const enterOverlays = lineOverlays
      .enter()
      .append("path")
      .attr("class", (d, i) => {
        const safeLabelClass = sanitizeForClassName(d.label);
        return `line-overlay line-overlay-${i} data-group-overlay data-group-${i} data-group-overlay-${safeLabelClass} line-group-overlay-${safeLabelClass}`;
      })
      .attr("data-label", d => d.label)
      .attr("data-label-safe", d => sanitizeForClassName(d.label))
      .attr("d", d =>
        line({
          d: d.series,
          curve: d?.curve ?? "curveBumpX",
        })
      )
      .attr("stroke", d => getColor(colorsMapping[d.label], d.color))
      .attr("stroke-width", 6)
      .attr("fill", "none")
      .attr("pointer-events", "stroke")
      .style("opacity", 0.05); // Use style instead of attr for consistency with transitions

    enterOverlays
      .transition()
      .duration(TRANSITION_DURATION)
      .ease(TRANSITION_EASE)
      .attr("stroke", d => getColor(colorsMapping[d.label], d.color))
      // Do not change the opacity for overlays
      .on("end", function (/* d */) {
        // Remove unused 'd'
        // After transition completes, add event listeners
        d3.select(this)
          .on("mouseenter", function (/* event */) {
            // Remove unused 'event'
            // Updated to directly use handleItemHighlight for consistency
            const label = d3.select(this).attr("data-label");
            if (label) {
              // Get all SVG elements
              const svg = d3.select(svgRef.current);

              // IMMEDIATELY fade all points and lines with no transition
              svg.selectAll(".data-group").style("opacity", 0.05);
              svg.selectAll("circle, rect, path.data-point").style("opacity", 0.05);

              // IMMEDIATELY highlight only points and lines with matching data-label
              svg.selectAll(`[data-label="${label}"]:not(.line-overlay)`).style("opacity", 1);
              // Double-ensure all shapes are explicitly targeted
              svg
                .selectAll(
                  `circle[data-label="${label}"], rect[data-label="${label}"], path.data-point[data-label="${label}"]`
                )
                .style("opacity", 1);

              // Keep line-overlays at consistent opacity
              svg.selectAll(".line-overlay").style("opacity", 0.05);

              // Use the standard highlight function after direct DOM manipulation
              handleItemHighlight([label]);
            }
          })
          .on("mouseout", handleMouseOut);
      });

    // Update existing overlays event handlers too
    lineOverlays
      .on("mouseenter", function (/* event, d */) {
        // Remove unused 'event' and 'd'
        // Get all SVG elements
        const svg = d3.select(svgRef.current);
        const label = d3.select(this).attr("data-label");

        if (label) {
          // IMMEDIATELY fade all points and lines with no transition
          svg.selectAll(".data-group").style("opacity", 0.05);
          svg.selectAll("circle, rect, path.data-point").style("opacity", 0.05);

          // IMMEDIATELY highlight only points and lines with matching data-label
          svg.selectAll(`[data-label="${label}"]:not(.line-overlay)`).style("opacity", 1);
          // Double-ensure all shapes are explicitly targeted
          svg
            .selectAll(
              `circle[data-label="${label}"], rect[data-label="${label}"], path.data-point[data-label="${label}"]`
            )
            .style("opacity", 1);

          // Keep line-overlays at consistent opacity
          svg.selectAll(".line-overlay").style("opacity", 0.05);

          // Use the standard highlight function after direct DOM manipulation
          handleItemHighlight([label]);
        }
      })
      .on("mouseout", handleMouseOut);

    // First remove any existing data points that don't belong to currently filtered datasets
    svg
      .selectAll(".data-group:not(.line):not(.line-overlay)")
      .filter(function () {
        const dataLabel = (this as SVGElement).getAttribute("data-label");
        return !visibleDataSets.some(d => d.label === dataLabel);
      })
      .remove();

    // Now draw points ONLY for the same datasets that have visible paths
    for (let i = 0; i < visibleDataSets.length; i++) {
      const data = visibleDataSets[i];
      const shape = data.shape || "circle";
      const circleSize = 5;
      const squareSize = 6;
      const triangleSize = 8;
      const color = getColor(colorsMapping[data.label], data.color);
      const safeLabelClass = sanitizeForClassName(data.label);

      // Use a composite key that includes both dataset label and point date to ensure uniqueness
      const pointKeyFn = (d: DataPoint) => `${data.label}-${d.date}`;

      if (shape === "circle") {
        // Select existing circles - use sanitized class names for selectors
        const circles = svg
          .selectAll(`.data-point-${i}[data-label="${data.label}"]`)
          .data(data.series, pointKeyFn);

        // Remove circles that no longer exist
        circles.exit().remove();

        // Update existing circles
        circles
          .attr("cx", d => xScale(new Date(d.date)))
          .attr("cy", d => yScale(d.value))
          .attr("fill", color);

        // Add new circles
        circles
          .enter()
          .append("circle")
          .attr(
            "class",
            `data-group data-point data-group-${i} data-group-${safeLabelClass} data-point-${i}`
          )
          .attr("data-label", data.label)
          .attr("data-label-safe", safeLabelClass)
          .attr("cx", d => xScale(new Date(d.date)))
          .attr("cy", d => yScale(d.value))
          .attr("r", circleSize) // Set final size immediately
          .attr("fill", color)
          .attr("stroke", "#fdfdfd")
          .attr("stroke-width", 2)
          .attr("cursor", "crosshair")
          .style("opacity", 0) // Start with opacity 0
          .transition()
          .duration(TRANSITION_DURATION)
          .ease(TRANSITION_EASE)
          .style("opacity", 1); // Only transition opacity to 1
      } else if (shape === "square") {
        // Select existing squares
        const squares = svg
          .selectAll(`.data-point-${i}[data-label="${data.label}"]`)
          .data(data.series, pointKeyFn);

        // Remove squares that no longer exist
        squares.exit().remove();

        // Update existing squares
        squares
          .attr("x", d => xScale(new Date(d.date)) - squareSize)
          .attr("y", d => yScale(d.value) - squareSize)
          .attr("fill", color);

        // Add new squares
        squares
          .enter()
          .append("rect")
          .attr(
            "class",
            `data-group data-point data-group-${i} data-group-${safeLabelClass} data-point-${i}`
          )
          .attr("data-label", data.label)
          .attr("data-label-safe", safeLabelClass)
          .attr("x", d => xScale(new Date(d.date)) - squareSize)
          .attr("y", d => yScale(d.value) - squareSize)
          .attr("width", squareSize * 2) // Set final size immediately
          .attr("height", squareSize * 2) // Set final size immediately
          .attr("fill", color)
          .attr("stroke", "#fdfdfd")
          .attr("stroke-width", 2)
          .attr("cursor", "crosshair")
          .style("opacity", 0) // Start with opacity 0
          .transition()
          .duration(TRANSITION_DURATION)
          .ease(TRANSITION_EASE)
          .style("opacity", 1); // Only transition opacity to 1
      } else if (shape === "triangle") {
        // Select existing triangles
        const triangles = svg
          .selectAll(`.data-point-${i}[data-label="${data.label}"]`)
          .data(data.series, pointKeyFn);

        // Remove triangles that no longer exist
        triangles.exit().remove();

        // Update existing triangles
        triangles
          .attr("d", d => {
            const x = xScale(new Date(d.date));
            const y = yScale(d.value);
            return `M${x},${y - triangleSize} L${x + triangleSize},${y + triangleSize} L${x - triangleSize},${y + triangleSize} Z`;
          })
          .attr("fill", color);

        // Add new triangles - scale from center for animation
        triangles
          .enter()
          .append("path")
          .attr(
            "class",
            `data-group data-point data-group-${i} data-group-${safeLabelClass} data-point-${i} data-point`
          )
          .attr("data-label", data.label)
          .attr("data-label-safe", safeLabelClass)
          .attr("d", d => {
            const x = xScale(new Date(d.date));
            const y = yScale(d.value);
            return `M${x},${y} L${x},${y} L${x},${y} Z`; // Start as a point
          })
          .attr("fill", color)
          .attr("stroke", "#fdfdfd")
          .attr("stroke-width", 2)
          .attr("cursor", "crosshair")
          .style("opacity", 0) // Start with opacity 0
          .transition()
          .duration(TRANSITION_DURATION)
          .ease(TRANSITION_EASE)
          .style("opacity", 1); // Only transition opacity to 1
      }

      // Add event listeners to all data points after they've been created or updated
      svg
        .selectAll(`.data-point-${i}[data-label="${data.label}"]`)
        .on("mouseenter", (event, d: DataPoint) => {
          event.preventDefault();
          event.stopPropagation();

          handleItemHighlight([data.label]);

          const tooltipContent = tooltipFormatter(
            {
              ...d,
              label: data.label,
            } as DataPoint,
            data.series,
            filteredDataSet
          );

          if (tooltipRef?.current && svgRef.current) {
            const [mouseX, mouseY] = d3.pointer(event, event.currentTarget);
            const svgRect = svgRef.current.getBoundingClientRect();
            const tooltip = tooltipRef.current;

            tooltip.style.visibility = "visible";
            tooltip.innerHTML = tooltipContent;
            const tooltipRect = tooltip.getBoundingClientRect();

            const xPosition = mouseX + 10;
            const yPosition = mouseY - 25;

            if (xPosition + tooltipRect.width > svgRect.width - margin.right) {
              tooltip.style.left = `${mouseX - tooltipRect.width - 10}px`;
            } else {
              tooltip.style.left = `${xPosition}px`;
            }

            if (yPosition < margin.top) {
              tooltip.style.top = `${mouseY + 10}px`;
            } else {
              tooltip.style.top = `${yPosition}px`;
            }
          }
        })
        .on("mouseout", event => {
          event.preventDefault();
          event.stopPropagation();

          const relatedTarget = event.relatedTarget;
          const isMouseOverLine =
            relatedTarget &&
            (relatedTarget.classList.contains("line") ||
              relatedTarget.classList.contains("line-overlay"));

          if (!isMouseOverLine) {
            handleItemHighlight([]);
            if (tooltipRef?.current) {
              tooltipRef.current.style.visibility = "hidden";
            }
          }
        });
    }
  }, [
    filteredDataSet,
    visibleDataSets,
    width,
    height,
    margin,
    xAxisDataType,
    getDashArrayMemoized,
    colorsMapping,
    line,
    xScale,
    yScale,
    handleItemHighlight,
    handleMouseOut,
    tooltipFormatter,
    tooltipRef,
    svgRef,
    getColor,
    sanitizeForClassName,
    TRANSITION_DURATION,
    TRANSITION_EASE,
  ]);

  useLayoutEffect(() => {
    const svg = d3.select(svgRef.current);
    const TRANSITION_DURATION = 400; // Consistent duration

    // Use for loop instead of forEach for better performance
    for (const key of Object.keys(colorsMapping)) {
      // Update circle/point colors with transitions
      svg
        .selectAll(
          `circle[data-label="${key}"], rect[data-label="${key}"], path.data-point[data-label="${key}"]`
        )
        .transition()
        .duration(TRANSITION_DURATION)
        .ease(d3.easeQuadOut) // Add consistent easing
        .attr("fill", getColor(colorsMapping[key], null));

      // Update path colors with proper selectors and transitions
      svg
        .selectAll(`.line[data-label="${key}"]`)
        .transition()
        .duration(TRANSITION_DURATION)
        .ease(d3.easeQuadOut) // Add consistent easing
        .attr("stroke", getColor(colorsMapping[key], null))
        .attr("stroke-width", 2.5);

      // Update path overlay colors with transitions
      svg
        .selectAll(`.line-overlay[data-label="${key}"]`)
        .transition()
        .duration(TRANSITION_DURATION)
        .ease(d3.easeQuadOut) // Add consistent easing
        .attr("stroke", getColor(colorsMapping[key], null));
    }
  }, [colorsMapping, getColor]);

  useLayoutEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll(".data-group").style("opacity", highlightItems.length > 0 ? 0.05 : 1);

    if (highlightItems.length > 0) {
      // Use for loop instead of forEach
      for (let i = 0; i < highlightItems.length; i++) {
        svg.selectAll(`[data-label="${highlightItems[i]}"]`).style("opacity", 1);
      }
    }

    if (highlightItems.length === 0) {
      d3.select("#tooltip").style("visibility", "hidden");
    }
  }, [highlightItems]);

  const handleHover = useCallback(
    (event: MouseEvent) => {
      if (!svgRef.current || !tooltipRef.current) return;

      const [x, y] = d3.pointer(event, event.currentTarget as SVGElement);
      const xValue = xScale.invert(x);

      const tooltipTitle = `<div class="tooltip-title">${xValue}</div>`;
      const tooltipContent = filteredDataSet
        .map(data => {
          const yValue = getYValueAtX(data.series, xValue);
          return `<div>${data.label}: ${yValue ?? "N/A"}</div>`;
        })
        .join("");

      const tooltip = tooltipRef.current;
      tooltip.innerHTML = `<div style="background: #fff; padding: 5px">${tooltipTitle}${tooltipContent}</div>`;

      // Make tooltip visible to calculate its dimensions
      tooltip.style.opacity = "1";
      tooltip.style.visibility = "visible";
      tooltip.style.pointerEvents = "auto";

      // Get dimensions to check for overflow
      const tooltipRect = tooltip.getBoundingClientRect();
      const svgRect = svgRef.current.getBoundingClientRect();

      // Check for right edge overflow
      if (x + tooltipRect.width > svgRect.width - margin.right) {
        tooltip.style.left = x - tooltipRect.width - 10 + "px";
      } else {
        tooltip.style.left = x + 10 + "px";
      }

      // Check for top/bottom edge overflow
      if (y - tooltipRect.height < margin.top) {
        tooltip.style.top = y + 10 + "px";
      } else {
        tooltip.style.top = y - tooltipRect.height - 5 + "px";
      }

      const hoverLinesGroup = d3.select(svgRef.current).select(".hover-lines");
      const hoverLine = hoverLinesGroup.select(".hover-line");
      const xPosition = xScale(xValue);

      hoverLine
        .attr("x1", xPosition)
        .attr("x2", xPosition)
        .attr("y1", MARGIN.top)
        .attr("y2", HEIGHT - MARGIN.bottom + 20)
        .style("display", "block");

      hoverLinesGroup.style("display", "block");
    },
    [xScale, filteredDataSet, getYValueAtX, margin]
  );

  const handleCombinedMouseOut = useCallback(() => {
    if (!tooltipRef.current || !svgRef.current) return;

    const tooltip = tooltipRef.current;
    tooltip.style.visibility = "hidden";
    tooltip.style.opacity = "0";
    tooltip.innerHTML = "";

    const hoverLinesGroup = d3.select(svgRef.current).select(".hover-lines");
    const hoverLine = hoverLinesGroup.select(".hover-line");

    hoverLinesGroup.style("display", "none");
    hoverLine.style("display", "none");
  }, []);

  useLayoutEffect(() => {
    if (!showCombined || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const hoverLinesGroup = svg.append("g").attr("class", "hover-lines").style("display", "none");

    // Add the hover line to group and use it in callback
    hoverLinesGroup
      .append("line")
      .attr("class", "hover-line")
      .attr("stroke", "lightgray")
      .attr("stroke-width", 1)
      .style("pointer-events", "none")
      .style("display", "none");

    const overlay = svg
      .append("rect")
      .attr("class", "overlay")
      .attr("width", width)
      .attr("height", height)
      .style("fill", "none")
      .style("pointer-events", "all");

    overlay.on("mousemove", handleHover);
    overlay.on("mouseout", handleCombinedMouseOut);

    return () => {
      overlay.on("mousemove", null);
      overlay.on("mouseout", null);
      hoverLinesGroup.remove();
      overlay.remove();
    };
  }, [showCombined, width, height, handleHover, handleCombinedMouseOut]);

  const displayIsNodata = useDisplayIsNodata({
    dataSet: dataSet,
    isLoading: isLoading,
    isNodataComponent: isNodataComponent,
    isNodata: isNodata,
  });

  useLayoutEffect(() => {
    renderCompleteRef.current = true;
  }, []);

  useLayoutEffect(() => {
    if (renderCompleteRef.current && onChartDataProcessed) {
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

      // Only call callback if data has changed
      if (hasChanged) {
        onChartDataProcessed(currentMetadata);
      }
    }
  }, [dataSet, xAxisDataType, yScale, disabledItems, lineData, filter, onChartDataProcessed]);

  return (
    <LineChartContainer>
      <div style={{ position: "relative", width: width, height: height }}>
        {/* Always render the SVG, but optionally overlay the loading indicator */}
        <Suspense fallback={<LoadingIndicator />}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            ref={svgRef}
            width={width}
            height={height}
            onMouseOut={handleChartMouseOut}
          >
            {children}
            <Title x={width / 2} y={margin.top / 2}>
              {title}
            </Title>
            {filteredDataSet.length > 0 && (
              <>
                <XaxisLinear
                  xScale={xScale}
                  height={height}
                  margin={margin}
                  xAxisFormat={xAxisFormat}
                  xAxisDataType={xAxisDataType}
                  ticks={ticks}
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
          </svg>
        </Suspense>

        {/* Show loading indicator as an overlay when loading */}
        {showLoadingIndicator && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              background: "rgba(255, 255, 255, 0.7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10,
            }}
          >
            {isLoadingComponent || <LoadingIndicator />}
          </div>
        )}

        <div
          ref={tooltipRef}
          className="tooltip"
          style={{
            position: "absolute",
            visibility: "hidden",
            transition: "visibility 0.1s ease-out, opacity 0.1s ease-out",
            willChange: "visibility, opacity, top, left",
            zIndex: 1000,
            pointerEvents: "none",
            padding: "5px",
            borderRadius: "4px",
            whiteSpace: "nowrap",
          }}
        />
        {displayIsNodata && <>{isNodataComponent}</>}
      </div>
    </LineChartContainer>
  );
};

export default LineChart;

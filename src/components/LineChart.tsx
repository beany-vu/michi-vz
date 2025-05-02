import React, {
  useEffect,
  useMemo,
  useRef,
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

  /* Hide domain line consistently */
  .domain {
    stroke-opacity: 0 !important;
    opacity: 0 !important;
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

const TRANSITION_DURATION = 400;

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
    // Create typed version to properly handle the dataset
    type DataSetItem = {
      label: string;
      color: string;
      shape?: "circle" | "square" | "triangle";
      curve?: "curveBumpX" | "curveLinear";
      series: DataPoint[];
    };

    // If no filter is provided, return the entire dataset excluding disabled items
    if (!filter) {
      const result: DataSetItem[] = [];
      for (let i = 0; i < dataSet.length; i++) {
        if (!disabledItems.includes(dataSet[i].label)) {
          result.push(dataSet[i]);
        }
      }
      return result;
    }

    // Start with the base dataset, excluding disabled items
    const filtered: DataSetItem[] = [];
    for (let i = 0; i < dataSet.length; i++) {
      const item = dataSet[i] as DataSetItem;
      if (!disabledItems.includes(item.label)) {
        let hasTargetPoint = false;
        const series = item.series;
        for (let j = 0; j < series.length; j++) {
          const point = series[j] as DataPoint;
          if (point.date.toString() === filter.date.toString()) {
            hasTargetPoint = true;
            break;
          }
        }
        if (hasTargetPoint) {
          filtered.push(item);
        }
      }
    }

    // Sort based on filter criteria
    filtered.sort((a, b) => {
      let aVal = 0;
      let bVal = 0;

      const aSeries = a.series;
      for (let i = 0; i < aSeries.length; i++) {
        const aPoint = aSeries[i] as DataPoint;
        if (aPoint.date.toString() === filter.date.toString()) {
          aVal = Number(aPoint[filter.criteria as keyof DataPoint] || 0);
          break;
        }
      }

      const bSeries = b.series;
      for (let i = 0; i < bSeries.length; i++) {
        const bPoint = bSeries[i] as DataPoint;
        if (bPoint.date.toString() === filter.date.toString()) {
          bVal = Number(bPoint[filter.criteria as keyof DataPoint] || 0);
          break;
        }
      }

      return filter.sortingDir === "desc" ? bVal - aVal : aVal - bVal;
    });

    // Apply limit
    const result = filtered.slice(0, filter.limit);

    // Pre-process to ensure valid points for line rendering
    for (let i = 0; i < result.length; i++) {
      const validPoints: DataPoint[] = [];
      const series = result[i].series;
      for (let j = 0; j < series.length; j++) {
        const point = series[j] as DataPoint;
        if (point.value !== null && point.value !== undefined) {
          validPoints.push(point);
        }
      }
      result[i] = { ...result[i], series: validPoints };
    }

    return result;
  }, [dataSet, filter, disabledItems]);

  const yScale = useMemo(() => {
    let minValue = Infinity;
    let maxValue = -Infinity;

    if (yAxisDomain) {
      return d3
        .scaleLinear()
        .domain(yAxisDomain)
        .range([height - margin.bottom, margin.top])
        .clamp(true)
        .nice();
    }

    // Find min and max values manually with for loops
    for (let i = 0; i < filteredDataSet.length; i++) {
      const dataItem = filteredDataSet[i];
      const series = dataItem.series as DataPoint[];
      for (let j = 0; j < series.length; j++) {
        const point = series[j] as DataPoint;
        if (point.value !== null) {
          minValue = Math.min(minValue, point.value);
          maxValue = Math.max(maxValue, point.value);
        }
      }
    }

    // Handle edge case where no valid values were found
    if (minValue === Infinity) minValue = 0;
    if (maxValue === -Infinity) maxValue = 1;

    return d3
      .scaleLinear()
      .domain([minValue, maxValue])
      .range([height - margin.bottom, margin.top])
      .clamp(true)
      .nice();
  }, [filteredDataSet, height, margin, yAxisDomain]);

  const xScale = useMemo(() => {
    if (xAxisDataType === "number") {
      let minDate = Infinity;
      let maxDate = -Infinity;

      // Find min and max dates manually with for loops
      for (let i = 0; i < filteredDataSet.length; i++) {
        const dataItem = filteredDataSet[i];
        const series = dataItem.series as DataPoint[];
        for (let j = 0; j < series.length; j++) {
          const point = series[j] as DataPoint;
          const dateValue = Number(point.date);
          minDate = Math.min(minDate, dateValue);
          maxDate = Math.max(maxDate, dateValue);
        }
      }

      // Handle edge cases
      if (minDate === Infinity) minDate = 0;
      if (maxDate === -Infinity) maxDate = 1;

      return d3
        .scaleLinear()
        .domain([minDate, maxDate])
        .range([margin.left, width - margin.right])
        .clamp(true)
        .nice();
    }

    if (xAxisDataType === "date_annual") {
      let minDate = new Date("9999-12-31");
      let maxDate = new Date("0000-01-01");

      // Find min and max dates manually
      for (let i = 0; i < filteredDataSet.length; i++) {
        const dataItem = filteredDataSet[i];
        const series = dataItem.series as DataPoint[];
        for (let j = 0; j < series.length; j++) {
          const point = series[j] as DataPoint;
          const dateStr = String(point.date);
          const date = new Date(`${dateStr}-01-01`);
          if (date < minDate) minDate = date;
          if (date > maxDate) maxDate = date;
        }
      }

      // Handle edge cases
      if (minDate.getFullYear() === 9999) minDate = new Date();
      if (maxDate.getFullYear() === 0) maxDate = new Date();

      return d3
        .scaleTime()
        .domain([minDate, maxDate])
        .range([margin.left, width - margin.right]);
    }

    let minDate = new Date("9999-12-31");
    let maxDate = new Date("0000-01-01");

    // Find min and max dates manually
    for (let i = 0; i < filteredDataSet.length; i++) {
      const dataItem = filteredDataSet[i];
      const series = dataItem.series as DataPoint[];
      for (let j = 0; j < series.length; j++) {
        const point = series[j] as DataPoint;
        const dateStr = String(point.date);
        const date = new Date(dateStr);
        if (date < minDate) minDate = date;
        if (date > maxDate) maxDate = date;
      }
    }

    // Handle edge cases
    if (minDate.getFullYear() === 9999) minDate = new Date();
    if (maxDate.getFullYear() === 0) maxDate = new Date();

    return d3
      .scaleTime()
      .domain([minDate, maxDate])
      .range([margin.left, width - margin.right]);
  }, [filteredDataSet, width, margin, xAxisDataType]);

  const getYValueAtX = useCallback((series: DataPoint[], x: number | Date): number | undefined => {
    if (x instanceof Date) {
      const xTime = x.getTime();
      for (let i = 0; i < series.length; i++) {
        const point = series[i];
        const pointDate = new Date(point.date);
        if (pointDate.getTime() === xTime) {
          return point.value;
        }
      }
      return undefined;
    }

    for (let i = 0; i < series.length; i++) {
      const point = series[i];
      if (Number(point.date) === x) {
        return point.value;
      }
    }
    return undefined;
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

      // Use for loop instead of map
      const lengths = [];
      for (let i = 0; i < series.length; i++) {
        const point = series[i];
        lengths.push(getPathLengthAtX(pathNode, xScale(new Date(point.date))));
      }

      const dashArray = [];

      for (let i = 1; i <= series.length; i++) {
        const segmentLength =
          i === series.length - 1 ? totalLength - lengths[i - 1] : lengths[i] - lengths[i - 1];

        if (i < series.length && !series[i]?.certainty) {
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
  }, [DASH_LENGTH, DASH_SEPARATOR_LENGTH, getPathLengthAtX]);

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
  useLayoutEffect(() => {
    prevHighlightItems.current = highlightItems;
  }, [highlightItems]);

  useLayoutEffect(() => {
    prevDisabledItems.current = disabledItems;
  }, [disabledItems]);

  useLayoutEffect(() => {
    prevColorsMapping.current = colorsMapping;
  }, [colorsMapping]);

  // Update the useEffect that responds to highlightItems changes for consistency
  useLayoutEffect(() => {
    const svg = d3.select(svgRef.current);
    if (!svg.node()) return;

    // When no items are highlighted, all items should be fully visible
    if (highlightItems.length === 0) {
      svg.selectAll(".data-group").transition().duration(TRANSITION_DURATION).style("opacity", 1);
      // Ensure line-overlays are always 0.05 opacity
      svg
        .selectAll(".line-overlay")
        .transition()
        .duration(TRANSITION_DURATION)
        .style("opacity", 0.05);
    } else {
      // First set all groups to low opacity
      svg
        .selectAll(".data-group")
        .transition()
        .duration(TRANSITION_DURATION)
        .style("opacity", 0.05);

      // Then highlight all elements with the selected labels
      highlightItems.forEach(label => {
        svg
          .selectAll(`[data-label="${label}"]:not(.line-overlay)`)
          .transition()
          .duration(TRANSITION_DURATION)
          .style("opacity", 1);
      });

      // Ensure line-overlays are always 0.05 opacity
      svg
        .selectAll(".line-overlay")
        .transition()
        .duration(TRANSITION_DURATION)
        .style("opacity", 0.05);
    }
  }, [highlightItems, svgRef]);

  // Improve both handleItemHighlight and the line overlay event handlers to ensure ALL data points are properly faded
  const handleItemHighlight = useCallback(
    (labels: string[]) => {
      // Direct DOM manipulation for immediate visual feedback
      const svg = d3.select(svgRef.current);
      if (svg.node() && labels.length > 0) {
        // Select all shape groups and update opacity based on data-label attribute
        svg.selectAll<SVGGElement, unknown>(".shape-group").each(function () {
          const element = d3.select(this);
          const dataLabel = element.attr("data-label");
          element
            .transition()
            .duration(100)
            .style("opacity", labels.includes(dataLabel) ? 1 : 0.05);
        });
      } else if (svg.node()) {
        // Reset all opacities when no items are highlighted
        svg
          .selectAll(".shape-group")
          .transition()
          .duration(TRANSITION_DURATION)
          .style("opacity", 1);
      }

      onHighlightItem(labels);
    },
    [onHighlightItem, svgRef]
  );

  // Only show loading state during initial component mount or when explicitly isLoading is true
  // Process data changes internally without showing loading overlay
  useLayoutEffect(() => {
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
  useLayoutEffect(() => {
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
        svg.selectAll(".data-group").transition().duration(TRANSITION_DURATION).style("opacity", 1);
        // Ensure line-overlays are always 0.05 opacity
        svg
          .selectAll(".line-overlay")
          .transition()
          .duration(TRANSITION_DURATION)
          .style("opacity", 0.05);
      }

      // Clear highlight in context
      onHighlightItem([]);

      if (tooltipRef?.current) {
        tooltipRef.current.style.visibility = "hidden";
      }
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

    // Within each group, create/update the line path
    dataGroups.each(function (data) {
      const group = d3.select(this);

      // Create a specific group for lines
      const lineGroup = group
        .selectAll(".line-group")
        .data([data])
        .join("g")
        .attr("class", "line-group")
        .attr("data-label", data.label);

      // Main line path in line group
      const linePath = lineGroup
        .selectAll(".line")
        .data([data])
        .join("path")
        .attr("class", (d, i) => `line line-${i}`)
        .attr("d", d =>
          line({
            d: d.series,
            curve: d?.curve ?? "curveBumpX",
          })
        )
        .attr("stroke", d => getColor(colorsMapping[d.label], d.color))
        .attr("stroke-width", 2.5)
        .attr("fill", "none")
        .attr("pointer-events", "none");

      // Set dash array for the line
      linePath.each(function () {
        const pathNode = this as SVGPathElement;
        const dashArray = getDashArrayMemoized(data.series, pathNode, xScale);
        d3.select(this).attr("stroke-dasharray", dashArray);
      });

      // Line overlay in line group
      lineGroup
        .selectAll(".line-overlay")
        .data([data])
        .join("path")
        .attr("class", (d, i) => `line-overlay line-overlay-${i}`)
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
        .style("opacity", 0.05)
        .on("mouseenter", function (this: SVGPathElement) {
          const parent = this.closest(".dataset-container");
          if (parent) {
            const label = d3.select(parent).attr("data-label");
            if (label) {
              // Fade all line groups and shape groups
              svgSelection.selectAll<SVGGElement, unknown>(".line-group").each(function () {
                const element = d3.select(this);
                const dataLabel = element.attr("data-label");
                element
                  .transition()
                  .duration(TRANSITION_DURATION)
                  .style("opacity", dataLabel === label ? 1 : 0.05);
              });

              // Keep shapes with matching data-label visible
              svgSelection.selectAll<SVGGElement, unknown>(".shape-group").each(function () {
                const element = d3.select(this);
                const dataLabel = element.attr("data-label");
                element
                  .transition()
                  .duration(TRANSITION_DURATION)
                  .style("opacity", dataLabel === label ? 1 : 0.05);
              });

              handleItemHighlight([label]);
            }
          }
        })
        .on("mouseout", function (event) {
          // Reset all opacities
          svgSelection.selectAll(".line-group, .shape-group").style("opacity", 1);
          handleMouseOut(event);
        });

      // Create a specific group for shapes
      const shapeGroup = group
        .selectAll(".shape-group")
        .data([data])
        .join("g")
        .attr("class", "shape-group")
        .attr("data-label", data.label);

      // Add shapes based on the shape type
      const shape = data.shape || "circle";
      const circleSize = 5;
      const squareSize = 6;
      const triangleSize = 16;
      const color = getColor(colorsMapping[data.label], data.color);

      if (shape === "circle") {
        shapeGroup
          .selectAll(".data-point")
          .data(data.series)
          .join("circle")
          .attr("class", "data-point")
          .attr("cx", d => xScale(new Date(d.date)))
          .attr("cy", d => yScale(d.value))
          .attr("r", circleSize)
          .attr("fill", color)
          .attr("stroke", "#fdfdfd")
          .attr("stroke-width", 2)
          .attr("cursor", "pointer");
      } else if (shape === "square") {
        shapeGroup
          .selectAll(".data-point")
          .data(data.series)
          .join("rect")
          .attr("class", "data-point")
          .attr("x", d => xScale(new Date(d.date)) - squareSize)
          .attr("y", d => yScale(d.value) - squareSize)
          .attr("width", squareSize * 2)
          .attr("height", squareSize * 2)
          .attr("fill", color)
          .attr("stroke", "#fdfdfd")
          .attr("stroke-width", 2)
          .attr("cursor", "pointer");
      } else if (shape === "triangle") {
        shapeGroup
          .selectAll(".data-point")
          .data(data.series)
          .join("path")
          .attr("class", "data-point")
          .attr("d", d => {
            const x = xScale(new Date(d.date));
            const y = yScale(d.value);
            const height = (triangleSize * Math.sqrt(3)) / 2;
            return `M ${x} ${y - height * 0.7} L ${x + triangleSize / 2} ${y + height * 0.3} L ${x - triangleSize / 2} ${y + height * 0.3} Z`;
          })
          .attr("fill", color)
          .attr("stroke", "#fdfdfd")
          .attr("stroke-width", 2)
          .attr("cursor", "pointer");
      }

      // Add shape-level event handlers
      shapeGroup
        .selectAll(".data-point")
        .on("mouseenter", function (event, d) {
          event.stopPropagation();
          const label = data.label;

          // Fade other line groups
          svgSelection.selectAll<SVGGElement, unknown>(".data-group").each(function () {
            const element = d3.select(this);
            const dataLabel = element.attr("data-label");
            element
              .transition()
              .duration(TRANSITION_DURATION)
              .style("opacity", dataLabel === label ? 1 : 0.05);
          });

          // Show tooltip
          if (tooltipRef?.current && svg) {
            const dataPoint = d as DataPoint;
            const tooltipContent = tooltipFormatter(
              {
                date: dataPoint.date,
                value: dataPoint.value,
                certainty: dataPoint.certainty,
                label: data.label,
              } as DataPoint,
              data.series,
              filteredDataSet
            );

            const tooltip = tooltipRef.current;
            const [mouseX, mouseY] = d3.pointer(event, svg);

            tooltip.style.visibility = "visible";
            tooltip.innerHTML = tooltipContent;

            const tooltipRect = tooltip.getBoundingClientRect();
            const svgRect = svg.getBoundingClientRect();

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
        .on("mouseleave", function (event) {
          event.stopPropagation();
          // Reset all opacities
          svgSelection.selectAll(".line-group, .shape-group").style("opacity", 1);

          // Hide tooltip
          if (tooltipRef?.current) {
            tooltipRef.current.style.visibility = "hidden";
          }
        });
    });

    // Update opacity based on highlightItems
    if (highlightItems.length > 0) {
      // Fade line groups based on highlight
      svgSelection
        .selectAll(".line-group")
        .style("opacity", (d: (typeof visibleDataSets)[0]) =>
          highlightItems.includes(d.label) ? 1 : 0.05
        );
      // Keep shapes visible for highlighted items
      svgSelection.selectAll<SVGGElement, unknown>(".shape-group").style("opacity", function () {
        const element = d3.select(this);
        const parent = element.node()?.parentElement;
        const parentLabel = parent && d3.select(parent).attr("data-label");
        return parentLabel && highlightItems.includes(parentLabel) ? 1 : 0.05;
      });
    } else {
      // Reset all opacities when no highlights
      svgSelection.selectAll(".line-group, .shape-group").style("opacity", 1);
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
    highlightItems,
  ]);

  useLayoutEffect(() => {
    const svg = d3.select(svgRef.current);
    const TRANSITION_DURATION = 100; // Consistent duration

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

  useLayoutEffect(() => {
    renderCompleteRef.current = true;
  }, []);

  useLayoutEffect(() => {
    if (renderCompleteRef.current && onChartDataProcessed) {
      // Extract all dates from all series using for loops instead of flatMap
      const allDates = [];
      for (let i = 0; i < dataSet.length; i++) {
        const series = dataSet[i].series;
        for (let j = 0; j < series.length; j++) {
          const point = series[j];
          allDates.push(xAxisDataType === "number" ? point.date : String(point.date));
        }
      }

      // Create unique dates array
      const uniqueDates = [...new Set(allDates)];

      // Sort and filter series based on values at the filter date if filter exists
      // Create visibleSeries using for loop instead of map
      const visibleSeries = [];
      for (let i = 0; i < dataSet.length; i++) {
        visibleSeries.push(dataSet[i].label);
      }

      if (filter?.date) {
        visibleSeries.sort((a, b) => {
          let aData = null;
          let bData = null;

          // Find data items with for loops instead of find
          for (let i = 0; i < dataSet.length; i++) {
            if (dataSet[i].label === a) aData = dataSet[i];
            if (dataSet[i].label === b) bData = dataSet[i];
            // Exit early if both found
            if (aData && bData) break;
          }

          let aValue = 0;
          let bValue = 0;

          // Find specific data points with for loops instead of find
          if (aData) {
            for (let i = 0; i < aData.series.length; i++) {
              if (String(aData.series[i].date) === String(filter.date)) {
                aValue = aData.series[i].value || 0;
                break;
              }
            }
          }

          if (bData) {
            for (let i = 0; i < bData.series.length; i++) {
              if (String(bData.series[i].date) === String(filter.date)) {
                bValue = bData.series[i].value || 0;
                break;
              }
            }
          }

          return filter.sortingDir === "desc" ? bValue - aValue : aValue - bValue;
        });

        // Apply limit if specified
        if (filter.limit) {
          visibleSeries.splice(filter.limit);
        }
      }

      const filteredVisibleItems = [];
      // Filter with for loop instead of filter method
      for (let i = 0; i < visibleSeries.length; i++) {
        const label = visibleSeries[i];
        let shouldInclude = !disabledItems.includes(label);

        if (shouldInclude) {
          let foundWithSeries = false;
          for (let j = 0; j < dataSet.length; j++) {
            if (dataSet[j].label === label && dataSet[j].series.length > 0) {
              foundWithSeries = true;
              break;
            }
          }
          shouldInclude = foundWithSeries;
        }

        if (shouldInclude) {
          filteredVisibleItems.push(label);
        }
      }

      // Build renderedData with for loops instead of reduce
      const renderedData: { [key: string]: DataPoint[] } = {};
      for (let i = 0; i < lineData.length; i++) {
        const item = lineData[i];
        if (item.points.length > 0 && visibleSeries.includes(item.label)) {
          renderedData[item.label] = item.points;
        }
      }

      const currentMetadata: ChartMetadata = {
        xAxisDomain: uniqueDates.map(String),
        yAxisDomain: yScale.domain() as [number, number],
        visibleItems: filteredVisibleItems,
        renderedData: renderedData,
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
        <svg xmlns="http://www.w3.org/2000/svg" ref={svgRef} width={width} height={height}>
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

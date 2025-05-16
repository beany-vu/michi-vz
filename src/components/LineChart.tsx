import React, { useMemo, useRef, useCallback, useLayoutEffect, FC } from "react";
import * as d3 from "d3";
import { DataPoint } from "../types/data";
import Title from "./shared/Title";
import YaxisLinear from "./shared/YaxisLinear";
import XaxisLinear from "./shared/XaxisLinear";
import { useChartContext } from "./MichiVzProvider";
import LoadingIndicator from "./shared/LoadingIndicator";
import { useDisplayIsNodata } from "./hooks/useDisplayIsNodata";
import styled from "styled-components";
import useFilteredDataSet from "./hooks/lineChart/useFilteredDataSet";
import useLineChartYscale from "./hooks/lineChart/useLineChartYscale";
import useLineChartXscale from "./hooks/lineChart/useLineChartXscale";
import useLineChartXtickValues from "./hooks/lineChart/useXtickValues";
import useLineChartPathsShapesRendering from "./hooks/lineChart/useLineChartPathsShapesRendering";
import useLineChartMouseInteractionCombinedMode from "./hooks/lineChart/useLineChartMouseInteractionCombinedMode";
import useLineChartMetadataExpose from "./hooks/lineChart/useLineChartMetadataExpose";
import useLineChartColorMapping from "./hooks/lineChart/useColorMapping";
import { useLineChartRefsAndState } from "./hooks/lineChart/useLineChartRefsAndState";
import { sanitizeForClassName, getColor } from "./hooks/lineChart/lineChartUtils";
import { useLineChartGeometry } from "./hooks/lineChart/useLineChartGeometry";

// Extend the Window interface for custom properties
declare global {
  interface Window {
    hoverResetTimer?: number; // Add optional timer ID
  }
}

export const DEFAULT_MARGIN = { top: 50, right: 50, bottom: 50, left: 50 };
export const DEFAULT_WIDTH = 900 - DEFAULT_MARGIN.left - DEFAULT_MARGIN.right;
export const DEFAULT_HEIGHT = 480 - DEFAULT_MARGIN.top - DEFAULT_MARGIN.bottom;
export const OPACITY_DEFAULT = 1;
export const OPACITY_NOT_HIGHLIGHTED = 0.05;

const LineChartContainer = styled.div`
  position: relative;
  path {
    transition:
      stroke 0.1s ease-out,
      opacity 0.1s ease-out;
    transition-behavior: allow-discrete;
    will-change: stroke, opacity, d;
  }

  circle,
  rect,
  path.data-point {
    transition:
      fill 0.1s ease-out,
      stroke 0.1s ease-out,
      opacity 0.1s ease-out;
    will-change: fill, stroke, opacity;
  }

  .data-group {
    transition: opacity 0.1s ease-out;
  }

  /* Enhanced line-overlay styling for better hover targeting */
  .line-overlay {
    stroke-linecap: round;
    stroke-linejoin: round;
    cursor: pointer;
    /* Critical for proper hover behavior */
    pointer-events: visibleStroke;
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
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
  margin = DEFAULT_MARGIN,
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
  const prevHighlightItems = useRef<string[]>([]);
  const prevDisabledItems = useRef<string[]>([]);
  const prevColorsMapping = useRef<{ [key: string]: string }>({});
  const { colorsMapping, highlightItems, disabledItems } = useChartContext();

  // Use the new hook for refs and state
  const { svgRef, tooltipRef, renderCompleteRef, prevChartDataRef, isInitialMount } =
    useLineChartRefsAndState();

  // Animation constants
  const TRANSITION_DURATION = 100;
  const TRANSITION_EASE = d3.easeQuadOut;

  const filteredDataSet = useFilteredDataSet(dataSet, filter, disabledItems);

  const yScale = useLineChartYscale(filteredDataSet, yAxisDomain, height, margin);

  const xScale = useLineChartXscale(filteredDataSet, width, margin, xAxisDataType);

  // Compute unique sorted x values for axis ticks
  const xTickValues = useLineChartXtickValues(filteredDataSet, xAxisDataType, width, margin);

  // Use the new hook for line/path utilities
  const { getYValueAtX, getDashArrayMemoized, line, lineData } = useLineChartGeometry({
    dataSet,
    xAxisDataType,
    xScale,
    yScale,
  });

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

  // Calculate whether to show the loading indicator
  // Only show on initial load or explicit isLoading
  const showLoadingIndicator = isLoading || !isInitialMount.current;

  const visibleDataSets = useMemo(() => {
    return filteredDataSet.filter(d => d.series.length > 1);
  }, [filteredDataSet]);

  // Reset hover state on mouse out from the chart
  const handleChartMouseOut = useCallback(() => {
    // Clear highlight
    onHighlightItem([]);

    // Clear highlight
    onHighlightItem([]);

    if (tooltipRef?.current) {
      tooltipRef.current.style.visibility = "hidden";
    }
  }, [onHighlightItem]);

  useLineChartPathsShapesRendering(
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
    onHighlightItem,
    tooltipFormatter,
    tooltipRef,
    svgRef,
    getColor,
    sanitizeForClassName,
    TRANSITION_DURATION,
    TRANSITION_EASE,
    highlightItems,
    onHighlightItem
  );

  useLineChartColorMapping(colorsMapping, getColor, svgRef, TRANSITION_DURATION);

  const handleHover = useCallback(
    (event: MouseEvent) => {
      if (!svgRef.current || !tooltipRef.current) return;

      const [x, y] = d3.pointer(event, event.currentTarget as SVGElement);
      const xValue = xScale.invert(x);

      const tooltipTitle = `<div class="tooltip-title">${xValue}</div>`;

      // Replace map with for loop for better performance
      let tooltipContent = "";
      for (let i = 0; i < filteredDataSet.length; i++) {
        const data = filteredDataSet[i];
        const yValue = getYValueAtX(data.series, xValue);
        tooltipContent += `<div>${data.label}: ${yValue ?? "N/A"}</div>`;
      }

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
        .attr("y1", DEFAULT_MARGIN.top)
        .attr("y2", DEFAULT_HEIGHT - DEFAULT_MARGIN.bottom + 20)
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

  useLineChartMouseInteractionCombinedMode(
    showCombined,
    width,
    height,
    handleHover,
    handleCombinedMouseOut,
    svgRef
  );

  const displayIsNodata = useDisplayIsNodata({
    dataSet: dataSet,
    isLoading: isLoading,
    isNodataComponent: isNodataComponent,
    isNodata: isNodata,
  });

  useLineChartMetadataExpose(
    dataSet,
    xAxisDataType,
    yScale,
    disabledItems,
    lineData,
    filter,
    onChartDataProcessed,
    renderCompleteRef,
    prevChartDataRef
  );

  useLayoutEffect(() => {
    renderCompleteRef.current = true;
  }, []);

  return (
    <LineChartContainer>
      <div style={{ position: "relative", width: width, height: height }}>
        {/* Always render the SVG, but optionally overlay the loading indicator */}
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

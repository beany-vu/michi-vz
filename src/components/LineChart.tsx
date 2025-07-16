import React, { useMemo, useCallback, FC, useEffect } from "react";
import { select } from "d3";
import { DataPoint, ChartMetadata, LegendItem } from "../types/data";
import Title from "./shared/Title";
import YaxisLinear from "./shared/YaxisLinear";
import XaxisLinear from "./shared/XaxisLinear";
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
import useGenerateColorMapping from "./hooks/lineChart/useGenerateColorMapping";
import { useLineChartRefsAndState } from "./hooks/lineChart/useLineChartRefsAndState";
import { sanitizeForClassName, getColor } from "./hooks/lineChart/lineChartUtils";
import { useLineChartGeometry } from "./hooks/lineChart/useLineChartGeometry";
import useLineChartTooltipToggle from "./hooks/lineChart/useLineChartHandleHover";

export const DEFAULT_MARGIN = { top: 50, right: 50, bottom: 50, left: 50 };
export const DEFAULT_WIDTH = 900 - DEFAULT_MARGIN.left - DEFAULT_MARGIN.right;
export const DEFAULT_HEIGHT = 480 - DEFAULT_MARGIN.top - DEFAULT_MARGIN.bottom;
export const OPACITY_DEFAULT = 1;
export const OPACITY_NOT_HIGHLIGHTED = 0.05;
const TRANSITION_DURATION = 100;
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

interface LineChartContainerProps {
  width: number;
  height: number;
}

const LineChartContainer = styled.div<LineChartContainerProps>`
  position: relative;
  width: ${props => `${props.width}px`};
  height: ${props => `${props.height}px`};
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

  .data-group-wrapper {
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

const LoadingIndicatorContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
`;

const TooltipStyled = styled.div`
  position: absolute;
  visibility: hidden;
  transition:
    visibility 0.1s ease-out,
    opacity 0.1s ease-out;
  will-change: visibility, opacity, top, left;
  z-index: 1000;
  pointer-events: none;
  padding: 5px;
  border-radius: 4px;
  white-space: nowrap;
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
  ticks?: number;
  // colors is the color palette for the chart for new generated colors
  colors?: string[];
  // colorsMapping is the color mapping for the chart for existing colors
  // the purpose is to share the same color mapping between charts
  colorsMapping?: { [key: string]: string };
  onChartDataProcessed?: (metadata: ChartMetadata) => void;
  onHighlightItem: (labels: string[]) => void;
  onColorMappingGenerated?: (colorsMapping: { [key: string]: string }) => void;
  onLegendDataChange?: (legendData: LegendItem[]) => void;
  // highlightItems and disabledItems as props for better performance
  highlightItems?: string[];
  disabledItems?: string[];
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
  ticks = 5,
  colors = DEFAULT_COLORS,
  colorsMapping = {},
  onChartDataProcessed,
  onHighlightItem,
  onColorMappingGenerated,
  onLegendDataChange,
  highlightItems = [],
  disabledItems = [],
}) => {
  // Use the new hook for refs and state
  const { svgRef, tooltipRef, renderCompleteRef, prevChartDataRef, isInitialMount } =
    useLineChartRefsAndState();

  const { filteredData: filteredDataSet, topNItems } = useFilteredDataSet(
    dataSet,
    filter,
    disabledItems
  );

  const yScale = useLineChartYscale(filteredDataSet, yAxisDomain, height, margin);

  const xScale = useLineChartXscale(filteredDataSet, width, margin, xAxisDataType);

  useLineChartXtickValues(filteredDataSet, xAxisDataType, width, margin);

  const { getYValueAtX, getDashArrayMemoized, line, lineData } = useLineChartGeometry({
    dataSet,
    xAxisDataType,
    xScale,
    yScale,
  });

  const showLoadingIndicator = isLoading || !isInitialMount.current;

  const visibleDataSets = useMemo(() => {
    return filteredDataSet.filter(d => d.series.length > 1);
  }, [filteredDataSet]);

  // Memoize callback functions to prevent infinite loops
  const memoizedOnHighlightItem = useCallback(
    (labels: string[]) => {
      if (onHighlightItem) {
        onHighlightItem(labels);
      }
    },
    [onHighlightItem]
  );

  const memoizedOnColorMappingGenerated = useCallback(
    (colorsMapping: { [key: string]: string }) => {
      if (onColorMappingGenerated) {
        onColorMappingGenerated(colorsMapping);
      }
    },
    [onColorMappingGenerated]
  );

  const memoizedOnChartDataProcessed = useCallback(
    (metadata: ChartMetadata) => {
      if (onChartDataProcessed) {
        onChartDataProcessed(metadata);
      }
    },
    [onChartDataProcessed]
  );

  // Generate consistent color mapping first
  const generatedColorMapping = useGenerateColorMapping(
    dataSet,
    colors,
    colorsMapping,
    onColorMappingGenerated
  );

  useLineChartPathsShapesRendering(
    filteredDataSet,
    visibleDataSets,
    width,
    height,
    margin,
    xAxisDataType,
    getDashArrayMemoized,
    colors,
    generatedColorMapping, // Use the generated mapping here
    line,
    xScale,
    yScale,
    memoizedOnHighlightItem,
    tooltipFormatter,
    tooltipRef,
    svgRef,
    getColor,
    sanitizeForClassName,
    highlightItems,
    undefined,
    memoizedOnColorMappingGenerated,
    dataSet
  );

  useLineChartColorMapping(generatedColorMapping, getColor, svgRef, TRANSITION_DURATION);

  const handleTooltipToggle = useLineChartTooltipToggle(
    xScale,
    filteredDataSet,
    getYValueAtX,
    margin,
    svgRef,
    tooltipRef
  );
  const handleCombinedMouseOut = useCallback(() => {
    if (!tooltipRef.current || !svgRef.current) return;

    const tooltip = tooltipRef.current;
    tooltip.style.visibility = "hidden";
    tooltip.style.opacity = "0";
    tooltip.innerHTML = "";

    const hoverLinesGroup = select(svgRef.current).select(".hover-lines");
    const hoverLine = hoverLinesGroup.select(".hover-line");

    hoverLinesGroup.style("display", "none");
    hoverLine.style("display", "none");
  }, []);

  useLineChartMouseInteractionCombinedMode(
    showCombined,
    width,
    height,
    handleTooltipToggle,
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
    memoizedOnChartDataProcessed,
    renderCompleteRef,
    prevChartDataRef,
    colorsMapping,
    colors,
    memoizedOnColorMappingGenerated,
    onLegendDataChange,
    topNItems
  );

  useEffect(() => {
    // Set render complete flag
    renderCompleteRef.current = true;

    return () => {
      // Clean up when component unmounts
      renderCompleteRef.current = false;
    };
  }, []);

  return (
    <LineChartContainer width={width} height={height}>
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

      {showLoadingIndicator && (
        <LoadingIndicatorContainer>
          {isLoadingComponent || <LoadingIndicator />}
        </LoadingIndicatorContainer>
      )}

      <TooltipStyled ref={tooltipRef} />

      {displayIsNodata && <>{isNodataComponent}</>}
    </LineChartContainer>
  );
};

export default LineChart;

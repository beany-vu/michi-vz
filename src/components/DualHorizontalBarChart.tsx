import * as d3 from "d3";
import React, { useEffect, useMemo, useRef, useLayoutEffect, useCallback } from "react";
import isEqual from "lodash/isEqual";
import { useChartContext } from "../components/MichiVzProvider";
import Title from "../components/shared/Title";
import { useDisplayIsNodata } from "./hooks/useDisplayIsNodata";
import LoadingIndicator from "./shared/LoadingIndicator";
import XaxisLinear from "./shared/XaxisLinear";
import YaxisBand from "./shared/YaxisBand";
import useDeepCompareEffect from "use-deep-compare-effect";

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

interface DataPoint {
  label: string;
  color?: string;
  value1: number;
  value2: number;
}

const MARGIN = { top: 50, right: 50, bottom: 50, left: 50 };
const WIDTH = 900 - MARGIN.left - MARGIN.right;
const HEIGHT = 480 - MARGIN.top - MARGIN.bottom;

interface LineChartProps {
  dataSet: DataPoint[];
  width: number;
  height: number;
  margin: { top: number; right: number; bottom: number; left: number };
  xAxisFormat?: (d: number | { valueOf(): number }) => string;
  xAxisDataType: "number" | "date_annual" | "date_monthly";
  yAxisFormat?: (d: number | string) => string;
  title?: string;
  tooltipFormatter?: (
    d: DataPoint | undefined,
    dataSet?: {
      label: string;
      color: string;
      series: DataPoint[];
    }[]
  ) => string;
  children?: React.ReactNode;
  isLoading?: boolean;
  isLoadingComponent?: React.ReactNode;
  isNodataComponent?: React.ReactNode;
  isNodata?: boolean | ((dataSet: DataPoint[]) => boolean);
  filter?: {
    limit: number; // new; replaces top
    criteria: "valueBased" | "valueCompared"; // sorting criteria
    sortingDir: "asc" | "desc";
  };
  onChartDataProcessed?: (metadata: ChartMetadata) => void;
  onHighlightItem?: (labels: string[]) => void;
  tickHtmlWidth?: number;
  // colors is the color palette for the chart for new generated colors
  colors?: string[];
  // colorsMapping is the color mapping for the chart for existing colors
  // the purpose is to share the same color mapping between charts
  colorsMapping?: { [key: string]: string };
  onColorMappingGenerated?: (colorsMapping: { [key: string]: string }) => void;
  // highlightItems and disabledItems as props for better performance
  highlightItems?: string[];
  disabledItems?: string[];
}

interface ChartMetadata {
  xAxisDomain: string[];
  yAxisDomain: [number, number];
  visibleItems: string[];
  renderedData: { [key: string]: DataPoint[] };
  chartType: "dual-horizontal-bar-chart";
}

const DualHorizontalBarChart: React.FC<LineChartProps> = ({
  dataSet,
  filter,
  title,
  width = WIDTH,
  height = HEIGHT,
  margin = MARGIN,
  yAxisFormat,
  xAxisFormat,
  xAxisDataType = "number",
  tooltipFormatter,
  children,
  isLoading = false,
  isLoadingComponent,
  isNodataComponent,
  isNodata,
  onChartDataProcessed,
  onHighlightItem,
  tickHtmlWidth,
  colors = DEFAULT_COLORS,
  colorsMapping = {},
  onColorMappingGenerated,
  highlightItems = [],
  disabledItems = [],
}) => {
  const [tooltip, setTooltip] = React.useState<{
    x: number;
    y: number;
    data: DataPoint;
  } | null>(null);
  const { visibleItems } = useChartContext();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const renderCompleteRef = useRef(false);
  const prevChartDataRef = useRef<ChartMetadata | null>(null);
  const lastColorMappingSentRef = useRef<{ [key: string]: string }>({});

  // Generate colors for items that don't have colors in colorsMapping
  const generatedColorsMapping = useMemo(() => {
    const uniqueLabels = [...new Set(dataSet.map(d => d.label))];
    const newMapping = { ...colorsMapping };
    let colorIndex = Object.keys(colorsMapping).length;

    for (const label of uniqueLabels) {
      if (!newMapping[label]) {
        newMapping[label] = colors[colorIndex % colors.length];
        colorIndex++;
      }
    }

    return newMapping;
  }, [dataSet, colorsMapping, colors]);

  // Memoized callback for color mapping generation
  const memoizedOnColorMappingGenerated = useCallback(
    (colorsMapping: { [key: string]: string }) => {
      if (onColorMappingGenerated) {
        onColorMappingGenerated(colorsMapping);
      }
    },
    [onColorMappingGenerated]
  );

  // Notify parent about generated color mapping with infinite loop protection
  useLayoutEffect(() => {
    if (memoizedOnColorMappingGenerated) {
      if (!isEqual(generatedColorsMapping, lastColorMappingSentRef.current)) {
        lastColorMappingSentRef.current = { ...generatedColorsMapping };
        memoizedOnColorMappingGenerated(generatedColorsMapping);
      }
    }
  }, [generatedColorsMapping, memoizedOnColorMappingGenerated]);

  useLayoutEffect(() => {
    renderCompleteRef.current = true;
  }, []);

  // New: compute filteredDataSet
  const filteredDataSet = useMemo(() => {
    // First filter out disabled items
    let result = dataSet.filter(d => !disabledItems.includes(d.label));

    // Then apply filter logic if filter exists
    if (filter) {
      result = result
        .slice() // copy array to avoid mutating original during sort
        .sort((a, b) => {
          const aVal = a[filter.criteria] ?? 0;
          const bVal = b[filter.criteria] ?? 0;
          return filter.sortingDir === "desc" ? bVal - aVal : aVal - bVal;
        })
        .slice(0, filter.limit);
    }

    return result;
  }, [dataSet, filter, disabledItems]);

  const yAxisDomain = useMemo(
    () => filteredDataSet.filter(d => !disabledItems.includes(d.label)).map(d => d.label),
    [filteredDataSet]
  );
  const xAxisDomain = useMemo(() => {
    const flattenedValues = filteredDataSet
      .filter(d => !disabledItems.includes(d.label))
      .map(d => [d.value1, d.value2])
      .flat();

    if (xAxisDataType === "number") {
      return [Math.max(...flattenedValues), 0];
    }

    if (xAxisDataType === "date_annual" || xAxisDataType === "date_monthly") {
      return [
        new Date(Math.max(...flattenedValues), 1, 1),
        new Date(0, 1, 1), // Assuming the minimum date is January 1, 1900
      ];
    }

    return [];
  }, [filteredDataSet, disabledItems, xAxisDataType]);

  const yAxisScale = d3
    .scaleBand()
    .domain(yAxisDomain)
    .range([margin.top, height - margin.bottom]);

  const xAxis1Scale = d3
    .scaleLinear()
    .domain(xAxisDomain)
    .range([width - margin.right, width / 2])
    .clamp(true)
    .nice(1);

  const xAxis2Scale = d3
    .scaleLinear()
    .domain(xAxisDomain)
    .range([margin.left, width / 2])
    .clamp(true)
    .nice(1);

  const handleMouseOver = (d: DataPoint, event: React.MouseEvent<SVGRectElement, MouseEvent>) => {
    if (svgRef.current) {
      const mousePoint = d3.pointer(event.nativeEvent, svgRef.current);

      setTooltip(() => ({
        x: mousePoint[0],
        y: mousePoint[1],
        data: d,
      }));
    }
  };

  const handleMouseOut = () => {
    setTooltip(null);
  };

  useEffect(() => {
    d3.select(svgRef.current).select(".bar").attr("opacity", 0.3);
    highlightItems.forEach(item => {
      d3.select(svgRef.current)
        .select(`.bar-${item.replaceAll(" ", "-").replaceAll(",", "")}`)
        .attr("opacity", 1);
    });
  }, [highlightItems]);

  const displayIsNodata = useDisplayIsNodata({
    dataSet: dataSet,
    isLoading: isLoading,
    isNodataComponent: isNodataComponent,
    isNodata: isNodata,
  });

  // Replace useEffect with useDeepCompareEffect for metadata comparison
  useDeepCompareEffect(() => {
    if (renderCompleteRef.current && onChartDataProcessed) {
      // Ensure unique labels
      const uniqueLabels = [...new Set(yAxisDomain)];

      const currentMetadata: ChartMetadata = {
        xAxisDomain: uniqueLabels,
        yAxisDomain: [Number(yAxisScale.domain()[0]), Number(yAxisScale.domain()[1])],
        visibleItems: visibleItems,
        renderedData: {
          [uniqueLabels[0]]: filteredDataSet,
        },
        chartType: "dual-horizontal-bar-chart",
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

      // Only call callback if data has changed
      if (hasChanged) {
        // Update ref before calling callback
        prevChartDataRef.current = currentMetadata;

        // Call callback with slight delay to ensure DOM updates are complete
        const timeoutId = setTimeout(() => {
          onChartDataProcessed(currentMetadata);
        }, 0);

        return () => clearTimeout(timeoutId);
      }
    }
  }, [yAxisDomain, xAxisDomain, visibleItems, filteredDataSet, onChartDataProcessed]);

  return (
    <div style={{ position: "relative" }}>
      <svg
        width={width}
        height={height}
        ref={svgRef}
        style={{ overflow: "visible" }}
        onMouseOut={event => {
          event.stopPropagation();
          event.preventDefault();
          onHighlightItem([]);
        }}
      >
        {children}
        <Title x={width / 2} y={margin.top / 2}>
          {title}
        </Title>
        {filteredDataSet.length > 0 && !isLoading && (
          <>
            <XaxisLinear
              xScale={xAxis1Scale}
              height={height}
              margin={margin}
              xAxisFormat={xAxisFormat}
              xAxisDataType={xAxisDataType}
            />
            <XaxisLinear
              xScale={xAxis2Scale}
              height={height}
              margin={margin}
              xAxisFormat={xAxisFormat}
              xAxisDataType={xAxisDataType}
            />
            <YaxisBand
              yScale={yAxisScale}
              width={width}
              margin={margin}
              yAxisFormat={yAxisFormat}
              tickHtmlWidth={tickHtmlWidth}
            />
          </>
        )}
        {filteredDataSet
          .filter(d => !disabledItems.includes(d.label))
          .map((d, i) => {
            const x1 = xAxis1Scale(d.value1) - width / 2; // Corrected width calculation
            const x2 = xAxis2Scale(0) - xAxis2Scale(d.value2); // Corrected width calculation
            const y = yAxisScale(d.label) || 0;
            const standardHeight = yAxisScale.bandwidth();
            return (
              <g
                className={`bar bar-${d.label.replaceAll(" ", "-").replaceAll(",", "")}`}
                key={i}
                style={{
                  opacity:
                    highlightItems.includes(d.label) || highlightItems.length === 0 ? 1 : 0.3,
                }}
                onMouseOver={() => onHighlightItem([d.label])}
                onMouseOut={() => onHighlightItem([])}
              >
                <rect
                  x={width / 2}
                  // y should be aligned to the center of the bandwidth's unit with height = 30
                  y={y + (standardHeight - 30) / 2}
                  width={x1}
                  height={30}
                  fill={generatedColorsMapping[d.label]}
                  rx={5}
                  ry={5}
                  onMouseOver={event => handleMouseOver(d, event)}
                  onMouseOut={handleMouseOut}
                  stroke={"#fff"}
                />
                <rect
                  x={width / 2 - x2}
                  y={y + (standardHeight - 30) / 2}
                  width={x2}
                  height={30}
                  fill={generatedColorsMapping[d.label]}
                  opacity={0.8}
                  rx={3}
                  ry={3}
                  onMouseOver={event => handleMouseOver(d, event)}
                  onMouseOut={handleMouseOut}
                  stroke={"#fff"}
                />
                {!d.value1 && !d.value2 && (
                  <>
                    <rect
                      x={width / 2 - 5}
                      // y should be aligned to the center of the bandwidth's unit with height = 30
                      y={y + (standardHeight - 30) / 2}
                      width={10}
                      height={30}
                      fill={generatedColorsMapping[d.label]}
                      rx={3}
                      ry={3}
                      onMouseOver={event => handleMouseOver(d, event)}
                      onMouseOut={handleMouseOut}
                    />
                    <text
                      x={width / 2 + 15}
                      y={y + (standardHeight - 30) / 2 + 20}
                      fill="black"
                      fontSize="12px"
                      fontWeight="bold"
                    >
                      N/A
                    </text>
                  </>
                )}
              </g>
            );
          })}
      </svg>
      {tooltip && (
        <div
          style={{
            position: "absolute",
            left: `${tooltip?.x}px`,
            top: `${tooltip?.y}px`,
            background: "white",
            padding: "5px",
            pointerEvents: "none",
          }}
        >
          {!tooltipFormatter && (
            <div>
              ${tooltip?.data?.label}: ${tooltip?.data?.value1} - ${tooltip?.data?.value2}
            </div>
          )}
          {tooltipFormatter && tooltipFormatter(tooltip?.data)}
        </div>
      )}
      {isLoading && isLoadingComponent && <>{isLoadingComponent}</>}
      {isLoading && !isLoadingComponent && <LoadingIndicator />}
      {displayIsNodata && <>{isNodataComponent}</>}
    </div>
  );
};

export default DualHorizontalBarChart;

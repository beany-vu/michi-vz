import React, { useMemo, useRef, useEffect, useCallback, Suspense, useState, useLayoutEffect } from "react";
import defaultConf from "./hooks/useDefaultConfig";
import * as d3 from "d3";
import Title from "./shared/Title";
import XaxisLinear from "./shared/XaxisLinear";
import XaxisBand from "./shared/XaxisBand";
import YaxisLinear from "./shared/YaxisLinear";
import { useChartContext } from "./MichiVzProvider";
import { drawHalfLeftCircle } from "../components/shared/helpers";
import { useDisplayIsNodata } from "./hooks/useDisplayIsNodata";
import styled from "styled-components";

const Styled = styled.div`
  .shape {
    width: 100%;
    height: 100%;
    background-color: var(--data-background);
  }

  .shape-circle {
    border-radius: 50%;
  }

  .shape-square {
    border-radius: 0;
  }

  .shape-triangle {
    width: 0;
    height: 0;
    border-width: 0 calc(var(--data-size) / 2) var(--data-size) calc(var(--data-size) / 2);
    border-color: transparent transparent var(--data-background) transparent;
    border-style: solid;
    background: transparent !important;
  }
`;

interface DataPoint {
  x: number;
  y: number;
  label: string;
  color?: string;
  d: number;
  meta?: never;
  shape?: "square" | "circle" | "triangle";
  date?: string;
}

interface ChartMetadata {
  xAxisDomain: string[];
  yAxisDomain: [number, number];
  visiblePoints: string[];
  renderedData: { [key: string]: DataPoint[] };
}

interface ScatterPlotChartProps<T extends number | string> {
  dataSet: DataPoint[];
  width: number;
  height: number;
  margin: { top: number; right: number; bottom: number; left: number };
  title: string;
  children?: React.ReactNode;
  isLoading?: boolean;
  isLoadingComponent?: React.ReactNode;
  isNodataComponent?: React.ReactNode;
  isNodata?: boolean | ((dataSet: DataPoint[]) => boolean);
  xAxisFormat?: (d: number | string) => string;
  yAxisFormat?: (d: number | string) => string;
  yTicksQty?: number;
  xAxisDataType?: "number" | "date_annual" | "date_monthly" | "band";
  tooltipFormatter?: (d: DataPoint) => string;
  showGrid?: { x: boolean; y: boolean };
  xAxisDomain?: [T, T];
  yAxisDomain?: [T, T];
  dScaleLegend?: {
    title?: string;
    valueFormatter?: (d: number) => string;
  };
  dScaleLegendFormatter?: (domain: number[], dScale: d3.ScaleLinear<number, number>) => string;
  // Updated filter property to include date filtering
  filter?: {
    limit: number;
    criteria: "x" | "y" | "d"; // Sort by x, y, or d values
    sortingDir: "asc" | "desc";
    date?: string; // Added date property for filtering by date
  };
  onChartDataProcessed?: (metadata: ChartMetadata) => void;
}

const ScatterPlotChart: React.FC<ScatterPlotChartProps<number | string>> = ({
  dataSet = [],
  width = defaultConf.WIDTH,
  height = defaultConf.HEIGHT,
  margin = defaultConf.MARGIN,
  title,
  children,
  isLoading,
  isLoadingComponent,
  isNodataComponent,
  isNodata,
  xAxisFormat,
  yAxisFormat,
  yTicksQty,
  xAxisDataType = "number",
  tooltipFormatter,
  showGrid = defaultConf.SHOW_GRID,
  xAxisDomain,
  yAxisDomain,
  dScaleLegend,
  dScaleLegendFormatter,
  filter,
  onChartDataProcessed,
}) => {
  const ref = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [activePoint, setActivePoint] = useState<DataPoint | null>(null);
  const {
    colorsMapping,
    highlightItems,
    setHighlightItems,
    disabledItems,
    setHiddenItems,
    hiddenItems,
    setVisibleItems,
    visibleItems,
  } = useChartContext();

  const renderCompleteRef = useRef(false);
  // Add ref for previous data comparison
  const prevChartDataRef = useRef<ChartMetadata | null>(null);

  useLayoutEffect(() => {
    renderCompleteRef.current = true;
  }, []);

  // Apply filtering based on filter prop, now including date filtering
  const filteredDataSet = useMemo(() => {
    if (!filter) return dataSet;

    // First filter by date if specified
    let dateFiltered = dataSet;
    if (filter.date) {
      dateFiltered = dataSet.filter(d => d.date === filter.date);
    }

    // Then filter out disabledItems
    const filteredByDisabled = dateFiltered.filter(d => !disabledItems.includes(d.label));

    // Sort by the specified criteria
    return filteredByDisabled
      .slice() // Create a copy to avoid mutating the original
      .sort((a, b) => {
        const aVal = a[filter.criteria];
        const bVal = b[filter.criteria];
        return filter.sortingDir === "desc" ? bVal - aVal : aVal - bVal;
      })
      .slice(0, filter.limit); // Take only the first 'limit' items
  }, [dataSet, filter, disabledItems]);

  // Sort data points by 'd' value in descending order for rendering
  // This ensures larger circles are rendered first (appear at the back)
  const renderOrderedDataSet = useMemo(() => {
    return [...filteredDataSet].sort((a, b) => b.d - a.d);
  }, [filteredDataSet]);

  // Update hiddenItems based on filter
  useEffect(() => {
    if (filter) {
      const newHidden = dataSet
        .filter(item => !filteredDataSet.some(filtered => filtered.label === item.label))
        .map(item => item.label);

      if (JSON.stringify(newHidden) !== JSON.stringify(hiddenItems)) {
        setHiddenItems(newHidden);
      }
    } else {
      if (hiddenItems.length > 0) {
        setHiddenItems([]);
      }
    }
  }, [dataSet, filteredDataSet, filter, hiddenItems, setHiddenItems]);

  // Update visibleItems based on filter
  useEffect(() => {
    if (filter) {
      const newVisible = filteredDataSet.map(item => item.label);

      if (JSON.stringify(newVisible) !== JSON.stringify(visibleItems)) {
        setVisibleItems(newVisible);
      }
    } else {
      const allLabels = dataSet.map(item => item.label);
      if (JSON.stringify(allLabels) !== JSON.stringify(visibleItems)) {
        setVisibleItems(allLabels);
      }
    }
  }, [dataSet, filteredDataSet, filter, visibleItems, setVisibleItems]);

  // Use filteredDataSet instead of dataSet in all calculations
  const xValues = useMemo(() => filteredDataSet.map(d => d.x || 0), [filteredDataSet]);

  const yValues = useMemo(() => filteredDataSet.map(d => d.y || 0), [filteredDataSet]);

  const xDomain = useMemo(() => [0, Math.max(...xValues) || 0], [xValues]);

  const yDomain = useMemo(() => [0, Math.max(...yValues) || 0], [yValues]);

  const xScale: d3.ScaleLinear<number, number> | d3.ScaleTime<number, number> | d3.ScaleBand<string> =
    useMemo(() => {
      if (xAxisDataType === "number") {
        return d3
          .scaleLinear()
          .domain((xAxisDomain as [number, number]) ?? xDomain)
          .range([margin.left, width - margin.right])
          .nice()
          .clamp(true);
      }
      if (xAxisDataType === "date_annual" || xAxisDataType === "date_monthly") {
        return d3
          .scaleTime()
          .domain(xDomain)
          .range([margin.left, width - margin.right])
          .nice()
          .clamp(true);
      }
      if (xAxisDataType === "band") {
        return d3
          .scaleBand<string>()
          .domain(dataSet.map(d => d.label)) // Assuming dataSet has labels for bands
          .range([margin.left, width - margin.right])
          .padding(0.1); // Adjust padding as needed
      }
    }, [xDomain, width, margin]);

  const yScale = useMemo(
    () =>
      d3
        .scaleLinear()
        .domain((yAxisDomain as [number, number]) ?? yDomain)
        .range([height - margin.bottom, margin.top]),
    [yDomain, height, margin]
  );

  const dValues = useMemo(() => dataSet.map(d => d.d), [dataSet]);

  const dMax = useMemo(() => Math.max(...dValues), [dValues]);
  const dMin = useMemo(() => Math.min(...dValues), [dValues]);
  // const dDomain = dMax === dMin ? [0, dMax] : [dMin, dMax];

  const dDomain = useMemo(() => (dMax === dMin ? [0, dMax] : [dMin, dMax]), [dMin, dMax]);

  // dScale is scaleQuantile
  const dScale = useMemo(
    () => d3.scaleLinear().domain(dDomain).range([16, 80]),
    [dDomain, height, width, margin]
  );

  const dLegendPosition = useMemo(
    () => ({
      x: width - 100,
      y: height / 3,
    }),
    [width, height]
  );

  const getXValue = useCallback(
    (d: DataPoint) => {
      const offSet = "bandwidth" in xScale ? xScale?.bandwidth() / 2 : 0;
      return xAxisDataType === "band" ? xScale(d.label as never) + offSet : xScale(d.x as never);
    },
    [xScale, xAxisDataType]
  );

  useEffect(() => {
    const svg = d3.select(ref.current);

    if (highlightItems.length === 0) {
      svg.selectAll("foreignObject").style("opacity", 0.9);
      return;
    }
    // set opacity for all circles to 0.1, except for the highlighted ones (detect by data-label attribute)
    svg.selectAll("foreignObject[data-label]").style("opacity", 0.1);
    highlightItems.forEach(label => {
      svg.selectAll(`foreignObject[data-label="${label}"]`).style("opacity", 1);
    });
  }, [highlightItems]);

  const handleMouseEnter = useCallback(
    (event, d) => {
      setActivePoint(d); // Store the active point
      setHighlightItems([d.label]);

      if (tooltipRef.current) {
        tooltipRef.current.style.display = "block";

        if (tooltipFormatter) {
          tooltipRef.current.innerHTML = tooltipFormatter(d);
        } else {
          tooltipRef.current.innerHTML = `
            <div>
              <div>${d.label}</div>
              <div>${xAxisFormat ? xAxisFormat(d.x) : d.x}</div>
              <div>${yAxisFormat ? yAxisFormat(d.y) : d.y}</div>
            </div>
          `;
        }

        // Initial positioning
        const [x, y] = d3.pointer(event);
        tooltipRef.current.style.left = `${x + 10}px`;
        tooltipRef.current.style.top = `${y - 10}px`;
      }
    },
    [setHighlightItems, tooltipFormatter, xAxisFormat, yAxisFormat]
  );

  const handleMouseLeave = useCallback(() => {
    setActivePoint(null); // Clear the active point
    setHighlightItems([]);
    if (tooltipRef.current) {
      tooltipRef.current.style.display = "none";
    }
  }, [setHighlightItems]);

  // Global mouse move handler for the SVG
  const handleSvgMouseMove = useCallback(
    event => {
      // Only update tooltip position if there's an active point
      if (activePoint && tooltipRef.current) {
        const [x, y] = d3.pointer(event);
        tooltipRef.current.style.left = `${x + 10}px`;
        tooltipRef.current.style.top = `${y - 10}px`;
      }
    },
    [activePoint]
  );

  const displayIsNodata = useDisplayIsNodata({
    dataSet: dataSet,
    isLoading: isLoading,
    isNodataComponent: isNodataComponent,
    isNodata: isNodata,
  });

  useEffect(() => {
    if (renderCompleteRef.current && onChartDataProcessed) {
      // For scatter plots, we might want to keep unique date+sector combinations
      const uniqueXValues = [...new Set(filteredDataSet.map(d => d.x))];

      // Sort points based on filter criteria
      let sortedPoints = filteredDataSet.map(d => d.label);
      if (filter?.criteria) {
        sortedPoints = sortedPoints.sort((a, b) => {
          const aData = filteredDataSet.find(d => d.label === a);
          const bData = filteredDataSet.find(d => d.label === b);
          const aValue = aData?.[filter.criteria] || 0;
          const bValue = bData?.[filter.criteria] || 0;
          return filter.sortingDir === "desc" ? bValue - aValue : aValue - bValue;
        });
      }

      const currentMetadata: ChartMetadata = {
        xAxisDomain: uniqueXValues.map(String),
        yAxisDomain: yAxisDomain
          ? [Number(yAxisDomain[0]), Number(yAxisDomain[1])]
          : [Number(yScale.domain()[0]), Number(yScale.domain()[1])],
        visiblePoints: sortedPoints,
        renderedData: {
          [uniqueXValues[0]]: filteredDataSet,
        },
      };

      // Check if data has actually changed
      const hasChanged =
        !prevChartDataRef.current ||
        JSON.stringify(prevChartDataRef.current.xAxisDomain) !==
          JSON.stringify(currentMetadata.xAxisDomain) ||
        JSON.stringify(prevChartDataRef.current.yAxisDomain) !==
          JSON.stringify(currentMetadata.yAxisDomain) ||
        JSON.stringify(prevChartDataRef.current.visiblePoints) !==
          JSON.stringify(currentMetadata.visiblePoints) ||
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
  }, [filteredDataSet, yAxisDomain, yScale, filter, onChartDataProcessed]);

  return (
    <Styled style={{ position: "relative" }}>
      {isLoading && isLoadingComponent}
      {displayIsNodata && isNodataComponent}
      <Suspense fallback={null}>
        <svg
          width={width}
          height={height}
          ref={ref}
          onMouseMove={handleSvgMouseMove} // Add global mouse move handler
        >
          <Title x={width / 2} y={margin.top / 2}>
            {title}
          </Title>
          {children}

          {/* Use renderOrderedDataSet instead of filteredDataSet for proper rendering order */}
          {renderOrderedDataSet
            .filter(d => !disabledItems.includes(d.label))
            .map((d, i) => {
              const x = getXValue(d);
              const y = yScale(d.y);
              const size = xAxisDataType === "band" ? d.d / 2 : dScale(d.d);
              const radius = size / 2;
              const fill = colorsMapping?.[d.label] || d.color || "transparent";

              // Function to create the right shape based on the shape prop
              return (
                <g
                  key={i}
                  transform={`translate(${x}, ${y})`}
                  opacity={0.9}
                  data-label={d.label}
                  onMouseEnter={event => handleMouseEnter(event, d)}
                  onMouseLeave={handleMouseLeave}
                >
                  {d.shape === "square" ? (
                    <rect
                      x={-radius}
                      y={-radius}
                      width={size}
                      height={size}
                      fill={fill}
                      stroke="#fff"
                      strokeWidth={2}
                    />
                  ) : d.shape === "triangle" ? (
                    <path
                      d={`M0,${-radius} L${radius},${radius} L${-radius},${radius} Z`}
                      fill={fill}
                      stroke="#fff"
                      strokeWidth={2}
                    />
                  ) : (
                    // Default is circle
                    <circle r={radius} fill={fill} stroke="#fff" strokeWidth={2} />
                  )}
                </g>
              );
            })}
          {!isLoading && dataSet.length && (
            <g className="michi-vz-legend">
              {dScaleLegendFormatter && dScaleLegendFormatter(dDomain, dScale)}
              {dScaleLegend?.title && (
                <text x={dLegendPosition.x} y={dLegendPosition.y - 120} textAnchor={"middle"}>
                  {dScaleLegend?.title}
                </text>
              )}
              <path
                d={drawHalfLeftCircle(dLegendPosition.x, dLegendPosition.y, 40, 40)}
                fill={"none"}
                stroke={"#ccc"}
              />
              <path
                d={drawHalfLeftCircle(dLegendPosition.x, dLegendPosition.y, 20, 20)}
                fill={"none"}
                stroke={"#ccc"}
              />
              <path
                d={drawHalfLeftCircle(dLegendPosition.x, dLegendPosition.y, 8, 8)}
                fill={"none"}
                stroke={"#ccc"}
              />
              <text x={dLegendPosition.x} y={dLegendPosition.y}>
                {dScaleLegend?.valueFormatter
                  ? dScaleLegend.valueFormatter(dScale.invert(16))
                  : dScale.invert(16)}
              </text>
              <text x={dLegendPosition.x} y={dLegendPosition.y - 40}>
                {dScaleLegend?.valueFormatter
                  ? dScaleLegend.valueFormatter(dScale.invert(40))
                  : dScale.invert(40)}
              </text>
              <text x={dLegendPosition.x} y={dLegendPosition.y - 80}>
                {dScaleLegend?.valueFormatter
                  ? dScaleLegend.valueFormatter(dScale.invert(80))
                  : dScale.invert(80)}
              </text>
            </g>
          )}
          {xAxisDataType === "number" ||
          xAxisDataType === "date_annual" ||
          xAxisDataType === "date_monthly" ? (
            <XaxisLinear
              xScale={xScale as d3.ScaleLinear<number, number> | d3.ScaleTime<number, number>}
              height={height}
              margin={margin}
              xAxisFormat={xAxisFormat}
              xAxisDataType={xAxisDataType}
              ticks={5}
              showGrid={showGrid?.x || false}
            />
          ) : (
            <XaxisBand
              xScale={xScale as d3.ScaleBand<string>}
              height={height}
              margin={margin}
              xAxisFormat={xAxisFormat}
            />
          )}
          <YaxisLinear
            yScale={yScale}
            width={width}
            height={height}
            margin={margin}
            yAxisFormat={yAxisFormat}
            yTicksQty={yTicksQty}
          />
        </svg>

        <div
          ref={tooltipRef}
          className="tooltip"
          style={{
            position: "absolute",
            display: "none",
            padding: "10px",
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            color: "white",
            borderRadius: "5px",
            pointerEvents: "none",
            zIndex: 1000,
          }}
        />
      </Suspense>
    </Styled>
  );
};

export default ScatterPlotChart;

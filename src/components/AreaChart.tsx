import React, { Fragment, useMemo, useRef, useState, useLayoutEffect } from "react";
import * as d3 from "d3";
import Title from "./shared/Title";
import YaxisLinear from "./shared/YaxisLinear";
import { useChartContext } from "./MichiVzProvider";
import XaxisLinear from "./shared/XaxisLinear";
import LoadingIndicator from "./shared/LoadingIndicator";
import { useDisplayIsNodata } from "./hooks/useDisplayIsNodata";
import useDeepCompareEffect from "use-deep-compare-effect";
import styled from "styled-components";

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

const AreaChartContainer = styled.div`
  position: relative;
  path {
    transition: fill 0.1s ease-out;
    will-change: fill;
    transition-behavior: allow-discrete;
  }
`;

interface DataPoint {
  date: number;
  [key: string]: number | undefined;
}

interface AreaDataPoint {
  0: number;
  1: number;
  data: DataPoint;
}

interface ChartMetadata {
  xAxisDomain: string[];
  yAxisDomain: [number, number];
  visibleItems: string[];
  renderedData: { [key: string]: DataPoint[] };
  chartType: "area-chart";
}

interface Props {
  series: DataPoint[];
  keys: string[];
  width: number;
  height: number;
  margin: { top: number; right: number; bottom: number; left: number };
  title?: string;
  xAxisFormat?: (d: number) => string;
  yAxisFormat?: (d: number) => string;
  yAxisDomain?: [number, number] | null;
  tooltipFormatter?: (d: DataPoint, series: DataPoint[], key: string) => string | null;
  children?: React.ReactNode;
  xAxisDataType: "number" | "date_annual" | "date_monthly";
  isLoading?: boolean;
  isLoadingComponent?: React.ReactNode;
  isNodataComponent?: React.ReactNode;
  isNodata?: boolean | ((dataSet: DataPoint[]) => boolean);
  onChartDataProcessed?: (metadata: ChartMetadata) => void;
  onHighlightItem?: (labels: string[]) => void;
  filter?: { date: number; sortingDir: "asc" | "desc" };
  ticks?: number;
  // colors is the color palette for the chart for new generated colors
  colors?: string[];
  // colorsMapping is the color mapping for the chart for existing colors
  // the purpose is to share the same color mapping between charts
  colorsMapping?: { [key: string]: string };
  onColorMappingGenerated?: (colorsMapping: { [key: string]: string }) => void;
}

const MARGIN = { top: 50, right: 50, bottom: 50, left: 50 };
const WIDTH = 900;
const HEIGHT = 480;

const AreaChart: React.FC<Props> = ({
  series,
  width = WIDTH,
  height = HEIGHT,
  margin = MARGIN,
  title,
  keys,
  xAxisFormat,
  yAxisFormat,
  yAxisDomain = null,
  tooltipFormatter = null,
  xAxisDataType = "number",
  children,
  isLoading = false,
  isLoadingComponent,
  isNodataComponent,
  isNodata,
  onChartDataProcessed,
  onHighlightItem,
  filter,
  ticks = 5,
  colors = DEFAULT_COLORS,
  colorsMapping = {},
  onColorMappingGenerated,
}) => {
  const { highlightItems, disabledItems } = useChartContext();
  const ref = useRef<SVGSVGElement>(null);
  const [hoveredDate] = useState<number | null>(null);
  const renderCompleteRef = useRef(false);
  const prevChartDataRef = useRef<ChartMetadata | null>(null);

  // Generate colors for keys that don't have colors in colorsMapping
  const generatedColorsMapping = useMemo(() => {
    const newMapping = { ...colorsMapping };
    let colorIndex = Object.keys(colorsMapping).length;

    for (const key of keys) {
      if (!newMapping[key]) {
        newMapping[key] = colors[colorIndex % colors.length];
        colorIndex++;
      }
    }

    return newMapping;
  }, [keys, colorsMapping, colors]);

  // Notify parent about generated color mapping
  useLayoutEffect(() => {
    if (onColorMappingGenerated) {
      onColorMappingGenerated(generatedColorsMapping);
    }
  }, [generatedColorsMapping, onColorMappingGenerated]);

  const xScale = useMemo(() => {
    if (xAxisDataType === "number") {
      return d3
        .scaleLinear()
        .domain([d3.min(series, d => d.date || 0), d3.max(series, d => d.date || 1)])
        .range([margin.left, width - margin.right])
        .clamp(true)
        .nice();
    }

    const minDate = d3.min(
      series.map(d => new Date(xAxisDataType === "date_annual" ? `${d.date} 01 01` : d.date))
    );
    const maxDate = d3.max(series.map(d => new Date(d.date)));

    return d3
      .scaleTime()
      .domain([minDate || 0, maxDate || 1])
      .range([MARGIN.left, width - margin.right]);
    // .nice();
  }, [series, width, height, disabledItems, xAxisDataType]);

  // yScale
  const yScaleDomain = useMemo(() => {
    if (yAxisDomain) {
      return yAxisDomain;
    }
    // return the max value of the sum of all the keys, don't count the date
    const max = d3.max(
      series,
      d =>
        d3.sum(
          Object.keys(d)
            .filter(key => !disabledItems.includes(key))
            .map(key => (key === "date" ? 0 : d[key] || 0))
        ) || 0
    );

    return [0, max];
  }, [series, keys]);

  const yScale = useMemo(
    () =>
      d3
        .scaleLinear()
        .domain(yScaleDomain)
        .range([height - margin.bottom, margin.top])
        .clamp(true)
        .nice(),
    [series, width, height, margin]
  );

  const stackedData = useMemo(() => {
    return d3.stack<DataPoint, string>().keys(keys)(series);
  }, [series, keys]);

  const prepareAreaData = () => {
    return stackedData.map((keyData, index) => {
      return {
        key: keys[index],
        values: keyData,
        fill: generatedColorsMapping[keys[index]],
      };
    });
  };

  const areaGenerator = d3
    .area<AreaDataPoint>()
    .defined(() => true)
    .x(d => {
      if (xAxisDataType === "number") {
        return xScale(d.data.date);
      } else {
        // Assuming d.data.date is a JavaScript Date object
        return xScale(new Date(d.data.date).getTime());
      }
    })
    .y0(d => yScale(d[0] || 0))
    .y1(d => yScale(d[1] || 0))
    .curve(d3.curveMonotoneX);

  const handleAreaSegmentHover = (dataPoint: DataPoint, key: string) => {
    if (tooltipFormatter) {
      return tooltipFormatter(dataPoint, series, key);
    }

    return `
        <div style="background: #fff; padding: 5px">
            <p>${dataPoint.date}</p>
            <p style="color:${generatedColorsMapping[key]}">${key}: ${dataPoint[key] ?? "N/A"}</p>
        </div>`;
  };

  const displayIsNodata = useDisplayIsNodata({
    dataSet: series,
    isLoading: isLoading,
    isNodataComponent: isNodataComponent,
    isNodata: isNodata,
  });

  useLayoutEffect(() => {
    renderCompleteRef.current = true;
  }, []);

  useDeepCompareEffect(() => {
    if (renderCompleteRef.current && onChartDataProcessed) {
      // Get the domain from xScale
      let domain;
      if (xAxisDataType === "number") {
        domain = [d3.min(series, d => d.date || 0), d3.max(series, d => d.date || 1)];
      } else {
        // For date types, ensure unique dates
        domain = [...new Set(series.map(d => d.date))];
      }

      // Ensure yScaleDomain is always a tuple with 2 elements
      const safeYDomain: [number, number] =
        Array.isArray(yScaleDomain) && yScaleDomain.length === 2
          ? (yScaleDomain as [number, number])
          : [0, yScaleDomain[1] || 0];

      // Sort keys based on values at the filter date if filter exists
      let sortedKeys = keys;
      if (filter?.date) {
        sortedKeys = [...keys].sort((a, b) => {
          const aValue = series.find(d => String(d.date) === String(filter.date))?.[a] || 0;
          const bValue = series.find(d => String(d.date) === String(filter.date))?.[b] || 0;
          return filter.sortingDir === "desc" ? bValue - aValue : aValue - bValue;
        });
      }

      const currentMetadata: ChartMetadata = {
        xAxisDomain: domain.map(String),
        yAxisDomain: safeYDomain,
        visibleItems: sortedKeys.filter(key => !disabledItems.includes(key)),
        renderedData: {
          [keys[0]]: series,
        },
        chartType: "area-chart",
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
  }, [series, xAxisDataType, yScaleDomain, keys, disabledItems, filter, onChartDataProcessed]);

  return (
    <AreaChartContainer>
      <div
        className={"tooltip"}
        style={{
          position: "absolute",
          background: "white",
          padding: "5px",
          pointerEvents: "none",
          zIndex: 1000,
          visibility: "hidden", // Initially hidden
        }}
      />

      <svg
        className={"chart"}
        ref={ref}
        width={width}
        height={height}
        style={{ overflow: "visible" }}
        onMouseOut={event => {
          // Only clear highlight if mouse leaves the SVG container
          const target = event.relatedTarget as HTMLElement;
          if (!target || !target.closest("svg.chart")) {
            d3.select(".tooltip").style("visibility", "hidden");
            onHighlightItem?.([]);
          }
        }}
      >
        {children}
        <Title x={width / 2} y={MARGIN.top / 2}>
          {title}
        </Title>
        {series.length > 0 && !isLoading && (
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
        <g>
          {prepareAreaData().map(areaData => (
            <Fragment key={areaData.key}>
              <path
                d={areaGenerator(areaData.values)}
                fill={areaData.fill ? areaData.fill : "#fdfdfd"}
                stroke={"#fff"}
                strokeWidth={1}
                opacity={
                  highlightItems.length === 0 || highlightItems.includes(areaData.key) ? 1 : 0.2
                }
                onMouseMove={event => {
                  event.stopPropagation();
                  onHighlightItem([areaData.key]);
                }}
                onMouseOut={event => {
                  // Don't clear highlight if moving to a rect element
                  const target = event.relatedTarget as HTMLElement;
                  if (!target || !target.classList.contains("rect-hover")) {
                    event.stopPropagation();
                    onHighlightItem([]);
                  }
                }}
              />
              {/* Here's the addition*/}
              {areaData.values.map(dataPoint => (
                <rect
                  key={`${areaData.key}-${dataPoint.data.date}`}
                  className="rect-hover"
                  x={
                    xScale(
                      xAxisDataType === "number"
                        ? dataPoint.data.date
                        : new Date(dataPoint.data.date)
                    ) - 2
                  }
                  y={yScale(dataPoint[1] || 0)} // Handle null values
                  width={8}
                  strokeWidth={1}
                  rx={3}
                  ry={3}
                  stroke={"#ccc"}
                  // Handle null values
                  height={yScale(dataPoint[0] || 0) - yScale(dataPoint[1] || 0)}
                  fill="#fff"
                  opacity={highlightItems.includes(areaData.key) ? 0.5 : 0}
                  onMouseEnter={event => {
                    event.stopPropagation();
                    onHighlightItem([areaData.key]);
                    d3.select(".tooltip")
                      .style("visibility", "visible")
                      .html(handleAreaSegmentHover(dataPoint.data, areaData.key));
                    const [x, y] = d3.pointer(event);
                    const tooltip = d3.select(".tooltip").node() as HTMLElement;
                    const tooltipWidth = tooltip.getBoundingClientRect().width;
                    const tooltipHeight = tooltip.getBoundingClientRect().height;
                    d3.select(".tooltip")
                      .style("left", x - tooltipWidth / 2 + "px")
                      .style("top", y - tooltipHeight - 10 + "px");
                  }}
                  onMouseOut={event => {
                    // Don't clear highlight if moving to another rect or the path
                    const target = event.relatedTarget as HTMLElement;
                    if (
                      !target ||
                      (!target.classList.contains("rect-hover") &&
                        target.tagName.toLowerCase() !== "path")
                    ) {
                      event.stopPropagation();
                      onHighlightItem([]);
                      d3.select(".tooltip").style("visibility", "hidden");
                    }
                  }}
                />
              ))}
              {hoveredDate !== null && (
                <line
                  className={"hover-line"}
                  x1={xScale(hoveredDate)}
                  x2={xScale(hoveredDate)}
                  y1={margin.top}
                  y2={height - margin.bottom}
                  stroke={"#666"}
                  strokeWidth={1}
                />
              )}
            </Fragment>
          ))}
        </g>
      </svg>
      {isLoading && isLoadingComponent && <>{isLoadingComponent}</>}
      {isLoading && !isLoadingComponent && <LoadingIndicator />}
      {displayIsNodata && <>{isNodataComponent}</>}
    </AreaChartContainer>
  );
};

export default AreaChart;

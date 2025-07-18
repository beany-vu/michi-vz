// RangeChart.tsx
import React, { useEffect, useMemo, useRef, useLayoutEffect } from "react";
import * as d3 from "d3";
import { DataPointRangeChart, LegendItem } from "../types/data";
import { useChartContext } from "./MichiVzProvider";
import Title from "./shared/Title";
import XaxisLinear from "./shared/XaxisLinear";
import YaxisLinear from "./shared/YaxisLinear";
import { useDisplayIsNodata } from "./hooks/useDisplayIsNodata";
import LoadingIndicator from "./shared/LoadingIndicator";
import useDeepCompareEffect from "use-deep-compare-effect";
import { sanitizeForClassName } from "./hooks/lineChart/lineChartUtils";

const MARGIN = { top: 50, right: 50, bottom: 50, left: 50 };
const WIDTH = 900 - MARGIN.left - MARGIN.right;
const HEIGHT = 480 - MARGIN.top - MARGIN.bottom;

interface RangeChartProps {
  dataSet: {
    label: string;
    color: string;
    series: DataPointRangeChart[];
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
    d: DataPointRangeChart,
    series: DataPointRangeChart[],
    dataSet: {
      label: string;
      color: string;
      series: DataPointRangeChart[];
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
          series: DataPointRangeChart[];
        }[]
      ) => boolean);
  onChartDataProcessed?: (metadata: ChartMetadata) => void;
  onHighlightItem?: (labels: string[]) => void;
  onLegendDataChange?: (legendData: LegendItem[]) => void;
  // highlightItems and disabledItems as props for better performance
  highlightItems?: string[];
  disabledItems?: string[];
}

interface ChartMetadata {
  xAxisDomain: string[];
  yAxisDomain: [number, number];
  visibleItems: string[];
  renderedData: { [key: string]: DataPointRangeChart[] };
  chartType: "range-chart";
  legendData?: LegendItem[];
}

const RangeChart: React.FC<RangeChartProps> = ({
  dataSet,
  title,
  width = WIDTH,
  height = HEIGHT,
  margin = MARGIN,
  yAxisDomain,
  yAxisFormat,
  xAxisDataType = "number",
  xAxisFormat,
  tooltipFormatter = (d: DataPointRangeChart) =>
    `<div>${d.label} - ${d.date}: ${d?.valueMedium}</div>`,
  showCombined = false,
  children,
  isLoading = false,
  isLoadingComponent,
  isNodataComponent,
  isNodata,
  onChartDataProcessed,
  onHighlightItem,
  onLegendDataChange,
  highlightItems = [],
  disabledItems = [],
}) => {
  const { colorsMapping } = useChartContext();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const renderCompleteRef = useRef(false);
  // Add ref for previous data comparison
  const prevChartDataRef = useRef<ChartMetadata | null>(null);

  // Add filteredDataSet to filter out disabled items first
  const filteredDataSet = useMemo(() => {
    return dataSet.filter(d => !disabledItems.includes(d.label));
  }, [dataSet, disabledItems]);

  const yScale = useMemo(
    () =>
      d3
        .scaleLinear()
        .domain(
          yAxisDomain
            ? yAxisDomain
            : [
                d3.min(
                  filteredDataSet.flatMap(({ series }) =>
                    series.filter(dd => dd.valueMin !== null)
                  ),
                  d => d.valueMin
                ) || 0,
                d3.max(
                  filteredDataSet.flatMap(({ series }) =>
                    series.filter(dd => dd.valueMax !== null)
                  ),
                  d => d.valueMax
                ) || 1,
              ]
        )
        .range([height - margin.bottom, margin.top])
        .clamp(true)
        .nice(),
    [filteredDataSet, width, height, margin, yAxisDomain]
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
  }, [filteredDataSet, width, height, margin, xAxisDataType]);

  // function getDashArrayMemoized(
  //   series: DataPointRangeChart[],
  //   pathNode: SVGPathElement,
  //   xScale: ScaleLinear<number, number> | ScaleTime<number, number>,
  // ) {
  //   // ... (existing code)
  // }

  const getAreaGenerator = d3
    .area<DataPointRangeChart>()
    .x(d => {
      return xScale(new Date(d.date));
    })
    .y0(d => {
      return yScale(d.valueMin);
    })
    .y1(d => {
      return yScale(d.valueMax);
    })
    .curve(d3.curveBumpX);

  const getLineGenerator = d3
    .line<DataPointRangeChart>()
    .x(d => {
      return xScale(new Date(d.date));
    })
    .y(d => {
      // Use the average for a line
      return yScale((d.valueMax + d.valueMin) / 2);
    })
    .curve(d3.curveBumpX);

  const showLine = (d: DataPointRangeChart) => d.valueMin === d.valueMax;

  const showTooltip = (event: MouseEvent, content: string) => {
    const tooltip = tooltipRef.current;
    const [x, y] = d3.pointer(event, svgRef.current);
    if (tooltip) {
      tooltip.innerHTML = content;
      tooltip.style.opacity = "1";
      tooltip.style.left = x + 10 + "px"; // Offset by 10 pixels to the right
      tooltip.style.top = y - window.scrollY - 10 + "px"; // Offset by 10 pixels to the top, considering scroll position
    }
  };

  const hideTooltip = () => {
    const tooltip = tooltipRef.current;
    if (tooltip) {
      tooltip.style.opacity = "0";
    }
  };

  useEffect(() => {
    const svg = d3.select(svgRef.current);

    // svg.selectAll(".area-upper").remove();
    // svg.selectAll(".area-lower").remove();
    svg.selectAll(".line").remove();
    svg.selectAll(".line-overlay").remove();
    svg.selectAll(".circle-data").remove();
    svg.selectAll(".area-group").remove();

    const areas = svg.selectAll(".area-group").data(filteredDataSet).enter().append("g");

    areas
      .append("path")
      .attr("class", (_, i) => `area area-${i} area-group`)
      .attr("d", d => {
        if (showLine(d.series[0])) {
          const linePath = getLineGenerator(d.series);
          return linePath;
        } else {
          const areaPath = getAreaGenerator(d.series);
          return areaPath;
        }
      })
      .attr("fill", d => (showLine(d.series[0]) ? "none" : colorsMapping[d.label] || d.color))
      .attr("stroke", d => (showLine(d.series[0]) ? colorsMapping[d.label] || d.color : "none"))
      .attr("data-label", d => d.label)
      .attr("data-label-safe", d => sanitizeForClassName(d.label))
      .attr("transition", "all 0.1s ease-out")
      .on("mouseenter", function (event) {
        const label = d3.select(this).attr("label");
        event.preventDefault();
        // Bring the hovered area to the front
        d3.select(this).raise();
        // Set opacity of other areas to 0.3
        areas.selectAll(".area-group").attr("opacity", 0.1);
        // Set opacity of the hovered area to 1
        d3.select(this).attr("opacity", 1);
        svg.selectAll(".rect-hover").attr("opacity", 0);
        svg.selectAll(`.rect-hover[data-label="${label}"]`).attr("opacity", 1);
      })
      .on("mouseout", event => {
        // mouse is on .react-hover then do nothing
        if (event.relatedTarget && event.relatedTarget.classList.contains("rect-hover")) {
          return;
        }
        event.preventDefault();
        // Reset opacity of all areas to 0.8
        areas.selectAll(".area-group").attr("opacity", 0.8);
        svg.selectAll(".rect-hover").attr("opacity", 0);
      });

    // Add rect elements for each year
    filteredDataSet.forEach((data, i) => {
      svg
        .selectAll(`.rect-hover-${i}`)
        .data(data.series)
        .enter()
        .append("rect")
        .attr("class", `rect-hover rect-hover-${i}`)
        .attr("stroke", "#ccc")
        .attr("data-label", data.label)
        .attr("data-label-safe", sanitizeForClassName(data.label))
        .attr("x", d => xScale(new Date(d.date)) - 4 / 2)
        .attr("y", d => yScale(d.valueMax))
        .attr("width", 4)
        .attr("height", d => Math.abs(yScale(d.valueMax) - yScale(d.valueMin)))
        .attr("fill", "white")
        .attr("opacity", 0)
        .on("mouseenter", (event, d) => {
          event.preventDefault();
          event.stopPropagation();
          onHighlightItem([data.label]);
          showTooltip(event, tooltipFormatter(d, data.series, filteredDataSet));
        })
        .on("mouseleave", event => {
          event.preventDefault();
          event.stopPropagation();
          onHighlightItem([]);
          hideTooltip();
        });
    });

    // ... (existing code for axis, title, and other elements)
  }, [yScale, xScale, width, height, margin, filteredDataSet, xAxisDataType]);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll(".axis").remove();

    // ... (existing code for axis, title, and other elements)
  }, [filteredDataSet, width, height, margin, xAxisDataType, yAxisFormat]);

  useEffect(() => {
    // ... (existing code)
  }, [colorsMapping]);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    highlightItems.forEach(item => {
      // fade out items with selectors [data-label="item"] inside this svg
      svg.selectAll(`[data-label]:not([data-label="${item}"])`).attr("opacity", 0.1);
      svg.selectAll(`.rect-hover[data-label="${item}"]`).attr("opacity", 0.8);
    });
  }, [highlightItems]);

  useEffect(() => {
    // ... (existing code)
  }, [showCombined]);

  const displayIsNodata = useDisplayIsNodata({
    dataSet: filteredDataSet,
    isLoading: isLoading,
    isNodataComponent: isNodataComponent,
    isNodata: isNodata,
  });

  useLayoutEffect(() => {
    renderCompleteRef.current = true;
  }, []);

  // Replace useEffect with useDeepCompareEffect for metadata comparison
  useDeepCompareEffect(() => {
    if (renderCompleteRef.current && onChartDataProcessed) {
      // Extract all dates from all series
      const allDates = filteredDataSet.flatMap(set =>
        set.series.map(point => (xAxisDataType === "number" ? point.date : String(point.date)))
      );

      // Create unique dates array
      const uniqueDates = [...new Set(allDates)].map(date => String(date));

      // Generate legend data (include disabled items)
      const legendData: LegendItem[] = dataSet.map((item, index) => ({
        label: item.label,
        color: colorsMapping[item.label] || item.color,
        order: index,
        disabled: disabledItems.includes(item.label),
        dataLabelSafe: sanitizeForClassName(item.label),
      }));

      const currentMetadata: ChartMetadata = {
        xAxisDomain: uniqueDates,
        yAxisDomain: yScale.domain() as [number, number],
        visibleItems: filteredDataSet
          .map(d => d.label)
          .filter(label => !disabledItems.includes(label)),
        renderedData: filteredDataSet.reduce(
          (acc, d) => {
            acc[d.label] = d.series;
            return acc;
          },
          {} as { [key: string]: DataPointRangeChart[] }
        ),
        chartType: "range-chart",
        legendData,
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

      // Call legend data change callback
      if (onLegendDataChange) {
        onLegendDataChange(legendData);
      }
    }
  }, [
    filteredDataSet,
    xAxisDataType,
    yScale,
    disabledItems,
    onChartDataProcessed,
    dataSet,
    colorsMapping,
    onLegendDataChange,
  ]);

  return (
    <div className="chart-container" style={{ position: "relative" }}>
      {isLoading && isLoadingComponent && <>{isLoadingComponent}</>}
      {isLoading && !isLoadingComponent && <LoadingIndicator />}
      {displayIsNodata && <>{isNodataComponent}</>}
      {!isLoading && !displayIsNodata && filteredDataSet.length > 0 && (
        <svg
          className="chart"
          width={width}
          height={height}
          ref={svgRef}
          style={{ overflow: "visible" }}
        >
          {title && (
            <text x={width / 2} y={margin.top / 2} textAnchor="middle" className="chart-title">
              {title}
            </text>
          )}
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
      )}

      <div
        ref={tooltipRef}
        className="chart-tooltip"
        style={{ opacity: 0, pointerEvents: "none", position: "fixed" }}
      />
    </div>
  );
};

export default RangeChart;

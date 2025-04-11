import * as d3 from "d3";
import React, { useEffect, useMemo, useRef, useLayoutEffect } from "react";
import { useChartContext } from "../components/MichiVzProvider";
import Title from "../components/shared/Title";
import { useDisplayIsNodata } from "./hooks/useDisplayIsNodata";
import LoadingIndicator from "./shared/LoadingIndicator";
import XaxisLinear from "./shared/XaxisLinear";
import YaxisBand from "./shared/YaxisBand";

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
}

interface ChartMetadata {
  yAxisDomain: string[];
  xAxisDomain: string[];
  visibleItems: string[];
  renderedData: { [key: string]: DataPoint[] };
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
}) => {
  const [tooltip, setTooltip] = React.useState<{
    x: number;
    y: number;
    data: DataPoint;
  } | null>(null);
  const {
    colorsMapping,
    colorsBasedMapping,
    highlightItems,
    setHighlightItems,
    disabledItems,
    setHiddenItems,
    hiddenItems,
    setVisibleItems,
    visibleItems,
  } = useChartContext();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const renderCompleteRef = useRef(false);

  useLayoutEffect(() => {
    renderCompleteRef.current = true;
  }, []);

  // New: compute filteredDataSet
  const filteredDataSet = useMemo(() => {
    if (!filter) return dataSet;
    return dataSet
      .slice() // copy array to avoid mutating original during sort
      .sort((a, b) => {
        const aVal = a[filter.criteria] ?? 0;
        const bVal = b[filter.criteria] ?? 0;
        return filter.sortingDir === "desc" ? bVal - aVal : aVal - bVal;
      })
      .slice(0, filter.limit);
  }, [dataSet, filter]);

  // New: update hiddenItems based on filter
  useEffect(() => {
    if (filter != null) {
      const newHidden = dataSet
        .filter(item => !filteredDataSet.some(filtered => filtered.label === item.label))
        .map(item => item.label);
      if (JSON.stringify(newHidden) !== JSON.stringify(hiddenItems)) {
        setHiddenItems(newHidden);
      }
    } else {
      if (hiddenItems.length !== 0) {
        setHiddenItems([]);
      }
    }
  }, [dataSet, filter, filteredDataSet, hiddenItems, setHiddenItems]);

  // New: update visibleItems based on filter
  useEffect(() => {
    if (filter != null) {
      const newVisible = dataSet
        .filter(item => filteredDataSet.some(filtered => filtered.label === item.label))
        .map(item => item.label);
      if (JSON.stringify(newVisible) !== JSON.stringify(visibleItems)) {
        setVisibleItems(newVisible);
      }
    } else {
      if (visibleItems.length !== 0) {
        setVisibleItems([]);
      }
    }
  }, [dataSet, filter, filteredDataSet, visibleItems, setVisibleItems]);

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

  useEffect(() => {
    if (renderCompleteRef.current && onChartDataProcessed) {
      // Ensure unique labels
      const uniqueLabels = [...new Set(yAxisDomain)];

      const currentMetadata: ChartMetadata = {
        yAxisDomain: uniqueLabels,
        xAxisDomain: Array.isArray(xAxisDomain) ? xAxisDomain.map(String) : [],
        visibleItems: visibleItems,
        renderedData: {
          [uniqueLabels[0]]: filteredDataSet,
        },
      };

      // Rest of the function with comparison and callback...
    }
  }, [yAxisDomain, xAxisDomain, visibleItems, filteredDataSet]);

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
          setHighlightItems([]);
        }}
      >
        {children}
        <Title x={width / 2} y={margin.top / 2}>
          {title}
        </Title>
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
        <YaxisBand yScale={yAxisScale} width={width} margin={margin} yAxisFormat={yAxisFormat} />
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
                  opacity: highlightItems.includes(d.label) || highlightItems.length === 0 ? 1 : 0.3,
                }}
                onMouseOver={() => setHighlightItems([d.label])}
                onMouseOut={() => setHighlightItems([])}
              >
                <rect
                  x={width / 2}
                  // y should be aligned to the center of the bandwidth's unit with height = 30
                  y={y + (standardHeight - 30) / 2}
                  width={x1}
                  height={30}
                  fill={colorsBasedMapping[d.label]}
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
                  fill={colorsMapping[d.label]}
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
                      fill={colorsBasedMapping[d.label]}
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

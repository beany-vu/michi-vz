import React, { useEffect, useMemo, useRef, useState, useLayoutEffect } from "react";
import * as d3 from "d3";
import styled from "styled-components";
import range from "lodash/range";
import { useChartContext } from "../components/MichiVzProvider";
import LoadingIndicator from "./shared/LoadingIndicator";
import { useDisplayIsNodata } from "./hooks/useDisplayIsNodata";

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
}) => {
  const { colorsMapping, highlightItems, disabledItems } = useChartContext();
  const svgRef = useRef(null);
  const [tooltipData, setTooltipData] = useState<{
    date: string;
    value: number;
    series: never[];
  } | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const renderCompleteRef = useRef(false);
  const prevChartDataRef = useRef<ChartMetadata | null>(null);

  const yScaleDomain = useMemo(() => {
    if (!series) return [0, 30];
    return [
      0,
      Math.max(
        ...series
          .filter((d: DataPoint) => !disabledItems.includes(d.label))
          .map((d: DataPoint) => d.data)
          .flat()
          .map(d => {
            const parsedValue = parseFloat(String(d.value));
            return isNaN(parsedValue) ? 0 : parsedValue;
          })
      ),
    ];
  }, [series, disabledItems]);

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

      if (!cur?.value) {
        return res;
      }

      // Adjusting starting angle by subtracting Math.PI / 2
      const angle = anglesDateMapping[cur.date];
      // Now include the center of the radar chart in your calculations.
      const xVal = Math.round(width / 2 + scale(cur.value) * Math.sin(angle));
      const yVal = Math.round(height / 2 + scale(cur.value) * Math.cos(angle) * -1);

      points[i] = { x: xVal, y: yVal, date: cur.date, value: cur.value };
      res += `${xVal},${yVal} `;
      return res;
    }, "");

    return { points, pointString };
  };

  const processedSeries =
    series && series.length > 0
      ? series
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
  }, [width, height, series, poles]);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll(".series").attr("opacity", highlightItems.length === 0 ? 1 : 0.5);
    svg.selectAll(".data-point").attr("opacity", 0);

    highlightItems.forEach((item: string) => {
      svg.selectAll(`.series[data-label="${item}"]`).attr("opacity", 1).raise();
      svg.selectAll(`.data-point[data-label="${item}"]`).attr("opacity", 1).raise();
      svg.selectAll(".radial-label").raise();
    });
  }, [highlightItems]);

  const displayIsNodata = useDisplayIsNodata({
    dataSet: series,
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
      const uniqueLabels = poles?.labels ? [...new Set(poles.labels)] : [];

      const currentMetadata: ChartMetadata = {
        xAxisDomain: poles?.labels ? poles.labels.map(String) : [],
        yAxisDomain: yScale.domain() as [number, number],
        visibleItems:
          series && series.length > 0
            ? series.filter(s => !disabledItems.includes(s.label)).map(s => s.label)
            : [],
        renderedData: {
          [uniqueLabels[0] || "default"]: series || [],
        },
        chartType: "radar-chart",
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
  }, [series, poles, processedSeries, disabledItems, onChartDataProcessed]);

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
          <g key={`series-${i}`} data-label={label} className={`series`}>
            <Polygon
              points={pointString}
              fill={"transparent"}
              data-label={colorsMapping[label]}
              stroke={colorsMapping[label] ?? color}
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
                        r={5}
                        cx={point.x}
                        cy={point.y}
                        stroke="#fff"
                        strokeWidth={2}
                        fill={colorsMapping[label] ?? color}
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

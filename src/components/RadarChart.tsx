import React, { useRef, useEffect, useMemo, useState } from "react";
import * as d3 from "d3";
import styled from "styled-components";
import range from "lodash/range";
import { useChartContext } from "../components/MichiVzProvider";
import LoadingIndicator from "./shared/LoadingIndicator";

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
  padding: 5px 10px;
  border-radius: 4px;
  pointer-events: none;
  z-index: 1000;
  transition: opacity 0.3s;
  font-size: 12px;
`;

interface DataPoint {
  label: string;
  value: number;
  data: {
    value: number;
    date: string;
  }[];
}
export interface RadarChartProps {
  width: number;
  height: number;
  tooltipFormatter?: (data: { date: string; value: number }) => React.ReactNode;
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
}

export const RadarChart = ({
  width,
  height,
  series,
  poles: poles,
  tooltipFormatter,
  children,
  isLoading = false,
  isLoadingComponent,
  isNodataComponent,
}) => {
  const { colorsMapping, highlightItems, setHighlightItems, disabledItems } =
    useChartContext();
  const svgRef = useRef(null);
  const [tooltipData, setTooltipData] = useState<{
    date: string;
    value: number;
  } | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  const yScaleDomain = useMemo(() => {
    if (!series) return [0, 30];
    return [
      0,
      Math.max(
        ...series
          .filter((d: DataPoint) => !disabledItems.includes(d.label))
          .map((d: DataPoint) => d.data)
          .flat()
          .map((d: DataPoint) => d.value),
      ),
    ];
  }, []);

  const yScale = useMemo(() => {
    return d3
      .scaleLinear()
      .domain(yScaleDomain)
      .range([0, height / 2 - 30]);
  }, [poles, height]);

  const genPolygonPoints = (
    data: { value: number; date: string }[],
    scale: (n: number) => number,
  ) => {
    const step = (Math.PI * 2) / data.length;
    const points: { x: number; y: number; date: string; value: number }[] =
      new Array(data.length).fill({
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
      const angle = i * step - Math.PI / 2;

      // Now include the center of the radar chart in your calculations.
      const xVal = Math.round(width / 2 + scale(cur.value) * Math.sin(angle));
      const yVal = Math.round(height / 2 + scale(cur.value) * Math.cos(angle));

      points[i] = { x: xVal, y: yVal, date: cur.date, value: cur.value };
      res += `${xVal},${yVal} `;
      return res;
    }, "");

    return { points, pointString };
  };

  const processedseries = series
    // sort disabled items first
    .filter((d: DataPoint) => !disabledItems.includes(d.label))
    .map((item: DataPoint) => ({
      ...genPolygonPoints(item.data, yScale),
      ...item,
    }));

  useEffect(() => {
    const svg = d3.select(svgRef.current);
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
      svg
        .append("path")
        .attr("d", line)
        .attr("stroke", "#c1c1c1")
        .attr("stroke-width", 1)
        .lower();
    }

    // Drawing radial circles
    const numCircleTicks = 6; // Or any other desired number.
    const circleRadii = range(1, numCircleTicks + 1).map(
      (value) => (height / 2) * (value / numCircleTicks),
    );

    circleRadii.forEach((radius) => {
      svg
        .append("circle")
        .attr("cx", width / 2)
        .attr("cy", height / 2)
        .attr("r", radius - 30)
        .attr("fill", "transparent")
        .attr("stroke", "#c1c1c1")
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "2,2")
        .lower();
    });

    // Drawing labels
    const labelRadius = height / 2 - 15; // Adjust this as needed

    poles.labels.forEach((label: string, i: number) => {
      const angle = (i / poles.labels.length) * 2 * Math.PI;
      const lx = width / 2 + Math.sin(angle) * labelRadius;
      const ly = height / 2 - Math.cos(angle) * labelRadius;
      svg
        .append("text")
        .attr("class", "pole-label")
        .attr("x", lx)
        .attr("y", ly)
        .attr("dy", ".35em") // Adjust vertical alignment here
        .attr("text-anchor", () => {
          if (i === poles.labels.length / 2) return "middle";
          else if (lx < width / 2) return "end";
          else if (lx > width / 2) return "start";
          return "middle";
        })
        .text(label);
    });
  }, [width, height, series, poles]);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg
      .selectAll(".series")
      .attr("opacity", highlightItems.length === 0 ? 1 : 0.3);
    svg.selectAll(".data-point").attr("opacity", 0);
    highlightItems.forEach((item: string) => {
      svg
        .selectAll(`.series-${item.replaceAll(" ", "-")}`)
        .attr("opacity", 1)
        .raise();
      svg
        .selectAll(`.data-point-${item.replaceAll(" ", "-")}`)
        .attr("opacity", 1)
        .raise();
    });
  }, [highlightItems]);

  return (
    <div style={{ position: "relative" }}>
      <Tooltip ref={tooltipRef} style={{ display: "none" }} className="tooltip">
        {tooltipData && (
          <>
            {tooltipFormatter ? (
              tooltipFormatter(tooltipData)
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
        onMouseOut={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setHighlightItems([]);
          setTooltipData(null);
        }}
      >
        {children}
        {processedseries.map(
          ({ label, pointString, points, color }, i: number) => (
            <g
              key={`series-${i}`}
              className={`series series-${i} series-${label.replaceAll(
                " ",
                "-",
              )}`}
            >
              <Polygon
                points={pointString}
                fill={"transparent"}
                data-label={colorsMapping[label]}
                stroke={colorsMapping[label] ?? color}
                strokeWidth={5}
                onMouseMove={(event) => {
                  event.preventDefault();
                  setHighlightItems([label]);
                }}
                onMouseOut={(event) => {
                  event.preventDefault();
                  setHighlightItems([]);
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
                    j: number,
                  ) => (
                    <g key={`data-point-${j}`}>
                      {point.x !== null && point.y !== null && (
                        <DataPointStyled
                          className={`data-point data-point-${i} data-point-${label.replaceAll(
                            " ",
                            "-",
                          )}`}
                          r={6}
                          cx={point.x}
                          cy={point.y}
                          stroke="#fff"
                          strokeWidth={3}
                          fill={colorsMapping[label] ?? color}
                          onMouseOver={(e) => {
                            const [x, y] = d3.pointer(e, svgRef.current);
                            setHighlightItems([label]);
                            setTooltipData({
                              date: point.date,
                              value: point.value,
                            });
                            if (tooltipRef.current) {
                              tooltipRef.current.style.top = `${x}px`;
                              tooltipRef.current.style.left = `${y + 10}px`;
                              tooltipRef.current.style.display = "block";
                            }
                          }}
                          onMouseOut={() => {
                            setTooltipData(null);
                            if (tooltipRef.current) {
                              tooltipRef.current.style.display = "none";
                            }
                          }}
                        />
                      )}
                    </g>
                  ),
                )}
              </DataPoints>
            </g>
          ),
        )}
      </svg>
      {isLoading && isLoadingComponent && <>{isLoadingComponent}</>}
      {isLoading && !isLoadingComponent && <LoadingIndicator />}
      {!isLoading && series.length === 0 && isNodataComponent && (
        <>{isNodataComponent}</>
      )}
    </div>
  );
};

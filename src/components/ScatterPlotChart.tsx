import React, { useEffect, useMemo, useRef } from "react";
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
import { orderBy } from "lodash";

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
    border-width: 0 calc(var(--data-size) / 2) var(--data-size)
      calc(var(--data-size) / 2);
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
  dScaleLegendFormatter?: (
    domain: number[],
    dScale: d3.ScaleLinear<number, number>
  ) => string;
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
}) => {
  const ref = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const { colorsMapping, highlightItems, setHighlightItems, disabledItems } =
    useChartContext();
  const xValues = dataSet
    .filter(d => !disabledItems.includes(d.label))
    .map(d => d.x || 0);
  const yValues = dataSet
    .filter(d => !disabledItems.includes(d.label))
    .map(d => d.y || 0);
  const xDomain = [0, Math.max(...xValues) || 0];
  const yDomain = [0, Math.max(...yValues) || 0];
  // const radiusDomain = [16, d3.max(dataSet, (d) => d.d) || 0];
  // radiusDomain wil·be the range from [16 to 50 px]

  const xScale:
    | d3.ScaleLinear<number, number>
    | d3.ScaleTime<number, number>
    | d3.ScaleBand<string> = useMemo(() => {
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

  const dValues = dataSet.map(d => d.d);
  const dMax = Math.max(...dValues);
  const dMin = Math.min(...dValues);
  const dDomain = dMax === dMin ? [0, dMax] : [dMin, dMax];

  // dScale is scaleQuantile
  const dScale = useMemo(
    () => d3.scaleLinear().domain(dDomain).range([16, 80]),
    [dDomain, height, width, margin]
  );

  const dLegendPosition = {
    x: width - 100,
    y: height / 3,
  };

  const getXValue = (d: DataPoint) => {
    const offSet = "bandwidth" in xScale ? xScale?.bandwidth() / 2 : 0;
    return xAxisDataType === "band"
      ? xScale(d.label as never) + offSet
      : xScale(d.x as never);
  };

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

  const displayIsNodata = useDisplayIsNodata({
    dataSet: dataSet,
    isLoading: isLoading,
    isNodataComponent: isNodataComponent,
    isNodata: isNodata,
  });

  return (
    <Styled style={{ position: "relative" }}>
      {isLoading && isLoadingComponent}
      {displayIsNodata && isNodataComponent}
      <svg width={width} height={height} ref={ref}>
        <Title x={width / 2} y={margin.top / 2}>
          {title}
        </Title>
        {children}

        {orderBy(dataSet, ["d"], ["desc"])
          .filter(d => !disabledItems.includes(d.label))
          .map((d, i) => (
            <foreignObject
              data-label={d.label}
              opacity={0.9}
              key={i}
              x={getXValue(d)}
              y={yScale(d.y)}
              width={xAxisDataType === "band" ? d.d / 2 : dScale(d.d)}
              height={xAxisDataType === "band" ? d.d / 2 : dScale(d.d)}
              style={{
                transition: "r 0.1s ease-out, opacity 0.1s ease-out",
                transform: `translate(-${xAxisDataType === "band" ? d.d / 4 : dScale(d.d) / 2}px, -${xAxisDataType === "band" ? d.d / 4 : dScale(d.d) / 2}px)`,
              }}
              onMouseEnter={event => {
                const [x, y] = d3.pointer(event);

                setHighlightItems([d.label]);
                if (tooltipRef.current) {
                  tooltipRef.current.style.display = "block";
                  tooltipRef.current.style.left = `${x}px`;
                  tooltipRef.current.style.top = `${y}px`;

                  if (tooltipFormatter) {
                    tooltipRef.current.innerHTML = tooltipFormatter(d);
                    return;
                  }

                  tooltipRef.current.innerHTML = `
                  <div>
                    <div>${d.label}</div>
                    <div>${xAxisFormat ? xAxisFormat(d.x) : d.x}</div>
                    <div>${yAxisFormat ? yAxisFormat(d.y) : d.y}</div>
                  </div>
                `;
                }
              }}
              onMouseLeave={() => {
                setHighlightItems([]);
                if (tooltipRef.current) {
                  tooltipRef.current.style.display = "none";
                }
              }}
            >
              <div
                style={
                  {
                    "--data-size": `${xAxisDataType === "band" ? d.d / 2 : dScale(d.d)}px`,
                    "--data-background":
                      colorsMapping?.[d.label] || d.color || "transparent",
                  } as React.CSSProperties
                }
                className={`shape shape-${d?.shape ? d.shape : "circle"}`}
              ></div>
            </foreignObject>
          ))}
        {!isLoading && dataSet.length && (
          <g className="michi-vz-legend">
            {dScaleLegendFormatter && dScaleLegendFormatter(dDomain, dScale)}
            {dScaleLegend?.title && (
              <text
                x={dLegendPosition.x}
                y={dLegendPosition.y - 120}
                textAnchor={"middle"}
              >
                {dScaleLegend?.title}
              </text>
            )}
            <path
              d={drawHalfLeftCircle(
                dLegendPosition.x,
                dLegendPosition.y,
                40,
                40
              )}
              fill={"none"}
              stroke={"#ccc"}
            />
            <path
              d={drawHalfLeftCircle(
                dLegendPosition.x,
                dLegendPosition.y,
                20,
                20
              )}
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
            xScale={
              xScale as
                | d3.ScaleLinear<number, number>
                | d3.ScaleTime<number, number>
            }
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
    </Styled>
  );
};

export default ScatterPlotChart;

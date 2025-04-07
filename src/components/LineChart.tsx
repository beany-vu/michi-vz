import React, { useEffect, useMemo, useRef, Suspense, useCallback } from "react";
import * as d3 from "d3";
import { ScaleTime } from "d3";
import { DataPoint } from "../types/data";
import Title from "./shared/Title";
import YaxisLinear from "./shared/YaxisLinear";
import XaxisLinear from "./shared/XaxisLinear";
import { useChartContext } from "./MichiVzProvider";
import { ScaleLinear } from "d3-scale";
import LoadingIndicator from "./shared/LoadingIndicator";
import { useDisplayIsNodata } from "./hooks/useDisplayIsNodata";
import styled from "styled-components";

const MARGIN = { top: 50, right: 50, bottom: 50, left: 50 };
const WIDTH = 900 - MARGIN.left - MARGIN.right;
const HEIGHT = 480 - MARGIN.top - MARGIN.bottom;
const DASH_LENGTH = 4;
const DASH_SEPARATOR_LENGTH = 4;

const Styled = styled.div`
  path,
  circle {
    transition: opacity 0.1s ease-out;
    will-change: opacity;
    transition-delay: 0.1s;
    transition-behavior: allow-discrete;
  }

  .data-group {
    opacity: 1;
    &.dimmed {
      opacity: 0.05;
    }
    &.highlighted {
      opacity: 1;
    }
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
  sandBoxMode?: boolean;
}

const debounce = (func: Function, wait: number) => {
  let timeout: number;
  return function (...args: any[]) {
    const context = this;
    clearTimeout(timeout);
    timeout = window.setTimeout(() => func.apply(context, args), wait);
  };
};

const LineChart: React.FC<LineChartProps> = ({
  dataSet,
  filter,
  title,
  width = WIDTH,
  height = HEIGHT,
  margin = MARGIN,
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
  sandBoxMode = false,
}) => {
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
  const svgRef = useRef<SVGSVGElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  const filteredDataSet = useMemo(() => {
    // If filter is undefined, show all items.
    if (!filter) return dataSet;
    return dataSet
      .filter(item => {
        const targetPoint = item.series.find(d => d.date.toString() === filter.date.toString());
        return targetPoint !== undefined;
      })
      .sort((a, b) => {
        const aPoint = a.series.find(d => d.date.toString() === filter.date.toString());
        const bPoint = b.series.find(d => d.date.toString() === filter.date.toString());
        const aVal = aPoint ? Number(aPoint[filter.criteria]) : 0;
        const bVal = bPoint ? Number(bPoint[filter.criteria]) : 0;
        return filter.sortingDir === "desc" ? bVal - aVal : aVal - bVal;
      })
      .slice(0, filter.limit); // use filter.limit instead of filter.top
  }, [dataSet, filter]);

  // New: update hiddenItems based on filter
  useEffect(() => {
    if (sandBoxMode) return;
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

  useEffect(() => {
    if (sandBoxMode) return;
    // New: update visibleItems based on filter
    const newVisible = filteredDataSet.map(item => item.label);
    if (JSON.stringify(newVisible) !== JSON.stringify(visibleItems)) {
      setVisibleItems(newVisible);
    }
  }, [hiddenItems, visibleItems, setVisibleItems]);

  const yScale = useMemo(
    () =>
      d3
        .scaleLinear()
        .domain(
          yAxisDomain
            ? yAxisDomain
            : [
                d3.min(
                  filteredDataSet
                    .filter(d => !disabledItems.includes(d.label))
                    .flatMap(({ series }) => series.filter(dd => dd.value !== null)),
                  d => d.value
                ) || 0,
                d3.max(
                  filteredDataSet
                    .filter(d => !disabledItems.includes(d.label))
                    .flatMap(({ series }) => series.filter(dd => dd.value !== null)),
                  d => d.value
                ) || 1,
              ]
        )
        .range([height - margin.bottom, margin.top])
        .clamp(true)
        .nice(),
    [filteredDataSet, width, height, disabledItems, yAxisDomain]
  );

  const xScale = useMemo(() => {
    if (xAxisDataType === "number") {
      return d3
        .scaleLinear()
        .domain([
          d3.min(
            filteredDataSet
              .filter(d => !disabledItems.includes(d.label))
              .flatMap(item => item.series.map(d => d.date as number))
          ) || 0,
          d3.max(
            filteredDataSet
              .filter(d => !disabledItems.includes(d.label))
              .flatMap(item => item.series.map(d => d.date as number))
          ) || 1,
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
      const maxDate = d3.max(filteredDataSet.flatMap(item => item.series.map(d => new Date(`${d.date}`))));

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
  }, [filteredDataSet, width, height, disabledItems, xAxisDataType]);

  const getYValueAtX = useCallback((series: DataPoint[], x: number | Date): number | undefined => {
    if (x instanceof Date) {
      const dataPoint = series.find(d => new Date(d.date).getTime() === x.getTime());
      return dataPoint ? dataPoint.value : undefined;
    }

    const dataPoint = series.find(d => Number(d.date) === x);
    return dataPoint ? dataPoint.value : undefined;
  }, []);

  const getPathLengthAtX = useCallback((path: SVGPathElement, x: number) => {
    const l = path.getTotalLength();
    const precision = 90;
    if (!path || path.getTotalLength() === 0) {
      return 0;
    }
    for (let i = 0; i <= precision; i++) {
      const pos = path.getPointAtLength((l * i) / precision);
      if (pos.x >= x) return (l * i) / precision;
    }
  }, []);

  const getDashArrayMemoized = useMemo(() => {
    return (
      series: DataPoint[],
      pathNode: SVGPathElement,
      xScale: ScaleLinear<number, number> | ScaleTime<number, number>
    ) => {
      const totalLength = pathNode.getTotalLength();
      const lengths = series.map(d => getPathLengthAtX(pathNode, xScale(new Date(d.date))));

      const dashArray = [];

      for (let i = 1; i <= series.length; i++) {
        const segmentLength =
          i === series.length - 1 ? totalLength - lengths[i - 1] : lengths[i] - lengths[i - 1];

        if (!series[i]?.certainty) {
          const dashes = Math.floor(segmentLength / (DASH_LENGTH + DASH_SEPARATOR_LENGTH));
          const remainder = Math.ceil(segmentLength - dashes * (DASH_LENGTH + DASH_SEPARATOR_LENGTH)) + 5;

          for (let j = 0; j < dashes; j++) {
            dashArray.push(DASH_LENGTH);
            dashArray.push(DASH_SEPARATOR_LENGTH);
          }

          if (remainder > 0) dashArray.push(remainder);
        } else {
          // if dashArray.length is odd, then the coming up last segment is dash
          // we will have to add a "0" as space before we add the segmentLength so that the new added segment is not dashed
          if (dashArray.length % 2 === 1) {
            dashArray.push(0);
            dashArray.push(segmentLength);
          } else {
            dashArray.push(segmentLength);
          }
        }
      }
      return dashArray.join(",");
    };
  }, [DASH_LENGTH, DASH_SEPARATOR_LENGTH]);

  useEffect(() => {
    const svg = d3.select(svgRef.current);

    svg.selectAll(".line").remove();
    svg.selectAll(".line-overlay").remove();
    svg.selectAll(".data-group").remove();

    const line = ({ d, curve }: { d: Iterable<DataPoint>; curve: string }) => {
      return d3
        .line<DataPoint>()
        .x(d => xScale(new Date(d.date)))
        .y(d => yScale(d.value))
        .curve(d3?.[curve] ?? d3.curveBumpX)(d);
    };

    // draw lines
    filteredDataSet
      .filter(d => !disabledItems.includes(d.label))
      .forEach((data, i) => {
        svg
          .append("path")
          .datum(data.series)
          .attr("class", `line line-${i} data-group data-group-${i}`)
          .attr("data-label", data.label)
          .attr("d", (d: DataPoint[]) =>
            line({
              d: d,
              curve: data?.curve,
            })
          )
          .attr("stroke", colorsMapping[data.label] ?? data.color)
          .attr("stroke-width", 2)
          .attr("fill", "none")
          .attr("pointer-events", "none")
          .on("mouseenter", event => handleMouseEnter(event, data))
          .on("mouseout", handleMouseOut);

        if (data.series) {
          svg
            .append("path")
            .datum(data.series)
            .attr(
              "class",
              `line-overlay line-overlay-${i} data-group-overlay data-group-${i} data-group-overlay-${data.label} line-group-overlay-${data.label}`
            )
            .attr("d", (d: DataPoint[]) =>
              line({
                d: d,
                curve: data?.curve,
              })
            )
            .attr("stroke", colorsMapping[data.label] ?? data.color)
            .attr("stroke-width", 5)
            .attr("fill", "none")
            .attr("pointer-events", "stroke")
            .attr("opacity", 0.05)
            .on("mouseenter", event => handleMouseEnter(event, data))
            .on("mouseout", handleMouseOut);
        }
      });

    // draw circles on the line to indicate data points
    filteredDataSet
      .filter(d => !disabledItems.includes(d.label))
      .forEach((data, i) => {
        svg
          .selectAll(`.circle-data-${i}`)
          .data(data.series)
          .enter()
          .append("circle")
          .attr("class", `data-group data-group-${i} data-group-${data.label}`)
          .attr("data-label", data.label)
          .attr("cx", (d: DataPoint) => xScale(new Date(d.date)))
          .attr("cy", (d: DataPoint) => yScale(d.value))
          .attr("r", 5)
          .attr("fill", colorsMapping[data.label] ?? data.color ?? "transparent")
          .attr("stroke", "#fff")
          .attr("stroke-width", 2)
          .attr("transition", "all 0.1s ease-out")
          .attr("cursor", "crosshair")
          .on("mouseenter", (event, d) => {
            event.preventDefault();
            event.stopPropagation();

            setHighlightItems([data.label]);

            const tooltipContent = tooltipFormatter(
              {
                ...d,
                label: data.label,
              } as DataPoint,
              data.series,
              filteredDataSet
            );

            if (tooltipRef?.current && svgRef.current) {
              const [mouseX, mouseY] = d3.pointer(event);
              const svgRect = svgRef.current.getBoundingClientRect();
              const tooltip = tooltipRef.current;

              // Calculate position relative to SVG container
              const xPosition = svgRect.left + mouseX + 10;
              const yPosition = svgRect.top + mouseY - 25;

              tooltip.style.left = `${xPosition}px`;
              tooltip.style.top = `${yPosition}px`;
              tooltip.style.visibility = "visible";
              tooltip.innerHTML = tooltipContent;
            }
          })
          .on("mouseout", event => {
            event.preventDefault();
            event.stopPropagation();

            const relatedTarget = event.relatedTarget;
            const isMouseOverLine =
              relatedTarget &&
              (relatedTarget.classList.contains("line") || relatedTarget.classList.contains("line-overlay"));

            if (!isMouseOverLine) {
              setHighlightItems([]);
              if (tooltipRef?.current) {
                tooltipRef.current.style.visibility = "hidden";
              }
            }
          });
      });
  }, [filteredDataSet, width, height, margin, disabledItems, xAxisDataType, getDashArrayMemoized]);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    Object.keys(colorsMapping).forEach(key => {
      svg
        .selectAll(`circle[data-label="${key}"]`)
        .attr("stroke", "#fff")
        .attr("stroke-width", 5)
        .attr("fill", colorsMapping[key]);
      svg.selectAll(`[label="${key}"]`).attr("fill", colorsMapping[key]);
    });
  }, [colorsMapping]);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg
      .selectAll(".data-group")
      .classed("dimmed", highlightItems.length > 0)
      .classed("highlighted", false);

    if (highlightItems.length > 0) {
      highlightItems.forEach(item => {
        svg.selectAll(`[data-label="${item}"]`).classed("dimmed", false).classed("highlighted", true);
      });
    }

    if (highlightItems.length === 0) {
      d3.select("#tooltip").style("visibility", "hidden");
    }
  }, [highlightItems]);

  const handleMouseEnter = useCallback(
    debounce((event, data) => {
      event.preventDefault();
      event.stopPropagation();
      setHighlightItems([data.label]);
    }, 100),
    [setHighlightItems]
  );

  const handleMouseOut = useCallback(
    debounce(event => {
      event.preventDefault();
      event.stopPropagation();
      setHighlightItems([]);
      if (tooltipRef?.current) {
        tooltipRef.current.style.visibility = "hidden";
      }
    }, 100),
    [setHighlightItems]
  );

  const handleHover = useCallback(
    (event: MouseEvent) => {
      if (!svgRef.current || !tooltipRef.current) return;

      const [x, y] = d3.pointer(event, svgRef.current);
      const xValue = xScale.invert(x);

      const tooltipTitle = `<div class="tooltip-title">${xValue}</div>`;
      const tooltipContent = filteredDataSet
        .map(data => {
          const yValue = getYValueAtX(data.series, xValue);
          return `<div>${data.label}: ${yValue ?? "N/A"}</div>`;
        })
        .join("");

      const tooltip = tooltipRef.current;
      tooltip.innerHTML = `<div style="background: #fff; padding: 5px">${tooltipTitle}${tooltipContent}</div>`;
      tooltip.style.left = x + "px";
      tooltip.style.top = y + "px";
      tooltip.style.opacity = "1";
      tooltip.style.visibility = "visible";
      tooltip.style.pointerEvents = "auto";

      const hoverLinesGroup = d3.select(svgRef.current).select(".hover-lines");
      const hoverLine = hoverLinesGroup.select(".hover-line");
      const xPosition = xScale(xValue);

      hoverLine
        .attr("x1", xPosition)
        .attr("x2", xPosition)
        .attr("y1", MARGIN.top)
        .attr("y2", HEIGHT - MARGIN.bottom + 20)
        .style("display", "block");

      hoverLinesGroup.style("display", "block");
    },
    [xScale, filteredDataSet, getYValueAtX]
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

  useEffect(() => {
    if (!showCombined || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const hoverLinesGroup = svg.append("g").attr("class", "hover-lines").style("display", "none");
    const hoverLine = hoverLinesGroup
      .append("line")
      .attr("class", "hover-line")
      .attr("stroke", "lightgray")
      .attr("stroke-width", 1)
      .style("pointer-events", "none")
      .style("display", "none");

    const overlay = svg
      .append("rect")
      .attr("class", "overlay")
      .attr("width", width)
      .attr("height", height)
      .style("fill", "none")
      .style("pointer-events", "all");

    overlay.on("mousemove", handleHover);
    overlay.on("mouseout", handleCombinedMouseOut);

    return () => {
      overlay.on("mousemove", null);
      overlay.on("mouseout", null);
      hoverLinesGroup.remove();
      overlay.remove();
    };
  }, [showCombined, width, height, handleHover, handleCombinedMouseOut]);

  const displayIsNodata = useDisplayIsNodata({
    dataSet: dataSet,
    isLoading: isLoading,
    isNodataComponent: isNodataComponent,
    isNodata: isNodata,
  });

  return (
    <Styled>
      <div style={{ position: "relative", width: width, height: height }}>
        <Suspense fallback={<LoadingIndicator />}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            ref={svgRef}
            width={width}
            height={height}
            onMouseOut={event => {
              event.preventDefault();
              event.stopPropagation();
              setHighlightItems([]);

              if (tooltipRef?.current) {
                tooltipRef.current.style.visibility = "hidden";
              }
            }}
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
        </Suspense>
        <div
          ref={tooltipRef}
          className="tooltip"
          style={{
            position: "fixed",
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
        {isLoading && isLoadingComponent && <>{isLoadingComponent}</>}
        {isLoading && !isLoadingComponent && <LoadingIndicator />}
        {displayIsNodata && <>{isNodataComponent}</>}
      </div>
    </Styled>
  );
};

export default LineChart;

import React, { FC, useLayoutEffect, useRef, useMemo, useCallback } from "react";
import { ScaleBand } from "d3-scale";
import * as d3 from "d3";

// Simple text width estimation (average character width ~7px for 12px font) - currently unused
// const estimateTextWidth = (text: string): number => {
//   return text.length * 7;
// };

interface Props {
  yScale: ScaleBand<string>;
  width: number;
  margin: { top: number; right: number; bottom: number; left: number };
  yAxisFormat?: (d: number | string) => string;
  showGrid?: boolean;
  onHover?: (label: string | null) => void;
  hoveredItem?: string | null;
  tickHtmlWidth?: number;
  enableTransitions?: boolean;
  defaultTickPosition?: { x: number; y: number };
}

const YaxisBand: FC<Props> = ({
  yScale,
  width,
  margin,
  yAxisFormat,
  showGrid,
  onHover,
  hoveredItem,
  tickHtmlWidth = 100,
  enableTransitions = true,
  defaultTickPosition = { x: -100, y: -10 },
}) => {
  const ref = useRef<SVGGElement>(null);
  const renderedRef = useRef(false);

  // Memoize the axis generator
  const axisGenerator = useMemo(() => {
    return d3
      .axisLeft(yScale)
      .tickFormat(d => (yAxisFormat ? yAxisFormat(d) : d))
      .tickSize(0);
  }, [yScale, yAxisFormat]);

  // Memoize the grid width calculation with dynamic adjustment (currently unused)
  // const gridWidthCalc = useMemo(() => {
  //   // Calculate the maximum label width
  //   const domain = yScale.domain();
  //   const maxLabelWidth = Math.max(
  //     ...domain.map(d => {
  //       const formatValue = yAxisFormat ? yAxisFormat(d) : String(d);
  //       return estimateTextWidth(formatValue);
  //     })
  //   );

  //   // Calculate adjusted grid width: full width minus label overlap
  //   const labelOverlapBuffer = 10; // 10px buffer
  //   const adjustedGridWidth = Math.max(
  //     width -
  //       margin.left -
  //       margin.right -
  //       Math.max(0, maxLabelWidth - tickHtmlWidth + labelOverlapBuffer),
  //     50 // Minimum grid line length
  //   );

  //   return adjustedGridWidth;
  // }, [width, margin, yScale, yAxisFormat, tickHtmlWidth]);

  const updateAxis = useCallback(() => {
    if (!ref.current) return;

    const g = d3.select(ref.current);

    // Clear previous content
    g.selectAll("*").remove();

    // Add the y-axis with ticks
    g.attr("class", "y-axis")
      .attr("transform", "translate(" + margin.left + ",0)")
      .call(axisGenerator);

    // Remove domain line and tick lines
    g.select(".domain").remove();
    g.selectAll(".tick line").remove();

    // Remove existing text labels
    g.selectAll(".tick *").remove();

    // Remove existing tick lines
    g.selectAll(".tick-line").remove();

    // Append foreignObject for HTML content
    g.selectAll(".tick")
      .append("foreignObject")
      .attr("class", "tick-html")
      .attr("x", defaultTickPosition.x)
      .attr("y", defaultTickPosition.y)
      .attr("width", tickHtmlWidth)
      .attr("height", 20)
      .html(
        d =>
          `<div style="display:flex;align-items:center;height:100%;cursor:pointer" title="${d}"><span>${d}</span></div>`
      )
      .on("mouseenter", function (_, d) {
        if (onHover) {
          onHover(d as string);
        }
      })
      .on("mouseleave", function () {
        if (onHover) {
          onHover(null);
        }
      });

    // Add dashed lines on each tick (full width from Y-axis to right edge)
    // Grid lines should start at x=0 (Y-axis position) and extend the full width
    const fullGridWidth = width - margin.left - margin.right;
    g.selectAll(".tick")
      .append("line")
      .attr("class", "tick-line")
      .attr("x1", 0)
      .attr("x2", fullGridWidth)
      .attr("y1", 0)
      .attr("y2", 0)
      .style("stroke-dasharray", "1.5")
      .style("stroke", showGrid ? "lightgray" : "transparent");
  }, [
    margin.left,
    margin.right,
    axisGenerator,
    defaultTickPosition.x,
    defaultTickPosition.y,
    tickHtmlWidth,
    width,
    showGrid,
    onHover,
  ]);

  useLayoutEffect(() => {
    if (!renderedRef.current) {
      // First render with transition
      if (ref.current && enableTransitions) {
        const g = d3.select(ref.current);
        g.selectAll(".tick").attr("opacity", 0).transition().duration(500).attr("opacity", 1);
      }
      renderedRef.current = true;
    }
    updateAxis();
  }, [updateAxis, enableTransitions]);

  // Separate effect for hover state changes and rendering state
  useLayoutEffect(() => {
    if (!ref.current) return;
    const g = d3.select(ref.current);

    g.selectAll(".tick-html").each(function (d) {
      const element = d3.select(this);
      let opacity = 0;

      opacity = hoveredItem === null ? 1 : d === hoveredItem ? 1 : 0.3;

      element.style("opacity", opacity);
      if (enableTransitions) {
        element.style("transition", "opacity 0.2s ease-in-out");
      }
    });
  }, [hoveredItem, enableTransitions]);

  return <g ref={ref} />;
};

export default YaxisBand;

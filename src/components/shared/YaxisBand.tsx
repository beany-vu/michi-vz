import React, { FC, useLayoutEffect, useRef, useMemo, useCallback } from "react";
import { ScaleBand } from "d3-scale";
import * as d3 from "d3";

interface Props {
  yScale: ScaleBand<string>;
  width: number;
  margin: { top: number; right: number; bottom: number; left: number };
  yAxisFormat?: (d: number | string) => string;
  showGrid?: boolean;
  onHover?: (label: string | null) => void;
  hoveredItem?: string | null;
}

const YaxisBand: FC<Props> = ({
  yScale,
  width,
  margin,
  yAxisFormat,
  showGrid,
  onHover,
  hoveredItem,
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

  // Memoize the grid width calculation
  const gridWidth = useMemo(() => {
    return width - margin.left - margin.right;
  }, [width, margin]);

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
      .attr("x", -100)
      .attr("y", -10)
      .attr("width", 100)
      .attr("height", 20)
      .html(
        d =>
          `<div style="display:flex;align-items:center;height:100%;cursor:pointer" title="${d}"><span>${d}</span></div>`
      )
      .on("mouseenter", function (event, d) {
        if (onHover) {
          onHover(d as string);
        }
      })
      .on("mouseleave", function () {
        if (onHover) {
          onHover(null);
        }
      });

    // Add dashed lines on each tick
    g.selectAll(".tick")
      .append("line")
      .attr("class", "tick-line")
      .attr("x1", 0)
      .attr("x2", gridWidth)
      .attr("y1", 0)
      .attr("y2", 0)
      .style("stroke-dasharray", "1.5")
      .style("stroke", showGrid ? "lightgray" : "transparent");
  }, [axisGenerator, margin.left, showGrid, gridWidth, onHover]);

  useLayoutEffect(() => {
    if (!renderedRef.current) {
      // First render with transition
      if (ref.current) {
        const g = d3.select(ref.current);
        g.selectAll(".tick").attr("opacity", 0).transition().duration(500).attr("opacity", 1);
      }
      renderedRef.current = true;
    }
    updateAxis();
  }, [updateAxis]);

  // Separate effect for hover state changes
  useLayoutEffect(() => {
    if (!ref.current) return;
    const g = d3.select(ref.current);

    g.selectAll(".tick-html").each(function (d) {
      const element = d3.select(this);
      const opacity = hoveredItem === null ? 1 : d === hoveredItem ? 1 : 0.3;
      element.style("opacity", opacity);
      element.style("transition", "opacity 0.2s ease-in-out");
    });
  }, [hoveredItem]);

  return <g ref={ref} />;
};

export default React.memo(YaxisBand);

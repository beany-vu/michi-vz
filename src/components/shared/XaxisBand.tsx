import React, { FC, useLayoutEffect, useRef, useMemo, useCallback, useEffect } from "react";
import { ScaleBand } from "d3-scale";
import * as d3 from "d3";
import { chooseAxisMode, AxisMode } from "./xaxisBand/chooseAxisMode";
import { measureLabelWidth } from "./xaxisBand/measureLabelWidth";

interface Props {
  xScale: ScaleBand<string>;
  height: number;
  margin: { top: number; right: number; bottom: number; left: number };
  xAxisFormat?: (d: string | number) => string;
  xAxisDataType?: "text" | "number";
  ticks?: number;
  isLoading?: boolean;
  isEmpty?: boolean;
  xAxisLabelMode?: "auto" | "horizontal";
  /**
   * Fired when the label layout changes. `requiredBottomMargin` is the bottom
   * margin (px) the chart must provide so rotated labels are not clipped by
   * the SVG edge — measured from the longest rendered tick label (0 when
   * horizontal). Consumers grow their margin via
   * `Math.max(margin.bottom, requiredBottomMargin)`.
   */
  onAxisModeChange?: (mode: AxisMode, requiredBottomMargin?: number) => void;
}

// Rotated labels hang below the axis line by labelWidth·sin(45°), on top of
// the axis group's own +25px offset and the label's translate(0, 14). The
// extra 12px covers the font box/descender so the last glyph clears the edge.
const AXIS_GROUP_OFFSET = 25;
const ROTATED_LABEL_TRANSLATE = 14;
const ROTATED_LABEL_PADDING = 12;
const SIN_45 = Math.SQRT1_2;

const XaxisBand: FC<Props> = ({
  xScale,
  height,
  margin,
  xAxisFormat,
  // xAxisDataType is kept for API consistency with other axis components
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  xAxisDataType = "text",
  ticks = 15,
  isLoading = false,
  isEmpty = false,
  xAxisLabelMode = "auto",
  onAxisModeChange,
}) => {
  const ref = useRef<SVGGElement>(null);
  const renderedRef = useRef(false);
  const prevModeRef = useRef<AxisMode | null>(null);

  const formatter = useCallback(
    (d: string | number): string => {
      if (xAxisFormat) {
        return xAxisFormat(d);
      }
      return String(d);
    },
    [xAxisFormat]
  );

  const { mode, tickValues, requiredBottomMargin } = useMemo<{
    mode: AxisMode;
    tickValues: string[];
    requiredBottomMargin: number;
  }>(() => {
    if (isLoading || isEmpty) {
      return { mode: "horizontal", tickValues: [], requiredBottomMargin: 0 };
    }
    const result = chooseAxisMode({
      domain: xScale.domain(),
      formatter: d => formatter(d),
      bandWidth: xScale.step(),
      measure: measureLabelWidth,
      maxTicks: ticks,
      forceMode: xAxisLabelMode,
    });
    // How much bottom margin the chart needs so rotated labels render fully
    // inside the SVG (independent of margin, so no feedback loop with charts
    // that grow their margin from this value).
    let required = 0;
    if (result.mode === "rotated") {
      const maxLabelWidth = result.tickValues.reduce(
        (max, value) => Math.max(max, measureLabelWidth(formatter(value))),
        0
      );
      required = Math.ceil(
        AXIS_GROUP_OFFSET + ROTATED_LABEL_TRANSLATE + maxLabelWidth * SIN_45 + ROTATED_LABEL_PADDING
      );
    }
    return { ...result, requiredBottomMargin: required };
  }, [xScale, formatter, ticks, isLoading, isEmpty, xAxisLabelMode]);

  // Notify parent when the layout changes (used by charts to reserve extra
  // bottom space for rotated labels — see VerticalStackBarChart/ScatterPlotChart).
  const prevRequiredRef = useRef<number | null>(null);
  useEffect(() => {
    if (prevModeRef.current === mode && prevRequiredRef.current === requiredBottomMargin) return;
    prevModeRef.current = mode;
    prevRequiredRef.current = requiredBottomMargin;
    if (onAxisModeChange) {
      onAxisModeChange(mode, requiredBottomMargin);
    }
  }, [mode, requiredBottomMargin, onAxisModeChange]);

  useLayoutEffect(() => {
    if (!ref.current || !xScale || renderedRef.current) return;

    const xAxis = d3
      .axisBottom(xScale)
      .tickFormat(formatter as (d: string) => string)
      .tickSizeOuter(0)
      .tickValues(tickValues);

    d3.select<SVGGElement, unknown>(ref.current)
      .call(xAxis)
      .selectAll("text")
      .attr("y", margin.bottom / 2)
      .attr("dx", "0em")
      .attr("dy", "0.5em");

    renderedRef.current = true;
  }, [xScale, margin.bottom, formatter, tickValues]);

  useLayoutEffect(() => {
    if (!ref.current || !tickValues.length) return;
    const g = d3.select<SVGGElement, unknown>(ref.current);

    const isModeChange = prevModeRef.current !== null && prevModeRef.current !== mode;

    // Clear previous content
    g.selectAll("*").remove();

    // Create the axis group
    const axisGroup = g.attr("transform", `translate(0,${height - margin.bottom + 25})`);

    // Add the axis with transition - only apply transition on first render
    const axisCall = d3.axisBottom(xScale).tickValues(tickValues).tickFormat(formatter);

    if (!renderedRef.current) {
      axisGroup.transition().duration(500).call(axisCall);
      renderedRef.current = true;
    } else {
      axisGroup.call(axisCall);
    }

    // Remove domain line and tick lines
    axisGroup.select(".domain").remove();
    axisGroup.selectAll(".tick line").remove();

    // Apply the mode-appropriate label transform. The dot at each tick stays
    // unchanged regardless of mode.
    const labelSel = axisGroup.selectAll(".tick text");
    if (mode === "rotated") {
      // Push text well below the dot so the stack reads:
      // abbreviation → dot → rotated label (clear vertical gap on each side).
      // translate(0, 14) shifts the whole label straight down in screen coords
      // after rotation, giving a clean vertical gap regardless of font metrics.
      labelSel
        .attr("y", 0)
        .attr("transform", "translate(0, 14) rotate(-45)")
        .style("text-anchor", "end")
        .attr("dx", "0")
        .attr("dy", "0.32em");
    } else {
      // Horizontal mode (including fallback): explicit y=16 (vs d3's default
      // 9) gives a clear ~10px gap between the dot and the text top edge, so
      // they don't visually merge.
      labelSel
        .attr("y", 16)
        .attr("transform", "rotate(0)")
        .style("text-anchor", "middle")
        .attr("dx", "0")
        .attr("dy", "0.71em");
    }

    // Add dashed lines with transition
    const tickGroups = axisGroup.selectAll(".tick");

    // Remove existing tick lines before adding new ones
    tickGroups.selectAll(".tick-line").remove();

    // Add tick lines - only apply transition on first render
    tickGroups
      .append("line")
      .attr("class", "tick-line")
      .attr("x1", 0)
      .attr("x2", 0)
      .attr("y1", 0)
      .attr("y2", -height + margin.bottom - 25)
      .attr("pointer-events", "none")
      .style("stroke-dasharray", "3,3")
      .style("stroke", "transparent")
      .style("opacity", 1);

    // Update or add dots
    const dots = tickGroups.selectAll(".tickValueDot").data([0]); // One dot per tick

    // Enter new dots
    dots
      .enter()
      .append("circle")
      .attr("class", "tickValueDot")
      .merge(dots as unknown as d3.Selection<SVGCircleElement, number, SVGGElement, unknown>)
      .attr("cx", 0)
      .attr("cy", 0)
      .attr("r", 2)
      .attr("fill", "lightgray")
      .style("opacity", 1);

    // Remove old dots
    dots.exit().remove();

    // Add interactive circles (separate from the dots)
    tickGroups
      .append("circle")
      .attr("class", "tickValueDot-interactive")
      .attr("cx", 0)
      .attr("cy", 0)
      .attr("r", 2)
      .attr("fill", "lightgray")
      .style("opacity", 1)
      .on("mouseover", function () {
        d3.select(this).attr("r", 4).attr("fill", "#666");
      })
      .on("mouseout", function () {
        d3.select(this).attr("r", 2).attr("fill", "lightgray");
      });

    // Fade-in on mode change to soften the visual jump between layouts.
    if (isModeChange) {
      axisGroup
        .selectAll(".tick text")
        .style("opacity", 0)
        .transition()
        .duration(300)
        .style("opacity", 1);
      axisGroup
        .selectAll(".tickValueDot, .tickValueDot-interactive")
        .style("opacity", 0)
        .transition()
        .duration(300)
        .style("opacity", 1);
    }

    // Cleanup: cancel any in-flight d3 transitions on unmount/re-run.
    return () => {
      const node = ref.current;
      if (!node) return;
      const sel = d3.select(node);
      sel.interrupt();
      sel.selectAll("*").interrupt();
    };
  }, [xScale, height, margin, tickValues, formatter, mode]);

  return <g ref={ref} className="x-axis x-axis-band" />;
};

export default XaxisBand;

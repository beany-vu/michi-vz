import React from "react";
import { useCallback } from "react";
import { Margin, LineChartDataItem } from "../../../types/data";
import { pointer, select, ScaleLinear, ScaleTime } from "d3";

export const useTooltip = (
  xScale: ScaleLinear<number, number> | ScaleTime<number, number>,
  filteredDataSet: LineChartDataItem[],
  getYValueAtX: (series: { date: number; value: number; certainty: boolean }[], x: number | Date) => number | undefined,
  margin: Margin,
  height: number,
  svgRef: React.RefObject<SVGSVGElement | null>,
  tooltipRef: React.RefObject<HTMLDivElement | null>
) => {
  return useCallback(
    (event: MouseEvent) => {
      if (!svgRef.current || !tooltipRef.current) return;

      const [x, y] = pointer(event, event.currentTarget as SVGElement);
      const xInverted = xScale.invert(x);
      const xValue = xInverted instanceof Date ? xInverted.getTime() : +xInverted;

      const tooltipTitle = `<div class="tooltip-title">${xValue}</div>`;
      const tooltipContent = filteredDataSet
        .map((data: LineChartDataItem) => {
          const yValue = getYValueAtX(data.series, xValue);
          return `<div>${data.label}: ${yValue ?? "N/A"}</div>`;
        })
        .join("");

      const tooltip = tooltipRef.current;
      tooltip.innerHTML = `<div style="background: #fff; padding: 5px">${tooltipTitle}${tooltipContent}</div>`;

      // Make tooltip visible to calculate its dimensions
      tooltip.style.opacity = "1";
      tooltip.style.visibility = "visible";
      tooltip.style.pointerEvents = "auto";

      // Get dimensions to check for overflow
      const tooltipRect = tooltip.getBoundingClientRect();
      const svgRect = svgRef.current.getBoundingClientRect();

      // Check for right edge overflow
      if (x + tooltipRect.width > svgRect.width - (margin.right ?? 0)) {
        tooltip.style.left = x - tooltipRect.width - 10 + "px";
      } else {
        tooltip.style.left = x + 10 + "px";
      }

      // Check for top/bottom edge overflow
      if (y - tooltipRect.height < (margin.top ?? 0)) {
        tooltip.style.top = y + 10 + "px";
      } else {
        tooltip.style.top = y - tooltipRect.height - 5 + "px";
      }

      const hoverLinesGroup = select(svgRef.current).select(".hover-lines");
      const hoverLine = hoverLinesGroup.select(".hover-line");
      const xPosition = xScale(xValue);

      hoverLine
        .attr("x1", xPosition)
        .attr("x2", xPosition)
        .attr("y1", margin.top ?? 0)
        .attr("y2", height - (margin.bottom ?? 0) + 20)
        .style("display", "block");

      hoverLinesGroup.style("display", "block");
    },
    [xScale, filteredDataSet, getYValueAtX, margin, height, svgRef, tooltipRef]
  );
};

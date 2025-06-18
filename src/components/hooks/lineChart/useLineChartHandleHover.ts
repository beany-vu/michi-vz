import { useCallback } from "react";
import { pointer, select } from "d3";
import { DEFAULT_HEIGHT, DEFAULT_MARGIN } from "../../LineChart";

const useLineChartTooltipToggle = (
  xScale,
  filteredDataSet,
  getYValueAtX,
  margin,
  svgRef,
  tooltipRef
) => {
  return useCallback(
    (event: MouseEvent) => {
      if (!svgRef.current || !tooltipRef.current) return;

      const [x, y] = pointer(event, event.currentTarget as SVGElement);
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

      // Make tooltip visible to calculate its dimensions
      tooltip.style.opacity = "1";
      tooltip.style.visibility = "visible";
      tooltip.style.pointerEvents = "auto";

      // Get dimensions to check for overflow
      const tooltipRect = tooltip.getBoundingClientRect();
      const svgRect = svgRef.current.getBoundingClientRect();

      // Check for right edge overflow
      if (x + tooltipRect.width > svgRect.width - margin.right) {
        tooltip.style.left = x - tooltipRect.width - 10 + "px";
      } else {
        tooltip.style.left = x + 10 + "px";
      }

      // Check for top/bottom edge overflow
      if (y - tooltipRect.height < margin.top) {
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
        .attr("y1", DEFAULT_MARGIN.top)
        .attr("y2", DEFAULT_HEIGHT - DEFAULT_MARGIN.bottom + 20)
        .style("display", "block");

      hoverLinesGroup.style("display", "block");
    },
    [xScale, filteredDataSet, getYValueAtX, margin]
  );
};

export default useLineChartTooltipToggle;

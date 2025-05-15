import { useCallback } from "react";
import { select, pointer } from "d3";
import { DataPoint, LineChartDataItem } from "../../../types/data";

const useLineChartHighlighItems = (
  onHighlightItem: (labels: string[]) => void,
  svgRef: React.RefObject<SVGSVGElement>,
  tooltipRef: React.RefObject<HTMLDivElement>,
  tooltipFormatter: (point: DataPoint, series: DataPoint[], dataset: LineChartDataItem[]) => string,
  filteredDataSet: LineChartDataItem[]
) =>
  useCallback(
    (labels: string[], event?: MouseEvent, dataPoint?: DataPoint, series?: DataPoint[]) => {
      // Direct DOM manipulation for immediate visual feedback
      const svg = select(svgRef.current);
      if (svg.node() && labels.length > 0) {
        // First fade ALL elements - both lines and points
        svg.selectAll(".data-group").transition().duration(200).style("opacity", 0.05);
        svg
          .selectAll("circle, rect, path.data-point")
          .transition()
          .duration(200)
          .style("opacity", 0.05);

        // Then highlight all elements with the specified labels (except line-overlays)
        labels.forEach(label => {
          svg
            .selectAll(`[data-label="${label}"]:not(.line-overlay)`)
            .transition()
            .duration(200)
            .style("opacity", 1);
          // Explicitly target all shapes by type to ensure nothing is missed
          svg
            .selectAll(
              `circle[data-label="${label}"], rect[data-label="${label}"], path.data-point[data-label="${label}"]`
            )
            .transition()
            .duration(200)
            .style("opacity", 1);
        });

        // Ensure line-overlays are always 0.05 opacity
        svg.selectAll(".line-overlay").transition().duration(200).style("opacity", 0.05);

        // Handle tooltip if event and data are provided
        if (event && dataPoint && series && tooltipRef?.current && svgRef.current) {
          const [mouseX, mouseY] = pointer(event, event.currentTarget as SVGElement);
          const tooltip = tooltipRef.current;
          const svgRect = svgRef.current.getBoundingClientRect();

          const tooltipContent = tooltipFormatter(dataPoint, series, filteredDataSet);
          tooltip.style.visibility = "visible";
          tooltip.innerHTML = tooltipContent;
          const tooltipRect = tooltip.getBoundingClientRect();

          const xPosition = mouseX + 10;
          const yPosition = mouseY - 25;

          // Handle tooltip positioning
          if (xPosition + tooltipRect.width > svgRect.width - 50) {
            tooltip.style.left = `${mouseX - tooltipRect.width - 10}px`;
          } else {
            tooltip.style.left = `${xPosition}px`;
          }

          if (yPosition < 50) {
            tooltip.style.top = `${mouseY + 10}px`;
          } else {
            tooltip.style.top = `${yPosition}px`;
          }
        }
      } else if (svg.node()) {
        // Reset all opacities when no items are highlighted
        svg.selectAll(".data-group").transition().duration(200).style("opacity", 1);
        svg
          .selectAll("circle, rect, path.data-point")
          .transition()
          .duration(200)
          .style("opacity", 1);

        // Ensure line-overlays are always 0.05 opacity
        svg.selectAll(".line-overlay").transition().duration(200).style("opacity", 0.05);

        // Hide tooltip
        if (tooltipRef?.current) {
          tooltipRef.current.style.visibility = "hidden";
        }
      }

      onHighlightItem(labels);

      // Reset hover state after a delay to allow for normal processing later
      clearTimeout(window.hoverResetTimer);
      window.hoverResetTimer = window.setTimeout(() => {
        // setIsHovering(false);
      }, 1000); // 1 second delay to ensure hover state is fully complete
    },
    [onHighlightItem, svgRef, tooltipRef, tooltipFormatter, filteredDataSet]
  );

export default useLineChartHighlighItems;

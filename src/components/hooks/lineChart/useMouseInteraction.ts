import { useCallback } from "react";
import { select } from "d3";

export const useMouseOutHandler = (onHighlightItem, svgRef, tooltipRef) =>
  useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();

      // Directly manage opacity through D3 before clearing highlight
      const svg = select(svgRef.current);
      if (svg.node()) {
        // Reset all groups to full opacity
        svg.selectAll(".data-group").transition().duration(300).style("opacity", 1);
        // Ensure line-overlays are always 0.05 opacity
        svg.selectAll(".line-overlay").transition().duration(300).style("opacity", 0.05);
      }

      // Clear highlight in context
      onHighlightItem([]);

      if (tooltipRef?.current) {
        tooltipRef.current.style.visibility = "hidden";
      }
    },
    [onHighlightItem, svgRef, tooltipRef]
  );

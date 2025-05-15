import { useLayoutEffect } from "react";

const useLineChartMouseInteractionCombinedMode = (
  showCombined,
  width,
  height,
  handleHover,
  handleCombinedMouseOut,
  svgRef
) => {
  useLayoutEffect(() => {
    if (!showCombined || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const hoverLinesGroup = svg.append("g").attr("class", "hover-lines").style("display", "none");

    // Add the hover line to group and use it in callback
    hoverLinesGroup
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
  }, [showCombined, width, height, handleHover, handleCombinedMouseOut, svgRef]);
};

export default useLineChartMouseInteractionCombinedMode;

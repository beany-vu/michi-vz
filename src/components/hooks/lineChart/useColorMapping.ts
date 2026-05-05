import { easeQuadOut, select } from "d3";
import { useLayoutEffect } from "react";

const useLineChartColorMapping = (colorsMapping, getColor, svgRef, TRANSITION_DURATION) => {
  useLayoutEffect(() => {
    const svg = select(svgRef.current);

    // Use for loop instead of forEach for better performance
    for (const key of Object.keys(colorsMapping)) {
      // Update circle/point colors with transitions
      svg
        .selectAll(
          `circle[data-label="${key}"], rect[data-label="${key}"], path.data-point[data-label="${key}"]`
        )
        .transition()
        .duration(TRANSITION_DURATION)
        .ease(easeQuadOut) // Add consistent easing
        .attr("fill", getColor(colorsMapping[key], null));

      // Update path colors with proper selectors and transitions
      svg
        .selectAll(`.line[data-label="${key}"]`)
        .transition()
        .duration(TRANSITION_DURATION)
        .ease(easeQuadOut) // Add consistent easing
        .attr("stroke", getColor(colorsMapping[key], null))
        .attr("stroke-width", 2.5);

      // Update path overlay colors with transitions
      svg
        .selectAll(`.line-overlay[data-label="${key}"]`)
        .transition()
        .duration(TRANSITION_DURATION)
        .ease(easeQuadOut) // Add consistent easing
        .attr("stroke", getColor(colorsMapping[key], null));
    }

    // Cleanup: interrupt any in-flight color transitions on unmount/re-run
    // so they can't continue mutating SVG nodes after React has moved on.
    return () => {
      const node = svgRef.current;
      if (!node) return;
      const cleanupSvg = select(node);
      cleanupSvg.selectAll("*").interrupt();
    };
  }, [colorsMapping]);
};

export default useLineChartColorMapping;

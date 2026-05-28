import { easeQuadOut, select } from "d3";
import React, { useLayoutEffect, useRef } from "react";

// Above this many colour changes in a single pass, skip the per-node tween:
// N simultaneous 100ms transitions is itself a jank source, so set the
// colours directly instead.
const COLOR_TWEEN_MAX_KEYS = 200;

const useLineChartColorMapping = (
  colorsMapping: Record<string, string>,
  getColor: (color?: string, fallback?: string) => string,
  svgRef: React.RefObject<SVGSVGElement | null>,
  TRANSITION_DURATION: number
) => {
  // Colours this hook last applied. Lets an unchanged colorsMapping (new object
  // identity but identical values — common with Redux / inline-object props)
  // skip re-running 100ms transitions on every series.
  const appliedRef = useRef<Record<string, string>>({});

  useLayoutEffect(() => {
    // Cleanup: interrupt any in-flight color transitions on unmount/re-run
    // so they can't continue mutating SVG nodes after React has moved on.
    const cleanup = () => {
      const node = svgRef.current;
      if (node) select(node).selectAll("*").interrupt();
    };

    const svg = select(svgRef.current);
    if (!svg.node()) return cleanup;

    // Only the keys whose resolved colour actually changed since the last apply.
    const changed: Array<[string, string]> = [];
    for (const key of Object.keys(colorsMapping)) {
      const color = getColor(colorsMapping[key], undefined);
      if (color !== appliedRef.current[key]) changed.push([key, color]);
    }

    if (changed.length > 0) {
      const animate = changed.length <= COLOR_TWEEN_MAX_KEYS;

      for (const [key, color] of changed) {
        appliedRef.current[key] = color;

        const points = svg.selectAll(
          `circle[data-label="${key}"], rect[data-label="${key}"], path.data-point[data-label="${key}"]`
        );
        const lines = svg.selectAll(`.line[data-label="${key}"]`);
        const overlays = svg.selectAll(`.line-overlay[data-label="${key}"]`);

        if (animate) {
          points.transition().duration(TRANSITION_DURATION).ease(easeQuadOut).attr("fill", color);
          lines
            .transition()
            .duration(TRANSITION_DURATION)
            .ease(easeQuadOut)
            .attr("stroke", color)
            .attr("stroke-width", 2.5);
          overlays
            .transition()
            .duration(TRANSITION_DURATION)
            .ease(easeQuadOut)
            .attr("stroke", color);
        } else {
          points.attr("fill", color);
          lines.attr("stroke", color).attr("stroke-width", 2.5);
          overlays.attr("stroke", color);
        }
      }
    }

    return cleanup;
  }, [colorsMapping]);
};

export default useLineChartColorMapping;

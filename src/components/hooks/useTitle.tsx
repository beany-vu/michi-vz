import * as d3 from "d3";
import { useEffect } from "react";

export default (node: SVGElement, text: string, x: number, y: number) => {
  console.log("useTitle", node, text, x, y);
  useEffect(() => {
    if (node) {
      const svgSelection = d3.select(node);

      console.log("svgSelection", svgSelection);
      // Remove existing title text element if it exists
      const existingTitle = svgSelection.select(".title-text");
      if (!existingTitle.empty()) {
        existingTitle.remove();
      }

      // Append the new title text
      svgSelection
        .append("text")
        .attr("x", x)
        .attr("y", y)
        .attr("text-anchor", "middle")
        .attr("class", "title-text") // Assign the class
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .text(text);
    }
  }, [node, text, x, y]);
};

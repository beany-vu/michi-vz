import * as d3 from "d3";
import {select} from "d3-selection";
import {ScaleLinear, ScaleBand} from "d3-scale";
import {Margin} from "src/types/data";
import {useEffect} from "react";

export default (
    height: number,
    width: number,
    yScale: ScaleLinear<number, number>,
    xScale: ScaleLinear<number, number> | ScaleBand<number>,
    MARGIN: Margin, node: SVGSVGElement
) => {
    // Y-axis with grid lines
    const {bottom = 0, left = 0, right = 0} = MARGIN;
    useEffect(() => {
        if (node) {
            const svgSelection = select(node);

            // Remove existing title text element if it exists
            svgSelection.selectAll(".y-axis").remove();
            svgSelection.selectAll(".tickValueDot").remove();
            svgSelection.selectAll(".y-axis-grid").remove();
            svgSelection.append("g")
                .attr("class", "y-axis")
                .attr("transform", "translate(" + left + ",0)")
                .call(d3.axisLeft(yScale)
                    .tickSize(0)  // This removes the ticks
                    .tickPadding(10)) // This provides some spacing between the tick labels and the grid lines


            svgSelection.selectAll(".tickValueDot")
                // .data(xScale.ticks(numUniqueYears))
                .enter()
                .append("circle")
                .attr("class", "tickValueDot")
                .attr("cx", (d: number) => xScale(d))
                .attr("cy", height - bottom + 5)  // 10 units above the x-axis. Adjust as needed.
                .attr("r", 2)  // Radius of the circle
                .attr("fill", "lightgray");  // Color of the circle

            // Highlighting the y=0 line
            svgSelection.append("line")
                .attr("class", "y-axis-grid")
                .attr("x1", left)
                .attr("x2", width - right)
                .attr("y1", yScale(0))
                .attr("y2", yScale(0))
                .attr("stroke", "black")
                .attr("stroke-width", 1.5)
                .attr("stroke-opacity", 0.7);
        }
    }, [height, width, yScale, xScale, MARGIN, node]);
}
import { useCallback, useEffect, useLayoutEffect } from "react";
import { pointer, select, ScaleLinear, ScaleTime } from "d3";
import { DataPoint, LineChartDataItem } from "../../../types/data";

const useLineChartPathsShapesRendering = (
  filteredDataSet: LineChartDataItem[],
  visibleDataSets: LineChartDataItem[],
  width: number,
  height: number,
  margin: { top: number; right: number; bottom: number; left: number },
  xAxisDataType: string,
  getDashArrayMemoized: (
    series: DataPoint[],
    pathNode: SVGPathElement,
    xScale: ScaleLinear<number, number> | ScaleTime<number, number>
  ) => string,
  colors: string[],
  colorsMapping: { [key: string]: string },
  line: (options: { d: DataPoint[]; curve: string }) => string,
  xScale: ScaleLinear<number, number> | ScaleTime<number, number>,
  yScale: ScaleLinear<number, number>,
  handleItemHighlight: (labels: string[]) => void,
  tooltipFormatter: (point: DataPoint, series: DataPoint[], dataset: LineChartDataItem[]) => string,
  tooltipRef: React.RefObject<HTMLDivElement>,
  svgRef: React.RefObject<SVGSVGElement>,
  getColor: (color: string | undefined, fallback: string | null) => string,
  sanitizeForClassName: (str: string) => string,
  highlightItems: string[],
  onHighlightItem?: (labels: string[]) => void
) => {
  const handleMouseEnter = useCallback(
    (
      event: React.MouseEvent | null,
      svgRef: React.RefObject<SVGSVGElement>,
      groupSelector: string,
      opacityUnhighlighted: number,
      opacityHighlighted: number,
      highlightItems: string[] = []
    ) => {
      const svg = select(svgRef.current);

      if (!svg.node()) return;

      const dataLabel = event ? (event.currentTarget as SVGElement).dataset.label : null;

      if (dataLabel) {
        svg.selectAll(`${groupSelector}`).style("opacity", `${opacityUnhighlighted}`);
        svg
          .selectAll(`${groupSelector}[data-label="${CSS.escape(dataLabel)}"]`)
          .style("opacity", opacityHighlighted);
        return;
      }

      if (highlightItems.length > 0) {
        console.log("Setting all items to opacity", opacityUnhighlighted);
        const allGroups = svg.selectAll(`${groupSelector}`);
        console.log("Found groups:", allGroups.size());
        allGroups.style("opacity", `${opacityUnhighlighted}`);

        highlightItems.forEach(item => {
          console.log("Highlighting item:", item);
          const highlightedGroups = svg.selectAll(
            `${groupSelector}[data-label="${CSS.escape(item)}"]`
          );
          console.log("Found highlighted groups for", item, ":", highlightedGroups.size());
          highlightedGroups.style("opacity", opacityHighlighted);
        });
      } else {
        console.log("Resetting all to opacity", opacityHighlighted);
        svg.selectAll(`${groupSelector}`).style("opacity", `${opacityHighlighted}`);
      }

      handleItemHighlight([dataLabel]);
    },
    [handleItemHighlight, svgRef]
  );

  const handleMouseOut = useCallback(
    (svgRef: React.RefObject<SVGSVGElement>) => {
      const svg = select(svgRef.current);
      if (!svg.node()) return;

      // Reset opacity for all elements to ensure proper visibility
      svg.selectAll(".data-group").style("opacity", 1);
      svg.selectAll(".series-group").style("opacity", 1);
      svg.selectAll(".line").style("opacity", 1);
      svg.selectAll(".data-point").style("opacity", 1);

      handleItemHighlight([]);
      if (tooltipRef.current) {
        tooltipRef.current.style.visibility = "hidden";
      }
    },
    [handleItemHighlight, tooltipRef]
  );

  useLayoutEffect(() => {
    console.log("LineChart highlightItems changed:", highlightItems);
    // Only apply highlighting when there are items to highlight
    if (highlightItems.length > 0) {
      console.log("Applying highlighting to:", highlightItems);
      handleMouseEnter(null, svgRef, "g.data-group", 0.05, 1, highlightItems);
      if (onHighlightItem) {
        onHighlightItem(highlightItems);
      }
    } else {
      console.log("Resetting all highlighting");
      // Reset all items to fully visible when nothing is highlighted
      const svg = select(svgRef.current);
      if (svg.node()) {
        svg.selectAll("g.data-group").style("opacity", 1);
      }
    }
  }, [highlightItems, visibleDataSets]);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = select(svgRef.current);

    // IMPORTANT: Clear everything and redraw from scratch on every render
    // This ensures we don't have any stale elements lingering around
    // when the filter changes
    svg.selectAll(".data-point, .line, .line-overlay, .series-group, .data-group").remove();

    // Now draw all elements for each series inside a <g>
    for (let i = 0; i < visibleDataSets.length; i++) {
      const data = visibleDataSets[i];
      const shape = data.shape || "circle";
      const circleSize = 5;
      const squareSize = 6;
      const triangleSize = 16;
      const color = getColor(colorsMapping[data.label], data.color);
      const safeLabelClass = sanitizeForClassName(data.label);
      const uniqueKey = `${data.label}__${i}`;

      // Use a composite key that includes both dataset label and point date to ensure uniqueness
      const pointKeyFn = (d: DataPoint) => `${uniqueKey}-${d.date}`;

      // --- GROUP ---
      // Always create a new group since we cleared all groups above
      const group = svg
        .append("g")
        .attr("class", `data-group series-group series-group-${i} series-group-${safeLabelClass}`)
        .attr("data-label", data.label)
        .attr("data-label-safe", safeLabelClass)
        .attr("data-key", uniqueKey);

      // --- LINE ---
      // No need to clear since we're creating a fresh group

      // Create new line path with updated data
      const linePath = group
        .append("path")
        .attr("class", `line line-${i} data-group data-group-${i}`);

      linePath
        .attr("data-label", data.label)
        .attr("data-label-safe", safeLabelClass)
        .attr("data-key", uniqueKey)
        .attr("d", line({ d: data.series, curve: data?.curve ?? "curveBumpX" }))
        .attr("stroke-width", 2.5)
        .attr("pointer-events", "none")
        .attr("stroke", color)
        .attr("fill", "none")
        .each(function () {
          const pathNode = this as SVGPathElement;
          const dashArray = getDashArrayMemoized(data.series, pathNode, xScale);
          select(this).attr("stroke-dasharray", dashArray);
        });

      // --- LINE OVERLAY ---
      const overlayPath = group
        .append("path")
        .attr(
          "class",
          `line-overlay line-overlay-${i} data-group-overlay data-group-${i} data-group data-group-overlay-${safeLabelClass} line-group-overlay-${safeLabelClass}`
        );

      overlayPath
        .attr("data-label", data.label)
        .attr("data-label-safe", safeLabelClass)
        .attr("data-key", uniqueKey)
        .attr("d", line({ d: data.series, curve: data?.curve ?? "curveBumpX" }))
        .attr("stroke", color)
        .attr("stroke-width", 6)
        .attr("fill", "none")
        .attr("pointer-events", "stroke")
        .style("opacity", 0.05)
        .on("mouseenter", event => {
          handleMouseEnter(event, svgRef, "g.data-group", 0.05, 1, highlightItems);
        })
        .on("mouseout", () => handleMouseOut(svgRef));

      // --- POINTS ---
      // Update and enter points
      const points = group.selectAll(`.data-point`).data(data.series, pointKeyFn);

      // Handle the exit selection - remove points that no longer exist in the data
      points.exit().remove();

      if (shape === "circle") {
        points
          .attr("cx", d => xScale(new Date(d.date)))
          .attr("cy", d => yScale(d.value))
          .attr("fill", color);
        points
          .enter()
          .append("circle")
          .attr("class", `data-point data-point-${safeLabelClass} data-point-${i}`)
          .attr("data-label", data.label)
          .attr("data-label-safe", safeLabelClass)
          .attr("data-key", uniqueKey)
          .attr("cx", d => xScale(new Date(d.date)))
          .attr("cy", d => yScale(d.value))
          .attr("r", circleSize)
          .attr("fill", color)
          .attr("stroke", "#fdfdfd")
          .attr("stroke-width", 2)
          .attr("cursor", "crosshair");
      } else if (shape === "square") {
        points
          .attr("x", d => xScale(new Date(d.date)) - squareSize)
          .attr("y", d => yScale(d.value) - squareSize)
          .attr("fill", color);
        points
          .enter()
          .append("rect")
          .attr("class", `data-point data-point-${safeLabelClass} data-point-${i}`)
          .attr("data-label", data.label)
          .attr("data-label-safe", safeLabelClass)
          .attr("data-key", uniqueKey)
          .attr("x", d => xScale(new Date(d.date)) - squareSize)
          .attr("y", d => yScale(d.value) - squareSize)
          .attr("width", squareSize * 2)
          .attr("height", squareSize * 2)
          .attr("fill", color)
          .attr("stroke", "#fdfdfd")
          .attr("stroke-width", 2)
          .attr("cursor", "crosshair");
      } else if (shape === "triangle") {
        const generateTrianglePath = (x: number, y: number, size: number = triangleSize) => {
          const height = (size * Math.sqrt(3)) / 2;
          return `M ${x} ${y - height * 0.7} L ${x + size / 2} ${y + height * 0.3} L ${x - size / 2} ${y + height * 0.3} Z`;
        };
        points
          .attr("d", d => {
            const x = xScale(new Date(d.date));
            const y = yScale(d.value);
            return generateTrianglePath(x, y);
          })
          .attr("fill", color);
        points
          .enter()
          .append("path")
          .attr("class", `data-point data-point-${safeLabelClass} data-point-${i}`)
          .attr("data-label", data.label)
          .attr("data-label-safe", safeLabelClass)
          .attr("data-key", uniqueKey)
          .attr("d", d => {
            const x = xScale(new Date(d.date));
            const y = yScale(d.value);
            return generateTrianglePath(x, y);
          })
          .attr("fill", color)
          .attr("stroke", "#fdfdfd")
          .attr("stroke-width", 2)
          .attr("cursor", "crosshair");
      }

      // Add event listeners to all data points after they've been created or updated
      group
        .selectAll(`.data-point`)
        .on("mouseenter", (event, d: DataPoint) => {
          handleMouseEnter(event, svgRef, "g.data-group", 0.05, 1, highlightItems);

          const tooltipContent = tooltipFormatter(
            {
              ...d,
              label: data.label,
            } as DataPoint,
            data.series,
            filteredDataSet
          );

          if (tooltipRef?.current && svgRef.current) {
            const [mouseX, mouseY] = pointer(event, event.currentTarget);
            const svgRect = svgRef.current.getBoundingClientRect();
            const tooltip = tooltipRef.current;

            tooltip.style.visibility = "visible";
            tooltip.innerHTML = tooltipContent;
            const tooltipRect = tooltip.getBoundingClientRect();

            const xPosition = mouseX + 10;
            const yPosition = mouseY - 25;

            if (xPosition + tooltipRect.width > svgRect.width - margin.right) {
              tooltip.style.left = `${mouseX - tooltipRect.width - 10}px`;
            } else {
              tooltip.style.left = `${xPosition}px`;
            }

            if (yPosition < margin.top) {
              tooltip.style.top = `${mouseY + 10}px`;
            } else {
              tooltip.style.top = `${yPosition}px`;
            }
          }
        })
        .on("mouseout", () => {
          handleMouseOut(svgRef);
        });
    }

    // Apply highlighting AFTER rendering is complete
    if (highlightItems.length > 0) {
      console.log("Applying highlighting after render to:", highlightItems);

      // Set all groups to low opacity
      svg.selectAll("g.data-group").style("opacity", 0.05);

      // Set highlighted groups to full opacity
      highlightItems.forEach(item => {
        svg.selectAll(`g.data-group[data-label="${CSS.escape(item)}"]`).style("opacity", 1);
      });
    } else {
      // Reset all groups to full opacity
      svg.selectAll("g.data-group").style("opacity", 1);
    }
  }, [
    filteredDataSet,
    visibleDataSets,
    width,
    height,
    margin,
    xAxisDataType,
    xScale,
    yScale,
    colorsMapping,
    getColor,
    sanitizeForClassName,
    highlightItems,
    handleItemHighlight,
    tooltipFormatter,
  ]);
};

export default useLineChartPathsShapesRendering;

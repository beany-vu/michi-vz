import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { pointer, select, ScaleLinear, ScaleTime } from "d3";
import { DataPoint, LineChartDataItem } from "src/types/data";
import { OPACITY_DEFAULT, OPACITY_NOT_HIGHLIGHTED } from "src/components/LineChart";

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
  onHighlightItem?: (labels: string[]) => void,
  onColorMappingGenerated?: (colorsMapping: { [key: string]: string }) => void
) => {
  // Use state instead of ref for color mapping to ensure re-renders
  const [internalColorsMapping, setInternalColorsMapping] = useState<{ [key: string]: string }>({});
  const colorsIndex = useRef(0);
  const filteredDataSetLabels = useMemo(() => {
    return visibleDataSets.map(d => d.label);
  }, [visibleDataSets]);

  useEffect(() => {
    const newColorsMapping = { ...internalColorsMapping };
    let hasChanges = false;
    for (const label of filteredDataSetLabels) {
      if (!newColorsMapping[label]) {
        hasChanges = true;
        if (colorsMapping[label]) {
          newColorsMapping[label] = colorsMapping[label];
        } else {
          newColorsMapping[label] = colors[colorsIndex.current];
          colorsIndex.current = (colorsIndex.current + 1) % colors.length;
        }
      }
    }
    if (hasChanges) {
      setInternalColorsMapping(newColorsMapping);
      if (onColorMappingGenerated) {
        onColorMappingGenerated(newColorsMapping);
      }
    }
    // Important: Do NOT include highlightItems in dependencies
  }, [
    colors,
    filteredDataSetLabels,
    colorsMapping,
    setInternalColorsMapping,
    onColorMappingGenerated,
  ]);

  // Memoize colors to ensure they don't change when only highlighting changes
  const memoizedColors = useMemo(() => {
    return { ...internalColorsMapping };
  }, [internalColorsMapping]);

  const handleMouseEnter = useCallback(
    (
      event: React.MouseEvent,
      svgRef: React.RefObject<SVGSVGElement>,
      groupSelector: string,
      opacityUnhighlighted: number,
      opacityHighlighted: number,
      highlightItems: string[] = []
    ) => {
      const svg = select(svgRef.current);
      if (!svg.node()) return;

      const dataLabel = event ? (event.currentTarget as SVGElement).dataset.label : null;

      // First set all items to faded state
      svg.selectAll(`${groupSelector}`).style("opacity", opacityUnhighlighted);

      if (dataLabel) {
        // Highlight the hovered item
        svg
          .selectAll(`${groupSelector}[data-label="${dataLabel}"]`)
          .style("opacity", opacityHighlighted)
          .raise();
      } else if (highlightItems.length > 0) {
        // Highlight items from the highlightItems array
        highlightItems.forEach(item => {
          svg
            .selectAll(`${groupSelector}[data-label="${item}"]`)
            .style("opacity", opacityHighlighted)
            .raise();
        });
      } else {
        // If no highlighting, set all to default opacity
        svg.selectAll(`${groupSelector}`).style("opacity", OPACITY_DEFAULT);
      }

      if (dataLabel) {
        handleItemHighlight([dataLabel]);
      }
    },
    [handleItemHighlight]
  );

  const handleMouseOut = useCallback(
    svgRef => {
      const svg = select(svgRef.current);
      if (!svg.node()) return;

      // Reset opacity for all group elements to ensure proper visibility
      svg.selectAll("g.data-group-wrapper").style("opacity", OPACITY_DEFAULT);

      handleItemHighlight([]);
      if (tooltipRef.current) {
        tooltipRef.current.style.visibility = "hidden";
      }
    },
    [handleItemHighlight, tooltipRef]
  );

  useEffect(() => {
    const svg = select(svgRef.current);
    if (!svg.node()) return;

    if (highlightItems.length > 0) {
      // First set ALL items to faded state
      svg.selectAll("g.data-group-wrapper").style("opacity", OPACITY_NOT_HIGHLIGHTED);

      // Then highlight only the selected items
      highlightItems.forEach(item => {
        // Use more specific selector to ensure we get all elements with this label
        svg
          .selectAll(`g.data-group-wrapper[data-label="${item}"]`)
          .style("opacity", OPACITY_DEFAULT)
          .raise(); // Bring highlighted items to front
      });

      if (onHighlightItem) {
        onHighlightItem(highlightItems);
      }
    } else {
      // Reset all items to default opacity when no highlighting
      svg.selectAll("g.data-group-wrapper").style("opacity", OPACITY_DEFAULT);
    }
  }, [highlightItems, onHighlightItem]);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = select(svgRef.current);

    // IMPORTANT: Clear everything and redraw from scratch on every render
    // This ensures we don't have any stale elements lingering around
    // when the filter changes
    svg.selectAll("g.data-group-wrapper").remove();

    // Now draw all elements for each series inside a <g>
    for (let i = 0; i < visibleDataSets.length; i++) {
      const data = visibleDataSets[i];
      const shape = data.shape || "circle";
      const circleSize = 5;
      const squareSize = 6;
      const triangleSize = 16;
      const color = memoizedColors[data.label]; // Use memoized colors instead of direct lookup
      const safeLabelClass = sanitizeForClassName(data.label);
      const uniqueKey = `${data.label}__${i}`;

      // Use a composite key that includes both dataset label and point date to ensure uniqueness
      const pointKeyFn = (d: DataPoint) => `${uniqueKey}-${d.date}`;

      // --- GROUP ---
      // Select or create a <g> for this series
      let group = svg.select(`g.series-group[data-key='${uniqueKey}']`);
      if (group.empty()) {
        group = svg
          .append("g")
          .attr(
            "class",
            `data-group-wrapper series-group series-group-${i} series-group-${safeLabelClass}`
          )
          .attr("data-label", data.label)
          .attr("data-label-safe", safeLabelClass)
          .attr("data-key", uniqueKey)
          .attr(
            "opacity",
            highlightItems.includes(data.label) || highlightItems.length === 0
              ? OPACITY_DEFAULT
              : OPACITY_NOT_HIGHLIGHTED
          );
      }

      // --- LINE ---
      // Clear old paths first if they exist to ensure proper redrawing
      group.selectAll(".line").remove();
      group.selectAll(".line-overlay").remove();

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
          handleMouseEnter(event, svgRef, "g.data-group-wrapper", 0.05, 1);
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
          handleMouseEnter(event, svgRef, "g.data-group-wrapper", 0.05, 1);

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
  }, [
    filteredDataSet,
    visibleDataSets,
    width,
    height,
    margin,
    xAxisDataType,
    getDashArrayMemoized,
    line,
    xScale,
    yScale,
    handleItemHighlight,
    tooltipFormatter,
    getColor,
    sanitizeForClassName,
    onHighlightItem,
    memoizedColors,
    highlightItems,
  ]);
};

export default useLineChartPathsShapesRendering;

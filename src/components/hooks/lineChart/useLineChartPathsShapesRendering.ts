import { useCallback, useEffect } from "react";
import { pointer, select, ScaleLinear, ScaleTime, easeQuadOut } from "d3";
import { DataPoint, LineChartDataItem } from "src/types/data";

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
  TRANSITION_DURATION: number,
  TRANSITION_EASE: typeof easeQuadOut
) => {
  const handleMouseEnter = useCallback(
    (
      event: React.MouseEvent,
      svgRef: React.RefObject<SVGSVGElement>,
      groupSelector: string,
      opacityUnhighlighted: number,
      opacityHighlighted: number
    ) => {
      const svg = select(svgRef.current);

      if (!svg.node()) return;

      const dataLabel = (event.currentTarget as SVGElement).dataset.label;

      svg.selectAll(groupSelector).style("opacity", opacityUnhighlighted);
      svg.selectAll(`[data-label="${dataLabel}"]`).style("opacity", opacityHighlighted);

      handleItemHighlight([dataLabel]);
    },
    [handleItemHighlight]
  );

  const handleMouseOut = useCallback(
    svgRef => {
      const svg = select(svgRef.current);
      if (!svg.node()) return;
      svg.selectAll(".data-group").style("opacity", 1);
      handleItemHighlight([]);
    },
    [handleItemHighlight]
  );

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = select(svgRef.current);

    // Instead of removing all lines, use D3 update pattern
    // Create a key function that uniquely identifies each dataset
    const keyFn = (d: LineChartDataItem) => d.label;

    // Line paths - main paths
    const linePaths = svg.selectAll(".line").data(visibleDataSets, keyFn);

    // Update - update existing lines
    linePaths
      .attr("d", d =>
        line({
          d: d.series,
          curve: d?.curve ?? "curveBumpX",
        })
      )
      .each(function (d) {
        const pathNode = this as SVGPathElement;
        const dashArray = getDashArrayMemoized(d.series, pathNode, xScale);
        select(this).attr("stroke-dasharray", dashArray);
      });

    // Enter - add new lines
    linePaths
      .enter()
      .append("path")
      .attr("class", (d, i) => `line line-${i} data-group data-group-${i}`)
      .attr("data-label", d => d.label)
      .attr("data-label-safe", d => sanitizeForClassName(d.label))
      .attr("d", d =>
        line({
          d: d.series,
          curve: d?.curve ?? "curveBumpX",
        })
      )
      .attr("stroke-width", 2.5)
      .attr("pointer-events", "none")
      .each(function (d) {
        const pathNode = this as SVGPathElement;
        const dashArray = getDashArrayMemoized(d.series, pathNode, xScale);
        select(this).attr("stroke-dasharray", dashArray);
      })
      .attr("stroke", d => getColor(colorsMapping[d.label], d.color))
      .attr("fill", "none")
      .attr("opacity", 1);

    // Remove old lines
    linePaths.exit().remove();

    // Line overlays - handle similarly
    const lineOverlays = svg.selectAll(".line-overlay").data(visibleDataSets, keyFn);

    // Update - update existing overlays
    lineOverlays.attr("d", d =>
      line({
        d: d.series,
        curve: d?.curve ?? "curveBumpX",
      })
    );

    // Enter - add new overlays
    lineOverlays
      .enter()
      .append("path")
      .attr("class", (d, i) => {
        const safeLabelClass = sanitizeForClassName(d.label);
        return `line-overlay line-overlay-${i} data-group data-group-overlay data-group-${i} data-group-overlay-${safeLabelClass} line-group-overlay-${safeLabelClass}`;
      })
      .attr("data-label", d => d.label)
      .attr("data-label-safe", d => sanitizeForClassName(d.label))
      .attr("d", d =>
        line({
          d: d.series,
          curve: d?.curve ?? "curveBumpX",
        })
      )
      .attr("stroke", d => getColor(colorsMapping[d.label], d.color))
      .attr("stroke-width", 6)
      .attr("fill", "none")
      .attr("pointer-events", "stroke")
      .style("opacity", 0.05);

    // Add event handlers to both new and existing overlays
    svg
      .selectAll(".line-overlay")
      .on("mouseenter", event => {
        handleMouseEnter(event, svgRef, ".data-group", 0.05, 1);
      })
      .on("mouseout", () => handleMouseOut(svgRef));

    // Remove old overlays
    lineOverlays.exit().remove();

    // First remove any existing data points that don't belong to currently filtered datasets
    svg
      .selectAll(".data-group:not(.line):not(.line-overlay)")
      .filter(function () {
        const dataLabel = (this as SVGElement).getAttribute("data-label");
        return !visibleDataSets.some(d => d.label === dataLabel);
      })
      .remove();

    // Now draw all elements for each series inside a <g>
    for (let i = 0; i < visibleDataSets.length; i++) {
      const data = visibleDataSets[i];
      const shape = data.shape || "circle";
      const circleSize = 5;
      const squareSize = 6;
      const triangleSize = 16;
      const color = getColor(colorsMapping[data.label], data.color);
      const safeLabelClass = sanitizeForClassName(data.label);

      // Use a composite key that includes both dataset label and point date to ensure uniqueness
      const pointKeyFn = (d: DataPoint) => `${data.label}-${d.date}`;

      // --- GROUP ---
      // Select or create a <g> for this series
      let group = svg.select(`g.series-group[data-label='${data.label}']`);
      if (group.empty()) {
        group = svg
          .append("g")
          .attr("class", `data-group series-group series-group-${i} series-group-${safeLabelClass}`)
          .attr("data-label", data.label)
          .attr("data-label-safe", safeLabelClass);
      }

      // --- LINE ---
      let linePath = group.select(".line");
      if (linePath.empty()) {
        linePath = group.append("path").attr("class", `line line-${i} data-group data-group-${i}`);
      }
      linePath
        .attr("data-label", data.label)
        .attr("data-label-safe", safeLabelClass)
        .attr("d", line({ d: data.series, curve: data?.curve ?? "curveBumpX" }))
        .attr("stroke-width", 2.5)
        .attr("pointer-events", "none")
        .attr("stroke", color)
        .attr("fill", "none")
        .attr("opacity", 1)
        .each(function () {
          const pathNode = this as SVGPathElement;
          const dashArray = getDashArrayMemoized(data.series, pathNode, xScale);
          select(this).attr("stroke-dasharray", dashArray);
        });

      // --- LINE OVERLAY ---
      let overlayPath = group.select(".line-overlay");
      if (overlayPath.empty()) {
        overlayPath = group
          .append("path")
          .attr(
            "class",
            `line-overlay line-overlay-${i} data-group-overlay data-group-${i} data-group data-group-overlay-${safeLabelClass} line-group-overlay-${safeLabelClass}`
          );
      }
      overlayPath
        .attr("data-label", data.label)
        .attr("data-label-safe", safeLabelClass)
        .attr("d", line({ d: data.series, curve: data?.curve ?? "curveBumpX" }))
        .attr("stroke", color)
        .attr("stroke-width", 6)
        .attr("fill", "none")
        .attr("pointer-events", "stroke")
        .style("opacity", 0.05)
        .on("mouseenter", event => {
          handleMouseEnter(event, svgRef, ".data-group", 0.05, 1);
        })
        .on("mouseout", () => handleMouseOut(svgRef));

      // --- POINTS ---
      // Remove old points
      group.selectAll(".data-point").data(data.series, pointKeyFn).exit().remove();

      // Update and enter points
      const points = group.selectAll(`.data-point`).data(data.series, pointKeyFn);
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
          .attr("cx", d => xScale(new Date(d.date)))
          .attr("cy", d => yScale(d.value))
          .attr("r", circleSize)
          .attr("fill", color)
          .attr("stroke", "#fdfdfd")
          .attr("stroke-width", 2)
          .attr("cursor", "crosshair")
          .style("opacity", 1);
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
          .attr("x", d => xScale(new Date(d.date)) - squareSize)
          .attr("y", d => yScale(d.value) - squareSize)
          .attr("width", squareSize * 2)
          .attr("height", squareSize * 2)
          .attr("fill", color)
          .attr("stroke", "#fdfdfd")
          .attr("stroke-width", 2)
          .attr("cursor", "crosshair")
          .style("opacity", 1);
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
          .attr("d", d => {
            const x = xScale(new Date(d.date));
            const y = yScale(d.value);
            return generateTrianglePath(x, y);
          })
          .attr("fill", color)
          .attr("stroke", "#fdfdfd")
          .attr("stroke-width", 2)
          .attr("cursor", "crosshair")
          .style("opacity", 1);
      }

      // Add event listeners to all data points after they've been created or updated
      group
        .selectAll(`.data-point`)
        .on("mouseenter", (event, d: DataPoint) => {
          handleMouseEnter(event, svgRef, ".data-group", 0.05, 1);

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
    colorsMapping,
    line,
    xScale,
    yScale,
    handleItemHighlight,
    tooltipFormatter,
    tooltipRef,
    svgRef,
    getColor,
    sanitizeForClassName,
    TRANSITION_DURATION,
    TRANSITION_EASE,
  ]);
};

export default useLineChartPathsShapesRendering;

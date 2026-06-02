import { useCallback, useEffect, useLayoutEffect, useState, useRef } from "react";
import { pointer, select, ScaleLinear, ScaleTime } from "d3";
import DOMPurify from "dompurify";
import { DataPoint, LineChartDataItem } from "../../../types/data";
import type { SeriesRun } from "./useLineChartGeometry";
import { resolveCurveName } from "../../../utils/curve";

// Stroke dash pattern for "uncertain" runs (segments where the previous period's
// data point is missing). Certain runs use no dash array. Exported so the
// single-point guide line in LineChart can default to the same look.
export const UNCERTAIN_DASH_PATTERN = "4,4";

// Resolved style for the single-point guide line. `stroke` is optional — when
// omitted the renderer falls back to the series' own color. `strokeWidth` and
// `strokeDasharray` are always present (LineChart fills defaults).
export interface SinglePointLineStyle {
  stroke?: string;
  strokeWidth: number;
  strokeDasharray: string;
}

interface TooltipState {
  x?: number;
  y?: number;
  data?: DataPoint;
  isSticky?: boolean;
  isVisible?: boolean;
}

// Convert a data point's x-value to a comparable number for the given axis type.
const toComparableX = (d: DataPoint, xAxisDataType: string): number =>
  xAxisDataType === "number" ? Number(d.date) : +new Date(d.date);

// Nearest data point (by x) to a pixel x-position — drives the no-dots
// bisection tooltip. Module-scope so it is not re-created per group per render.
const findNearestPoint = (
  series: DataPoint[],
  mouseX: number,
  xScale: ScaleLinear<number, number> | ScaleTime<number, number>,
  xAxisDataType: string
): DataPoint => {
  const xValue = xScale.invert(mouseX);
  const target = xAxisDataType === "number" ? Number(xValue) : +new Date(xValue as Date);
  return series.reduce(
    (best, d) =>
      Math.abs(toComparableX(d, xAxisDataType) - target) <
      Math.abs(toComparableX(best, xAxisDataType) - target)
        ? d
        : best,
    series[0]
  );
};

const useLineChartPathsShapesRendering = (
  filteredDataSet: LineChartDataItem[],
  visibleDataSets: LineChartDataItem[],
  width: number,
  height: number,
  margin: { top: number; right: number; bottom: number; left: number },
  xAxisDataType: string,
  // getRuns splits a series into contiguous runs of same certainty (see useLineChartGeometry).
  // Each run renders as a separate <path> with a constant stroke-dasharray, replacing the
  // older approach that called pathNode.getTotalLength() / getPointAtLength() per data point —
  // those are layout-blocking SVG calls and dominated render cost on monthly data.
  getRuns: (series: DataPoint[]) => SeriesRun[],
  colors: string[],
  colorsMapping: { [key: string]: string },
  line: (options: { d: Iterable<DataPoint>; curve: string }) => string | null,
  xScale: ScaleLinear<number, number> | ScaleTime<number, number>,
  yScale: ScaleLinear<number, number>,
  handleItemHighlight: (labels: string[]) => void,
  tooltipFormatter: (point: DataPoint, series: DataPoint[], dataset: LineChartDataItem[]) => string,
  tooltipRef: React.RefObject<HTMLDivElement | null>,
  svgRef: React.RefObject<SVGSVGElement | null>,
  getColor: (color?: string, fallback?: string) => string,
  sanitizeForClassName: (str: string) => string,
  highlightItems: string[],
  onHighlightItem?: (labels: string[]) => void,
  showDataPoints: boolean = false,
  // When "canvas", the SVG line/point rendering is skipped — the Canvas
  // renderer owns the drawing. Default "svg" keeps the original behaviour.
  renderer: "svg" | "canvas" = "svg",
  // Resolved single-point guide-line style, or null when the feature is off.
  singlePointLine: SinglePointLineStyle | null = null
) => {
  const [tooltipState, setTooltipState] = useState<TooltipState | null>(null);

  // Use ref to capture latest tooltipFormatter to avoid stale closure issues
  const tooltipFormatterRef = useRef(tooltipFormatter);
  tooltipFormatterRef.current = tooltipFormatter;

  // Grace-period timer for the bisection tooltip in no-dots mode.
  // Lets the user travel from line to tooltip without the tooltip vanishing.
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isStickyRef = useRef(false);
  isStickyRef.current = !!tooltipState?.isSticky;
  const clearHideTimer = () => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  };
  const scheduleHide = () => {
    clearHideTimer();
    hideTimerRef.current = setTimeout(() => {
      hideTimerRef.current = null;
      if (!isStickyRef.current && tooltipRef.current) {
        tooltipRef.current.style.visibility = "hidden";
      }
    }, 400);
  };

  const handleMouseEnter = useCallback(
    (
      event: React.MouseEvent | null,
      svgRef: React.RefObject<SVGSVGElement | null>,
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

        // Emit highlight changes only for explicit hovered labels. This avoids
        // feeding `[null]` back into parent state during prop-driven dimming.
        handleItemHighlight([dataLabel]);
        return;
      }

      if (highlightItems.length > 0) {
        const allGroups = svg.selectAll(`${groupSelector}`);
        allGroups.style("opacity", `${opacityUnhighlighted}`);

        highlightItems.forEach(item => {
          const highlightedGroups = svg.selectAll(
            `${groupSelector}[data-label="${CSS.escape(item)}"]`
          );
          highlightedGroups.style("opacity", opacityHighlighted);
        });
      } else {
        svg.selectAll(`${groupSelector}`).style("opacity", `${opacityHighlighted}`);
      }
    },
    [handleItemHighlight, svgRef]
  );

  const handleMouseOut = useCallback(
    (svgRef: React.RefObject<SVGSVGElement | null>) => {
      const svg = select(svgRef.current);
      if (!svg.node()) return;

      // Reset opacity for all elements to ensure proper visibility
      svg.selectAll(".data-group").style("opacity", 1);
      svg.selectAll(".series-group").style("opacity", 1);
      svg.selectAll(".line").style("opacity", 1);
      svg.selectAll(".data-point").style("opacity", 1);

      handleItemHighlight([]);
      if (!tooltipState?.isSticky && tooltipRef.current) {
        tooltipRef.current.style.visibility = "hidden";
      }
    },
    [handleItemHighlight, tooltipRef, tooltipState?.isSticky]
  );

  useLayoutEffect(() => {
    // Apply incoming highlightItems prop as visual dimming — D3 opacity only.
    // Do NOT call onHighlightItem here: that is an output callback for
    // user-initiated events; calling it on every prop change creates a
    // highlight-prop → setState → re-render → highlight-prop infinite loop.
    if (highlightItems.length > 0) {
      handleMouseEnter(null, svgRef, "g.data-group", 0.05, 1, highlightItems);
    } else {
      const svg = select(svgRef.current);
      if (svg.node()) {
        svg.selectAll("g.data-group").style("opacity", 1);
      }
    }
  }, [highlightItems, visibleDataSets]);

  const handleTooltipPosition = useCallback(
    (event: MouseEvent, d: DataPoint, data: LineChartDataItem) => {
      if (tooltipRef?.current && svgRef.current) {
        const [mouseX, mouseY] = pointer(event, event.currentTarget);
        const svgRect = svgRef.current.getBoundingClientRect();
        const tooltip = tooltipRef.current;

        tooltip.style.visibility = "visible";
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

        const tooltipContent = tooltipFormatterRef.current(
          {
            ...d,
            label: data.label,
          } as DataPoint,
          data.series,
          filteredDataSet
        );

        const tooltipContentElement = tooltip.querySelector(".tooltip-content");
        if (tooltipContentElement) {
          tooltipContentElement.innerHTML = DOMPurify.sanitize(tooltipContent);
        }
      }
    },
    [tooltipState, tooltipRef, svgRef, margin, filteredDataSet]
  );

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = select(svgRef.current);

    // When the Canvas renderer is active it owns the line/point drawing.
    // Drop any SVG line groups (e.g. left over from a renderer switch) and
    // skip the SVG render path entirely.
    if (renderer === "canvas") {
      svg.selectAll("g.data-group").remove();
      return;
    }

    const circleSize = 5;
    const squareSize = 6;
    const triangleSize = 16;

    const groupKey = (d: LineChartDataItem) => d.label;
    const pointKey = (d: DataPoint) => String(d.date);
    const linePathFor = (data: LineChartDataItem) =>
      line({ d: data.series, curve: resolveCurveName(data?.curve) });
    // Key for a run's <path> based on its start date and certainty. Reusing path
    // nodes across renders means d3's data join can update only the `d` attribute
    // when geometry changes, instead of destroying and re-creating SVG nodes.
    const runKey = (run: SeriesRun) => `${run.certain ? "c" : "u"}-${run.points[0]?.date ?? ""}`;

    const generateTrianglePath = (x: number, y: number, size: number = triangleSize) => {
      const h = (size * Math.sqrt(3)) / 2;
      return `M ${x} ${y - h * 0.7} L ${x + size / 2} ${y + h * 0.3} L ${x - size / 2} ${y + h * 0.3} Z`;
    };

    // --- GROUPS: enter/update/exit join ---
    // Reuse existing <g> nodes for series whose label is still present so the browser
    // doesn't tear down and rebuild SVG subtrees on every dataset update.
    const groups = svg
      .selectAll<SVGGElement, LineChartDataItem>("g.data-group")
      .data(visibleDataSets, groupKey);

    groups.exit().remove();

    const groupsEnter = groups.enter().append("g").attr("class", "data-group series-group");

    // Skeleton for new groups:
    //  - <g class="line-runs">: container for one or more <path> elements, one per
    //    contiguous run of same-certainty points. Lets the browser handle dashing
    //    natively along the true curve geometry, no JS path-length math required.
    //  - <path class="line-overlay">: a single thicker, near-transparent path for hover
    //    hit detection. Doesn't need dashing so it stays as one path regardless of runs.
    groupsEnter.append("g").attr("class", "line-runs").attr("pointer-events", "none");
    groupsEnter
      .append("path")
      .attr("class", "line-overlay data-group-overlay")
      .attr("fill", "none")
      .attr("stroke-width", 6)
      .attr("pointer-events", "stroke")
      .style("opacity", 0.05);

    const groupsAll = groupsEnter.merge(groups as typeof groupsEnter);

    // Update group-level attributes (index-derived classes change when ordering changes).
    groupsAll.each(function (data, i) {
      const safeLabelClass = sanitizeForClassName(data.label);
      const uniqueKey = `${data.label}__${i}`;
      const color = getColor(colorsMapping[data.label], data.color);
      const g = select(this);

      g.attr("class", `data-group series-group series-group-${i} series-group-${safeLabelClass}`)
        .attr("data-label", data.label)
        .attr("data-label-safe", safeLabelClass)
        .attr("data-key", uniqueKey);

      // --- LINE (rendered as one <path> per certainty run) ---
      // Each run is a contiguous stretch of points sharing the same `certainty`.
      // Adjacent runs share their boundary point so the visual line stays connected.
      // For typical continuous data, runs.length is 1 (all certain) or 2 (one uncertain
      // stretch at the start). The browser handles dashing for each path via CSS
      // stroke-dasharray, avoiding any per-point getTotalLength()/getPointAtLength()
      // calls that previously dominated render time on monthly charts.
      const runs = getRuns(data.series);
      // Defensive: ensure the runs container exists. It's created on first render via
      // groupsEnter, but a stale group surviving across hot-reloads might lack it.
      let runsContainer = g.select<SVGGElement>("g.line-runs");
      if (runsContainer.empty()) {
        runsContainer = g
          .append<SVGGElement>("g")
          .attr("class", "line-runs")
          .attr("pointer-events", "none");
      }
      const runPaths = runsContainer
        .selectAll<SVGPathElement, SeriesRun>("path.line")
        .data(runs, runKey);

      runPaths.exit().remove();

      const runPathsEnter = runPaths
        .enter()
        .append("path")
        .attr("fill", "none")
        .attr("stroke-width", 2.5);

      runPathsEnter
        .merge(runPaths as typeof runPathsEnter)
        .attr("class", `line line-${i} data-group data-group-${i}`)
        .attr("data-label", data.label)
        .attr("data-label-safe", safeLabelClass)
        .attr("data-key", uniqueKey)
        .attr("d", run => line({ d: run.points, curve: resolveCurveName(data?.curve) }))
        .attr("stroke", color)
        // Solid for certain runs, dashed for uncertain runs. d3 understands "null"
        // as "remove the attribute" — preferred over "none" to keep markup clean.
        .attr("stroke-dasharray", run => (run.certain ? null : UNCERTAIN_DASH_PATTERN));

      // --- LINE OVERLAY ---
      const overlayPath = g.select<SVGPathElement>("path.line-overlay");
      overlayPath
        .attr(
          "class",
          `line-overlay line-overlay-${i} data-group-overlay data-group-${i} data-group data-group-overlay-${safeLabelClass} line-group-overlay-${safeLabelClass}`
        )
        .attr("data-label", data.label)
        .attr("data-label-safe", safeLabelClass)
        .attr("data-key", uniqueKey)
        .attr("d", linePathFor(data))
        .attr("stroke", color);

      // Re-bind overlay event handlers each update (closures capture latest data/highlightItems).
      overlayPath
        .on("mouseenter", event => {
          handleMouseEnter(event, svgRef, "g.data-group", 0.05, 1, highlightItems);
        })
        .on("mouseout", () => handleMouseOut(svgRef));

      if (!showDataPoints && data.series.length > 0) {
        overlayPath.style("cursor", "pointer");
        overlayPath
          .on("mousemove", function (event) {
            if (isStickyRef.current) return;
            clearHideTimer();
            const [mouseX] = pointer(event, this);
            handleTooltipPosition(
              event,
              findNearestPoint(data.series, mouseX, xScale, xAxisDataType),
              data
            );
          })
          .on("click", function (event) {
            clearHideTimer();
            const [mouseX] = pointer(event, this);
            setTooltipState({ isSticky: true });
            handleTooltipPosition(
              event,
              findNearestPoint(data.series, mouseX, xScale, xAxisDataType),
              data
            );
          })
          // Override mouseout: reset line-highlight, then start the grace-period
          // hide timer so the user has time to travel into the tooltip.
          .on("mouseout", () => {
            const svgSel = select(svgRef.current);
            if (!svgSel.node()) return;
            svgSel.selectAll(".data-group").style("opacity", 1);
            svgSel.selectAll(".series-group").style("opacity", 1);
            svgSel.selectAll(".line").style("opacity", 1);
            handleItemHighlight([]);
            if (!isStickyRef.current) scheduleHide();
          });
      } else {
        overlayPath.style("cursor", null);
        overlayPath.on("mousemove", null).on("click", null);
      }

      // --- SINGLE-POINT GUIDE LINE ---
      // A one-point series has no drawable path: d3.line() emits only an `M`
      // command, so nothing shows. When singlePointLine is enabled, draw a
      // full-plot-width horizontal line at the point's value. Defaults reuse the
      // uncertainty dash look (set by LineChart). exit().remove() always runs so
      // the line is cleaned up if the series later gains a 2nd point / is disabled.
      const singleLineSel = g
        .selectAll<SVGLineElement, DataPoint>("line.single-point-line")
        .data(singlePointLine && data.series.length === 1 ? [data.series[0]] : [], pointKey);
      singleLineSel.exit().remove();
      if (singlePointLine && data.series.length === 1) {
        const singleLineEnter = singleLineSel
          .enter()
          .append("line")
          .attr("class", `single-point-line single-point-line-${i} data-group-${i}`)
          .attr("pointer-events", "none");
        singleLineEnter
          .merge(singleLineSel as typeof singleLineEnter)
          .attr("data-label", data.label)
          .attr("data-label-safe", safeLabelClass)
          .attr("data-key", uniqueKey)
          .attr("x1", margin.left)
          .attr("x2", width - margin.right)
          .attr("y1", d => yScale(d.value))
          .attr("y2", d => yScale(d.value))
          .attr("stroke", singlePointLine.stroke ?? color)
          .attr("stroke-width", singlePointLine.strokeWidth)
          .attr("stroke-dasharray", singlePointLine.strokeDasharray);
      }

      // --- POINTS ---
      const showSinglePointDot = !!singlePointLine && data.series.length === 1;
      if (showDataPoints || showSinglePointDot) {
        const shape = data.shape || "circle";
        const tag = shape === "square" ? "rect" : shape === "triangle" ? "path" : "circle";

        // Remove any points belonging to a different shape (e.g., shape changed across renders).
        g.selectAll<SVGElement, DataPoint>(".data-point")
          .filter(function () {
            return (this as SVGElement).tagName.toLowerCase() !== tag;
          })
          .remove();

        const points = g
          .selectAll<SVGElement, DataPoint>(`${tag}.data-point`)
          .data(data.series, pointKey);

        points.exit().remove();

        if (shape === "circle") {
          const enter = points
            .enter()
            .append("circle")
            .attr("class", `data-point data-point-${safeLabelClass} data-point-${i}`)
            .attr("data-label", data.label)
            .attr("data-label-safe", safeLabelClass)
            .attr("data-key", uniqueKey)
            .attr("r", circleSize)
            .attr("stroke", "#fdfdfd")
            .attr("stroke-width", 2)
            .attr("cursor", "crosshair");
          enter
            .merge(points as unknown as typeof enter)
            .attr("cx", d => xScale(new Date(d.date)))
            .attr("cy", d => yScale(d.value))
            .attr("fill", color);
        } else if (shape === "square") {
          const enter = points
            .enter()
            .append("rect")
            .attr("class", `data-point data-point-${safeLabelClass} data-point-${i}`)
            .attr("data-label", data.label)
            .attr("data-label-safe", safeLabelClass)
            .attr("data-key", uniqueKey)
            .attr("width", squareSize * 2)
            .attr("height", squareSize * 2)
            .attr("stroke", "#fdfdfd")
            .attr("stroke-width", 2)
            .attr("cursor", "crosshair");
          enter
            .merge(points as unknown as typeof enter)
            .attr("x", d => xScale(new Date(d.date)) - squareSize)
            .attr("y", d => yScale(d.value) - squareSize)
            .attr("fill", color);
        } else if (shape === "triangle") {
          const enter = points
            .enter()
            .append("path")
            .attr("class", `data-point data-point-${safeLabelClass} data-point-${i}`)
            .attr("data-label", data.label)
            .attr("data-label-safe", safeLabelClass)
            .attr("data-key", uniqueKey)
            .attr("stroke", "#fdfdfd")
            .attr("stroke-width", 2)
            .attr("cursor", "crosshair");
          enter
            .merge(points as unknown as typeof enter)
            .attr("d", d => generateTrianglePath(xScale(new Date(d.date)), yScale(d.value)))
            .attr("fill", color);
        }

        // Re-bind point event handlers each update (closures capture latest data).
        g.selectAll<SVGElement, DataPoint>(".data-point")
          .on("click", (event, d) => {
            if (tooltipRef?.current && svgRef.current) {
              setTooltipState({ isSticky: true });
              handleTooltipPosition(event, d, data);
            }
          })
          .on("mouseenter", (event, d) => {
            handleMouseEnter(event, svgRef, "g.data-group", 0.05, 1, highlightItems);
            if (tooltipState?.isSticky) return;
            handleTooltipPosition(event, d, data);
          })
          .on("mouseout", () => {
            handleMouseOut(svgRef);
          });
      } else {
        // showDataPoints toggled off: remove any leftover points from a previous render.
        g.selectAll(".data-point").remove();
      }
    });

    // Apply highlighting AFTER rendering is complete
    if (highlightItems.length > 0) {
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
    showDataPoints,
    renderer,
    singlePointLine,
  ]);

  // Keep the tooltip visible while the cursor is over it (no-dots mode UX).
  // Cancel the hide timer on mouseenter, restart it on mouseleave.
  //
  // Skipped entirely in canvas mode: there the Canvas renderer owns the whole
  // tooltip lifecycle, including its own click-to-pin sticky state. This grace
  // timer's hide callback only consults the SVG renderer's `isStickyRef`
  // (always false when renderer="canvas"), so leaving it active would hide a
  // canvas-pinned tooltip ~400ms after the cursor merely crossed the tooltip.
  useEffect(() => {
    if (renderer === "canvas") return;
    const el = tooltipRef.current;
    if (!el) return;
    const onEnter = () => clearHideTimer();
    const onLeave = () => scheduleHide();
    el.addEventListener("mouseenter", onEnter);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mouseenter", onEnter);
      el.removeEventListener("mouseleave", onLeave);
      clearHideTimer();
    };
  }, [renderer]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tooltipState?.isSticky) {
        const tooltipElement = (event.target as HTMLElement).closest(".tooltip");
        const tooltipElement2 = (event.target as HTMLElement).closest(".data-point");
        const lineOverlayElement = (event.target as Element).closest(".line-overlay");

        if (!tooltipElement && !tooltipElement2 && !lineOverlayElement) {
          if (tooltipRef.current) {
            tooltipRef.current.style.visibility = "hidden";
          }

          setTimeout(() => {
            setTooltipState(value => {
              return {
                ...value,
                isSticky: false,
              };
            });
          }, 100);
        }
      }
    };

    if (tooltipState?.isSticky) {
      document.addEventListener("click", handleClickOutside);
      return () => {
        document.removeEventListener("click", handleClickOutside);
      };
    }
  }, [tooltipState?.isSticky]);

  return {
    tooltip: tooltipState,
  };
};

export default useLineChartPathsShapesRendering;

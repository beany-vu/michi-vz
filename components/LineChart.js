"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const d3 = __importStar(require("d3"));
const Title_1 = __importDefault(require("./shared/Title"));
const YaxisLinear_1 = __importDefault(require("./shared/YaxisLinear"));
const XaxisLinear_1 = __importDefault(require("./shared/XaxisLinear"));
const MichiVzProvider_1 = require("./MichiVzProvider");
const LoadingIndicator_1 = __importDefault(require("./shared/LoadingIndicator"));
const useDisplayIsNodata_1 = require("./hooks/useDisplayIsNodata");
const styled_components_1 = __importDefault(require("styled-components"));
const MARGIN = { top: 50, right: 50, bottom: 50, left: 50 };
const WIDTH = 900 - MARGIN.left - MARGIN.right;
const HEIGHT = 480 - MARGIN.top - MARGIN.bottom;
const DASH_LENGTH = 4;
const DASH_SEPARATOR_LENGTH = 4;
const LineChartContainer = styled_components_1.default.div `
  position: relative;
  contain: layout paint;
  content-visibility: auto;
  path {
    transition:
      stroke 0.3s ease-out,
      opacity 0.3s ease-out;
    transition-behavior: allow-discrete;
    will-change: stroke, opacity, d;
  }

  circle,
  rect,
  path.data-point {
    transition:
      fill 0.3s ease-out,
      stroke 0.3s ease-out,
      opacity 0.3s ease-out;
    will-change: fill, stroke, opacity;
  }

  .data-group {
    transition: opacity 0.3s ease-out;
  }

  /* Enhanced line-overlay styling for better hover targeting */
  .line-overlay {
    stroke-linecap: round;
    stroke-linejoin: round;
    cursor: pointer;
    /* Critical for proper hover behavior */
    pointer-events: stroke;
    /* Always ensure it's visible for hover but transparent visually */
    opacity: 0.05 !important;
  }
`;
const LineChart = ({ dataSet, filter, title, width = WIDTH, height = HEIGHT, margin = MARGIN, yAxisDomain, yAxisFormat, xAxisDataType = "number", xAxisFormat, tooltipFormatter = (d) => `<div>${d.label} - ${d.date}: ${d.value}</div>`, showCombined = false, children, isLoading = false, isLoadingComponent, isNodataComponent, isNodata, onChartDataProcessed, onHighlightItem, ticks = 5, }) => {
    const { colorsMapping, highlightItems, disabledItems } = (0, MichiVzProvider_1.useChartContext)();
    const svgRef = (0, react_1.useRef)(null);
    const tooltipRef = (0, react_1.useRef)(null);
    const renderCompleteRef = (0, react_1.useRef)(false);
    const prevChartDataRef = (0, react_1.useRef)(null);
    const [isProcessing, setIsProcessing] = (0, react_1.useState)(false);
    const isInitialMount = (0, react_1.useRef)(true); // Track initial mount
    // Animation constants
    const TRANSITION_DURATION = 100;
    const TRANSITION_EASE = d3.easeQuadOut;
    // Use this constant for the fallback semi-transparent color
    const FALLBACK_COLOR = "rgba(253, 253, 253, 0.5)";
    // Helper function to get the appropriate color
    const getColor = (0, react_1.useCallback)((mappedColor, dataColor) => {
        if (mappedColor)
            return mappedColor;
        if (dataColor)
            return dataColor;
        return FALLBACK_COLOR;
    }, []);
    // Add this helper function to sanitize labels for CSS class names
    const sanitizeForClassName = (0, react_1.useCallback)((str) => {
        return str.replace(/[^a-z0-9]/gi, "_");
    }, []);
    const filteredDataSet = (0, react_1.useMemo)(() => {
        // If no filter is provided, return the entire dataset excluding disabled items
        if (!filter) {
            return dataSet.filter(d => !disabledItems.includes(d.label));
        }
        // Start with the base dataset, excluding disabled items
        let result = dataSet.filter(d => !disabledItems.includes(d.label));
        // Apply filter logic if filter exists
        result = result
            .filter(item => {
            const targetPoint = item.series.find(d => d.date.toString() === filter.date.toString());
            return targetPoint !== undefined;
        })
            .sort((a, b) => {
            const aPoint = a.series.find(d => d.date.toString() === filter.date.toString());
            const bPoint = b.series.find(d => d.date.toString() === filter.date.toString());
            const aVal = aPoint ? Number(aPoint[filter.criteria]) : 0;
            const bVal = bPoint ? Number(bPoint[filter.criteria]) : 0;
            return filter.sortingDir === "desc" ? bVal - aVal : aVal - bVal;
        })
            .slice(0, filter.limit);
        // Pre-process each dataset to ensure valid points for line rendering
        return result.map(item => ({
            ...item,
            series: item.series.filter(point => point.value !== null && point.value !== undefined),
        }));
    }, [dataSet, filter, disabledItems]);
    const yScale = (0, react_1.useMemo)(() => d3
        .scaleLinear()
        .domain(yAxisDomain
        ? yAxisDomain
        : [
            d3.min(filteredDataSet.flatMap(({ series }) => series.filter(dd => dd.value !== null)), d => d.value) || 0,
            d3.max(filteredDataSet.flatMap(({ series }) => series.filter(dd => dd.value !== null)), d => d.value) || 1,
        ])
        .range([height - margin.bottom, margin.top])
        .clamp(true)
        .nice(), [filteredDataSet, height, margin, yAxisDomain]);
    const xScale = (0, react_1.useMemo)(() => {
        if (xAxisDataType === "number") {
            return d3
                .scaleLinear()
                .domain([
                d3.min(filteredDataSet.flatMap(item => item.series.map(d => d.date))) || 0,
                d3.max(filteredDataSet.flatMap(item => item.series.map(d => d.date))) || 1,
            ])
                .range([margin.left, width - margin.right])
                .clamp(true)
                .nice();
        }
        if (xAxisDataType === "date_annual") {
            // sometimes the first tick is missing, so do a hack here
            const minDate = d3.min(filteredDataSet.flatMap(item => item.series.map(d => new Date(`${d.date}-01-01`))));
            const maxDate = d3.max(filteredDataSet.flatMap(item => item.series.map(d => new Date(`${d.date}`))));
            return d3
                .scaleTime()
                .domain([minDate || 0, maxDate || 1])
                .range([margin.left, width - margin.right]);
        }
        const minDate = d3.min(filteredDataSet.flatMap(item => item.series.map(d => new Date(d.date))));
        const maxDate = d3.max(filteredDataSet.flatMap(item => item.series.map(d => new Date(d.date))));
        return d3
            .scaleTime()
            .domain([minDate || 0, maxDate || 1])
            .range([margin.left, width - margin.right]);
    }, [filteredDataSet, width, margin, xAxisDataType]);
    // Compute unique sorted x values for axis ticks
    const xTickValues = (0, react_1.useMemo)(() => {
        if (xAxisDataType === "date_annual") {
            // Get all years from data
            const years = filteredDataSet
                .flatMap(item => item.series.map(d => {
                const year = new Date(d.date).getFullYear();
                return isNaN(year) ? null : year;
            }))
                .filter((y) => y !== null);
            if (years.length === 0)
                return [];
            const minYear = Math.min(...years);
            const maxYear = Math.max(...years);
            const allYears = [];
            for (let y = minYear; y <= maxYear; y++) {
                allYears.push(new Date(`${y}-01-01`));
            }
            // Estimate how many ticks can fit based on chart width and label size
            const estimatedLabelWidth = 50; // px per year label
            const maxTicks = Math.floor((width - margin.left - margin.right) / estimatedLabelWidth);
            if (allYears.length <= maxTicks)
                return allYears;
            // Otherwise, pick 5 ticks: first, last, and 3 evenly spaced
            const tickCount = 5;
            const result = [allYears[0]];
            const step = (allYears.length - 1) / (tickCount - 1);
            for (let i = 1; i < tickCount - 1; i++) {
                const idx = Math.round(i * step);
                if (idx > 0 && idx < allYears.length - 1) {
                    result.push(allYears[idx]);
                }
            }
            result.push(allYears[allYears.length - 1]);
            // Sort by year
            result.sort((a, b) => a.getTime() - b.getTime());
            return result;
        }
        if (xAxisDataType === "date_monthly") {
            // Get all months from data
            const months = filteredDataSet
                .flatMap(item => item.series.map(d => {
                const date = new Date(d.date);
                return isNaN(date.getTime()) ? null : date;
            }))
                .filter((d) => d !== null);
            if (months.length === 0)
                return [];
            // Find min and max month
            const minMonth = new Date(Math.min(...months.map(d => d.getTime())));
            const maxMonth = new Date(Math.max(...months.map(d => d.getTime())));
            // Generate all months in range
            const allMonths = [];
            const current = new Date(minMonth.getFullYear(), minMonth.getMonth(), 1);
            const end = new Date(maxMonth.getFullYear(), maxMonth.getMonth(), 1);
            while (current <= end) {
                allMonths.push(new Date(current));
                current.setMonth(current.getMonth() + 1);
            }
            // Estimate how many ticks can fit based on chart width and label size
            const estimatedLabelWidth = 50; // px per month label
            const maxTicks = Math.floor((width - margin.left - margin.right) / estimatedLabelWidth);
            if (allMonths.length <= maxTicks)
                return allMonths;
            // Otherwise, pick 5 ticks: first, last, and 3 evenly spaced
            const tickCount = 5;
            const result = [allMonths[0]];
            const step = (allMonths.length - 1) / (tickCount - 1);
            for (let i = 1; i < tickCount - 1; i++) {
                const idx = Math.round(i * step);
                if (idx > 0 && idx < allMonths.length - 1) {
                    result.push(allMonths[idx]);
                }
            }
            result.push(allMonths[allMonths.length - 1]);
            // Sort by date
            result.sort((a, b) => a.getTime() - b.getTime());
            return result;
        }
        if (xAxisDataType === "number") {
            let values = Array.from(new Set(filteredDataSet.flatMap(item => item.series.map(d => Number(d.date)))));
            values = values.filter((v) => typeof v === "number" && !isNaN(v));
            values.sort((a, b) => a - b);
            return values;
        }
        else {
            // Handle all date cases (monthly, annual, and default)
            const values = Array.from(new Set(filteredDataSet.flatMap(item => item.series.map(d => d.date))));
            const dateValues = values
                .map(d => new Date(d))
                .filter((d) => d instanceof Date && !isNaN(d.getTime()));
            dateValues.sort((a, b) => a.getTime() - b.getTime());
            return dateValues;
        }
    }, [filteredDataSet, xAxisDataType, width, margin]);
    const getYValueAtX = (0, react_1.useCallback)((series, x) => {
        if (x instanceof Date) {
            const dataPoint = series.find(d => new Date(d.date).getTime() === x.getTime());
            return dataPoint ? dataPoint.value : undefined;
        }
        const dataPoint = series.find(d => Number(d.date) === x);
        return dataPoint ? dataPoint.value : undefined;
    }, []);
    const getPathLengthAtX = (0, react_1.useCallback)((path, x) => {
        const l = path.getTotalLength();
        const precision = 90;
        if (!path || path.getTotalLength() === 0) {
            return 0;
        }
        for (let i = 0; i <= precision; i++) {
            const pos = path.getPointAtLength((l * i) / precision);
            if (pos.x >= x)
                return (l * i) / precision;
        }
    }, []);
    const getDashArrayMemoized = (0, react_1.useMemo)(() => {
        return (series, pathNode, xScale) => {
            var _a;
            const totalLength = pathNode.getTotalLength();
            const lengths = series.map(d => getPathLengthAtX(pathNode, xScale(new Date(d.date))));
            const dashArray = [];
            for (let i = 1; i <= series.length; i++) {
                const segmentLength = i === series.length - 1 ? totalLength - lengths[i - 1] : lengths[i] - lengths[i - 1];
                if (!((_a = series[i]) === null || _a === void 0 ? void 0 : _a.certainty)) {
                    const dashes = Math.floor(segmentLength / (DASH_LENGTH + DASH_SEPARATOR_LENGTH));
                    const remainder = Math.ceil(segmentLength - dashes * (DASH_LENGTH + DASH_SEPARATOR_LENGTH));
                    for (let j = 0; j < dashes; j++) {
                        dashArray.push(DASH_LENGTH);
                        dashArray.push(DASH_SEPARATOR_LENGTH);
                    }
                    if (remainder > 0)
                        dashArray.push(remainder);
                }
                else {
                    if (dashArray.length % 2 === 1) {
                        dashArray.push(0);
                        dashArray.push(segmentLength);
                    }
                    else {
                        dashArray.push(segmentLength);
                    }
                }
            }
            return dashArray.join(",");
        };
    }, [DASH_LENGTH, DASH_SEPARATOR_LENGTH]);
    const line = (0, react_1.useCallback)(({ d, curve }) => {
        var _a;
        return d3
            .line()
            .x(d => {
            if (xAxisDataType === "number") {
                return xScale(Number(d.date));
            }
            else if (xAxisDataType === "date_annual") {
                return xScale(new Date(`${d.date}-01-01`));
            }
            else {
                return xScale(new Date(d.date));
            }
        })
            .y(d => yScale(d.value))
            .curve((_a = d3 === null || d3 === void 0 ? void 0 : d3[curve]) !== null && _a !== void 0 ? _a : d3.curveBumpX)(d);
    }, [xScale, yScale, xAxisDataType]);
    const lineData = (0, react_1.useMemo)(() => dataSet.map(set => ({
        label: set.label,
        color: set.color,
        points: set.series,
    })), [dataSet]);
    // Track context changes independently
    const prevHighlightItems = (0, react_1.useRef)([]);
    const prevDisabledItems = (0, react_1.useRef)([]);
    const prevColorsMapping = (0, react_1.useRef)({});
    // Update context refs without triggering effects
    (0, react_1.useEffect)(() => {
        prevHighlightItems.current = highlightItems;
    }, [highlightItems]);
    (0, react_1.useEffect)(() => {
        prevDisabledItems.current = disabledItems;
    }, [disabledItems]);
    (0, react_1.useEffect)(() => {
        prevColorsMapping.current = colorsMapping;
    }, [colorsMapping]);
    // Update the useEffect that responds to highlightItems changes for consistency
    (0, react_1.useLayoutEffect)(() => {
        const svg = d3.select(svgRef.current);
        if (!svg.node())
            return;
        // When no items are highlighted, all items should be fully visible
        if (highlightItems.length === 0) {
            svg.selectAll(".data-group").transition().duration(300).style("opacity", 1);
            // Ensure line-overlays are always 0.05 opacity
            svg.selectAll(".line-overlay").transition().duration(300).style("opacity", 0.05);
        }
        else {
            // First set all groups to low opacity
            svg.selectAll(".data-group").transition().duration(300).style("opacity", 0.05);
            // Then highlight all elements with the selected labels
            highlightItems.forEach(label => {
                svg
                    .selectAll(`[data-label="${label}"]:not(.line-overlay)`)
                    .transition()
                    .duration(300)
                    .style("opacity", 1);
            });
            // Ensure line-overlays are always 0.05 opacity
            svg.selectAll(".line-overlay").transition().duration(300).style("opacity", 0.05);
        }
    }, [highlightItems, svgRef]);
    // Improve both handleItemHighlight and the line overlay event handlers to ensure ALL data points are properly faded
    const handleItemHighlight = (0, react_1.useCallback)((labels) => {
        // Direct DOM manipulation for immediate visual feedback
        const svg = d3.select(svgRef.current);
        if (svg.node() && labels.length > 0) {
            // First fade ALL elements - both lines and points
            // svg.selectAll(".data-group").transition().duration(200).style("opacity", 0.05);
            svg.selectAll(".data-group").each(function () {
                const dataLabel = this.getAttribute("data-label");
                if (dataLabel && !labels.includes(dataLabel)) {
                    d3.select(this).transition().duration(200).style("opacity", 0.05);
                }
                else {
                    d3.select(this).transition().duration(200).style("opacity", 1);
                }
            });
        }
        onHighlightItem(labels);
        // Reset hover state after a delay to allow for normal processing later
        clearTimeout(window.hoverResetTimer);
        window.hoverResetTimer = window.setTimeout(() => {
            // setIsHovering(false);
        }, 1000); // 1 second delay to ensure hover state is fully complete
    }, [onHighlightItem, svgRef]);
    // Only show loading state during initial component mount or when explicitly isLoading is true
    // Process data changes internally without showing loading overlay
    (0, react_1.useEffect)(() => {
        // Only show processing indicator on initial mount, not on subsequent data changes
        if (isInitialMount.current) {
            setIsProcessing(true);
            const initialTimer = setTimeout(() => {
                setIsProcessing(false);
                isInitialMount.current = false;
            }, TRANSITION_DURATION);
            return () => clearTimeout(initialTimer);
        }
    }, [TRANSITION_DURATION]);
    // Separate data processing effect that doesn't show loading overlay
    (0, react_1.useEffect)(() => {
        // Process data changes without showing loading overlay
        // Internal-only state for cleanup and synchronization
        const processingTimer = setTimeout(() => {
            // This just manages cleanup timing, doesn't affect UI
        }, TRANSITION_DURATION);
        return () => clearTimeout(processingTimer);
    }, [dataSet, filter, width, height, TRANSITION_DURATION]);
    // Calculate whether to show the loading indicator
    // Only show on initial load or explicit isLoading
    const showLoadingIndicator = isLoading || (isProcessing && isInitialMount.current);
    const visibleDataSets = (0, react_1.useMemo)(() => {
        return filteredDataSet.filter(d => d.series.length > 1);
    }, [filteredDataSet]);
    // Ensure we have clean data point removal when filter changes
    (0, react_1.useEffect)(() => {
        // This effect specifically runs when filter or dataset changes
        // It ensures all old data points are properly removed
        const svg = d3.select(svgRef.current);
        if (!svg.node())
            return;
        // First, remove all existing data points before any new ones are rendered
        // Use a more aggressive selector to ensure all old points are removed
        svg.selectAll(".data-group:not(.line):not(.line-overlay)").remove();
        // This ensures a clean slate for new data points to be rendered
        // The main rendering effect will then add the correct points back
    }, [filter, dataSet]); // Only run when filter or dataset changes
    // Also update the handleMouseOut to restore opacity directly
    const handleMouseOut = (0, react_1.useCallback)((event) => {
        event.preventDefault();
        event.stopPropagation();
        // Keep hover state true briefly to prevent flicker
        // setIsHovering(true);
        // Directly manage opacity through D3 before clearing highlight
        const svg = d3.select(svgRef.current);
        if (svg.node()) {
            // Reset all groups to full opacity
            svg.selectAll(".data-group").transition().duration(300).style("opacity", 1);
            // Ensure line-overlays are always 0.05 opacity
            svg.selectAll(".line-overlay").transition().duration(300).style("opacity", 0.05);
        }
        // Clear highlight in context
        onHighlightItem([]);
        if (tooltipRef === null || tooltipRef === void 0 ? void 0 : tooltipRef.current) {
            tooltipRef.current.style.visibility = "hidden";
        }
        // Reset hover state after a small delay
        setTimeout(() => {
            // setIsHovering(false);
        }, 300);
    }, [onHighlightItem, svgRef]);
    // Reset hover state on mouse out from the chart
    const handleChartMouseOut = (0, react_1.useCallback)((event) => {
        event.preventDefault();
        event.stopPropagation();
        // Ensure hover state is set
        // setIsHovering(true);
        // Clear highlight
        onHighlightItem([]);
        if (tooltipRef === null || tooltipRef === void 0 ? void 0 : tooltipRef.current) {
            tooltipRef.current.style.visibility = "hidden";
        }
        // Reset hover state after a small delay
        setTimeout(() => {
            // setIsHovering(false);
        }, 200);
    }, [onHighlightItem]);
    // Main rendering effect
    (0, react_1.useEffect)(() => {
        const svg = d3.select(svgRef.current);
        // Instead of removing all lines, use D3 update pattern
        // Create a key function that uniquely identifies each dataset
        const keyFn = (d) => d.label;
        // Line paths - main paths
        const linePaths = svg.selectAll(".line").data(visibleDataSets, keyFn);
        // Exit - remove lines that no longer exist
        linePaths.exit().remove();
        // Update - update existing lines
        linePaths
            .attr("d", d => {
            var _a;
            return line({
                d: d.series,
                curve: (_a = d === null || d === void 0 ? void 0 : d.curve) !== null && _a !== void 0 ? _a : "curveBumpX",
            });
        })
            .each(function (d) {
            const pathNode = this;
            const dashArray = getDashArrayMemoized(d.series, pathNode, xScale);
            d3.select(this).attr("stroke-dasharray", dashArray);
        });
        // Enter - add new lines
        linePaths
            .enter()
            .append("path")
            .attr("class", (d, i) => `line line-${i} data-group data-group-${i}`)
            .attr("data-label", d => d.label)
            .attr("data-label-safe", d => sanitizeForClassName(d.label))
            .attr("d", d => {
            var _a;
            return line({
                d: d.series,
                curve: (_a = d === null || d === void 0 ? void 0 : d.curve) !== null && _a !== void 0 ? _a : "curveBumpX",
            });
        })
            .attr("stroke", "transparent")
            .attr("stroke-width", 2.5)
            .attr("fill", "none")
            .attr("pointer-events", "none")
            .attr("transition", "stroke 0.5s ease-out, opacity 0.5s ease-out")
            .attr("stroke", d => getColor(colorsMapping[d.label], d.color))
            .attr("opacity", 0)
            .each(function (d) {
            const pathNode = this;
            const dashArray = getDashArrayMemoized(d.series, pathNode, xScale);
            d3.select(this).attr("stroke-dasharray", dashArray);
        })
            .transition()
            .duration(TRANSITION_DURATION)
            .ease(TRANSITION_EASE)
            .attr("stroke", d => getColor(colorsMapping[d.label], d.color))
            .attr("fill", "none")
            .attr("opacity", 1);
        // Line overlays - handle similarly
        const lineOverlays = svg.selectAll(".line-overlay").data(visibleDataSets, keyFn);
        // Exit - remove overlays that no longer exist
        lineOverlays.exit().remove();
        // Update - update existing overlays
        lineOverlays.attr("d", d => {
            var _a;
            return line({
                d: d.series,
                curve: (_a = d === null || d === void 0 ? void 0 : d.curve) !== null && _a !== void 0 ? _a : "curveBumpX",
            });
        });
        // Enter - add new overlays
        const enterOverlays = lineOverlays
            .enter()
            .append("path")
            .attr("class", (d, i) => {
            const safeLabelClass = sanitizeForClassName(d.label);
            return `line-overlay line-overlay-${i} data-group-overlay data-group-${i} data-group-overlay-${safeLabelClass} line-group-overlay-${safeLabelClass}`;
        })
            .attr("data-label", d => d.label)
            .attr("data-label-safe", d => sanitizeForClassName(d.label))
            .attr("d", d => {
            var _a;
            return line({
                d: d.series,
                curve: (_a = d === null || d === void 0 ? void 0 : d.curve) !== null && _a !== void 0 ? _a : "curveBumpX",
            });
        })
            .attr("stroke", d => getColor(colorsMapping[d.label], d.color))
            .attr("stroke-width", 6)
            .attr("fill", "none")
            .attr("pointer-events", "stroke")
            .style("opacity", 0.05); // Use style instead of attr for consistency with transitions
        enterOverlays
            .transition()
            .duration(TRANSITION_DURATION)
            .ease(TRANSITION_EASE)
            .attr("stroke", d => getColor(colorsMapping[d.label], d.color))
            // Do not change the opacity for overlays
            .on("end", function ( /* d */) {
            // Remove unused 'd'
            // After transition completes, add event listeners
            d3.select(this)
                .on("mouseenter", function ( /* event */) {
                // Remove unused 'event'
                // Updated to directly use handleItemHighlight for consistency
                const label = d3.select(this).attr("data-label");
                if (label) {
                    // Get all SVG elements
                    const svg = d3.select(svgRef.current);
                    // IMMEDIATELY fade all points and lines with no transition
                    svg.selectAll(".data-group").style("opacity", 0.05);
                    svg.selectAll("circle, rect, path").style("opacity", 0.05);
                    // IMMEDIATELY highlight only points and lines with matching data-label
                    svg.selectAll(`[data-label="${label}"]:not(.line-overlay)`).style("opacity", 1);
                    // Double-ensure all shapes are explicitly targeted
                    svg
                        .selectAll(`circle[data-label="${label}"], rect[data-label="${label}"], path[data-label="${label}"]`)
                        .style("opacity", 1);
                    // Keep line-overlays at consistent opacity
                    svg.selectAll(".line-overlay").style("opacity", 0.05);
                    // Use the standard highlight function after direct DOM manipulation
                    handleItemHighlight([label]);
                }
            })
                .on("mouseout", handleMouseOut);
        });
        // Update existing overlays event handlers too
        lineOverlays
            .on("mouseenter", function ( /* event, d */) {
            // Remove unused 'event' and 'd'
            // Get all SVG elements
            const svg = d3.select(svgRef.current);
            const label = d3.select(this).attr("data-label");
            if (label) {
                // IMMEDIATELY fade all points and lines with no transition
                svg.selectAll(".data-group").style("opacity", 0.05);
                svg.selectAll("circle, rect, path").style("opacity", 0.05);
                // IMMEDIATELY highlight only points and lines with matching data-label
                svg.selectAll(`[data-label="${label}"]:not(.line-overlay)`).style("opacity", 1);
                // Double-ensure all shapes are explicitly targeted
                svg
                    .selectAll(`circle[data-label="${label}"], rect[data-label="${label}"],[data-label="${label}"]`)
                    .style("opacity", 1);
                // Keep line-overlays at consistent opacity
                svg.selectAll(".line-overlay").style("opacity", 0.05);
                // Use the standard highlight function after direct DOM manipulation
                handleItemHighlight([label]);
            }
        })
            .on("mouseout", handleMouseOut);
        // First remove any existing data points that don't belong to currently filtered datasets
        svg
            .selectAll(".data-group:not(.line):not(.line-overlay)")
            .filter(function () {
            const dataLabel = this.getAttribute("data-label");
            return !visibleDataSets.some(d => d.label === dataLabel);
        })
            .remove();
        // Now draw points ONLY for the same datasets that have visible paths
        for (let i = 0; i < visibleDataSets.length; i++) {
            const data = visibleDataSets[i];
            const shape = data.shape || "circle";
            const circleSize = 5;
            const squareSize = 6;
            const triangleSize = 16;
            const color = getColor(colorsMapping[data.label], data.color);
            const safeLabelClass = sanitizeForClassName(data.label);
            // Use a composite key that includes both dataset label and point date to ensure uniqueness
            const pointKeyFn = (d) => `${data.label}-${d.date}`;
            if (shape === "circle") {
                // Select existing circles - use sanitized class names for selectors
                const circles = svg
                    .selectAll(`.data-point-${i}[data-label="${data.label}"]`)
                    .data(data.series, pointKeyFn);
                // Remove circles that no longer exist
                circles.exit().remove();
                // Update existing circles
                circles
                    .attr("cx", d => xScale(new Date(d.date)))
                    .attr("cy", d => yScale(d.value))
                    .attr("fill", color);
                // Add new circles
                circles
                    .enter()
                    .append("circle")
                    .attr("class", `data-group data-point data-group-${i} data-group-${safeLabelClass} data-point-${i}`)
                    .attr("data-label", data.label)
                    .attr("data-label-safe", safeLabelClass)
                    .attr("cx", d => xScale(new Date(d.date)))
                    .attr("cy", d => yScale(d.value))
                    .attr("r", circleSize) // Set final size immediately
                    .attr("fill", color)
                    .attr("stroke", "#fdfdfd")
                    .attr("stroke-width", 2)
                    .attr("cursor", "crosshair")
                    .style("opacity", 0) // Start with opacity 0
                    .transition()
                    .duration(TRANSITION_DURATION)
                    .ease(TRANSITION_EASE)
                    .style("opacity", 1); // Only transition opacity to 1
            }
            else if (shape === "square") {
                // Select existing squares
                const squares = svg
                    .selectAll(`.data-point-${i}[data-label="${data.label}"]`)
                    .data(data.series, pointKeyFn);
                // Remove squares that no longer exist
                squares.exit().remove();
                // Update existing squares
                squares
                    .attr("x", d => xScale(new Date(d.date)) - squareSize)
                    .attr("y", d => yScale(d.value) - squareSize)
                    .attr("fill", color);
                // Add new squares
                squares
                    .enter()
                    .append("rect")
                    .attr("class", `data-group data-point data-group-${i} data-group-${safeLabelClass} data-point-${i}`)
                    .attr("data-label", data.label)
                    .attr("data-label-safe", safeLabelClass)
                    .attr("x", d => xScale(new Date(d.date)) - squareSize)
                    .attr("y", d => yScale(d.value) - squareSize)
                    .attr("width", squareSize * 2) // Set final size immediately
                    .attr("height", squareSize * 2) // Set final size immediately
                    .attr("fill", color)
                    .attr("stroke", "#fdfdfd")
                    .attr("stroke-width", 2)
                    .attr("cursor", "crosshair")
                    .style("opacity", 0) // Start with opacity 0
                    .transition()
                    .duration(TRANSITION_DURATION)
                    .ease(TRANSITION_EASE)
                    .style("opacity", 1); // Only transition opacity to 1
            }
            else if (shape === "triangle") {
                // Select existing triangles
                const triangles = svg
                    .selectAll(`.data-point-${i}[data-label="${data.label}"]`)
                    .data(data.series, pointKeyFn);
                // Remove triangles that no longer exist
                triangles.exit().remove();
                // Helper function to generate triangle path
                const generateTrianglePath = (x, y, size = triangleSize) => {
                    const height = (size * Math.sqrt(3)) / 2;
                    return `M ${x} ${y - height * 0.7} L ${x + size / 2} ${y + height * 0.3} L ${x - size / 2} ${y + height * 0.3} Z`;
                };
                // Update existing triangles
                triangles
                    .attr("d", d => {
                    const x = xScale(new Date(d.date));
                    const y = yScale(d.value);
                    return generateTrianglePath(x, y);
                })
                    .attr("fill", color);
                // Add new triangles
                triangles
                    .enter()
                    .append("path")
                    .attr("class", `data-group data-point data-group-${i} data-group-${safeLabelClass} data-point-${i}`)
                    .attr("data-label", data.label)
                    .attr("data-label-safe", safeLabelClass)
                    .attr("d", d => {
                    const x = xScale(new Date(d.date));
                    const y = yScale(d.value);
                    // Start with a tiny triangle
                    return generateTrianglePath(x, y, 0);
                })
                    .attr("fill", color)
                    .attr("stroke", "#fdfdfd")
                    .attr("stroke-width", 2)
                    .attr("cursor", "crosshair")
                    .style("opacity", 0)
                    .transition()
                    .duration(TRANSITION_DURATION)
                    .ease(TRANSITION_EASE)
                    .attr("d", d => {
                    const x = xScale(new Date(d.date));
                    const y = yScale(d.value);
                    // Grow to full size
                    return generateTrianglePath(x, y);
                })
                    .style("opacity", 1);
            }
            // Add event listeners to all data points after they've been created or updated
            const allDataPoints = svg.selectAll(`.data-point-${i}[data-label="${data.label}"]`);
            // Add new listeners for data points
            allDataPoints
                .on("mouseenter", (event, d) => {
                event.preventDefault();
                event.stopPropagation();
                handleItemHighlight([data.label]);
                const tooltipContent = tooltipFormatter({
                    ...d,
                    label: data.label,
                }, data.series, filteredDataSet);
                if ((tooltipRef === null || tooltipRef === void 0 ? void 0 : tooltipRef.current) && svgRef.current) {
                    const [mouseX, mouseY] = d3.pointer(event, event.currentTarget);
                    const svgRect = svgRef.current.getBoundingClientRect();
                    const tooltip = tooltipRef.current;
                    tooltip.style.visibility = "visible";
                    tooltip.innerHTML = tooltipContent;
                    const tooltipRect = tooltip.getBoundingClientRect();
                    const xPosition = mouseX + 10;
                    const yPosition = mouseY - 25;
                    if (xPosition + tooltipRect.width > svgRect.width - margin.right) {
                        tooltip.style.left = `${mouseX - tooltipRect.width - 10}px`;
                    }
                    else {
                        tooltip.style.left = `${xPosition}px`;
                    }
                    if (yPosition < margin.top) {
                        tooltip.style.top = `${mouseY + 10}px`;
                    }
                    else {
                        tooltip.style.top = `${yPosition}px`;
                    }
                }
            })
                .on("mouseout", event => {
                event.preventDefault();
                event.stopPropagation();
                const relatedTarget = event.relatedTarget;
                const isMouseOverLine = relatedTarget &&
                    (relatedTarget.classList.contains("line") ||
                        relatedTarget.classList.contains("line-overlay"));
                if (!isMouseOverLine) {
                    handleItemHighlight([]);
                    if (tooltipRef === null || tooltipRef === void 0 ? void 0 : tooltipRef.current) {
                        tooltipRef.current.style.visibility = "hidden";
                    }
                }
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
        handleMouseOut,
        tooltipFormatter,
        tooltipRef,
        svgRef,
        getColor,
        sanitizeForClassName,
        TRANSITION_DURATION,
        TRANSITION_EASE,
    ]);
    (0, react_1.useLayoutEffect)(() => {
        const svg = d3.select(svgRef.current);
        const TRANSITION_DURATION = 400; // Consistent duration
        // Use for loop instead of forEach for better performance
        for (const key of Object.keys(colorsMapping)) {
            // Update circle/point colors with transitions
            svg
                .selectAll(`circle[data-label="${key}"], rect[data-label="${key}"], path.data-point[data-label="${key}"]`)
                .transition()
                .duration(TRANSITION_DURATION)
                .ease(d3.easeQuadOut) // Add consistent easing
                .attr("fill", getColor(colorsMapping[key], null));
            // Update path colors with proper selectors and transitions
            svg
                .selectAll(`.line[data-label="${key}"]`)
                .transition()
                .duration(TRANSITION_DURATION)
                .ease(d3.easeQuadOut) // Add consistent easing
                .attr("stroke", getColor(colorsMapping[key], null))
                .attr("stroke-width", 2.5);
            // Update path overlay colors with transitions
            svg
                .selectAll(`.line-overlay[data-label="${key}"]`)
                .transition()
                .duration(TRANSITION_DURATION)
                .ease(d3.easeQuadOut) // Add consistent easing
                .attr("stroke", getColor(colorsMapping[key], null));
        }
    }, [colorsMapping, getColor]);
    (0, react_1.useLayoutEffect)(() => {
        const svg = d3.select(svgRef.current);
        svg.selectAll(".data-group").each(function () {
            const dataLabel = d3.select(this).attr("data-label");
            const isDisabled = disabledItems.includes(dataLabel);
            const opacity = isDisabled ? 0.05 : 1;
            d3.select(this).transition().duration(TRANSITION_DURATION).style("opacity", opacity);
        });
        if (highlightItems.length === 0) {
            d3.select("#tooltip").style("visibility", "hidden");
        }
    }, [highlightItems]);
    const handleHover = (0, react_1.useCallback)((event) => {
        if (!svgRef.current || !tooltipRef.current)
            return;
        const [x, y] = d3.pointer(event, event.currentTarget);
        const xValue = xScale.invert(x);
        const tooltipTitle = `<div class="tooltip-title">${xValue}</div>`;
        const tooltipContent = filteredDataSet
            .map(data => {
            const yValue = getYValueAtX(data.series, xValue);
            return `<div>${data.label}: ${yValue !== null && yValue !== void 0 ? yValue : "N/A"}</div>`;
        })
            .join("");
        const tooltip = tooltipRef.current;
        tooltip.innerHTML = `<div style="background: #fff; padding: 5px">${tooltipTitle}${tooltipContent}</div>`;
        // Make tooltip visible to calculate its dimensions
        tooltip.style.opacity = "1";
        tooltip.style.visibility = "visible";
        tooltip.style.pointerEvents = "auto";
        // Get dimensions to check for overflow
        const tooltipRect = tooltip.getBoundingClientRect();
        const svgRect = svgRef.current.getBoundingClientRect();
        // Check for right edge overflow
        if (x + tooltipRect.width > svgRect.width - margin.right) {
            tooltip.style.left = x - tooltipRect.width - 10 + "px";
        }
        else {
            tooltip.style.left = x + 10 + "px";
        }
        // Check for top/bottom edge overflow
        if (y - tooltipRect.height < margin.top) {
            tooltip.style.top = y + 10 + "px";
        }
        else {
            tooltip.style.top = y - tooltipRect.height - 5 + "px";
        }
        const hoverLinesGroup = d3.select(svgRef.current).select(".hover-lines");
        const hoverLine = hoverLinesGroup.select(".hover-line");
        const xPosition = xScale(xValue);
        hoverLine
            .attr("x1", xPosition)
            .attr("x2", xPosition)
            .attr("y1", MARGIN.top)
            .attr("y2", HEIGHT - MARGIN.bottom + 20)
            .style("display", "block");
        hoverLinesGroup.style("display", "block");
    }, [xScale, filteredDataSet, getYValueAtX, margin]);
    const handleCombinedMouseOut = (0, react_1.useCallback)(() => {
        if (!tooltipRef.current || !svgRef.current)
            return;
        const tooltip = tooltipRef.current;
        tooltip.style.visibility = "hidden";
        tooltip.style.opacity = "0";
        tooltip.innerHTML = "";
        const hoverLinesGroup = d3.select(svgRef.current).select(".hover-lines");
        const hoverLine = hoverLinesGroup.select(".hover-line");
        hoverLinesGroup.style("display", "none");
        hoverLine.style("display", "none");
    }, []);
    (0, react_1.useLayoutEffect)(() => {
        if (!showCombined || !svgRef.current)
            return;
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
    }, [showCombined, width, height, handleHover, handleCombinedMouseOut]);
    const displayIsNodata = (0, useDisplayIsNodata_1.useDisplayIsNodata)({
        dataSet: dataSet,
        isLoading: isLoading,
        isNodataComponent: isNodataComponent,
        isNodata: isNodata,
    });
    (0, react_1.useLayoutEffect)(() => {
        renderCompleteRef.current = true;
    }, []);
    (0, react_1.useLayoutEffect)(() => {
        if (renderCompleteRef.current && onChartDataProcessed) {
            // Extract all dates from all series
            const allDates = dataSet.flatMap(set => set.series.map(point => (xAxisDataType === "number" ? point.date : String(point.date))));
            // Create unique dates array
            const uniqueDates = [...new Set(allDates)];
            // Sort and filter series based on values at the filter date if filter exists
            let visibleSeries = dataSet.map(d => d.label);
            if (filter === null || filter === void 0 ? void 0 : filter.date) {
                visibleSeries = visibleSeries.sort((a, b) => {
                    var _a, _b;
                    const aData = dataSet.find(d => d.label === a);
                    const bData = dataSet.find(d => d.label === b);
                    const aValue = ((_a = aData === null || aData === void 0 ? void 0 : aData.series.find(d => String(d.date) === String(filter.date))) === null || _a === void 0 ? void 0 : _a.value) || 0;
                    const bValue = ((_b = bData === null || bData === void 0 ? void 0 : bData.series.find(d => String(d.date) === String(filter.date))) === null || _b === void 0 ? void 0 : _b.value) || 0;
                    return filter.sortingDir === "desc" ? bValue - aValue : aValue - bValue;
                });
                // Apply limit if specified
                if (filter.limit) {
                    visibleSeries = visibleSeries.slice(0, filter.limit);
                }
            }
            const currentMetadata = {
                xAxisDomain: uniqueDates.map(String),
                yAxisDomain: yScale.domain(),
                visibleItems: visibleSeries.filter(label => {
                    var _a;
                    return !disabledItems.includes(label) &&
                        ((_a = dataSet.find(d => d.label === label)) === null || _a === void 0 ? void 0 : _a.series.length) > 0;
                }),
                renderedData: lineData.reduce((acc, item) => {
                    // Only include data for visible series
                    if (item.points.length > 0 && visibleSeries.includes(item.label)) {
                        acc[item.label] = item.points;
                    }
                    return acc;
                }, {}),
                chartType: "line-chart",
            };
            // Check if data has actually changed
            const hasChanged = !prevChartDataRef.current ||
                JSON.stringify(prevChartDataRef.current.xAxisDomain) !==
                    JSON.stringify(currentMetadata.xAxisDomain) ||
                JSON.stringify(prevChartDataRef.current.yAxisDomain) !==
                    JSON.stringify(currentMetadata.yAxisDomain) ||
                JSON.stringify(prevChartDataRef.current.visibleItems) !==
                    JSON.stringify(currentMetadata.visibleItems) ||
                JSON.stringify(Object.keys(prevChartDataRef.current.renderedData).sort()) !==
                    JSON.stringify(Object.keys(currentMetadata.renderedData).sort());
            // Always update the ref with latest metadata
            prevChartDataRef.current = currentMetadata;
            // Only call callback if data has changed
            if (hasChanged) {
                onChartDataProcessed(currentMetadata);
            }
        }
    }, [dataSet, xAxisDataType, yScale, disabledItems, lineData, filter, onChartDataProcessed]);
    return ((0, jsx_runtime_1.jsxs)(LineChartContainer, { children: [(0, jsx_runtime_1.jsxs)("svg", { xmlns: "http://www.w3.org/2000/svg", ref: svgRef, width: width, height: height, onMouseOut: handleChartMouseOut, children: [children, (0, jsx_runtime_1.jsx)(Title_1.default, { x: width / 2, y: margin.top / 2, children: title }), filteredDataSet.length > 0 && ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(XaxisLinear_1.default, { xScale: xScale, height: height, margin: margin, xAxisFormat: xAxisFormat, xAxisDataType: xAxisDataType, ticks: ticks, tickValues: xTickValues }), (0, jsx_runtime_1.jsx)(YaxisLinear_1.default, { yScale: yScale, width: width, height: height, margin: margin, highlightZeroLine: true, yAxisFormat: yAxisFormat })] }))] }), showLoadingIndicator && ((0, jsx_runtime_1.jsx)("div", { style: {
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    background: "rgba(255, 255, 255, 0.7)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 10,
                }, children: isLoadingComponent || (0, jsx_runtime_1.jsx)(LoadingIndicator_1.default, {}) })), (0, jsx_runtime_1.jsx)("div", { ref: tooltipRef, className: "tooltip", style: {
                    position: "absolute",
                    visibility: "hidden",
                    transition: "visibility 0.1s ease-out, opacity 0.1s ease-out",
                    willChange: "visibility, opacity, top, left",
                    zIndex: 1000,
                    pointerEvents: "none",
                    padding: "5px",
                    borderRadius: "4px",
                    whiteSpace: "nowrap",
                } }), displayIsNodata && (0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: isNodataComponent })] }));
};
exports.default = LineChart;

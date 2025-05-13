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
const useDefaultConfig_1 = __importDefault(require("./hooks/useDefaultConfig"));
const d3 = __importStar(require("d3"));
const Title_1 = __importDefault(require("./shared/Title"));
const XaxisLinear_1 = __importDefault(require("./shared/XaxisLinear"));
const XaxisBand_1 = __importDefault(require("./shared/XaxisBand"));
const YaxisLinear_1 = __importDefault(require("./shared/YaxisLinear"));
const MichiVzProvider_1 = require("./MichiVzProvider");
const helpers_1 = require("../components/shared/helpers");
const useDisplayIsNodata_1 = require("./hooks/useDisplayIsNodata");
const styled_components_1 = __importDefault(require("styled-components"));
const use_deep_compare_effect_1 = __importDefault(require("use-deep-compare-effect"));
const LoadingIndicator_1 = __importDefault(require("./shared/LoadingIndicator"));
const Styled = styled_components_1.default.div `
  .shape {
    width: 100%;
    height: 100%;
    background-color: var(--data-background);
  }

  .shape-circle {
    border-radius: 50%;
  }

  .shape-square {
    border-radius: 0;
  }

  .shape-triangle {
    width: 0;
    height: 0;
    border-width: 0 calc(var(--data-size) / 2) var(--data-size) calc(var(--data-size) / 2);
    border-color: transparent transparent var(--data-background) transparent;
    border-style: solid;
    background: transparent !important;
  }

  circle,
  rect,
  path {
    transition-property: all;
    transition-duration: 0.1s;
    transition-timing-function: ease-out;
    transition-behavior: allow-discrete;
  }

  /* Override any existing tooltip styles */
  .tooltip {
    position: absolute !important;
    display: none !important;
    padding: 10px !important;
    background-color: rgba(0, 0, 0, 0.8) !important;
    color: white !important;
    border-radius: 5px !important;
    pointer-events: none !important;
    z-index: 1000 !important;
    font-size: 12px !important;
    white-space: nowrap !important;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2) !important;
    transform: none !important;
    transition: none !important;
    animation: none !important;
  }
`;
const ScatterPlotChart = ({ dataSet = [], width = useDefaultConfig_1.default.WIDTH, height = useDefaultConfig_1.default.HEIGHT, margin = useDefaultConfig_1.default.MARGIN, title, children, isLoading = false, isLoadingComponent, isNodataComponent, isNodata, xAxisFormat, yAxisFormat, yTicksQty, xAxisDataType = "number", tooltipFormatter, showGrid = useDefaultConfig_1.default.SHOW_GRID, xAxisDomain, yAxisDomain, dScaleLegend, dScaleLegendFormatter, filter, onChartDataProcessed, onHighlightItem, }) => {
    const ref = (0, react_1.useRef)(null);
    const tooltipRef = (0, react_1.useRef)(null);
    const svgContainerRef = (0, react_1.useRef)(null);
    const [activePoint, setActivePoint] = (0, react_1.useState)(null);
    const { colorsMapping, highlightItems, disabledItems } = (0, MichiVzProvider_1.useChartContext)();
    const renderCompleteRef = (0, react_1.useRef)(false);
    // Add ref for previous data comparison
    const prevChartDataRef = (0, react_1.useRef)(null);
    (0, react_1.useLayoutEffect)(() => {
        renderCompleteRef.current = true;
    }, []);
    // Apply filtering based on filter prop, now including date filtering
    const filteredDataSet = (0, react_1.useMemo)(() => {
        if (!filter)
            return dataSet;
        // First filter by date if specified
        let dateFiltered = dataSet;
        if (filter.date) {
            dateFiltered = dataSet.filter(d => d.date === filter.date);
        }
        // Then filter out disabledItems
        const filteredByDisabled = dateFiltered.filter(d => !disabledItems.includes(d.label));
        // Sort by the specified criteria
        return filteredByDisabled
            .slice() // Create a copy to avoid mutating the original
            .sort((a, b) => {
            const aVal = a[filter.criteria];
            const bVal = b[filter.criteria];
            return filter.sortingDir === "desc" ? bVal - aVal : aVal - bVal;
        })
            .slice(0, filter.limit); // Take only the first 'limit' items
    }, [dataSet, filter, disabledItems]);
    // Sort data points by 'd' value in descending order for rendering
    // This ensures larger circles are rendered first (appear at the back)
    const renderOrderedDataSet = (0, react_1.useMemo)(() => {
        return [...filteredDataSet].sort((a, b) => b.d - a.d);
    }, [filteredDataSet]);
    // Use filteredDataSet instead of dataSet in all calculations
    const xValues = (0, react_1.useMemo)(() => filteredDataSet.map(d => d.x || 0), [filteredDataSet]);
    const yValues = (0, react_1.useMemo)(() => filteredDataSet.map(d => d.y || 0), [filteredDataSet]);
    const xDomain = (0, react_1.useMemo)(() => [0, Math.max(...xValues) || 0], [xValues]);
    const yDomain = (0, react_1.useMemo)(() => [0, Math.max(...yValues) || 0], [yValues]);
    const xScale = (0, react_1.useMemo)(() => {
        var _a;
        if (xAxisDataType === "number") {
            return d3
                .scaleLinear()
                .domain((_a = xAxisDomain) !== null && _a !== void 0 ? _a : xDomain)
                .range([margin.left, width - margin.right])
                .nice()
                .clamp(true);
        }
        if (xAxisDataType === "date_annual" || xAxisDataType === "date_monthly") {
            return d3
                .scaleTime()
                .domain(xDomain)
                .range([margin.left, width - margin.right])
                .nice()
                .clamp(true);
        }
        if (xAxisDataType === "band") {
            return d3
                .scaleBand()
                .domain(dataSet.map(d => d.label)) // Assuming dataSet has labels for bands
                .range([margin.left, width - margin.right])
                .padding(0.1); // Adjust padding as needed
        }
    }, [xDomain, width, margin]);
    const yScale = (0, react_1.useMemo)(() => {
        var _a;
        return d3
            .scaleLinear()
            .domain((_a = yAxisDomain) !== null && _a !== void 0 ? _a : yDomain)
            .range([height - margin.bottom, margin.top]);
    }, [yDomain, height, margin]);
    const dValues = (0, react_1.useMemo)(() => dataSet.map(d => d.d), [dataSet]);
    const dMax = (0, react_1.useMemo)(() => Math.max(...dValues), [dValues]);
    const dMin = (0, react_1.useMemo)(() => Math.min(...dValues), [dValues]);
    // const dDomain = dMax === dMin ? [0, dMax] : [dMin, dMax];
    const dDomain = (0, react_1.useMemo)(() => (dMax === dMin ? [0, dMax] : [dMin, dMax]), [dMin, dMax]);
    // dScale is scaleQuantile
    const dScale = (0, react_1.useMemo)(() => d3.scaleLinear().domain(dDomain).range([16, 80]), [dDomain, height, width, margin]);
    const dLegendPosition = (0, react_1.useMemo)(() => ({
        x: width - 100,
        y: height / 3,
    }), [width, height]);
    const getXValue = (0, react_1.useCallback)((d) => {
        const offSet = "bandwidth" in xScale ? (xScale === null || xScale === void 0 ? void 0 : xScale.bandwidth()) / 2 : 0;
        return xAxisDataType === "band" ? xScale(d.label) + offSet : xScale(d.x);
    }, [xScale, xAxisDataType]);
    (0, react_1.useEffect)(() => {
        const svg = d3.select(ref.current);
        if (highlightItems.length === 0) {
            svg.selectAll("foreignObject").style("opacity", 0.9);
            return;
        }
        svg.selectAll("foreignObject[data-label]").style("opacity", 0.1);
        highlightItems.forEach(label => {
            svg.selectAll(`foreignObject[data-label="${label}"]`).style("opacity", 1);
        });
    }, [highlightItems]);
    // Create tooltip element in DOM on first render
    (0, react_1.useEffect)(() => {
        if (!tooltipRef.current) {
            const tooltip = document.createElement("div");
            tooltip.className = "tooltip";
            tooltip.style.cssText = `
        position: absolute;
        background-color: #fff;
        display: none;
        padding: 10px;
        border-radius: 5px;
        pointer-events: none;
        z-index: 1000;
        transition: none;
        animation: none;
        transform: none;
      `;
            document.body.appendChild(tooltip);
            tooltipRef.current = tooltip;
        }
        return () => {
            if (tooltipRef.current) {
                document.body.removeChild(tooltipRef.current);
            }
        };
    }, []);
    const handleMouseEnter = (0, react_1.useCallback)((event, d) => {
        setActivePoint(d);
        onHighlightItem([d.label]);
        if (!tooltipRef.current)
            return;
        // Get mouse position relative to document
        const x = event.clientX;
        const y = event.clientY;
        // Create tooltip content
        let content = "";
        if (tooltipFormatter) {
            content = tooltipFormatter(d);
        }
        else {
            content = `
          <div>
            <div>${d.label}</div>
            <div>${xAxisFormat ? xAxisFormat(d.x) : d.x}</div>
            <div>${yAxisFormat ? yAxisFormat(d.y) : d.y}</div>
          </div>
        `;
        }
        // Apply content and position at once
        tooltipRef.current.innerHTML = content;
        tooltipRef.current.style.left = `${x + 10}px`;
        tooltipRef.current.style.top = `${y - 10}px`;
        tooltipRef.current.style.display = "block";
    }, [onHighlightItem, tooltipFormatter, xAxisFormat, yAxisFormat]);
    const handleSvgMouseMove = (0, react_1.useCallback)(event => {
        if (activePoint && tooltipRef.current) {
            // Update tooltip position directly with client coordinates
            tooltipRef.current.style.left = `${event.clientX + 10}px`;
            tooltipRef.current.style.top = `${event.clientY - 10}px`;
        }
    }, [activePoint]);
    const handleMouseLeave = (0, react_1.useCallback)(() => {
        setActivePoint(null);
        onHighlightItem([]);
        if (tooltipRef.current) {
            tooltipRef.current.style.display = "none";
        }
    }, [onHighlightItem]);
    const displayIsNodata = (0, useDisplayIsNodata_1.useDisplayIsNodata)({
        dataSet,
        isLoading,
        isNodataComponent,
        isNodata,
    });
    // Move useDeepCompareEffect here, before any conditional returns
    (0, use_deep_compare_effect_1.default)(() => {
        if (renderCompleteRef.current && onChartDataProcessed) {
            const currentMetadata = {
                xAxisDomain: xValues.map(String),
                yAxisDomain: yScale.domain(),
                visibleItems: filteredDataSet.map(d => d.label),
                renderedData: {
                    points: renderOrderedDataSet,
                },
                chartType: "scatter-plot-chart",
            };
            const hasChanged = !prevChartDataRef.current ||
                JSON.stringify(prevChartDataRef.current.xAxisDomain) !==
                    JSON.stringify(currentMetadata.xAxisDomain) ||
                JSON.stringify(prevChartDataRef.current.yAxisDomain) !==
                    JSON.stringify(currentMetadata.yAxisDomain) ||
                JSON.stringify(prevChartDataRef.current.visibleItems) !==
                    JSON.stringify(currentMetadata.visibleItems) ||
                JSON.stringify(Object.keys(prevChartDataRef.current.renderedData).sort()) !==
                    JSON.stringify(Object.keys(currentMetadata.renderedData).sort());
            if (hasChanged) {
                onChartDataProcessed(currentMetadata);
            }
            prevChartDataRef.current = currentMetadata;
        }
    }, [renderOrderedDataSet, xValues, yScale, filteredDataSet, onChartDataProcessed]);
    return ((0, jsx_runtime_1.jsx)(Styled, { style: { position: "relative" }, children: (0, jsx_runtime_1.jsxs)("div", { ref: svgContainerRef, style: { position: "relative", width: width, height: height }, children: [isLoading ? ((0, jsx_runtime_1.jsx)(LoadingIndicator_1.default, {})) : ((0, jsx_runtime_1.jsx)(react_1.Suspense, { fallback: (0, jsx_runtime_1.jsx)(LoadingIndicator_1.default, {}), children: (0, jsx_runtime_1.jsxs)("svg", { width: width, height: height, ref: ref, onMouseMove: handleSvgMouseMove, children: [(0, jsx_runtime_1.jsx)(Title_1.default, { x: width / 2, y: margin.top / 2, children: title }), children, renderOrderedDataSet
                                .filter(d => !disabledItems.includes(d.label))
                                .map((d, i) => {
                                const x = getXValue(d);
                                const y = yScale(d.y);
                                const size = xAxisDataType === "band" ? d.d / 2 : dScale(d.d);
                                const radius = size / 2;
                                const fill = (colorsMapping === null || colorsMapping === void 0 ? void 0 : colorsMapping[d.label]) || d.color || "transparent";
                                // Function to create the right shape based on the shape prop
                                return ((0, jsx_runtime_1.jsx)("g", { transform: `translate(${x}, ${y})`, opacity: 0.9, "data-label": d.label, onMouseEnter: event => handleMouseEnter(event, d), onMouseLeave: handleMouseLeave, children: d.shape === "square" ? ((0, jsx_runtime_1.jsx)("rect", { x: -radius, y: -radius, width: size, height: size, fill: fill, stroke: "#fff", strokeWidth: 2 })) : d.shape === "triangle" ? ((0, jsx_runtime_1.jsx)("path", { d: `M0,${-radius} L${radius},${radius} L${-radius},${radius} Z`, fill: fill, stroke: "#fff", strokeWidth: 2 })) : (
                                    // Default is circle
                                    (0, jsx_runtime_1.jsx)("circle", { r: radius, fill: fill, stroke: "#fff", strokeWidth: 2 })) }, i));
                            }), !isLoading && dataSet.length && ((0, jsx_runtime_1.jsxs)("g", { className: "michi-vz-legend", children: [dScaleLegendFormatter && dScaleLegendFormatter(dDomain, dScale), (dScaleLegend === null || dScaleLegend === void 0 ? void 0 : dScaleLegend.title) && ((0, jsx_runtime_1.jsx)("text", { x: dLegendPosition.x, y: dLegendPosition.y - 120, textAnchor: "middle", children: dScaleLegend === null || dScaleLegend === void 0 ? void 0 : dScaleLegend.title })), (0, jsx_runtime_1.jsx)("path", { d: (0, helpers_1.drawHalfLeftCircle)(dLegendPosition.x, dLegendPosition.y, 40, 40), fill: "none", stroke: "#ccc" }), (0, jsx_runtime_1.jsx)("path", { d: (0, helpers_1.drawHalfLeftCircle)(dLegendPosition.x, dLegendPosition.y, 20, 20), fill: "none", stroke: "#ccc" }), (0, jsx_runtime_1.jsx)("path", { d: (0, helpers_1.drawHalfLeftCircle)(dLegendPosition.x, dLegendPosition.y, 8, 8), fill: "none", stroke: "#ccc" }), (0, jsx_runtime_1.jsx)("text", { x: dLegendPosition.x, y: dLegendPosition.y, children: (dScaleLegend === null || dScaleLegend === void 0 ? void 0 : dScaleLegend.valueFormatter)
                                            ? dScaleLegend.valueFormatter(dScale.invert(16))
                                            : dScale.invert(16) }), (0, jsx_runtime_1.jsx)("text", { x: dLegendPosition.x, y: dLegendPosition.y - 40, children: (dScaleLegend === null || dScaleLegend === void 0 ? void 0 : dScaleLegend.valueFormatter)
                                            ? dScaleLegend.valueFormatter(dScale.invert(40))
                                            : dScale.invert(40) }), (0, jsx_runtime_1.jsx)("text", { x: dLegendPosition.x, y: dLegendPosition.y - 80, children: (dScaleLegend === null || dScaleLegend === void 0 ? void 0 : dScaleLegend.valueFormatter)
                                            ? dScaleLegend.valueFormatter(dScale.invert(80))
                                            : dScale.invert(80) })] })), xAxisDataType === "number" ||
                                xAxisDataType === "date_annual" ||
                                xAxisDataType === "date_monthly" ? ((0, jsx_runtime_1.jsx)(XaxisLinear_1.default, { xScale: xScale, height: height, margin: margin, xAxisFormat: xAxisFormat, xAxisDataType: xAxisDataType, ticks: 5, showGrid: (showGrid === null || showGrid === void 0 ? void 0 : showGrid.x) || false })) : ((0, jsx_runtime_1.jsx)(XaxisBand_1.default, { xScale: xScale, height: height, margin: margin, xAxisFormat: xAxisFormat })), (0, jsx_runtime_1.jsx)(YaxisLinear_1.default, { yScale: yScale, width: width, height: height, margin: margin, yAxisFormat: yAxisFormat, yTicksQty: yTicksQty })] }) })), isLoading && isLoadingComponent && (0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: isLoadingComponent }), displayIsNodata && (0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: isNodataComponent })] }) }));
};
exports.default = ScatterPlotChart;

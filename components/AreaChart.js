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
const MichiVzProvider_1 = require("./MichiVzProvider");
const XaxisLinear_1 = __importDefault(require("./shared/XaxisLinear"));
const LoadingIndicator_1 = __importDefault(require("./shared/LoadingIndicator"));
const useDisplayIsNodata_1 = require("./hooks/useDisplayIsNodata");
const use_deep_compare_effect_1 = __importDefault(require("use-deep-compare-effect"));
const styled_components_1 = __importDefault(require("styled-components"));
const AreaChartContainer = styled_components_1.default.div `
  position: relative;
  contain: layout paint;
  content-visibility: auto;
  path {
    transition: fill 0.1s ease-out;
    will-change: fill;
    transition-behavior: allow-discrete;
  }
`;
const MARGIN = { top: 50, right: 50, bottom: 50, left: 50 };
const WIDTH = 900;
const HEIGHT = 480;
const AreaChart = ({ series, width = WIDTH, height = HEIGHT, margin = MARGIN, title, keys, xAxisFormat, yAxisFormat, yAxisDomain = null, tooltipFormatter = null, xAxisDataType = "number", children, isLoading = false, isLoadingComponent, isNodataComponent, isNodata, onChartDataProcessed, onHighlightItem, filter, ticks = 5, }) => {
    const { colorsMapping, highlightItems, disabledItems } = (0, MichiVzProvider_1.useChartContext)();
    const ref = (0, react_1.useRef)(null);
    const [hoveredDate] = (0, react_1.useState)(null);
    const renderCompleteRef = (0, react_1.useRef)(false);
    const prevChartDataRef = (0, react_1.useRef)(null);
    const xScale = (0, react_1.useMemo)(() => {
        if (xAxisDataType === "number") {
            return d3
                .scaleLinear()
                .domain([d3.min(series, d => d.date || 0), d3.max(series, d => d.date || 1)])
                .range([margin.left, width - margin.right])
                .clamp(true)
                .nice();
        }
        const minDate = d3.min(series.map(d => new Date(xAxisDataType === "date_annual" ? `${d.date} 01 01` : d.date)));
        const maxDate = d3.max(series.map(d => new Date(d.date)));
        return d3
            .scaleTime()
            .domain([minDate || 0, maxDate || 1])
            .range([MARGIN.left, width - margin.right]);
        // .nice();
    }, [series, width, height, disabledItems, xAxisDataType]);
    // yScale
    const yScaleDomain = (0, react_1.useMemo)(() => {
        if (yAxisDomain) {
            return yAxisDomain;
        }
        // return the max value of the sum of all the keys, don't count the date
        const max = d3.max(series, d => d3.sum(Object.keys(d)
            .filter(key => !disabledItems.includes(key))
            .map(key => (key === "date" ? 0 : d[key] || 0))) || 0);
        return [0, max];
    }, [series, keys]);
    const yScale = (0, react_1.useMemo)(() => d3
        .scaleLinear()
        .domain(yScaleDomain)
        .range([height - margin.bottom, margin.top])
        .clamp(true)
        .nice(), [series, width, height, margin]);
    const stackedData = (0, react_1.useMemo)(() => {
        return d3.stack().keys(keys)(series);
    }, [series, keys]);
    const prepareAreaData = () => {
        return stackedData.map((keyData, index) => {
            return {
                key: keys[index],
                values: keyData,
                fill: colorsMapping[keys[index]],
            };
        });
    };
    const areaGenerator = d3
        .area()
        .defined(() => true)
        .x(d => {
        if (xAxisDataType === "number") {
            return xScale(d.data.date);
        }
        else {
            // Assuming d.data.date is a JavaScript Date object
            return xScale(new Date(d.data.date).getTime());
        }
    })
        .y0(d => yScale(d[0] || 0))
        .y1(d => yScale(d[1] || 0))
        .curve(d3.curveMonotoneX);
    const handleAreaSegmentHover = (dataPoint, key) => {
        var _a;
        if (tooltipFormatter) {
            return tooltipFormatter(dataPoint, series, key);
        }
        return `
        <div style="background: #fff; padding: 5px">
            <p>${dataPoint.date}</p>
            <p style="color:${colorsMapping[key]}">${key}: ${(_a = dataPoint[key]) !== null && _a !== void 0 ? _a : "N/A"}</p>
        </div>`;
    };
    const displayIsNodata = (0, useDisplayIsNodata_1.useDisplayIsNodata)({
        dataSet: series,
        isLoading: isLoading,
        isNodataComponent: isNodataComponent,
        isNodata: isNodata,
    });
    (0, react_1.useLayoutEffect)(() => {
        renderCompleteRef.current = true;
    }, []);
    (0, use_deep_compare_effect_1.default)(() => {
        if (renderCompleteRef.current && onChartDataProcessed) {
            // Get the domain from xScale
            let domain;
            if (xAxisDataType === "number") {
                domain = [d3.min(series, d => d.date || 0), d3.max(series, d => d.date || 1)];
            }
            else {
                // For date types, ensure unique dates
                domain = [...new Set(series.map(d => d.date))];
            }
            // Ensure yScaleDomain is always a tuple with 2 elements
            const safeYDomain = Array.isArray(yScaleDomain) && yScaleDomain.length === 2
                ? yScaleDomain
                : [0, yScaleDomain[1] || 0];
            // Sort keys based on values at the filter date if filter exists
            let sortedKeys = keys;
            if (filter === null || filter === void 0 ? void 0 : filter.date) {
                sortedKeys = [...keys].sort((a, b) => {
                    var _a, _b;
                    const aValue = ((_a = series.find(d => String(d.date) === String(filter.date))) === null || _a === void 0 ? void 0 : _a[a]) || 0;
                    const bValue = ((_b = series.find(d => String(d.date) === String(filter.date))) === null || _b === void 0 ? void 0 : _b[b]) || 0;
                    return filter.sortingDir === "desc" ? bValue - aValue : aValue - bValue;
                });
            }
            const currentMetadata = {
                xAxisDomain: domain.map(String),
                yAxisDomain: safeYDomain,
                visibleItems: sortedKeys.filter(key => !disabledItems.includes(key)),
                renderedData: {
                    [keys[0]]: series,
                },
                chartType: "area-chart",
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
    }, [series, xAxisDataType, yScaleDomain, keys, disabledItems, filter, onChartDataProcessed]);
    return ((0, jsx_runtime_1.jsxs)(AreaChartContainer, { children: [(0, jsx_runtime_1.jsx)("div", { className: "tooltip", style: {
                    position: "absolute",
                    background: "white",
                    padding: "5px",
                    pointerEvents: "none",
                    zIndex: 1000,
                    visibility: "hidden", // Initially hidden
                } }), (0, jsx_runtime_1.jsxs)("svg", { className: "chart", ref: ref, width: width, height: height, style: { overflow: "visible" }, onMouseOut: event => {
                    // Only clear highlight if mouse leaves the SVG container
                    const target = event.relatedTarget;
                    if (!target || !target.closest("svg.chart")) {
                        d3.select(".tooltip").style("visibility", "hidden");
                        onHighlightItem === null || onHighlightItem === void 0 ? void 0 : onHighlightItem([]);
                    }
                }, children: [children, (0, jsx_runtime_1.jsx)(Title_1.default, { x: width / 2, y: MARGIN.top / 2, children: title }), (0, jsx_runtime_1.jsx)(XaxisLinear_1.default, { xScale: xScale, height: height, margin: margin, xAxisFormat: xAxisFormat, xAxisDataType: xAxisDataType, ticks: ticks }), (0, jsx_runtime_1.jsx)(YaxisLinear_1.default, { yScale: yScale, width: width, height: height, margin: margin, highlightZeroLine: true, yAxisFormat: yAxisFormat }), (0, jsx_runtime_1.jsx)("g", { children: prepareAreaData().map(areaData => ((0, jsx_runtime_1.jsxs)(react_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("path", { d: areaGenerator(areaData.values), fill: areaData.fill ? areaData.fill : "#fdfdfd", stroke: "#fff", strokeWidth: 1, opacity: highlightItems.length === 0 || highlightItems.includes(areaData.key) ? 1 : 0.2, onMouseMove: event => {
                                        event.stopPropagation();
                                        onHighlightItem([areaData.key]);
                                    }, onMouseOut: event => {
                                        // Don't clear highlight if moving to a rect element
                                        const target = event.relatedTarget;
                                        if (!target || !target.classList.contains("rect-hover")) {
                                            event.stopPropagation();
                                            onHighlightItem([]);
                                        }
                                    } }), areaData.values.map(dataPoint => ((0, jsx_runtime_1.jsx)("rect", { className: "rect-hover", x: xScale(xAxisDataType === "number"
                                        ? dataPoint.data.date
                                        : new Date(dataPoint.data.date)) - 2, y: yScale(dataPoint[1] || 0), width: 8, strokeWidth: 1, rx: 3, ry: 3, stroke: "#ccc", 
                                    // Handle null values
                                    height: yScale(dataPoint[0] || 0) - yScale(dataPoint[1] || 0), fill: "#fff", opacity: highlightItems.includes(areaData.key) ? 0.5 : 0, onMouseEnter: event => {
                                        event.stopPropagation();
                                        onHighlightItem([areaData.key]);
                                        d3.select(".tooltip")
                                            .style("visibility", "visible")
                                            .html(handleAreaSegmentHover(dataPoint.data, areaData.key));
                                        const [x, y] = d3.pointer(event);
                                        const tooltip = d3.select(".tooltip").node();
                                        const tooltipWidth = tooltip.getBoundingClientRect().width;
                                        const tooltipHeight = tooltip.getBoundingClientRect().height;
                                        d3.select(".tooltip")
                                            .style("left", x - tooltipWidth / 2 + "px")
                                            .style("top", y - tooltipHeight - 10 + "px");
                                    }, onMouseOut: event => {
                                        // Don't clear highlight if moving to another rect or the path
                                        const target = event.relatedTarget;
                                        if (!target ||
                                            (!target.classList.contains("rect-hover") &&
                                                target.tagName.toLowerCase() !== "path")) {
                                            event.stopPropagation();
                                            onHighlightItem([]);
                                            d3.select(".tooltip").style("visibility", "hidden");
                                        }
                                    } }, `${areaData.key}-${dataPoint.data.date}`))), hoveredDate !== null && ((0, jsx_runtime_1.jsx)("line", { className: "hover-line", x1: xScale(hoveredDate), x2: xScale(hoveredDate), y1: margin.top, y2: height - margin.bottom, stroke: "#666", strokeWidth: 1 }))] }, areaData.key))) })] }), isLoading && isLoadingComponent && (0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: isLoadingComponent }), isLoading && !isLoadingComponent && (0, jsx_runtime_1.jsx)(LoadingIndicator_1.default, {}), displayIsNodata && (0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: isNodataComponent })] }));
};
exports.default = AreaChart;

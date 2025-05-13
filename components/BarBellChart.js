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
const react_1 = __importStar(require("react"));
const Title_1 = __importDefault(require("./shared/Title"));
const useDefaultConfig_1 = __importDefault(require("./hooks/useDefaultConfig"));
const d3 = __importStar(require("d3"));
const d3_1 = require("d3");
const YaxisBand_1 = __importDefault(require("./shared/YaxisBand"));
const XaxisLinear_1 = __importDefault(require("./shared/XaxisLinear"));
const MichiVzProvider_1 = require("./MichiVzProvider");
const useDisplayIsNodata_1 = require("./hooks/useDisplayIsNodata");
const LoadingIndicator_1 = __importDefault(require("./shared/LoadingIndicator"));
const BarBellChart = ({ dataSet = [], keys = [], width = useDefaultConfig_1.default.WIDTH, height = useDefaultConfig_1.default.HEIGHT, margin = useDefaultConfig_1.default.MARGIN, title, children, isLoading, isLoadingComponent, isNodataComponent, isNodata, xAxisDataType, yAxisFormat, xAxisFormat, tooltipFormat = null, showGrid = useDefaultConfig_1.default.SHOW_GRID, onChartDataProcessed, onHighlightItem, filter, }) => {
    const { colorsMapping, highlightItems, disabledItems } = (0, MichiVzProvider_1.useChartContext)();
    const ref = (0, react_1.useRef)(null);
    const refTooltip = (0, react_1.useRef)(null);
    const renderCompleteRef = (0, react_1.useRef)(false);
    const prevChartDataRef = (0, react_1.useRef)(null);
    (0, react_1.useLayoutEffect)(() => {
        renderCompleteRef.current = true;
    }, []);
    const generateTooltip = (d, currentKey, currentValue, event) => {
        event.preventDefault();
        event.stopPropagation();
        const [x, y] = d3.pointer(event, ref.current);
        let content;
        if (tooltipFormat) {
            content = tooltipFormat(d, currentKey, currentValue);
        }
        else {
            content = `${d === null || d === void 0 ? void 0 : d.date}: ${currentKey} - ${currentValue}`;
        }
        const tooltip = refTooltip.current;
        if (tooltip) {
            tooltip.style.top = `${y}px`;
            tooltip.style.left = `${x}px`;
            tooltip.style.opacity = "1";
            tooltip.style.visibility = "visible";
            tooltip.innerHTML = content;
        }
    };
    const hideTooltip = () => {
        const tooltip = refTooltip.current;
        if (tooltip) {
            tooltip.style.opacity = "0";
            tooltip.style.visibility = "hidden";
        }
    };
    const yValues = dataSet.map(d => d.date).map(date => date);
    const yScale = (0, d3_1.scaleBand)()
        .domain(yValues.map(value => {
        return `${value}`;
    }))
        .range([margin.top + 20, height - margin.bottom]);
    // xValues is the sum of all values which their key is not "date"
    const xValues = dataSet.map(d => {
        let sum = 0;
        for (const key in d) {
            if (key !== "date" && disabledItems.includes(key) === false) {
                sum += d[key] || 0;
            }
        }
        return sum;
    });
    const maxValueX = Math.max(...xValues) === 0 ? 1 : Math.max(...xValues);
    const xScale = (0, d3_1.scaleLinear)()
        .domain([0, maxValueX])
        .range([0, width - margin.left - margin.right])
        .nice()
        .clamp(true);
    (0, react_1.useEffect)(() => {
        const svg = d3.select(ref.current);
        if (highlightItems.length > 0) {
            svg.selectAll(".bar-data").style("opacity", 0.1);
            svg.selectAll(".bar-data-point-shape").style("opacity", 0.1);
            highlightItems.forEach(item => {
                svg.selectAll(`[data-label="${item}"]`).style("opacity", 0.9);
            });
        }
        else {
            svg.selectAll(".bar-data").style("opacity", 0.9);
            svg.selectAll(".bar-data-point-shape").style("opacity", 0.9);
        }
    }, [highlightItems, disabledItems]);
    (0, react_1.useEffect)(() => {
        const svg = d3.select(ref.current);
        svg.selectAll(".bar-data-point").raise();
    }, [dataSet, xValues]);
    const displayIsNodata = (0, useDisplayIsNodata_1.useDisplayIsNodata)({
        dataSet: dataSet,
        isLoading: isLoading,
        isNodataComponent: isNodataComponent,
        isNodata: isNodata,
    });
    const filteredDataSet = (0, react_1.useMemo)(() => {
        // First filter out disabled items
        let result = dataSet.filter(d => !disabledItems.includes(String(d.label)));
        // Then apply filter logic if filter exists
        if (filter) {
            result = result
                .slice()
                .sort((a, b) => {
                var _a, _b;
                const aVal = (_a = a[filter.criteria]) !== null && _a !== void 0 ? _a : 0;
                const bVal = (_b = b[filter.criteria]) !== null && _b !== void 0 ? _b : 0;
                return filter.sortingDir === "desc" ? bVal - aVal : aVal - bVal;
            })
                .slice(0, filter.limit);
        }
        return result;
    }, [dataSet, filter, disabledItems]);
    (0, react_1.useEffect)(() => {
        if (renderCompleteRef.current && onChartDataProcessed) {
            const currentMetadata = {
                xAxisDomain: xValues.map(String),
                yAxisDomain: [0, maxValueX],
                visibleItems: keys.filter(key => !disabledItems.includes(key)),
                renderedData: {
                    [keys[0]]: dataSet,
                },
                chartType: "bar-bell-chart",
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
            // Only call callback if data has changed
            if (hasChanged) {
                // Update ref before calling callback
                prevChartDataRef.current = currentMetadata;
                // Call callback with slight delay to ensure DOM updates are complete
                const timeoutId = setTimeout(() => {
                    onChartDataProcessed(currentMetadata);
                }, 0);
                return () => clearTimeout(timeoutId);
            }
        }
    }, [yValues, maxValueX, keys, disabledItems, dataSet, onChartDataProcessed]);
    return ((0, jsx_runtime_1.jsxs)("div", { style: { position: "relative" }, children: [isLoading && isLoadingComponent && (0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: isLoadingComponent }), isLoading && !isLoadingComponent && (0, jsx_runtime_1.jsx)(LoadingIndicator_1.default, {}), displayIsNodata && (0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: isNodataComponent }), (0, jsx_runtime_1.jsxs)("svg", { ref: ref, height: height, width: width, children: [children, (0, jsx_runtime_1.jsx)(Title_1.default, { x: width / 2, y: margin.top / 2, children: title }), (0, jsx_runtime_1.jsx)(YaxisBand_1.default, { yScale: yScale, width: width, margin: margin, yAxisFormat: yAxisFormat, showGrid: (showGrid === null || showGrid === void 0 ? void 0 : showGrid.y) || false }), (0, jsx_runtime_1.jsx)(XaxisLinear_1.default, { xScale: xScale, height: height, margin: margin, xAxisFormat: xAxisFormat, xAxisDataType: xAxisDataType, showGrid: (showGrid === null || showGrid === void 0 ? void 0 : showGrid.x) || false, position: "top", ticks: 12 }), dataSet.map((d, i) => {
                        let cumulativeX = margin.left; // Initialize cumulativeX for each row
                        return ((0, jsx_runtime_1.jsx)("g", { className: `group-line group-line-${i}`, children: keys
                                .filter(key => !disabledItems.includes(key))
                                .map((key, j) => {
                                const value = d[key];
                                const x = cumulativeX; // Use cumulativeX as the starting point for each rectangle
                                const width = xScale(value); // Adjust width based on value
                                const shapeStyle = {
                                    "--data-color": colorsMapping === null || colorsMapping === void 0 ? void 0 : colorsMapping[key],
                                    transition: "all 0.1s ease-out",
                                    opacity: disabledItems.includes(key) ? 0.1 : 0.9,
                                    background: colorsMapping === null || colorsMapping === void 0 ? void 0 : colorsMapping[key],
                                    borderRadius: "50%",
                                    width: "12px",
                                    height: "12px",
                                };
                                cumulativeX += width; // Update cumulativeX for the next rectangle
                                return ((0, jsx_runtime_1.jsxs)(react_1.default.Fragment, { children: [value !== 0 && ((0, jsx_runtime_1.jsx)("rect", { className: "bar-data", "data-label": key, x: x, y: yScale(`${d === null || d === void 0 ? void 0 : d.date}`) + yScale.bandwidth() / 2 - 2 || 0, height: 4, width: width, fill: colorsMapping === null || colorsMapping === void 0 ? void 0 : colorsMapping[key], style: {
                                                transition: "all 0.1s ease-out",
                                                opacity: disabledItems.includes(key) ? 0.1 : 0.9,
                                            }, onMouseEnter: event => {
                                                onHighlightItem([key]);
                                                generateTooltip(d, key, value, event);
                                            }, onMouseLeave: () => {
                                                onHighlightItem([]);
                                                hideTooltip();
                                            }, "data-tooltip": JSON.stringify(d) }, `${key}-${i}`)), value !== undefined && ((0, jsx_runtime_1.jsx)("foreignObject", { x: x + width - 6, y: yScale(`${d === null || d === void 0 ? void 0 : d.date}`) + yScale.bandwidth() / 2 - 6, width: "12", height: "12", className: `bar-data-point ${value === 0 ? "has-value-zero" : ""}`, children: (0, jsx_runtime_1.jsx)("div", { "data-label": key, "data-value": value, "data-index": j, "data-order": keys.indexOf(key) + 1, "data-color": colorsMapping === null || colorsMapping === void 0 ? void 0 : colorsMapping[key], className: `bar-data-point-shape ${value === 0 ? "data-value-zero" : ""}`, style: shapeStyle, onMouseEnter: event => {
                                                    onHighlightItem([key]);
                                                    generateTooltip(d, key, value, event);
                                                }, onMouseLeave: () => {
                                                    onHighlightItem([]);
                                                    hideTooltip();
                                                } }) }))] }, `${key}-${i}`));
                            }) }, `group-line-${i}`));
                    })] }), (0, jsx_runtime_1.jsx)("div", { className: "tooltip", ref: refTooltip, style: {
                    position: "absolute",
                    opacity: 0,
                    visibility: "hidden",
                    padding: "10px",
                    backgroundColor: "rgba(0, 0, 0, 0.6)",
                    color: "white",
                    borderRadius: "5px",
                } })] }));
};
exports.default = BarBellChart;

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
const d3 = __importStar(require("d3"));
const react_1 = __importStar(require("react"));
const MichiVzProvider_1 = require("../components/MichiVzProvider");
const Title_1 = __importDefault(require("../components/shared/Title"));
const useDisplayIsNodata_1 = require("./hooks/useDisplayIsNodata");
const LoadingIndicator_1 = __importDefault(require("./shared/LoadingIndicator"));
const XaxisLinear_1 = __importDefault(require("./shared/XaxisLinear"));
const YaxisBand_1 = __importDefault(require("./shared/YaxisBand"));
const use_deep_compare_effect_1 = __importDefault(require("use-deep-compare-effect"));
const MARGIN = { top: 50, right: 50, bottom: 50, left: 50 };
const WIDTH = 900 - MARGIN.left - MARGIN.right;
const HEIGHT = 480 - MARGIN.top - MARGIN.bottom;
const DualHorizontalBarChart = ({ dataSet, filter, title, width = WIDTH, height = HEIGHT, margin = MARGIN, yAxisFormat, xAxisFormat, xAxisDataType = "number", tooltipFormatter, children, isLoading = false, isLoadingComponent, isNodataComponent, isNodata, onChartDataProcessed, onHighlightItem, }) => {
    var _a, _b, _c;
    const [tooltip, setTooltip] = react_1.default.useState(null);
    const { colorsMapping, colorsBasedMapping, highlightItems, disabledItems, hiddenItems, visibleItems, } = (0, MichiVzProvider_1.useChartContext)();
    const svgRef = (0, react_1.useRef)(null);
    const renderCompleteRef = (0, react_1.useRef)(false);
    const prevChartDataRef = (0, react_1.useRef)(null);
    (0, react_1.useLayoutEffect)(() => {
        renderCompleteRef.current = true;
    }, []);
    // New: compute filteredDataSet
    const filteredDataSet = (0, react_1.useMemo)(() => {
        // First filter out disabled items
        let result = dataSet.filter(d => !disabledItems.includes(d.label));
        // Then apply filter logic if filter exists
        if (filter) {
            result = result
                .slice() // copy array to avoid mutating original during sort
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
    const yAxisDomain = (0, react_1.useMemo)(() => filteredDataSet.filter(d => !disabledItems.includes(d.label)).map(d => d.label), [filteredDataSet]);
    const xAxisDomain = (0, react_1.useMemo)(() => {
        const flattenedValues = filteredDataSet
            .filter(d => !disabledItems.includes(d.label))
            .map(d => [d.value1, d.value2])
            .flat();
        if (xAxisDataType === "number") {
            return [Math.max(...flattenedValues), 0];
        }
        if (xAxisDataType === "date_annual" || xAxisDataType === "date_monthly") {
            return [
                new Date(Math.max(...flattenedValues), 1, 1),
                new Date(0, 1, 1), // Assuming the minimum date is January 1, 1900
            ];
        }
        return [];
    }, [filteredDataSet, disabledItems, xAxisDataType]);
    const yAxisScale = d3
        .scaleBand()
        .domain(yAxisDomain)
        .range([margin.top, height - margin.bottom]);
    const xAxis1Scale = d3
        .scaleLinear()
        .domain(xAxisDomain)
        .range([width - margin.right, width / 2])
        .clamp(true)
        .nice(1);
    const xAxis2Scale = d3
        .scaleLinear()
        .domain(xAxisDomain)
        .range([margin.left, width / 2])
        .clamp(true)
        .nice(1);
    const handleMouseOver = (d, event) => {
        if (svgRef.current) {
            const mousePoint = d3.pointer(event.nativeEvent, svgRef.current);
            setTooltip(() => ({
                x: mousePoint[0],
                y: mousePoint[1],
                data: d,
            }));
        }
    };
    const handleMouseOut = () => {
        setTooltip(null);
    };
    (0, react_1.useEffect)(() => {
        d3.select(svgRef.current).select(".bar").attr("opacity", 0.3);
        highlightItems.forEach(item => {
            d3.select(svgRef.current)
                .select(`.bar-${item.replaceAll(" ", "-").replaceAll(",", "")}`)
                .attr("opacity", 1);
        });
    }, [highlightItems]);
    const displayIsNodata = (0, useDisplayIsNodata_1.useDisplayIsNodata)({
        dataSet: dataSet,
        isLoading: isLoading,
        isNodataComponent: isNodataComponent,
        isNodata: isNodata,
    });
    // Replace useEffect with useDeepCompareEffect for metadata comparison
    (0, use_deep_compare_effect_1.default)(() => {
        if (renderCompleteRef.current && onChartDataProcessed) {
            // Ensure unique labels
            const uniqueLabels = [...new Set(yAxisDomain)];
            const currentMetadata = {
                xAxisDomain: uniqueLabels,
                yAxisDomain: [Number(yAxisScale.domain()[0]), Number(yAxisScale.domain()[1])],
                visibleItems: visibleItems,
                renderedData: {
                    [uniqueLabels[0]]: filteredDataSet,
                },
                chartType: "dual-horizontal-bar-chart",
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
    }, [yAxisDomain, xAxisDomain, visibleItems, filteredDataSet, onChartDataProcessed]);
    return ((0, jsx_runtime_1.jsxs)("div", { style: { position: "relative" }, children: [(0, jsx_runtime_1.jsxs)("svg", { width: width, height: height, ref: svgRef, style: { overflow: "visible" }, onMouseOut: event => {
                    event.stopPropagation();
                    event.preventDefault();
                    onHighlightItem([]);
                }, children: [children, (0, jsx_runtime_1.jsx)(Title_1.default, { x: width / 2, y: margin.top / 2, children: title }), (0, jsx_runtime_1.jsx)(XaxisLinear_1.default, { xScale: xAxis1Scale, height: height, margin: margin, xAxisFormat: xAxisFormat, xAxisDataType: xAxisDataType }), (0, jsx_runtime_1.jsx)(XaxisLinear_1.default, { xScale: xAxis2Scale, height: height, margin: margin, xAxisFormat: xAxisFormat, xAxisDataType: xAxisDataType }), (0, jsx_runtime_1.jsx)(YaxisBand_1.default, { yScale: yAxisScale, width: width, margin: margin, yAxisFormat: yAxisFormat }), filteredDataSet
                        .filter(d => !disabledItems.includes(d.label))
                        .map((d, i) => {
                        const x1 = xAxis1Scale(d.value1) - width / 2; // Corrected width calculation
                        const x2 = xAxis2Scale(0) - xAxis2Scale(d.value2); // Corrected width calculation
                        const y = yAxisScale(d.label) || 0;
                        const standardHeight = yAxisScale.bandwidth();
                        return ((0, jsx_runtime_1.jsxs)("g", { className: `bar bar-${d.label.replaceAll(" ", "-").replaceAll(",", "")}`, style: {
                                opacity: highlightItems.includes(d.label) || highlightItems.length === 0 ? 1 : 0.3,
                            }, onMouseOver: () => onHighlightItem([d.label]), onMouseOut: () => onHighlightItem([]), children: [(0, jsx_runtime_1.jsx)("rect", { x: width / 2, 
                                    // y should be aligned to the center of the bandwidth's unit with height = 30
                                    y: y + (standardHeight - 30) / 2, width: x1, height: 30, fill: colorsBasedMapping[d.label], rx: 5, ry: 5, onMouseOver: event => handleMouseOver(d, event), onMouseOut: handleMouseOut, stroke: "#fff" }), (0, jsx_runtime_1.jsx)("rect", { x: width / 2 - x2, y: y + (standardHeight - 30) / 2, width: x2, height: 30, fill: colorsMapping[d.label], opacity: 0.8, rx: 3, ry: 3, onMouseOver: event => handleMouseOver(d, event), onMouseOut: handleMouseOut, stroke: "#fff" }), !d.value1 && !d.value2 && ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("rect", { x: width / 2 - 5, 
                                            // y should be aligned to the center of the bandwidth's unit with height = 30
                                            y: y + (standardHeight - 30) / 2, width: 10, height: 30, fill: colorsBasedMapping[d.label], rx: 3, ry: 3, onMouseOver: event => handleMouseOver(d, event), onMouseOut: handleMouseOut }), (0, jsx_runtime_1.jsx)("text", { x: width / 2 + 15, y: y + (standardHeight - 30) / 2 + 20, fill: "black", fontSize: "12px", fontWeight: "bold", children: "N/A" })] }))] }, i));
                    })] }), tooltip && ((0, jsx_runtime_1.jsxs)("div", { style: {
                    position: "absolute",
                    left: `${tooltip === null || tooltip === void 0 ? void 0 : tooltip.x}px`,
                    top: `${tooltip === null || tooltip === void 0 ? void 0 : tooltip.y}px`,
                    background: "white",
                    padding: "5px",
                    pointerEvents: "none",
                }, children: [!tooltipFormatter && ((0, jsx_runtime_1.jsxs)("div", { children: ["$", (_a = tooltip === null || tooltip === void 0 ? void 0 : tooltip.data) === null || _a === void 0 ? void 0 : _a.label, ": $", (_b = tooltip === null || tooltip === void 0 ? void 0 : tooltip.data) === null || _b === void 0 ? void 0 : _b.value1, " - $", (_c = tooltip === null || tooltip === void 0 ? void 0 : tooltip.data) === null || _c === void 0 ? void 0 : _c.value2] })), tooltipFormatter && tooltipFormatter(tooltip === null || tooltip === void 0 ? void 0 : tooltip.data)] })), isLoading && isLoadingComponent && (0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: isLoadingComponent }), isLoading && !isLoadingComponent && (0, jsx_runtime_1.jsx)(LoadingIndicator_1.default, {}), displayIsNodata && (0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: isNodataComponent })] }));
};
exports.default = DualHorizontalBarChart;

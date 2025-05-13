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
exports.VALUE_TYPE = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const d3 = __importStar(require("d3"));
const react_1 = __importStar(require("react"));
const isEqual_1 = __importDefault(require("lodash/isEqual"));
const Title_1 = __importDefault(require("../components/shared/Title"));
const XaxisLinear_1 = __importDefault(require("./shared/XaxisLinear"));
const YaxisBand_1 = __importDefault(require("./shared/YaxisBand"));
const MichiVzProvider_1 = require("../components/MichiVzProvider");
const LoadingIndicator_1 = __importDefault(require("./shared/LoadingIndicator"));
const useDisplayIsNodata_1 = require("./hooks/useDisplayIsNodata");
const use_deep_compare_effect_1 = __importDefault(require("use-deep-compare-effect"));
const styled_components_1 = __importDefault(require("styled-components"));
const ComparableHorizontalBarChartStyled = styled_components_1.default.div `
  position: relative;
  rect {
    transition:
      fill 0.1s ease-out,
      opacity 0.1s ease-out,
      width 0.1s ease-out,
      height 0.1s ease-out;
  }
`;
exports.VALUE_TYPE = {
    BASED: "based",
    COMPARED: "compared",
};
const MARGIN = { top: 50, right: 50, bottom: 50, left: 50 };
const WIDTH = 900 - MARGIN.left - MARGIN.right;
const HEIGHT = 480 - MARGIN.top - MARGIN.bottom;
const ComparableHorizontalBarChart = ({ dataSet, filter, title, width = WIDTH, height = HEIGHT, margin = MARGIN, yAxisFormat, xAxisFormat, xAxisPredefinedDomain = [], xAxisDataType = "number", tooltipFormatter, children, isLoading = false, isLoadingComponent, isNodataComponent, isNodata, onChartDataProcessed, onHighlightItem, }) => {
    var _a, _b, _c;
    const [tooltip, setTooltip] = react_1.default.useState(null);
    const { colorsMapping, colorsBasedMapping, highlightItems, disabledItems, visibleItems } = (0, MichiVzProvider_1.useChartContext)();
    const svgRef = (0, react_1.useRef)(null);
    const renderCompleteRef = (0, react_1.useRef)(false);
    // Add ref for previous data comparison
    const prevChartDataRef = (0, react_1.useRef)(null);
    // Memoize filtered data set
    const filteredDataSet = (0, react_1.useMemo)(() => {
        if (!filter)
            return dataSet;
        return dataSet
            .slice()
            .sort((a, b) => {
            const aVal = Number(a[filter.criteria]);
            const bVal = Number(b[filter.criteria]);
            return filter.sortingDir === "desc" ? bVal - aVal : aVal - bVal;
        })
            .slice(0, filter.limit);
    }, [dataSet, filter]);
    // Memoize yAxisDomain
    const yAxisDomain = (0, react_1.useMemo)(() => { var _a; return (_a = filteredDataSet.filter(d => !disabledItems.includes(d === null || d === void 0 ? void 0 : d.label))) === null || _a === void 0 ? void 0 : _a.map(d => d === null || d === void 0 ? void 0 : d.label); }, [filteredDataSet, disabledItems]);
    // Memoize visible items
    const visibleItemsList = (0, react_1.useMemo)(() => {
        return filteredDataSet
            .filter(d => !disabledItems.includes(d === null || d === void 0 ? void 0 : d.label) && visibleItems.includes(d === null || d === void 0 ? void 0 : d.label))
            .map(d => d.label);
    }, [filteredDataSet, disabledItems, visibleItems]);
    // Memoize rendered data
    const renderedData = (0, react_1.useMemo)(() => {
        const uniqueLabels = [...new Set(yAxisDomain)];
        return uniqueLabels.reduce((acc, label) => {
            acc[label] = filteredDataSet.filter(d => d.label === label);
            return acc;
        }, {});
    }, [yAxisDomain, filteredDataSet]);
    // Memoize xAxisRange
    const xAxisRange = (0, react_1.useMemo)(() => {
        var _a, _b;
        if (filteredDataSet.length > 0) {
            return (_b = (_a = filteredDataSet === null || filteredDataSet === void 0 ? void 0 : filteredDataSet.filter(d => !disabledItems.includes(d === null || d === void 0 ? void 0 : d.label))) === null || _a === void 0 ? void 0 : _a.map(d => [d.valueBased, d.valueCompared])) === null || _b === void 0 ? void 0 : _b.flat();
        }
        return [];
    }, [filteredDataSet, disabledItems]);
    // Memoize xAxisDomain
    const xAxisDomain = (0, react_1.useMemo)(() => {
        const range = xAxisPredefinedDomain.length > 0 ? xAxisPredefinedDomain : xAxisRange;
        if (xAxisDataType === "number") {
            const min = Math.min(...range);
            const max = Math.max(...range);
            return [max, min];
        }
        if (xAxisDataType === "date_annual") {
            return [new Date(Math.max(...range), 1, 1), new Date(Math.min(...range), 1, 1)];
        }
        if (xAxisRange.length >= 2) {
            const minDate = new Date(Math.min(...range));
            const maxDate = new Date(Math.max(...range));
            return [maxDate, minDate];
        }
    }, [xAxisRange, xAxisPredefinedDomain, xAxisDataType]);
    // Memoize scales
    const yAxisScale = (0, react_1.useMemo)(() => d3
        .scaleBand()
        .domain(yAxisDomain)
        .range([margin.top, height - margin.bottom])
        .padding(0.1), [yAxisDomain, height, margin]);
    const xAxisScale = (0, react_1.useMemo)(() => xAxisDataType === "number"
        ? d3
            .scaleLinear()
            .domain(xAxisDomain)
            .range([width - margin.left, margin.right])
            .clamp(true)
            .nice()
        : d3
            .scaleTime()
            .domain(xAxisDomain)
            .range([width - margin.left, margin.right]), [xAxisDomain, width, margin, xAxisDataType]);
    // Memoize the YaxisBand component
    const memoizedYaxisBand = (0, react_1.useMemo)(() => {
        return ((0, jsx_runtime_1.jsx)(YaxisBand_1.default, { yScale: yAxisScale, width: width, margin: margin, yAxisFormat: yAxisFormat }));
    }, [yAxisScale, width, margin, yAxisFormat]);
    // Memoize event handlers
    const handleMouseOver = (0, react_1.useCallback)((d, event, type) => {
        if (svgRef.current) {
            const mousePoint = d3.pointer(event.nativeEvent, svgRef.current);
            setTooltip({
                x: mousePoint[0],
                y: mousePoint[1],
                data: d,
                type,
            });
        }
    }, []);
    const handleMouseOut = (0, react_1.useCallback)(() => {
        setTooltip(null);
    }, []);
    const handleHighlight = (0, react_1.useCallback)((label) => {
        onHighlightItem([label]);
    }, [onHighlightItem]);
    const handleUnhighlight = (0, react_1.useCallback)(() => {
        onHighlightItem([]);
    }, [onHighlightItem]);
    // Update bar opacity based on highlightItems
    (0, react_1.useLayoutEffect)(() => {
        if (svgRef.current) {
            d3.select(svgRef.current).select(".bar").attr("opacity", 0.3);
            highlightItems.forEach(item => {
                d3.select(svgRef.current).selectAll(`.bar[data-label="${item}"]`).attr("opacity", 1);
            });
        }
    }, [highlightItems]);
    const displayIsNodata = (0, useDisplayIsNodata_1.useDisplayIsNodata)({
        dataSet: dataSet,
        isLoading: isLoading,
        isNodataComponent: isNodataComponent,
        isNodata: isNodata,
    });
    // Memoize the bars rendering
    const renderBars = (0, react_1.useMemo)(() => {
        const shouldShowAll = visibleItems.length === 0;
        return filteredDataSet
            .filter(d => shouldShowAll
            ? !disabledItems.includes(d === null || d === void 0 ? void 0 : d.label)
            : !disabledItems.includes(d === null || d === void 0 ? void 0 : d.label) && visibleItems.includes(d === null || d === void 0 ? void 0 : d.label))
            .map((d, i) => {
            var _a, _b, _c, _d, _e, _f, _g, _h;
            const x1 = margin.left + xAxisScale(Math.min(0, d.valueBased)) - margin.left;
            const x2 = margin.left + xAxisScale(Math.min(0, d.valueCompared)) - margin.left;
            const width1 = Math.abs(xAxisScale(d.valueBased) - xAxisScale(0));
            const width2 = Math.abs(xAxisScale(d.valueCompared) - xAxisScale(0));
            const y = yAxisScale(d === null || d === void 0 ? void 0 : d.label) || 0;
            const standardHeight = yAxisScale.bandwidth();
            return ((0, jsx_runtime_1.jsx)("g", { className: "bar", "data-label": d === null || d === void 0 ? void 0 : d.label, style: {
                    opacity: highlightItems.includes(d === null || d === void 0 ? void 0 : d.label) || highlightItems.length === 0 ? 1 : 0.3,
                }, onMouseOver: () => handleHighlight(d === null || d === void 0 ? void 0 : d.label), onMouseOut: handleUnhighlight, children: width1 < width2 ? ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("rect", { className: "value-compared", x: x2, y: y + (standardHeight - 30) / 2, width: Math.max(width2, 3), height: 30, fill: (_b = (_a = colorsMapping[d === null || d === void 0 ? void 0 : d.label]) !== null && _a !== void 0 ? _a : d.color) !== null && _b !== void 0 ? _b : "transparent", opacity: 0.9, rx: 5, ry: 5, onMouseOver: event => handleMouseOver(d, event, "compared"), onMouseOut: handleMouseOut, stroke: "#fff", strokeWidth: 1 }), (0, jsx_runtime_1.jsx)("rect", { className: "value-based", x: x1, y: y + (standardHeight - 30) / 2, width: Math.max(width1, 3), height: 30, fill: (_d = (_c = colorsBasedMapping[d === null || d === void 0 ? void 0 : d.label]) !== null && _c !== void 0 ? _c : d === null || d === void 0 ? void 0 : d.color) !== null && _d !== void 0 ? _d : "transparent", rx: 5, ry: 5, onMouseOver: event => handleMouseOver(d, event, "based"), onMouseOut: handleMouseOut, opacity: 0.9, stroke: "#fff", strokeWidth: 1 })] })) : ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("rect", { className: "value-based", x: x1, y: y + (standardHeight - 30) / 2, width: Math.max(width1, 3), height: 30, fill: (_f = (_e = colorsBasedMapping[d === null || d === void 0 ? void 0 : d.label]) !== null && _e !== void 0 ? _e : d === null || d === void 0 ? void 0 : d.color) !== null && _f !== void 0 ? _f : "transparent", rx: 5, ry: 5, onMouseOver: event => handleMouseOver(d, event, "based"), onMouseOut: handleMouseOut, opacity: 0.9, stroke: "#fff", strokeWidth: 1 }), (0, jsx_runtime_1.jsx)("rect", { className: "value-compared", x: x2, y: y + (standardHeight - 30) / 2, width: Math.max(width2, 3), height: 30, fill: (_h = (_g = colorsMapping[d === null || d === void 0 ? void 0 : d.label]) !== null && _g !== void 0 ? _g : d.color) !== null && _h !== void 0 ? _h : "transparent", opacity: 0.9, rx: 5, ry: 5, onMouseOver: event => handleMouseOver(d, event, "compared"), onMouseOut: handleMouseOut, stroke: "#fff", strokeWidth: 1 })] })) }, i));
        });
    }, [
        filteredDataSet,
        disabledItems,
        visibleItems,
        margin,
        xAxisScale,
        yAxisScale,
        highlightItems,
        colorsMapping,
        colorsBasedMapping,
        handleMouseOver,
        handleMouseOut,
        handleHighlight,
        handleUnhighlight,
    ]);
    (0, react_1.useLayoutEffect)(() => {
        renderCompleteRef.current = true;
    }, []);
    (0, use_deep_compare_effect_1.default)(() => {
        var _a, _b, _c, _d;
        if (onChartDataProcessed && renderCompleteRef.current) {
            // Ensure unique labels
            const uniqueLabels = [...new Set(yAxisDomain)];
            // Only proceed if we have valid data
            if (uniqueLabels.length > 0) {
                const domain = yAxisScale.domain();
                const yMin = Number(domain[0]);
                const yMax = Number(domain[1]);
                const currentMetadata = {
                    xAxisDomain: uniqueLabels,
                    yAxisDomain: [yMin, yMax],
                    visibleItems: visibleItemsList,
                    renderedData,
                    chartType: "comparable-horizontal-bar-chart",
                };
                // Check individual changes
                const yAxisDomainChanged = !(0, isEqual_1.default)((_a = prevChartDataRef.current) === null || _a === void 0 ? void 0 : _a.yAxisDomain, currentMetadata.yAxisDomain);
                const xAxisDomainChanged = !(0, isEqual_1.default)((_b = prevChartDataRef.current) === null || _b === void 0 ? void 0 : _b.xAxisDomain, currentMetadata.xAxisDomain);
                const visibleItemsChanged = !(0, isEqual_1.default)((_c = prevChartDataRef.current) === null || _c === void 0 ? void 0 : _c.visibleItems, currentMetadata.visibleItems);
                const renderedDataKeysChanged = !(0, isEqual_1.default)(Object.keys(((_d = prevChartDataRef.current) === null || _d === void 0 ? void 0 : _d.renderedData) || {}).sort(), Object.keys(currentMetadata.renderedData).sort());
                // Check if data has actually changed
                const hasChanged = !prevChartDataRef.current ||
                    yAxisDomainChanged ||
                    xAxisDomainChanged ||
                    visibleItemsChanged ||
                    renderedDataKeysChanged;
                // Only call callback if data has changed
                if (hasChanged) {
                    onChartDataProcessed(currentMetadata);
                    prevChartDataRef.current = { ...currentMetadata };
                }
            }
        }
    }, [yAxisDomain, xAxisDomain, visibleItemsList, renderedData, onChartDataProcessed, yAxisScale]);
    return ((0, jsx_runtime_1.jsxs)(ComparableHorizontalBarChartStyled, { children: [(0, jsx_runtime_1.jsxs)("svg", { width: width, height: height, ref: svgRef, style: { overflow: "visible" }, onMouseOut: event => {
                    event.stopPropagation();
                    event.preventDefault();
                    onHighlightItem([]);
                }, children: [children, (0, jsx_runtime_1.jsx)(Title_1.default, { x: width / 2, y: margin.top / 2, children: title }), (0, jsx_runtime_1.jsx)(XaxisLinear_1.default, { xScale: xAxisScale, height: height, margin: margin, xAxisFormat: xAxisFormat, xAxisDataType: xAxisDataType }), memoizedYaxisBand, renderBars] }), tooltip && ((0, jsx_runtime_1.jsxs)("div", { className: "tooltip", style: {
                    position: "absolute",
                    left: `${tooltip === null || tooltip === void 0 ? void 0 : tooltip.x}px`,
                    top: `${tooltip === null || tooltip === void 0 ? void 0 : tooltip.y}px`,
                    background: "white",
                    padding: "5px",
                    pointerEvents: "none",
                }, children: [!tooltipFormatter && ((0, jsx_runtime_1.jsxs)("div", { children: ["$", (_a = tooltip === null || tooltip === void 0 ? void 0 : tooltip.data) === null || _a === void 0 ? void 0 : _a.label, ": $", (_b = tooltip === null || tooltip === void 0 ? void 0 : tooltip.data) === null || _b === void 0 ? void 0 : _b.valueBased, " - $", (_c = tooltip === null || tooltip === void 0 ? void 0 : tooltip.data) === null || _c === void 0 ? void 0 : _c.valueCompared] })), tooltipFormatter && tooltipFormatter(tooltip === null || tooltip === void 0 ? void 0 : tooltip.data, dataSet, tooltip === null || tooltip === void 0 ? void 0 : tooltip.type)] })), isLoading && isLoadingComponent && (0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: isLoadingComponent }), isLoading && !isLoadingComponent && (0, jsx_runtime_1.jsx)(LoadingIndicator_1.default, {}), displayIsNodata && (0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: isNodataComponent })] }));
};
exports.default = ComparableHorizontalBarChart;

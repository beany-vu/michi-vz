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
const d3 = __importStar(require("d3"));
const Title_1 = __importDefault(require("./shared/Title"));
const XaxisBand_1 = __importDefault(require("./shared/XaxisBand"));
const YaxisLinear_1 = __importDefault(require("./shared/YaxisLinear"));
const MichiVzProvider_1 = require("./MichiVzProvider");
const LoadingIndicator_1 = __importDefault(require("./shared/LoadingIndicator"));
const useDisplayIsNodata_1 = require("./hooks/useDisplayIsNodata");
const use_deep_compare_effect_1 = __importDefault(require("use-deep-compare-effect"));
const MARGIN = { top: 50, right: 50, bottom: 50, left: 50 };
const WIDTH = 900;
const HEIGHT = 480;
const RibbonChart = ({ series, width = WIDTH, height = HEIGHT, margin = MARGIN, title, yAxisFormat, xAxisFormat, keys, children, isLoading = false, isLoadingComponent, isNodataComponent, isNodata, tooltipContent, onChartDataProcessed, onHighlightItem, }) => {
    const { colorsMapping, highlightItems, disabledItems } = (0, MichiVzProvider_1.useChartContext)();
    const ref = (0, react_1.useRef)(null);
    const renderCompleteRef = (0, react_1.useRef)(false);
    const prevChartDataRef = (0, react_1.useRef)(null);
    // Add filteredDataSet to filter out disabled items
    const filteredDataSet = (0, react_1.useMemo)(() => {
        // Filter keys that are in disabledItems
        return series.map(dataPoint => {
            const filtered = { ...dataPoint };
            // Remove properties that are in disabledItems
            Object.keys(filtered).forEach(key => {
                if (disabledItems.includes(key) && key !== "date") {
                    delete filtered[key];
                }
            });
            return filtered;
        });
    }, [series, disabledItems]);
    // xScale
    const dates = (0, react_1.useMemo)(() => filteredDataSet.map(d => String(d.date)), [filteredDataSet]);
    const xScale = (0, react_1.useMemo)(() => d3
        .scaleBand()
        .domain(dates)
        .range([margin.left, width - margin.right])
        .padding(0.1), [filteredDataSet, width, margin, dates]);
    // yScale
    const yScaleDomain = (0, react_1.useMemo)(() => {
        // return the max value of the sum of all the keys, don't count the date
        const max = d3.max(filteredDataSet, d => d3.sum(Object.keys(d)
            .filter(key => key !== "date")
            .map(key => d[key] || 0)) || 0);
        return [0, max];
    }, [filteredDataSet, keys]);
    const yScale = (0, react_1.useMemo)(() => d3
        .scaleLinear()
        .domain(yScaleDomain)
        .range([height - margin.bottom, margin.top])
        .clamp(true)
        .nice(), [filteredDataSet, height, margin, yScaleDomain]);
    const prepareStackedData = (seriesData) => {
        let stackedData = keys.reduce((acc, key) => {
            acc[key] = null;
            return acc;
        }, {});
        seriesData.forEach(yearData => {
            let y0 = 0;
            [...keys]
                .filter(key => !disabledItems.includes(key))
                .sort((a, b) => (yearData[a] || 0) - (yearData[b] || 0))
                .forEach(key => {
                const y1 = y0 + (yearData[key] || 0);
                const height = yScale(y0) - yScale(y1);
                const rectData = {
                    key,
                    height,
                    width: 30,
                    y: yScale(y1),
                    x: xScale(String(yearData.date)) + xScale.bandwidth() / 2 - 30 / 2,
                    fill: colorsMapping[key],
                    data: yearData,
                    certainty: yearData.certainty,
                };
                y0 = y1;
                stackedData = {
                    ...stackedData,
                    [key]: stackedData[key] ? [stackedData[key], rectData].flat() : [rectData],
                };
            });
        });
        return stackedData;
    };
    const stackedRectData = (0, react_1.useMemo)(
    // remove keys from object that are disabled
    () => prepareStackedData(filteredDataSet), [filteredDataSet, width, height, margin, disabledItems]);
    const generateTooltipContent = (data) => {
        var _a;
        // Process your data and generate HTML string as per requirements
        return `
    <div style="background: #fff; padding: 5px">
      <p>${(_a = xAxisFormat === null || xAxisFormat === void 0 ? void 0 : xAxisFormat(String(data.date))) !== null && _a !== void 0 ? _a : data.date}</p>
      ${Object.keys(data)
            .filter(key => key !== "date")
            .map(key => { var _a; return `<p style="color:${colorsMapping[key]}">${key}: ${(_a = data[key]) !== null && _a !== void 0 ? _a : "N/A"}</p>`; })
            .join("")}
    </div>`;
    };
    const displayIsNodata = (0, useDisplayIsNodata_1.useDisplayIsNodata)({
        dataSet: filteredDataSet,
        isLoading: isLoading,
        isNodataComponent: isNodataComponent,
        isNodata: isNodata,
    });
    (0, react_1.useLayoutEffect)(() => {
        renderCompleteRef.current = true;
    }, []);
    (0, use_deep_compare_effect_1.default)(() => {
        if (renderCompleteRef.current && onChartDataProcessed) {
            // Ensure unique values in dates
            const uniqueDates = [...new Set(dates)];
            // Ensure yScaleDomain is always a tuple with 2 elements
            const safeYDomain = Array.isArray(yScaleDomain) && yScaleDomain.length === 2
                ? yScaleDomain
                : [0, yScaleDomain[1] || 0];
            const currentMetadata = {
                xAxisDomain: uniqueDates,
                yAxisDomain: safeYDomain,
                visibleItems: keys.filter(key => !disabledItems.includes(key)),
                renderedData: {
                    [keys[0]]: filteredDataSet,
                },
                chartType: "ribbon-chart",
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
    }, [
        filteredDataSet,
        width,
        height,
        margin,
        disabledItems,
        dates,
        keys,
        yScaleDomain,
        onChartDataProcessed,
    ]);
    return ((0, jsx_runtime_1.jsxs)("div", { style: { position: "relative" }, children: [(0, jsx_runtime_1.jsx)("div", { className: "tooltip", style: {
                    position: "absolute",
                    background: "white",
                    padding: "5px",
                    border: "1px solid #333",
                    pointerEvents: "none",
                    zIndex: 1000,
                } }), (0, jsx_runtime_1.jsxs)("svg", { className: "chart", ref: ref, width: width, height: height, style: { overflow: "visible" }, onMouseOut: event => {
                    event.preventDefault();
                    event.stopPropagation();
                    onHighlightItem([]);
                    d3.select(".tooltip").style("visibility", "hidden");
                }, children: [children, (0, jsx_runtime_1.jsx)(Title_1.default, { x: width / 2, y: MARGIN.top / 2, children: title }), (0, jsx_runtime_1.jsx)(XaxisBand_1.default, { xScale: xScale, height: height, margin: margin, xAxisFormat: xAxisFormat }), (0, jsx_runtime_1.jsx)(YaxisLinear_1.default, { yScale: yScale, width: width, height: height, margin: margin, highlightZeroLine: true, yAxisFormat: yAxisFormat }), (0, jsx_runtime_1.jsx)("g", { children: keys
                            .filter(key => !disabledItems.includes(key))
                            .map(key => {
                            return ((0, jsx_runtime_1.jsx)("g", { className: `stack-${key}.replaceAll(" ", "-").replaceAll(",", "")`, children: stackedRectData[key] &&
                                    stackedRectData[key].map((d, i) => {
                                        var _a, _b, _c, _d, _e;
                                        const pointTopLeft = {
                                            x: d.x + d.width,
                                            y: d.y,
                                            height: d.height,
                                        };
                                        const pointTopRight = {
                                            x: (_a = stackedRectData[key][i + 1]) === null || _a === void 0 ? void 0 : _a.x,
                                            y: (_b = stackedRectData[key][i + 1]) === null || _b === void 0 ? void 0 : _b.y,
                                            height: (_c = stackedRectData[key][i + 1]) === null || _c === void 0 ? void 0 : _c.height,
                                        };
                                        const topCurveControl = `Q${d.x + d.width} ${d.y}`;
                                        const segmentTopCurve = `M${pointTopLeft.x} ${pointTopLeft.y} ${topCurveControl} ${(_d = pointTopRight.x) !== null && _d !== void 0 ? _d : 0} ${(_e = pointTopRight.y) !== null && _e !== void 0 ? _e : 0}`;
                                        const rightSideLine = `V ${pointTopRight.y + pointTopRight.height} `;
                                        const segmentBottomCurve = `Q${d.x + d.width} ${d.y + d.height} ${pointTopLeft.x} ${pointTopLeft.y + pointTopLeft.height} `;
                                        const leftSideLine = `V ${pointTopLeft.y} `;
                                        const pathD = `${segmentTopCurve} ${rightSideLine} ${segmentBottomCurve} ${leftSideLine} Z`;
                                        return ((0, jsx_runtime_1.jsxs)(react_1.default.Fragment, { children: [i < stackedRectData[key].length - 1 && ((0, jsx_runtime_1.jsx)("path", { d: pathD, fill: d.fill, opacity: highlightItems.length === 0 || highlightItems.includes(d.key)
                                                        ? 0.4
                                                        : 0.1, stroke: "#fff", strokeOpacity: 0.4, style: { transition: "opacity 0.1s ease-out" }, onMouseOver: () => onHighlightItem([d.key]), onMouseOut: () => onHighlightItem([]) })), (0, jsx_runtime_1.jsx)("rect", { x: d.x, y: d.y, width: d.width, height: d.height, fill: d.fill, rx: 1.5, stroke: "#fff", strokeOpacity: 0.5, opacity: highlightItems.length === 0 || highlightItems.includes(d.key)
                                                        ? 1
                                                        : 0.1, ref: node => {
                                                        if (node) {
                                                            d3.select(node)
                                                                .on("mouseover", function () {
                                                                onHighlightItem([d.key]);
                                                                d3.select(".tooltip")
                                                                    .style("visibility", "visible")
                                                                    .html((tooltipContent === null || tooltipContent === void 0 ? void 0 : tooltipContent(d.data)) || generateTooltipContent(d.data)); // you can define this function or inline its logic
                                                            })
                                                                .on("mousemove", function (event) {
                                                                const [x, y] = d3.pointer(event);
                                                                const tooltip = d3.select(".tooltip").node();
                                                                const tooltipWidth = tooltip.getBoundingClientRect().width;
                                                                const tooltipHeight = tooltip.getBoundingClientRect().height;
                                                                d3.select(".tooltip")
                                                                    .style("left", x - tooltipWidth / 2 + "px")
                                                                    .style("top", y - tooltipHeight - 10 + "px");
                                                            })
                                                                .on("mouseout", function () {
                                                                onHighlightItem([]);
                                                                d3.select(".tooltip").style("visibility", "hidden");
                                                            });
                                                        }
                                                    } }, `item-${i}`)] }, `item-${i}`));
                                    }) }, `stack-${key}.replaceAll(" ", "-").replaceAll(",", "")`));
                        }) })] }), isLoading && isLoadingComponent && (0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: isLoadingComponent }), isLoading && !isLoadingComponent && (0, jsx_runtime_1.jsx)(LoadingIndicator_1.default, {}), displayIsNodata && (0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: isNodataComponent })] }));
};
exports.default = RibbonChart;

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
const styled_components_1 = __importDefault(require("styled-components"));
const VerticalStackBarChartStyled = styled_components_1.default.div `
  position: relative;
  rect {
    transition: x 0.1s ease-out, y 0.1s ease-out, width 0.1s ease-out, height 0.1s ease-out;
  }
}`;
const MARGIN = { top: 50, right: 50, bottom: 50, left: 50 };
const WIDTH = 900;
const HEIGHT = 480;
const VerticalStackBarChart = ({ dataSet, width = WIDTH, height = HEIGHT, margin = MARGIN, title, xAxisFormat, yAxisFormat, xAxisDomain, yAxisDomain, tooltipFormatter, showCombined = false, children, isLoading = false, isLoadingComponent, isNodataComponent, isNodata, colorCallbackFn, filter, onChartDataProcessed, onHighlightItem, }) => {
    const { colorsMapping, highlightItems, disabledItems } = (0, MichiVzProvider_1.useChartContext)();
    const chartRef = (0, react_1.useRef)(null);
    const tooltipRef = (0, react_1.useRef)(null);
    const renderCompleteRef = (0, react_1.useRef)(false);
    const prevChartDataRef = (0, react_1.useRef)(null);
    // Remove unused seriesKeys and filteredKeys
    const allKeys = (0, react_1.useMemo)(() => {
        return Array.from(new Set(dataSet
            .map(ds => ds.series.map(s => Object.keys(s)))
            .flat(2)
            .filter(d => d !== "date" && d !== "code")));
    }, [dataSet]);
    // Modified: effectiveKeys should filter out hidden items
    const effectiveKeys = (0, react_1.useMemo)(() => {
        return allKeys.filter(key => !disabledItems.includes(key));
    }, [allKeys, disabledItems]);
    // NEW: compute filteredDataSet from the entire dataSet by summing all numeric properties (except "date" and "code")
    const filteredDataSet = (0, react_1.useMemo)(() => {
        if (!filter)
            return dataSet;
        // For each DataSet, compute total sum over its series
        const computed = dataSet.map(ds => {
            const total = ds.series.reduce((sum, dp) => {
                // sum all non-date properties as numbers
                return (sum +
                    Object.entries(dp).reduce((acc, [key, value]) => {
                        return key !== "date" && key !== "code" ? acc + Number(value || 0) : acc;
                    }, 0));
            }, 0);
            return { ...ds, total };
        });
        const sorted = computed.sort((a, b) => filter.sortingDir === "desc" ? b.total - a.total : a.total - b.total);
        return sorted.slice(0, filter.limit);
    }, [dataSet, filter]);
    // Keep only the keys we need
    const keys = (0, react_1.useMemo)(() => {
        return Array.from(new Set(dataSet
            .map(ds => ds.series.map(s => Object.keys(s)))
            .flat(2)
            .filter(d => d !== "date" && d !== "code")));
    }, [dataSet]);
    // Replace usage of dataSet with filteredDataSet:
    const flattenedDataSet = (0, react_1.useMemo)(() => {
        return filteredDataSet
            .map(({ series }) => series)
            .flat()
            .map(dataPoint => {
            // Convert the DataPoint object to an array of [key, value] pairs.
            const entries = Object.entries(dataPoint);
            // Filter out the keys that are present in the disabledItems array.
            const filteredEntries = entries.filter(([key]) => !disabledItems.includes(key));
            // Convert the filtered [key, value] pairs back to an object.
            return Object.fromEntries(filteredEntries);
        });
    }, [filteredDataSet, disabledItems]);
    // xScale
    const extractDates = (data) => String(data.date);
    const dates = (0, react_1.useMemo)(() => flattenedDataSet.map(extractDates), [flattenedDataSet, disabledItems]);
    const xScale = (0, react_1.useMemo)(() => d3
        .scaleBand()
        .domain(xAxisDomain !== null && xAxisDomain !== void 0 ? xAxisDomain : dates)
        .range([margin.left, width - margin.right])
        .padding(0.1), [flattenedDataSet, width, height, margin, disabledItems]);
    // yScale
    const yScaleDomain = (0, react_1.useMemo)(() => {
        if (yAxisDomain) {
            return yAxisDomain;
        }
        const totalValuePerYear = flattenedDataSet.map(yearData => effectiveKeys.reduce((acc, key) => {
            // Parse the value safely, handling string values
            const value = yearData[key];
            if (value === undefined || value === null) {
                return acc;
            }
            const numericValue = typeof value === "string" ? parseFloat(value) : value;
            return acc + (isNaN(numericValue) ? 0 : numericValue);
        }, 0));
        const minValue = Math.min(...totalValuePerYear) < 0 ? Math.min(...totalValuePerYear) : 0;
        const maxValue = Math.max(...totalValuePerYear);
        return [minValue, maxValue];
    }, [flattenedDataSet, effectiveKeys]);
    const yScale = (0, react_1.useMemo)(() => d3
        .scaleLinear()
        .domain(yScaleDomain)
        .range([height - margin.bottom, margin.top])
        .clamp(true)
        .nice(), [flattenedDataSet, width, height, margin, disabledItems]);
    // Memoize the stacked data preparation
    const prepareStackedData = (0, react_1.useCallback)((rawDataSet) => {
        const stackedData = effectiveKeys
            .filter(key => !disabledItems.includes(key))
            .reduce((acc, key) => {
            acc[key] = [];
            return acc;
        }, {});
        // Get the actual number of visible series for width calculation
        const visibleSeriesCount = rawDataSet.filter(dataItem => !disabledItems.includes(dataItem.seriesKey)).length;
        rawDataSet
            .filter(dataItem => !disabledItems.includes(dataItem.seriesKey))
            .forEach((dataItem, groupIndex) => {
            const series = dataItem.series;
            // Use visibleSeriesCount instead of total stackedData length
            const groupWidth = xScale.bandwidth() / visibleSeriesCount;
            series.forEach(yearData => {
                let y0 = 0;
                effectiveKeys
                    .filter(key => !disabledItems.includes(key))
                    .reverse()
                    .forEach(key => {
                    const value = yearData[key];
                    // Skip if value is undefined or null
                    if (value === undefined || value === null) {
                        return;
                    }
                    // Parse the value to float safely, handling string values
                    const numericValue = typeof value === "string" ? parseFloat(value) : value;
                    // Skip if the parsed value is NaN
                    if (isNaN(numericValue)) {
                        return;
                    }
                    const y1 = parseFloat(String(y0)) + numericValue;
                    const rawHeight = yScale(y0) - yScale(y1);
                    // Only apply minimum height if the value exists (even if it's 0)
                    const itemHeight = value !== undefined && value !== null ? Math.max(3, rawHeight) : 0;
                    const rectData = {
                        key,
                        height: itemHeight,
                        width: groupWidth - 4,
                        y: yScale(y1),
                        x: xScale(String(yearData.date)) +
                            groupWidth * groupIndex +
                            groupWidth / 2 -
                            groupWidth / 2 +
                            2,
                        fill: colorsMapping[key],
                        data: yearData,
                        seriesKey: dataItem.seriesKey,
                        seriesKeyAbbreviation: dataItem.seriesKeyAbbreviation,
                        value: numericValue,
                        date: yearData.date,
                        code: yearData.code,
                    };
                    y0 = y1;
                    stackedData[key].push(rectData);
                });
            });
        });
        return stackedData;
    }, [effectiveKeys, disabledItems, xScale, yScale, colorsMapping]);
    // Memoize the stacked rect data
    const stackedRectData = (0, react_1.useMemo)(() => prepareStackedData(filteredDataSet), [prepareStackedData, filteredDataSet]);
    // Memoize the tooltip content generation
    const generateTooltipContent = (0, react_1.useCallback)((key, seriesKey, data, series) => {
        if (tooltipFormatter) {
            return tooltipFormatter({
                item: data,
                key: key,
                seriesKey: seriesKey,
                series: series,
            });
        }
        if (!showCombined) {
            return `
                <div style="background: #fff; padding: 5px">
                    <p>${data.date} - ${seriesKey}</p>
                    ${data[key] ? `<p style="color:${colorsMapping[key]}">${key}: ${data[key]}</p>` : "N/A"}
                </div>`;
        }
        return `
                <div style="background: #fff; padding: 5px">
                    <p>${data.date} - ${seriesKey}</p>
                    ${Object.keys(data)
            .filter(key => key !== "date" && key !== "code")
            .sort()
            .map(key => { var _a; return `<p style="color:${colorsMapping[key]}">${key}: ${(_a = data[key]) !== null && _a !== void 0 ? _a : "N/A"}</p>`; })
            .join("")}
                </div>`;
    }, [tooltipFormatter, showCombined, colorsMapping]);
    // Memoize the tooltip position update
    const updateTooltipPosition = (0, react_1.useCallback)((event) => {
        if (!tooltipRef.current)
            return;
        const [x, y] = d3.pointer(event);
        const tooltip = tooltipRef.current;
        const tooltipWidth = tooltip.getBoundingClientRect().width;
        const tooltipHeight = tooltip.getBoundingClientRect().height;
        tooltip.style.left = `${x - tooltipWidth / 2}px`;
        tooltip.style.top = `${y - tooltipHeight - 10}px`;
    }, []);
    // Memoize the mouse event handlers
    const handleMouseOver = (0, react_1.useCallback)((key, d) => {
        onHighlightItem([key]);
        if (tooltipRef.current) {
            tooltipRef.current.style.visibility = "visible";
            tooltipRef.current.innerHTML = generateTooltipContent(d.key, d.seriesKey, d.data, stackedRectData[key]
                .filter(item => item.seriesKey === d.seriesKey)
                .map(item => {
                var _a;
                return ({
                    label: item.key,
                    value: (_a = item.value) !== null && _a !== void 0 ? _a : null,
                    date: item.date,
                    code: item.code,
                });
            }));
        }
    }, [onHighlightItem, generateTooltipContent, stackedRectData]);
    const handleMouseOut = (0, react_1.useCallback)(() => {
        onHighlightItem === null || onHighlightItem === void 0 ? void 0 : onHighlightItem([]);
        if (tooltipRef.current) {
            tooltipRef.current.style.visibility = "hidden";
        }
    }, [onHighlightItem]);
    const displayIsNodata = (0, useDisplayIsNodata_1.useDisplayIsNodata)({
        dataSet: dataSet,
        isLoading: isLoading,
        isNodataComponent: isNodataComponent,
        isNodata: isNodata,
    });
    // Replace the previous useEffect with useLayoutEffect for data callback
    (0, react_1.useLayoutEffect)(() => {
        renderCompleteRef.current = true;
    }, []);
    // Use a separate useEffect to call the callback after rendering
    (0, react_1.useLayoutEffect)(() => {
        if (renderCompleteRef.current && onChartDataProcessed) {
            // First get all data that has values
            const allRenderedData = Object.fromEntries(Object.entries(stackedRectData).filter(([, array]) => {
                const hasData = array.length > 0;
                return hasData;
            }));
            // Get all keys that have data
            let renderedKeys = Object.keys(allRenderedData);
            // If we have a filter date and limit, sort and limit the keys
            if ((filter === null || filter === void 0 ? void 0 : filter.date) && (filter === null || filter === void 0 ? void 0 : filter.limit)) {
                console.log("Filtering with date:", filter.date);
                console.log("Available dates in data:", [
                    ...new Set(Object.values(stackedRectData)
                        .flat()
                        .map(d => d.date)),
                ]);
                renderedKeys = renderedKeys
                    .sort((a, b) => {
                    var _a, _b, _c, _d;
                    const aData = (_a = stackedRectData[a]) === null || _a === void 0 ? void 0 : _a.find(d => String(d.date) === String(filter.date));
                    const bData = (_b = stackedRectData[b]) === null || _b === void 0 ? void 0 : _b.find(d => String(d.date) === String(filter.date));
                    const aValue = (_c = aData === null || aData === void 0 ? void 0 : aData.value) !== null && _c !== void 0 ? _c : 0;
                    const bValue = (_d = bData === null || bData === void 0 ? void 0 : bData.value) !== null && _d !== void 0 ? _d : 0;
                    console.log(`Comparing ${a} (${aValue}) and ${b} (${bValue}) at date ${filter.date}`);
                    return filter.sortingDir === "desc" ? bValue - aValue : aValue - bValue;
                })
                    .slice(0, filter.limit);
                console.log("Final sorted and limited keys:", renderedKeys);
            }
            // Create the current metadata with filtered data and UNIQUE xAxisDomain
            const currentMetadata = {
                xAxisDomain: [...new Set(xAxisDomain !== null && xAxisDomain !== void 0 ? xAxisDomain : dates)],
                visibleItems: renderedKeys,
                renderedData: allRenderedData,
                chartType: "vertical-stack-bar-chart",
            };
            // Check if the data has actually changed
            const hasChanged = !prevChartDataRef.current ||
                JSON.stringify(prevChartDataRef.current.xAxisDomain) !==
                    JSON.stringify(currentMetadata.xAxisDomain) ||
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
    }, [xAxisDomain, dates, stackedRectData, filter, onChartDataProcessed, onHighlightItem]);
    return ((0, jsx_runtime_1.jsxs)(VerticalStackBarChartStyled, { children: [(0, jsx_runtime_1.jsx)("div", { ref: tooltipRef, className: "tooltip", style: {
                    position: "absolute",
                    background: "white",
                    padding: "5px",
                    pointerEvents: "none",
                    zIndex: 1000,
                    visibility: "hidden",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    borderRadius: "4px",
                    border: "1px solid #ddd",
                } }), (0, jsx_runtime_1.jsxs)("svg", { className: "chart", ref: chartRef, width: width, height: height, style: { overflow: "visible" }, onMouseOut: handleMouseOut, children: [children, (0, jsx_runtime_1.jsx)(Title_1.default, { x: width / 2, y: MARGIN.top / 2, children: title }), (0, jsx_runtime_1.jsx)(XaxisBand_1.default, { xScale: xScale, height: height, margin: margin, xAxisFormat: xAxisFormat }), (0, jsx_runtime_1.jsx)(YaxisLinear_1.default, { yScale: yScale, width: width, height: height, margin: margin, highlightZeroLine: true, yAxisFormat: yAxisFormat }), (0, jsx_runtime_1.jsx)("g", { children: keys.map(key => {
                            return ((0, jsx_runtime_1.jsx)("g", { children: stackedRectData[key] &&
                                    stackedRectData[key].map((d, i) => {
                                        var _a, _b;
                                        return ((0, jsx_runtime_1.jsxs)(react_1.default.Fragment, { children: [(0, jsx_runtime_1.jsx)("rect", { x: d.x, y: d.y, width: d.width, height: d.height, fill: (_b = (_a = colorCallbackFn === null || colorCallbackFn === void 0 ? void 0 : colorCallbackFn(key, d)) !== null && _a !== void 0 ? _a : d.fill) !== null && _b !== void 0 ? _b : "transparent", rx: 2, stroke: "#fff", className: `bar`, "data-value-zero": d.value === 0, opacity: highlightItems.length === 0 || highlightItems.includes(key) ? 1 : 0.2, onMouseOver: () => handleMouseOver(key, d), onMouseMove: updateTooltipPosition, onMouseOut: handleMouseOut }), d.seriesKeyAbbreviation && ((0, jsx_runtime_1.jsx)("text", { x: d.x + d.width / 2, y: height - margin.bottom + 15, textAnchor: "middle", fontSize: "12", fill: "#000", className: "x-axis-label", children: (0, jsx_runtime_1.jsx)("tspan", { children: d.seriesKeyAbbreviation }) }))] }, `item-${i}`));
                                    }) }, key));
                        }) })] }), isLoading && isLoadingComponent && (0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: isLoadingComponent }), isLoading && !isLoadingComponent && (0, jsx_runtime_1.jsx)(LoadingIndicator_1.default, {}), displayIsNodata && (0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: isNodataComponent })] }));
};
exports.default = VerticalStackBarChart;

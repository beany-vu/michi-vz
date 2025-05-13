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
// RangeChart.tsx
const react_1 = require("react");
const d3 = __importStar(require("d3"));
const MichiVzProvider_1 = require("./MichiVzProvider");
const Title_1 = __importDefault(require("./shared/Title"));
const XaxisLinear_1 = __importDefault(require("./shared/XaxisLinear"));
const YaxisLinear_1 = __importDefault(require("./shared/YaxisLinear"));
const useDisplayIsNodata_1 = require("./hooks/useDisplayIsNodata");
const LoadingIndicator_1 = __importDefault(require("./shared/LoadingIndicator"));
const use_deep_compare_effect_1 = __importDefault(require("use-deep-compare-effect"));
const MARGIN = { top: 50, right: 50, bottom: 50, left: 50 };
const WIDTH = 900 - MARGIN.left - MARGIN.right;
const HEIGHT = 480 - MARGIN.top - MARGIN.bottom;
const RangeChart = ({ dataSet, title, width = WIDTH, height = HEIGHT, margin = MARGIN, yAxisDomain, yAxisFormat, xAxisDataType = "number", xAxisFormat, tooltipFormatter = (d) => `<div>${d.label} - ${d.date}: ${d === null || d === void 0 ? void 0 : d.valueMedium}</div>`, showCombined = false, children, isLoading = false, isLoadingComponent, isNodataComponent, isNodata, onChartDataProcessed, onHighlightItem, }) => {
    const { colorsMapping, highlightItems, disabledItems } = (0, MichiVzProvider_1.useChartContext)();
    const svgRef = (0, react_1.useRef)(null);
    const tooltipRef = (0, react_1.useRef)(null);
    const renderCompleteRef = (0, react_1.useRef)(false);
    // Add ref for previous data comparison
    const prevChartDataRef = (0, react_1.useRef)(null);
    // Add filteredDataSet to filter out disabled items first
    const filteredDataSet = (0, react_1.useMemo)(() => {
        return dataSet.filter(d => !disabledItems.includes(d.label));
    }, [dataSet, disabledItems]);
    const yScale = (0, react_1.useMemo)(() => d3
        .scaleLinear()
        .domain(yAxisDomain
        ? yAxisDomain
        : [
            d3.min(filteredDataSet.flatMap(({ series }) => series.filter(dd => dd.valueMin !== null)), d => d.valueMin) || 0,
            d3.max(filteredDataSet.flatMap(({ series }) => series.filter(dd => dd.valueMax !== null)), d => d.valueMax) || 1,
        ])
        .range([height - margin.bottom, margin.top])
        .clamp(true)
        .nice(), [filteredDataSet, width, height, margin, yAxisDomain]);
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
    }, [filteredDataSet, width, height, margin, xAxisDataType]);
    // function getDashArrayMemoized(
    //   series: DataPointRangeChart[],
    //   pathNode: SVGPathElement,
    //   xScale: ScaleLinear<number, number> | ScaleTime<number, number>,
    // ) {
    //   // ... (existing code)
    // }
    const getAreaGenerator = d3
        .area()
        .x(d => {
        return xScale(new Date(d.date));
    })
        .y0(d => {
        return yScale(d.valueMin);
    })
        .y1(d => {
        return yScale(d.valueMax);
    })
        .curve(d3.curveBumpX);
    const getLineGenerator = d3
        .line()
        .x(d => {
        return xScale(new Date(d.date));
    })
        .y(d => {
        // Use the average for a line
        return yScale((d.valueMax + d.valueMin) / 2);
    })
        .curve(d3.curveBumpX);
    const showLine = (d) => d.valueMin === d.valueMax;
    const showTooltip = (event, content) => {
        const tooltip = tooltipRef.current;
        const [x, y] = d3.pointer(event, svgRef.current);
        if (tooltip) {
            tooltip.innerHTML = content;
            tooltip.style.opacity = "1";
            tooltip.style.left = x + 10 + "px"; // Offset by 10 pixels to the right
            tooltip.style.top = y - window.scrollY - 10 + "px"; // Offset by 10 pixels to the top, considering scroll position
        }
    };
    const hideTooltip = () => {
        const tooltip = tooltipRef.current;
        if (tooltip) {
            tooltip.style.opacity = "0";
        }
    };
    (0, react_1.useEffect)(() => {
        const svg = d3.select(svgRef.current);
        // svg.selectAll(".area-upper").remove();
        // svg.selectAll(".area-lower").remove();
        svg.selectAll(".line").remove();
        svg.selectAll(".line-overlay").remove();
        svg.selectAll(".circle-data").remove();
        svg.selectAll(".area-group").remove();
        const areas = svg.selectAll(".area-group").data(filteredDataSet).enter().append("g");
        areas
            .append("path")
            .attr("class", (_, i) => `area area-${i} area-group`)
            .attr("d", d => {
            if (showLine(d.series[0])) {
                const linePath = getLineGenerator(d.series);
                return linePath;
            }
            else {
                const areaPath = getAreaGenerator(d.series);
                return areaPath;
            }
        })
            .attr("fill", d => (showLine(d.series[0]) ? "none" : colorsMapping[d.label] || d.color))
            .attr("stroke", d => (showLine(d.series[0]) ? colorsMapping[d.label] || d.color : "none"))
            .attr("data-label", d => d.label)
            .attr("transition", "all 0.1s ease-out")
            .on("mouseenter", function (event) {
            const label = d3.select(this).attr("label");
            event.preventDefault();
            // Bring the hovered area to the front
            d3.select(this).raise();
            // Set opacity of other areas to 0.3
            areas.selectAll(".area-group").attr("opacity", 0.1);
            // Set opacity of the hovered area to 1
            d3.select(this).attr("opacity", 1);
            svg.selectAll(".rect-hover").attr("opacity", 0);
            svg.selectAll(`.rect-hover[data-label="${label}"]`).attr("opacity", 1);
        })
            .on("mouseout", event => {
            // mouse is on .react-hover then do nothing
            if (event.relatedTarget && event.relatedTarget.classList.contains("rect-hover")) {
                return;
            }
            event.preventDefault();
            // Reset opacity of all areas to 0.8
            areas.selectAll(".area-group").attr("opacity", 0.8);
            svg.selectAll(".rect-hover").attr("opacity", 0);
        });
        // Add rect elements for each year
        filteredDataSet.forEach((data, i) => {
            svg
                .selectAll(`.rect-hover-${i}`)
                .data(data.series)
                .enter()
                .append("rect")
                .attr("class", `rect-hover rect-hover-${i}`)
                .attr("stroke", "#ccc")
                .attr("data-label", data.label)
                .attr("x", d => xScale(new Date(d.date)) - 4 / 2)
                .attr("y", d => yScale(d.valueMax))
                .attr("width", 4)
                .attr("height", d => Math.abs(yScale(d.valueMax) - yScale(d.valueMin)))
                .attr("fill", "white")
                .attr("opacity", 0)
                .on("mouseenter", (event, d) => {
                event.preventDefault();
                event.stopPropagation();
                onHighlightItem([data.label]);
                showTooltip(event, tooltipFormatter(d, data.series, filteredDataSet));
            })
                .on("mouseleave", event => {
                event.preventDefault();
                event.stopPropagation();
                onHighlightItem([]);
                hideTooltip();
            });
        });
        // ... (existing code for axis, title, and other elements)
    }, [yScale, xScale, width, height, margin, filteredDataSet, xAxisDataType]);
    (0, react_1.useEffect)(() => {
        const svg = d3.select(svgRef.current);
        svg.selectAll(".axis").remove();
        // ... (existing code for axis, title, and other elements)
    }, [filteredDataSet, width, height, margin, xAxisDataType, yAxisFormat]);
    (0, react_1.useEffect)(() => {
        // ... (existing code)
    }, [colorsMapping]);
    (0, react_1.useEffect)(() => {
        const svg = d3.select(svgRef.current);
        highlightItems.forEach(item => {
            // fade out items with selectors [data-label="item"] inside this svg
            svg.selectAll(`[data-label]:not([data-label="${item}"])`).attr("opacity", 0.1);
            svg.selectAll(`.rect-hover[data-label="${item}"]`).attr("opacity", 0.8);
        });
    }, [highlightItems]);
    (0, react_1.useEffect)(() => {
        // ... (existing code)
    }, [showCombined]);
    const displayIsNodata = (0, useDisplayIsNodata_1.useDisplayIsNodata)({
        dataSet: filteredDataSet,
        isLoading: isLoading,
        isNodataComponent: isNodataComponent,
        isNodata: isNodata,
    });
    (0, react_1.useLayoutEffect)(() => {
        renderCompleteRef.current = true;
    }, []);
    // Replace useEffect with useDeepCompareEffect for metadata comparison
    (0, use_deep_compare_effect_1.default)(() => {
        if (renderCompleteRef.current && onChartDataProcessed) {
            // Extract all dates from all series
            const allDates = filteredDataSet.flatMap(set => set.series.map(point => (xAxisDataType === "number" ? point.date : String(point.date))));
            // Create unique dates array
            const uniqueDates = [...new Set(allDates)].map(date => String(date));
            const currentMetadata = {
                xAxisDomain: uniqueDates,
                yAxisDomain: yScale.domain(),
                visibleItems: filteredDataSet
                    .map(d => d.label)
                    .filter(label => !disabledItems.includes(label)),
                renderedData: filteredDataSet.reduce((acc, d) => {
                    acc[d.label] = d.series;
                    return acc;
                }, {}),
                chartType: "range-chart",
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
    }, [filteredDataSet, xAxisDataType, yScale, disabledItems, onChartDataProcessed]);
    return ((0, jsx_runtime_1.jsxs)("div", { className: "chart-container", style: { position: "relative" }, children: [isLoading && isLoadingComponent && (0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: isLoadingComponent }), isLoading && !isLoadingComponent && (0, jsx_runtime_1.jsx)(LoadingIndicator_1.default, {}), displayIsNodata && (0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: isNodataComponent }), !isLoading && !displayIsNodata && filteredDataSet.length > 0 && ((0, jsx_runtime_1.jsxs)("svg", { className: "chart", width: width, height: height, ref: svgRef, style: { overflow: "visible" }, children: [title && ((0, jsx_runtime_1.jsx)("text", { x: width / 2, y: margin.top / 2, textAnchor: "middle", className: "chart-title", children: title })), children, (0, jsx_runtime_1.jsx)(Title_1.default, { x: width / 2, y: margin.top / 2, children: title }), filteredDataSet.length > 0 && ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(XaxisLinear_1.default, { xScale: xScale, height: height, margin: margin, xAxisFormat: xAxisFormat, xAxisDataType: xAxisDataType }), (0, jsx_runtime_1.jsx)(YaxisLinear_1.default, { yScale: yScale, width: width, height: height, margin: margin, highlightZeroLine: true, yAxisFormat: yAxisFormat })] }))] })), (0, jsx_runtime_1.jsx)("div", { ref: tooltipRef, className: "chart-tooltip", style: { opacity: 0, pointerEvents: "none", position: "fixed" } })] }));
};
exports.default = RangeChart;

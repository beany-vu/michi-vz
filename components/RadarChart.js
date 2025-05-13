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
exports.RadarChart = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const d3 = __importStar(require("d3"));
const styled_components_1 = __importDefault(require("styled-components"));
const range_1 = __importDefault(require("lodash/range"));
const MichiVzProvider_1 = require("../components/MichiVzProvider");
const LoadingIndicator_1 = __importDefault(require("./shared/LoadingIndicator"));
const useDisplayIsNodata_1 = require("./hooks/useDisplayIsNodata");
const Polygon = styled_components_1.default.polygon `
  stroke-linejoin: round;
  pointer-events: stroke;
  transition: all 0.2s ease-out;
`;
const DataPointStyled = styled_components_1.default.circle `
  transition: opacity 0.3s ease-out;
`;
const DataPoints = styled_components_1.default.g `
  &.highlight {
    ${DataPointStyled} {
      opacity: 1;
      pointer-events: auto;
    }
  }
`;
const Tooltip = styled_components_1.default.div `
  position: absolute;
  padding: 8px 12px;
  border-radius: 4px;
  pointer-events: none;
  z-index: 1000;
  transition: opacity 0.3s;
  font-size: 12px;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border: 1px solid #e0e0e0;
  max-width: 200px;
  white-space: nowrap;
  transform: translate(-50%, -100%);
  margin-top: -10px;
`;
const RadarChart = ({ width, height, series, poles, tooltipFormatter, poleLabelFormatter, radialLabelFormatter, children, isLoading = false, isLoadingComponent, isNodataComponent, isNodata, onChartDataProcessed, onHighlightItem, tooltipContainerStyle, }) => {
    const { colorsMapping, highlightItems, disabledItems } = (0, MichiVzProvider_1.useChartContext)();
    const svgRef = (0, react_1.useRef)(null);
    const [tooltipData, setTooltipData] = (0, react_1.useState)(null);
    const tooltipRef = (0, react_1.useRef)(null);
    const renderCompleteRef = (0, react_1.useRef)(false);
    const prevChartDataRef = (0, react_1.useRef)(null);
    const yScaleDomain = (0, react_1.useMemo)(() => {
        if (!series)
            return [0, 30];
        return [
            0,
            Math.max(...series
                .filter((d) => !disabledItems.includes(d.label))
                .map((d) => d.data)
                .flat()
                .map(d => {
                const parsedValue = parseFloat(String(d.value));
                return isNaN(parsedValue) ? 0 : parsedValue;
            })),
        ];
    }, [series, disabledItems]);
    const yScale = (0, react_1.useMemo)(() => {
        return d3
            .scaleLinear()
            .domain(yScaleDomain)
            .range([0, height / 2 - 30]);
    }, [poles, height]);
    const anglesDateMapping = (0, react_1.useMemo)(() => {
        var _a;
        return (_a = poles === null || poles === void 0 ? void 0 : poles.labels) === null || _a === void 0 ? void 0 : _a.reduce((res, cur, i) => {
            res[cur] = (i / poles.labels.length) * 2 * Math.PI;
            return res;
        }, {});
    }, [poles === null || poles === void 0 ? void 0 : poles.labels]);
    const genPolygonPoints = (data, scale) => {
        const points = new Array(data.length).fill({
            x: null,
            y: null,
            date: null,
            value: null,
        });
        const pointString = data.reduce((res, cur, i) => {
            if (i > data.length)
                return res;
            if (!(cur === null || cur === void 0 ? void 0 : cur.value)) {
                return res;
            }
            // Adjusting starting angle by subtracting Math.PI / 2
            const angle = anglesDateMapping[cur.date];
            // Now include the center of the radar chart in your calculations.
            const xVal = Math.round(width / 2 + scale(cur.value) * Math.sin(angle));
            const yVal = Math.round(height / 2 + scale(cur.value) * Math.cos(angle) * -1);
            points[i] = { x: xVal, y: yVal, date: cur.date, value: cur.value };
            res += `${xVal},${yVal} `;
            return res;
        }, "");
        return { points, pointString };
    };
    const processedSeries = series && series.length > 0
        ? series
            // sort disabled items first
            .filter((d) => !disabledItems.includes(d.label))
            .map((item) => ({
            ...genPolygonPoints(item.data, yScale),
            ...item,
        }))
        : [];
    (0, react_1.useEffect)(() => {
        var _a;
        const svg = d3.select(svgRef.current);
        svg.selectAll(".radial-label").remove();
        svg.selectAll(".radial-circle").remove();
        svg.selectAll(".pole-label").remove();
        // Drawing radial lines
        const numRadialTicks = 12;
        for (let i = 0; i < numRadialTicks; i++) {
            const angle = (i / numRadialTicks) * 2 * Math.PI;
            const x1 = width / 2;
            const y1 = height / 2;
            const x2 = width / 2 + Math.sin(angle) * (height / 2 - 30);
            const y2 = height / 2 - Math.cos(angle) * (height / 2 - 30);
            const line = d3.line()([
                [x1, y1],
                [x2, y2],
            ]);
            svg.append("path").attr("d", line).attr("stroke", "#c1c1c1").attr("stroke-width", 1).lower();
        }
        // Drawing radial circles
        const numCircleTicks = 6; // Or any other desired number.
        const circleRadii = (0, range_1.default)(1, numCircleTicks + 1).map(value => (height / 2) * (value / numCircleTicks));
        circleRadii.forEach((radius, i) => {
            const tickValue = yScale.invert(radius - 30);
            const currentRadiusForLbl = radius - 30;
            const labelY = height / 2 - currentRadiusForLbl;
            svg
                .append("circle")
                .attr("class", "radial-circle")
                .attr("cx", width / 2)
                .attr("cy", height / 2)
                .attr("r", radius - 30)
                .attr("fill", "transparent")
                .attr("stroke", "#c1c1c1")
                .attr("stroke-width", 1)
                .style("pointer-events", "none")
                .attr("stroke-dasharray", "2,2");
            // Add tick label
            svg
                .append("text")
                .attr("class", "radial-label")
                .attr("x", width / 2)
                .attr("y", labelY) // Adjust vertical alignment as needed
                .attr("text-anchor", "end")
                .style("pointer-events", "none")
                .each(function () {
                const textElement = d3.select(this);
                if (radialLabelFormatter) {
                    textElement.text(radialLabelFormatter(tickValue));
                }
                else {
                    textElement.text(i === 0 ? i : tickValue.toFixed(1));
                }
            })
                .raise();
        });
        // Drawing labels
        const labelRadius = height / 2 - 5; // Adjust this as needed
        (_a = poles === null || poles === void 0 ? void 0 : poles.labels) === null || _a === void 0 ? void 0 : _a.forEach((label, i) => {
            const angle = (i / poles.labels.length) * 2 * Math.PI;
            const lx = width / 2 + Math.sin(angle) * labelRadius;
            const ly = height / 2 - Math.cos(angle) * labelRadius;
            svg
                .append("text")
                .attr("class", "pole-label")
                .style("pointer-events", "none")
                .attr("x", lx)
                .attr("y", ly)
                .attr("dy", ".35em") // Adjust vertical alignment here
                .attr("text-anchor", () => {
                if (i === poles.labels.length / 2)
                    return "middle";
                else if (lx < width / 2)
                    return "end";
                else if (lx > width / 2)
                    return "start";
                return "middle";
            })
                .text(poleLabelFormatter ? poleLabelFormatter(label) : label);
        });
    }, [width, height, series, poles]);
    (0, react_1.useEffect)(() => {
        const svg = d3.select(svgRef.current);
        svg.selectAll(".series").attr("opacity", highlightItems.length === 0 ? 1 : 0.5);
        svg.selectAll(".data-point").attr("opacity", 0);
        highlightItems.forEach((item) => {
            svg.selectAll(`.series[data-label="${item}"]`).attr("opacity", 1).raise();
            svg.selectAll(`.data-point[data-label="${item}"]`).attr("opacity", 1).raise();
            svg.selectAll(".radial-label").raise();
        });
    }, [highlightItems]);
    const displayIsNodata = (0, useDisplayIsNodata_1.useDisplayIsNodata)({
        dataSet: series,
        isLoading: isLoading,
        isNodataComponent: isNodataComponent,
        isNodata: isNodata,
    });
    (0, react_1.useLayoutEffect)(() => {
        renderCompleteRef.current = true;
    }, []);
    (0, react_1.useEffect)(() => {
        if (renderCompleteRef.current && onChartDataProcessed) {
            // Ensure unique labels in poles.labels
            const uniqueLabels = (poles === null || poles === void 0 ? void 0 : poles.labels) ? [...new Set(poles.labels)] : [];
            const currentMetadata = {
                xAxisDomain: (poles === null || poles === void 0 ? void 0 : poles.labels) ? poles.labels.map(String) : [],
                yAxisDomain: yScale.domain(),
                visibleItems: series && series.length > 0
                    ? series.filter(s => !disabledItems.includes(s.label)).map(s => s.label)
                    : [],
                renderedData: {
                    [uniqueLabels[0] || "default"]: series || [],
                },
                chartType: "radar-chart",
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
    }, [series, poles, processedSeries, disabledItems, onChartDataProcessed]);
    return ((0, jsx_runtime_1.jsxs)("div", { style: { position: "relative" }, children: [(0, jsx_runtime_1.jsx)(Tooltip, { ref: tooltipRef, style: {
                    opacity: tooltipData ? 1 : 0,
                    ...tooltipContainerStyle,
                }, className: "tooltip", children: tooltipData && ((0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: tooltipFormatter ? (tooltipFormatter({
                        date: tooltipData.date,
                        value: tooltipData.value,
                        series: tooltipData.series,
                    })) : ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("strong", { children: "Date:" }), " ", tooltipData.date, (0, jsx_runtime_1.jsx)("br", {}), (0, jsx_runtime_1.jsx)("strong", { children: "Value:" }), " ", tooltipData.value] })) })) }), (0, jsx_runtime_1.jsxs)("svg", { width: width, height: height, style: { overflow: "visible" }, ref: svgRef, onMouseOut: event => {
                    event.preventDefault();
                    event.stopPropagation();
                    onHighlightItem([]);
                    setTooltipData(null);
                }, children: [children, processedSeries.map(({ label, pointString, points, color }, i) => {
                        var _a;
                        return ((0, jsx_runtime_1.jsxs)("g", { "data-label": label, className: `series`, children: [(0, jsx_runtime_1.jsx)(Polygon, { points: pointString, fill: "transparent", "data-label": colorsMapping[label], stroke: (_a = colorsMapping[label]) !== null && _a !== void 0 ? _a : color, strokeWidth: 2, onMouseEnter: event => {
                                        event.preventDefault();
                                        onHighlightItem([label]);
                                    }, onMouseOut: event => {
                                        event.preventDefault();
                                        onHighlightItem([]);
                                    } }), (0, jsx_runtime_1.jsx)(DataPoints, { className: `data-points data-points-${i}`, children: points.map((point, j) => {
                                        var _a;
                                        return ((0, jsx_runtime_1.jsx)("g", { children: point.x !== null && point.y !== null && ((0, jsx_runtime_1.jsx)(DataPointStyled, { className: `data-point data-point-${i}`, "data-label": label, r: 5, cx: point.x, cy: point.y, stroke: "#fff", strokeWidth: 2, fill: (_a = colorsMapping[label]) !== null && _a !== void 0 ? _a : color, onMouseEnter: e => {
                                                    onHighlightItem([label]);
                                                    setTooltipData({
                                                        date: point.date,
                                                        value: point.value,
                                                        series: points,
                                                    });
                                                    if (tooltipRef.current) {
                                                        const tooltip = tooltipRef.current;
                                                        const svgRect = svgRef.current.getBoundingClientRect();
                                                        const x = e.clientX - svgRect.left;
                                                        const y = e.clientY - svgRect.top;
                                                        tooltip.style.left = `${x}px`;
                                                        tooltip.style.top = `${y}px`;
                                                    }
                                                }, onMouseOut: () => {
                                                    onHighlightItem([]);
                                                    setTooltipData(null);
                                                } })) }, `data-point-${j}`));
                                    }) })] }, `series-${i}`));
                    })] }), isLoading && isLoadingComponent && (0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: isLoadingComponent }), isLoading && !isLoadingComponent && (0, jsx_runtime_1.jsx)(LoadingIndicator_1.default, {}), displayIsNodata && (0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: isNodataComponent })] }));
};
exports.RadarChart = RadarChart;
exports.default = exports.RadarChart;

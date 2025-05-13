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
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importStar(require("react"));
const d3 = __importStar(require("d3"));
const YaxisLinear = ({ yScale, width, height, highlightZeroLine = true, margin, yTicksQty, yAxisFormat, }) => {
    const ref = (0, react_1.useRef)(null);
    const yAxisConfig = (0, react_1.useMemo)(() => {
        const axis = d3
            .axisLeft(yScale)
            .tickSize(0)
            .tickPadding(10)
            .ticks(yTicksQty || 10);
        if (yAxisFormat) {
            axis.tickFormat(yAxisFormat);
        }
        return axis;
    }, [yScale, yTicksQty, yAxisFormat]);
    // Memoize the previous yScale domain to detect changes
    const prevYScaleDomain = (0, react_1.useRef)(yScale.domain());
    (0, react_1.useLayoutEffect)(() => {
        const g = d3.select(ref.current);
        const currentYScaleDomain = yScale.domain();
        const yScaleChanged = JSON.stringify(currentYScaleDomain) !== JSON.stringify(prevYScaleDomain.current);
        prevYScaleDomain.current = currentYScaleDomain;
        // Initial render with transition
        g.transition()
            .duration(750)
            .attr("transform", `translate(${margin.left > 0 ? margin.left : 0},0)`)
            .call(yAxisConfig)
            .call(g => g.select(".domain").attr("stroke-opacity", 0))
            .call(g => g.select(".domain").remove())
            .call(g => g.selectAll(".tick line").attr("stroke-opacity", 0))
            .call(g => g.selectAll(".tick line").remove())
            .call(g => g.selectAll(".tick-line").remove());
        // Remove existing tick lines before updating
        g.selectAll(".tick line").remove();
        // Update transitions
        g.selectAll(".tick text").transition().duration(750).style("opacity", 1);
        // Only animate tick lines if y-scale changed
        const tickLines = g
            .selectAll(".tick")
            .append("line")
            .attr("class", "tick-line")
            .attr("x1", 0)
            .attr("x2", 0)
            .attr("y1", 0)
            .attr("y2", 0)
            .style("stroke-dasharray", "2,2")
            .style("stroke", "lightgray")
            .style("opacity", 1);
        if (yScaleChanged) {
            tickLines
                .transition()
                .duration(750)
                .attr("x2", width - margin.right - margin.left)
                .each(function (d) {
                if (d === 0) {
                    d3.select(this)
                        .classed("zero-line", true)
                        .attr("stroke", highlightZeroLine ? "#000" : "lightgray")
                        .attr("stroke-width", "1");
                }
            });
        }
        else {
            tickLines.attr("x2", width - margin.right - margin.left).each(function (d) {
                if (d === 0) {
                    d3.select(this)
                        .classed("zero-line", true)
                        .attr("stroke", highlightZeroLine ? "#000" : "lightgray")
                        .attr("stroke-width", "1");
                }
            });
        }
    }, [yScale, width, height, margin, highlightZeroLine, yAxisConfig]);
    return (0, jsx_runtime_1.jsx)("g", { ref: ref });
};
exports.default = react_1.default.memo(YaxisLinear);

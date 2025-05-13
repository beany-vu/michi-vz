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
const YaxisBand = ({ yScale, width, margin, yAxisFormat, showGrid }) => {
    const ref = (0, react_1.useRef)(null);
    const renderedRef = (0, react_1.useRef)(false);
    // Memoize the axis generator
    const axisGenerator = (0, react_1.useMemo)(() => {
        return d3
            .axisLeft(yScale)
            .tickFormat(d => (yAxisFormat ? yAxisFormat(d) : d))
            .tickSize(0);
    }, [yScale, yAxisFormat]);
    // Memoize the grid width calculation
    const gridWidth = (0, react_1.useMemo)(() => {
        return width - margin.left - margin.right;
    }, [width, margin]);
    const updateAxis = (0, react_1.useCallback)(() => {
        if (!ref.current)
            return;
        const g = d3.select(ref.current);
        // Clear previous content
        g.selectAll("*").remove();
        // Add the y-axis with ticks
        g.attr("class", "y-axis")
            .attr("transform", "translate(" + margin.left + ",0)")
            .call(axisGenerator);
        // Remove domain line and tick lines
        g.select(".domain").remove();
        g.selectAll(".tick line").remove();
        // Remove existing text labels
        g.selectAll(".tick *").remove();
        // Remove existing tick lines
        g.selectAll(".tick-line").remove();
        // Append foreignObject for HTML content
        g.selectAll(".tick")
            .append("foreignObject")
            .attr("class", "tick-html")
            .attr("x", -100)
            .attr("y", -10)
            .attr("width", 100)
            .attr("height", 20)
            .html(d => `<div style="display:flex;align-items:center;height:100%" title="${d}"><span>${d}</span></div>`);
        // Add dashed lines on each tick
        g.selectAll(".tick")
            .append("line")
            .attr("class", "tick-line")
            .attr("x1", 0)
            .attr("x2", gridWidth)
            .attr("y1", 0)
            .attr("y2", 0)
            .style("stroke-dasharray", "1.5")
            .style("stroke", showGrid ? "lightgray" : "transparent");
    }, [axisGenerator, margin.left, showGrid, gridWidth]);
    (0, react_1.useLayoutEffect)(() => {
        if (!renderedRef.current) {
            // First render with transition
            if (ref.current) {
                const g = d3.select(ref.current);
                g.selectAll(".tick").attr("opacity", 0).transition().duration(500).attr("opacity", 1);
            }
            renderedRef.current = true;
        }
        updateAxis();
    }, [updateAxis]);
    return (0, jsx_runtime_1.jsx)("g", { ref: ref });
};
exports.default = react_1.default.memo(YaxisBand);

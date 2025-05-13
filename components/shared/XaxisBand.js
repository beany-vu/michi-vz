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
const XaxisBand = ({ xScale, height, margin, xAxisFormat, 
// xAxisDataType is kept for API consistency with other axis components
// eslint-disable-next-line @typescript-eslint/no-unused-vars
xAxisDataType = "text", ticks = 15, isLoading = false, isEmpty = false, }) => {
    const ref = (0, react_1.useRef)(null);
    const renderedRef = (0, react_1.useRef)(false);
    // Memoize the tick values calculation - select evenly spaced ticks
    const tickValues = (0, react_1.useMemo)(() => {
        // Don't generate ticks if loading or empty
        if (isLoading || isEmpty) {
            return [];
        }
        const domain = xScale.domain();
        // Early return if domain is empty
        if (domain.length === 0)
            return [];
        // If only one item, just return it
        if (domain.length === 1)
            return domain;
        // Always include first and last
        const first = domain[0];
        const last = domain[domain.length - 1];
        // Calculate available width for ticks
        const availableWidth = xScale.range()[1] - xScale.range()[0];
        // Estimate space needed per tick (average label width + padding)
        const estimatedTickWidth = 80; // Base estimate in pixels
        // Calculate how many ticks can fit
        const maxFittingTicks = Math.floor(availableWidth / estimatedTickWidth);
        // Use the smaller of maxFittingTicks or requested ticks
        const effectiveTicks = Math.max(2, Math.min(maxFittingTicks, ticks));
        // If we only want two ticks or have only two items, return first and last
        if (effectiveTicks <= 2 || domain.length <= 2) {
            return [first, last];
        }
        // If we have very few items, just show them all
        if (domain.length <= effectiveTicks) {
            return domain;
        }
        // Generate evenly spaced index positions
        const result = [first]; // Always include first
        if (effectiveTicks > 2) {
            // Calculate step size to create evenly spaced ticks
            const step = (domain.length - 1) / (effectiveTicks - 1);
            // Add intermediate ticks at even intervals (skip first and last)
            for (let i = 1; i < effectiveTicks - 1; i++) {
                const index = Math.round(i * step);
                if (index > 0 && index < domain.length - 1) {
                    result.push(domain[index]);
                }
            }
        }
        result.push(last); // Always include last
        return result;
    }, [xScale, ticks, isLoading, isEmpty]);
    // Memoize the formatter function
    const formatter = (0, react_1.useCallback)((d) => {
        if (xAxisFormat) {
            return xAxisFormat(d);
        }
        return String(d);
    }, [xAxisFormat]);
    (0, react_1.useLayoutEffect)(() => {
        if (!ref.current || !xScale || renderedRef.current)
            return;
        const xAxis = d3
            .axisBottom(xScale)
            .tickFormat(formatter)
            .tickSizeOuter(0)
            .tickValues(tickValues);
        d3.select(ref.current)
            .call(xAxis)
            .selectAll("text")
            .attr("y", margin.bottom / 2)
            .attr("dx", "0em")
            .attr("dy", "0.5em");
        renderedRef.current = true;
    }, [xScale, margin.bottom, formatter, tickValues]);
    (0, react_1.useLayoutEffect)(() => {
        const g = d3.select(ref.current);
        if (!g || !tickValues.length)
            return;
        // Clear previous content
        g.selectAll("*").remove();
        // Create the axis group
        const axisGroup = g.attr("transform", `translate(0,${height - margin.bottom + 25})`);
        // Add the axis with transition - only apply transition on first render
        const axisCall = d3.axisBottom(xScale).tickValues(tickValues).tickFormat(formatter);
        if (!renderedRef.current) {
            axisGroup.transition().duration(500).call(axisCall);
            renderedRef.current = true;
        }
        else {
            axisGroup.call(axisCall);
        }
        // Remove domain line and tick lines
        axisGroup.select(".domain").remove();
        axisGroup.selectAll(".tick line").remove();
        // Keep labels horizontal by default
        axisGroup
            .selectAll(".tick text")
            .attr("transform", "rotate(0)")
            .style("text-anchor", "middle")
            .attr("dx", "0")
            .attr("dy", "0.71em");
        // Add dashed lines with transition
        const tickGroups = axisGroup.selectAll(".tick");
        // Remove existing tick lines before adding new ones
        tickGroups.selectAll(".tick-line").remove();
        // Add tick lines - only apply transition on first render
        tickGroups
            .append("line")
            .attr("class", "tick-line")
            .attr("x1", 0)
            .attr("x2", 0)
            .attr("y1", 0)
            .attr("y2", -height + margin.bottom - 25)
            .attr("pointer-events", "none")
            .style("stroke-dasharray", "3,3")
            .style("stroke", "transparent")
            .style("opacity", 1);
        // Update or add dots
        const dots = tickGroups.selectAll(".tickValueDot").data([0]); // One dot per tick
        // Enter new dots
        dots
            .enter()
            .append("circle")
            .attr("class", "tickValueDot")
            .merge(dots)
            .attr("cx", 0)
            .attr("cy", 0)
            .attr("r", 2)
            .attr("fill", "lightgray")
            .style("opacity", 1);
        // Remove old dots
        dots.exit().remove();
        // Add interactive circles (separate from the dots)
        tickGroups
            .append("circle")
            .attr("class", "tickValueDot-interactive")
            .attr("cx", 0)
            .attr("cy", 0)
            .attr("r", 2)
            .attr("fill", "lightgray")
            .style("opacity", 1)
            .on("mouseover", function () {
            d3.select(this).attr("r", 4).attr("fill", "#666");
        })
            .on("mouseout", function () {
            d3.select(this).attr("r", 2).attr("fill", "lightgray");
        });
    }, [xScale, height, margin, tickValues, formatter]);
    return (0, jsx_runtime_1.jsx)("g", { ref: ref, className: "x-axis x-axis-band" });
};
exports.default = react_1.default.memo(XaxisBand);

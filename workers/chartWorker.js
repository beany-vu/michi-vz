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
const d3 = __importStar(require("d3"));
// Constants
const DASH_LENGTH = 4;
const DASH_SEPARATOR_LENGTH = 4;
// Helper function to get path length at x position
const getPathLengthAtX = (path, x) => {
    const l = path.getTotalLength();
    const precision = 90;
    if (!path || path.getTotalLength() === 0) {
        return 0;
    }
    for (let i = 0; i <= precision; i++) {
        const pos = path.getPointAtLength((l * i) / precision);
        if (pos.x >= x)
            return (l * i) / precision;
    }
};
// Main worker message handler
self.onmessage = (e) => {
    if (e.data.type === "calculate") {
        const { dataSet, width, height, margin, xAxisDataType, filter, disabledItems } = e.data.data;
        // Filter dataset
        const filteredDataSet = filter
            ? dataSet
                .filter(d => !disabledItems.includes(d.label))
                .filter(item => {
                const targetPoint = item.series.find(d => d.date.toString() === filter.date.toString());
                return targetPoint !== undefined;
            })
                .sort((a, b) => {
                const aPoint = a.series.find(d => d.date.toString() === filter.date.toString());
                const bPoint = b.series.find(d => d.date.toString() === filter.date.toString());
                const aVal = aPoint ? Number(aPoint[filter.criteria]) : 0;
                const bVal = bPoint ? Number(bPoint[filter.criteria]) : 0;
                return filter.sortingDir === "desc" ? bVal - aVal : aVal - bVal;
            })
                .slice(0, filter.limit)
            : dataSet.filter(d => !disabledItems.includes(d.label));
        // Calculate scales
        const yScale = d3
            .scaleLinear()
            .domain([
            d3.min(filteredDataSet.flatMap(({ series }) => series.filter(dd => dd.value !== null)), d => d.value) || 0,
            d3.max(filteredDataSet.flatMap(({ series }) => series.filter(dd => dd.value !== null)), d => d.value) || 1,
        ])
            .range([height - margin.bottom, margin.top])
            .clamp(true)
            .nice();
        const xScale = xAxisDataType === "number"
            ? d3
                .scaleLinear()
                .domain([
                d3.min(filteredDataSet.flatMap(item => item.series.map(d => d.date))) || 0,
                d3.max(filteredDataSet.flatMap(item => item.series.map(d => d.date))) || 1,
            ])
                .range([margin.left, width - margin.right])
                .clamp(true)
                .nice()
            : d3
                .scaleTime()
                .domain([
                d3.min(filteredDataSet.flatMap(item => item.series.map(d => new Date(d.date)))) || 0,
                d3.max(filteredDataSet.flatMap(item => item.series.map(d => new Date(d.date)))) || 1,
            ])
                .range([margin.left, width - margin.right]);
        // Calculate line data
        const lineData = dataSet.map(set => ({
            label: set.label,
            color: set.color,
            points: set.series,
        }));
        // Calculate visible datasets
        const visibleDataSets = filteredDataSet.filter(d => d.series.length > 1);
        // Calculate chart metadata
        const allDates = dataSet.flatMap(set => set.series.map(point => (xAxisDataType === "number" ? point.date : String(point.date))));
        const uniqueDates = [...new Set(allDates)];
        let visibleSeries = dataSet.map(d => d.label);
        if (filter === null || filter === void 0 ? void 0 : filter.date) {
            visibleSeries = visibleSeries.sort((a, b) => {
                var _a, _b;
                const aData = dataSet.find(d => d.label === a);
                const bData = dataSet.find(d => d.label === b);
                const aValue = ((_a = aData === null || aData === void 0 ? void 0 : aData.series.find(d => String(d.date) === String(filter.date))) === null || _a === void 0 ? void 0 : _a.value) || 0;
                const bValue = ((_b = bData === null || bData === void 0 ? void 0 : bData.series.find(d => String(d.date) === String(filter.date))) === null || _b === void 0 ? void 0 : _b.value) || 0;
                return filter.sortingDir === "desc" ? bValue - aValue : aValue - bValue;
            });
            if (filter.limit) {
                visibleSeries = visibleSeries.slice(0, filter.limit);
            }
        }
        const chartMetadata = {
            xAxisDomain: uniqueDates.map(String),
            yAxisDomain: yScale.domain(),
            visibleItems: visibleSeries.filter(label => { var _a; return !disabledItems.includes(label) && ((_a = dataSet.find(d => d.label === label)) === null || _a === void 0 ? void 0 : _a.series.length) > 0; }),
            renderedData: lineData.reduce((acc, item) => {
                if (item.points.length > 0 && visibleSeries.includes(item.label)) {
                    acc[item.label] = item.points;
                }
                return acc;
            }, {}),
        };
        // Send results back to main thread
        const output = {
            type: "result",
            data: {
                filteredDataSet,
                visibleDataSets,
                xScale,
                yScale,
                lineData,
                chartMetadata,
            },
        };
        self.postMessage(output);
    }
};

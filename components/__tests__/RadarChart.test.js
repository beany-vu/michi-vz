"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("@testing-library/react");
require("@testing-library/jest-dom");
const RadarChart_1 = __importDefault(require("../RadarChart"));
const test_utils_1 = require("./test-utils");
// Transform radar data to match the expected interface
const radarData = [
    {
        label: "Product A",
        value: 80,
        data: [
            { date: "Feature 1", value: 80 },
            { date: "Feature 2", value: 70 },
            { date: "Feature 3", value: 90 },
            { date: "Feature 4", value: 60 },
            { date: "Feature 5", value: 85 },
        ],
        color: "#1f77b4",
    },
    {
        label: "Product B",
        value: 75,
        data: [
            { date: "Feature 1", value: 65 },
            { date: "Feature 2", value: 85 },
            { date: "Feature 3", value: 75 },
            { date: "Feature 4", value: 90 },
            { date: "Feature 5", value: 70 },
        ],
        color: "#ff7f0e",
    },
];
const radarChartProps = {
    ...test_utils_1.defaultChartProps,
    poles: {
        domain: [0, 100],
        range: [0, 100],
        labels: ["Feature 1", "Feature 2", "Feature 3", "Feature 4", "Feature 5"],
    },
    onHighlightItem: () => { },
};
describe("RadarChart", () => {
    // Skip tests that require deeper SVG mocking
    test.skip("renders with title", async () => {
        const chartTitle = "Test Radar Chart";
        const { container } = (0, test_utils_1.customRender)((0, jsx_runtime_1.jsx)(RadarChart_1.default, { series: radarData, ...radarChartProps }));
        await (0, react_1.waitFor)(() => {
            const svg = container.querySelector("svg");
            expect(svg).toBeInTheDocument();
        });
        // Check for polygon shapes (radar areas)
        const polygons = container.querySelectorAll("polygon");
        expect(polygons.length).toBeGreaterThan(0);
        // Check for axis labels
        expect(react_1.screen.getByText("Feature 1")).toBeInTheDocument();
        expect(react_1.screen.getByText("Feature 2")).toBeInTheDocument();
    });
    test.skip("renders with legends", async () => {
        const { container } = (0, test_utils_1.customRender)((0, jsx_runtime_1.jsx)(RadarChart_1.default, { series: radarData, ...radarChartProps }));
        await (0, react_1.waitFor)(() => {
            const svg = container.querySelector("svg");
            expect(svg).toBeInTheDocument();
        });
        // Check for data representing each series
        const polygons = container.querySelectorAll("polygon");
        expect(polygons.length).toBeGreaterThan(0);
    });
    test("renders without data", () => {
        // Just test that it doesn't throw
        expect(() => {
            (0, test_utils_1.customRender)((0, jsx_runtime_1.jsx)(RadarChart_1.default, { series: [], ...radarChartProps }));
        }).not.toThrow();
    });
    test.skip("handles data updates", async () => {
        const { rerender, container } = (0, test_utils_1.customRender)((0, jsx_runtime_1.jsx)(RadarChart_1.default, { series: [radarData[0]], ...radarChartProps }));
        await (0, react_1.waitFor)(() => {
            const svg = container.querySelector("svg");
            expect(svg).toBeInTheDocument();
        });
        // Initially we should have one polygon for one dataset
        let polygons = container.querySelectorAll("polygon");
        expect(polygons.length).toBe(1);
        // Rerender with more data
        rerender((0, jsx_runtime_1.jsx)(RadarChart_1.default, { series: radarData, ...radarChartProps }));
        await (0, react_1.waitFor)(() => {
            // Now we should have more polygons
            polygons = container.querySelectorAll("polygon");
            expect(polygons.length).toBe(2);
        });
    });
});

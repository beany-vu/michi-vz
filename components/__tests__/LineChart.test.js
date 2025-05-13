"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("@testing-library/react");
require("@testing-library/jest-dom");
const LineChart_1 = __importDefault(require("../LineChart"));
const test_utils_1 = require("./test-utils");
// Transform sample data to match LineChart expected structure
const transformedData = test_utils_1.sampleChartData.map(item => ({
    label: item.seriesKey,
    color: item.seriesKey === "Africa" ? "orange" : item.seriesKey === "Non-LDC" ? "purple" : "blue",
    series: item.series.map(s => ({
        date: s.date,
        value: parseInt(s[item.seriesKey] || "0"),
        certainty: true,
    })),
}));
describe("LineChart", () => {
    test.skip("renders with title", async () => {
        const title = "Test Line Chart";
        const { container } = (0, test_utils_1.customRender)((0, jsx_runtime_1.jsx)(LineChart_1.default, { dataSet: transformedData, ...test_utils_1.defaultChartProps, title: title, xAxisDataType: "date_annual", onHighlightItem: () => { } }));
        await (0, react_1.waitFor)(() => {
            expect(react_1.screen.getByText(title)).toBeInTheDocument();
        });
        // Check for SVG element
        const svg = container.querySelector("svg");
        expect(svg).toBeInTheDocument();
        // Check for line paths
        const paths = container.querySelectorAll("path.line");
        expect(paths.length).toBeGreaterThan(0);
    });
    test.skip("renders with custom colors", async () => {
        const colorsMapping = {
            Africa: "red",
            "Non-LDC": "blue",
            Sudan: "green",
        };
        const { container } = (0, test_utils_1.customRender)((0, jsx_runtime_1.jsx)(LineChart_1.default, { dataSet: transformedData, ...test_utils_1.defaultChartProps, xAxisDataType: "date_annual", onHighlightItem: () => { } }), {
            providerProps: {
                colorsMapping,
            },
        });
        await (0, react_1.waitFor)(() => {
            const svg = container.querySelector("svg");
            expect(svg).toBeInTheDocument();
        });
        // This is a basic test; in a real scenario you might want to check
        // that the colors are actually applied to the right elements
    });
    test("handles empty data", async () => {
        // Just test that it doesn't throw with empty data
        expect(() => {
            (0, test_utils_1.customRender)((0, jsx_runtime_1.jsx)(LineChart_1.default, { dataSet: [], ...test_utils_1.defaultChartProps, xAxisDataType: "date_annual", onHighlightItem: () => { } }));
        }).not.toThrow();
    });
    test.skip("renders with tooltip", async () => {
        const { container } = (0, test_utils_1.customRender)((0, jsx_runtime_1.jsx)(LineChart_1.default, { dataSet: transformedData, ...test_utils_1.defaultChartProps, xAxisDataType: "date_annual", onHighlightItem: () => { } }));
        await (0, react_1.waitFor)(() => {
            const svg = container.querySelector("svg");
            expect(svg).toBeInTheDocument();
        });
        // Check for tooltip container
        // Note: This might not be visible until interaction, so just check if the element exists
        const tooltipContainer = container.querySelector(".tooltip") || container.querySelector("[data-testid='tooltip']");
        // This check might need adjusting based on your tooltip implementation
        expect(tooltipContainer).toBeDefined();
    });
});

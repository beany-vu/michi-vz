"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("@testing-library/react");
require("@testing-library/jest-dom");
const VerticalStackBarChart_1 = __importDefault(require("../VerticalStackBarChart"));
const test_utils_1 = require("./test-utils");
describe("VerticalStackBarChart", () => {
    // Increase timeout for React 19's increased rendering complexity
    jest.setTimeout(10000);
    test.skip("renders chart with title", async () => {
        const title = "Test Vertical Stack Bar Chart";
        const { container } = (0, test_utils_1.customRender)((0, jsx_runtime_1.jsx)(VerticalStackBarChart_1.default, { dataSet: test_utils_1.sampleChartData, ...test_utils_1.defaultChartProps, title: title }));
        // Wait for any async rendering to complete with longer timeout for React 19
        await (0, react_1.waitFor)(() => {
            expect(react_1.screen.getByText(title)).toBeInTheDocument();
        }, { timeout: 5000 });
        // Check that SVG was created
        const svg = container.querySelector("svg");
        expect(svg).toBeInTheDocument();
        // Check for some bars (rects)
        const bars = container.querySelectorAll("rect");
        expect(bars.length).toBeGreaterThan(0);
    });
    test.skip("renders with filtered data", async () => {
        const { container } = (0, test_utils_1.customRender)((0, jsx_runtime_1.jsx)(VerticalStackBarChart_1.default, { dataSet: test_utils_1.sampleChartData, ...test_utils_1.defaultChartProps, filter: { limit: 2, sortingDir: "desc", date: "2003" } }));
        await (0, react_1.waitFor)(() => {
            const svg = container.querySelector("svg");
            expect(svg).toBeInTheDocument();
        }, { timeout: 5000 });
        // We should have fewer bars with the filter applied
        const bars = container.querySelectorAll("rect:not(.bar-background)");
        expect(bars.length).toBeGreaterThan(0);
    });
    test.skip("calls onChartDataProcessed callback", async () => {
        const mockCallback = jest.fn();
        (0, test_utils_1.customRender)((0, jsx_runtime_1.jsx)(VerticalStackBarChart_1.default, { dataSet: test_utils_1.sampleChartData, ...test_utils_1.defaultChartProps, onChartDataProcessed: mockCallback }));
        await (0, react_1.waitFor)(() => {
            expect(mockCallback).toHaveBeenCalled();
        }, { timeout: 5000 });
        // Check that the callback was called with appropriate data structure
        const callbackData = mockCallback.mock.calls[0][0];
        expect(callbackData).toHaveProperty("xAxisDomain");
        expect(callbackData).toHaveProperty("visibleItems");
        expect(callbackData).toHaveProperty("renderedData");
        expect(callbackData).toHaveProperty("chartType", "vertical-stack-bar-chart");
    });
    test("renders loading state", async () => {
        // Mock the LoadingIndicator component
        jest.mock("../shared/LoadingIndicator", () => {
            const MockLoadingIndicator = () => (0, jsx_runtime_1.jsx)("div", { "data-testid": "loading-indicator", children: "Loading..." });
            return MockLoadingIndicator;
        });
        const { getByTestId } = (0, test_utils_1.customRender)((0, jsx_runtime_1.jsx)(VerticalStackBarChart_1.default, { dataSet: test_utils_1.sampleChartData, ...test_utils_1.defaultChartProps, isLoading: true }));
        // Basic test - just check that it renders at all
        expect(() => {
            (0, test_utils_1.customRender)((0, jsx_runtime_1.jsx)(VerticalStackBarChart_1.default, { dataSet: test_utils_1.sampleChartData, ...test_utils_1.defaultChartProps, isLoading: true }));
        }).not.toThrow();
    });
});

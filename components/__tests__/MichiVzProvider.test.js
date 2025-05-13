"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("@testing-library/react");
require("@testing-library/jest-dom");
const MichiVzProvider_1 = require("../MichiVzProvider");
describe("MichiVzProvider", () => {
    test("renders children", () => {
        const { getByText } = (0, react_1.render)((0, jsx_runtime_1.jsx)(MichiVzProvider_1.MichiVzProvider, { children: (0, jsx_runtime_1.jsx)("div", { children: "Test Child" }) }));
        expect(getByText("Test Child")).toBeInTheDocument();
    });
    test("provides default context values", () => {
        const TestComponent = () => {
            const context = (0, MichiVzProvider_1.useChartContext)();
            return ((0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("span", { "data-testid": "disabled-items", children: JSON.stringify(context.disabledItems) }), (0, jsx_runtime_1.jsx)("span", { "data-testid": "colors-mapping", children: JSON.stringify(context.colorsMapping) })] }));
        };
        const { getByTestId } = (0, react_1.render)((0, jsx_runtime_1.jsx)(MichiVzProvider_1.MichiVzProvider, { children: (0, jsx_runtime_1.jsx)(TestComponent, {}) }));
        expect(getByTestId("disabled-items")).toHaveTextContent("[]");
        expect(getByTestId("colors-mapping")).toHaveTextContent("{}");
    });
    test("accepts custom context values", () => {
        const TestComponent = () => {
            const context = (0, MichiVzProvider_1.useChartContext)();
            return ((0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("span", { "data-testid": "disabled-items", children: JSON.stringify(context.disabledItems) }), (0, jsx_runtime_1.jsx)("span", { "data-testid": "colors-mapping", children: JSON.stringify(context.colorsMapping) })] }));
        };
        const customValues = {
            disabledItems: ["item1", "item2"],
            colorsMapping: { key1: "red", key2: "blue" },
        };
        const { getByTestId } = (0, react_1.render)((0, jsx_runtime_1.jsx)(MichiVzProvider_1.MichiVzProvider, { disabledItems: customValues.disabledItems, colorsMapping: customValues.colorsMapping, children: (0, jsx_runtime_1.jsx)(TestComponent, {}) }));
        expect(getByTestId("disabled-items")).toHaveTextContent(JSON.stringify(customValues.disabledItems));
        expect(getByTestId("colors-mapping")).toHaveTextContent(JSON.stringify(customValues.colorsMapping));
    });
});

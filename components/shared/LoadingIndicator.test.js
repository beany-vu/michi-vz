"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("@testing-library/react");
require("@testing-library/jest-dom");
const LoadingIndicator_1 = __importDefault(require("./LoadingIndicator"));
describe("LoadingIndicator component", () => {
    test("renders with correct styling", () => {
        const { container } = (0, react_1.render)((0, jsx_runtime_1.jsx)(LoadingIndicator_1.default, {}));
        // Check if the loading indicator element is rendered
        const loadingElement = container.firstChild;
        expect(loadingElement).toBeInTheDocument();
        // Check if styled component applied appropriate styles
        expect(loadingElement).toHaveStyle({
            position: "absolute",
            backgroundColor: "pink",
            cursor: "wait",
            pointerEvents: "none",
        });
    });
    test("is positioned correctly", () => {
        const { container } = (0, react_1.render)((0, jsx_runtime_1.jsx)(LoadingIndicator_1.default, {}));
        const loadingElement = container.firstChild;
        expect(loadingElement).toHaveStyle({
            top: "5px",
            left: "5px",
            right: "5px",
            bottom: "5px",
        });
    });
    test("has animation applied", () => {
        const { container } = (0, react_1.render)((0, jsx_runtime_1.jsx)(LoadingIndicator_1.default, {}));
        // Check if the element has animation-related styles
        const computedStyle = window.getComputedStyle(container.firstChild);
        expect(computedStyle.animation).not.toBe("");
    });
});

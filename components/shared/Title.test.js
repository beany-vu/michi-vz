"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("@testing-library/react");
require("@testing-library/jest-dom");
const Title_1 = __importDefault(require("./Title"));
describe("Title component", () => {
    test("renders title text when provided", () => {
        const testText = "Test Title";
        (0, react_1.render)((0, jsx_runtime_1.jsx)(Title_1.default, { x: 100, y: 50, children: testText }));
        expect(react_1.screen.getByText(testText)).toBeInTheDocument();
    });
    test("has correct position attributes", () => {
        const testText = "Test Title";
        const { container } = (0, react_1.render)((0, jsx_runtime_1.jsx)(Title_1.default, { x: 100, y: 50, children: testText }));
        const titleElement = container.querySelector(".title");
        expect(titleElement).toHaveAttribute("x", "100");
        expect(titleElement).toHaveAttribute("y", "50");
    });
    test("renders nothing when children is empty", () => {
        const { container } = (0, react_1.render)((0, jsx_runtime_1.jsx)(Title_1.default, { x: 100, y: 50, children: "" }));
        const titleElement = container.querySelector(".title");
        expect(titleElement).not.toBeInTheDocument();
    });
});

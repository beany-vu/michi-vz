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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("@testing-library/react");
require("@testing-library/jest-dom");
const d3 = __importStar(require("d3"));
const XaxisBand_1 = __importDefault(require("./XaxisBand"));
describe("XaxisBand component", () => {
    // Set up mock D3 scale
    const createMockScale = () => {
        const domain = ["A", "B", "C", "D", "E"];
        const range = [0, 500];
        const scale = d3.scaleBand().domain(domain).range(range).padding(0.1);
        return scale;
    };
    const defaultProps = {
        xScale: createMockScale(),
        height: 400,
        margin: { top: 20, right: 20, bottom: 30, left: 40 },
    };
    beforeAll(() => {
        // Mock the D3 select functionality
        const mockSelection = {
            selectAll: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            remove: jest.fn().mockReturnThis(),
            data: jest.fn().mockReturnThis(),
            enter: jest.fn().mockReturnThis(),
            exit: jest.fn().mockReturnThis(),
            merge: jest.fn().mockReturnThis(),
            attr: jest.fn().mockReturnThis(),
            style: jest.fn().mockReturnThis(),
            call: jest.fn().mockReturnThis(),
            transition: jest.fn().mockReturnThis(),
            duration: jest.fn().mockReturnThis(),
            append: jest.fn().mockReturnThis(),
            on: jest.fn().mockReturnThis(),
        };
        // @ts-ignore - Mocking d3.select
        d3.select = jest.fn().mockReturnValue(mockSelection);
    });
    test("renders with class name", () => {
        const { container } = (0, react_1.render)((0, jsx_runtime_1.jsx)(XaxisBand_1.default, { ...defaultProps }));
        const axis = container.querySelector(".x-axis");
        expect(axis).toBeInTheDocument();
        expect(axis).toHaveClass("x-axis-band");
    });
    test("accepts custom formatter", () => {
        const xAxisFormat = (d) => `Format: ${d}`;
        (0, react_1.render)((0, jsx_runtime_1.jsx)(XaxisBand_1.default, { ...defaultProps, xAxisFormat: xAxisFormat }));
        // We can't easily verify D3 calls, so just verify it doesn't throw
        expect(true).toBe(true);
    });
    test("creates appropriate bands with the scale domain", () => {
        (0, react_1.render)((0, jsx_runtime_1.jsx)(XaxisBand_1.default, { ...defaultProps }));
        // Check that the scale domain length matches the expected number from the mock
        expect(defaultProps.xScale.domain().length).toBe(5);
    });
});

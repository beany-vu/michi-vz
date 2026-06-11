import React from "react";
import { render, RenderOptions } from "@testing-library/react";
import { MichiVzProvider, SinglePointLineConfig } from "../MichiVzProvider";

// Add TypeScript declarations for SVG element prototype
declare global {
  interface SVGElement {
    getBBox(): { x: number; y: number; width: number; height: number };
    getComputedTextLength(): number;
    getPointAtLength(length: number): { x: number; y: number };
    _className?: any;
    _transform?: any;
    _x?: any;
    _y?: any;
    _width?: any;
    _height?: any;
  }
}

// Mock for ResizeObserver
class ResizeObserverMock {
  observe() {}

  unobserve() {}

  disconnect() {}
}

// Add empty test to avoid "Your test suite must contain at least one test"
describe("test-utils", () => {
  test("should have mocks for testing", () => {
    expect(true).toBe(true);
  });
});

// Mock SVG methods that D3 uses
const mockSVGFunctions = () => {
  // Define baseVal and other SVG properties
  class SVGAnimatedString {
    baseVal: string = "";

    animVal: string = "";

    constructor(value: string) {
      this.baseVal = value;
      this.animVal = value;
    }
  }

  class SVGAnimatedLength {
    baseVal: { value: number } = { value: 0 };
  }

  // Mock SVG element prototype methods
  globalThis.SVGElement.prototype.getBBox =
    globalThis.SVGElement.prototype.getBBox ||
    (() => ({
      x: 0,
      y: 0,
      width: 100,
      height: 100,
    }));

  globalThis.SVGElement.prototype.getComputedTextLength =
    globalThis.SVGElement.prototype.getComputedTextLength || (() => 100);

  globalThis.SVGElement.prototype.getPointAtLength =
    globalThis.SVGElement.prototype.getPointAtLength || (() => ({ x: 0, y: 0 }));

  // Add required properties without redefining them if they already exist
  const makeGetter = (factory: () => unknown) => ({
    configurable: true,
    get(this: Record<string, unknown>): unknown {
      const key = `_${factory.name || Math.random()}`;
      if (!this[key]) {
        this[key] = factory();
      }
      return this[key];
    },
  });

  const svgProps: Record<string, PropertyDescriptor> = {
    className: { configurable: true, get() { return new SVGAnimatedString(""); } },
    transform: { configurable: true, get() { return { baseVal: { consolidate: () => null } }; } },
    x: makeGetter(() => new SVGAnimatedLength()),
    y: makeGetter(() => new SVGAnimatedLength()),
    width: makeGetter(() => new SVGAnimatedLength()),
    height: makeGetter(() => new SVGAnimatedLength()),
  };

  // Only define properties that don't already exist
  Object.keys(svgProps).forEach(key => {
    if (!Object.getOwnPropertyDescriptor(globalThis.SVGElement.prototype, key)) {
      Object.defineProperty(globalThis.SVGElement.prototype, key, svgProps[key]);
    }
  });

  // Mock ResizeObserver
  global.ResizeObserver = ResizeObserverMock;
};

// Clear the mocks
const clearMocks = () => {
  // Reset prototype methods to their original (undefined/noop) state
  (globalThis.SVGElement.prototype as unknown as Record<string, unknown>).getBBox = undefined;
  (globalThis.SVGElement.prototype as unknown as Record<string, unknown>).getComputedTextLength = undefined;
  (globalThis.SVGElement.prototype as unknown as Record<string, unknown>).getPointAtLength = undefined;
  (global as unknown as Record<string, unknown>).ResizeObserver = undefined;
};

// Custom render function that includes the MichiVzProvider
const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, "wrapper"> & {
    providerProps?: {
      disabledItems?: string[];
      highlightItems?: string[];
      colorsMapping?: { [key: string]: string };
      singlePointLine?: SinglePointLineConfig;
    };
  }
): ReturnType<typeof render> & { cleanup: () => void } => {
  const { providerProps = {}, ...renderOptions } = options || {};

  mockSVGFunctions();

  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return <MichiVzProvider {...providerProps}>{children}</MichiVzProvider>;
  };

  const result = render(ui, { wrapper: Wrapper, ...renderOptions });

  return {
    ...result,
    cleanup: () => {
      clearMocks();
      result.unmount();
    },
  };
};

// Sample data for charts
const sampleChartData = [
  {
    seriesKey: "Africa",
    seriesKeyAbbreviation: "Africa",
    series: [
      { date: "2001", Africa: "666" },
      { date: "2002", Africa: "777" },
      { date: "2003", Africa: "989" },
    ],
  },
  {
    seriesKey: "Non-LDC",
    seriesKeyAbbreviation: "Non-LDC",
    series: [
      { date: "2001", "Non-LDC": "444" },
      { date: "2002", "Non-LDC": "333" },
      { date: "2003", "Non-LDC": "222" },
    ],
  },
  {
    seriesKey: "Sudan",
    seriesKeyAbbreviation: "Sudan",
    series: [
      { date: "2001", Sudan: "789" },
      { date: "2002", Sudan: "456" },
      { date: "2003", Sudan: "123" },
    ],
  },
];

// Default chart props
const defaultChartProps = {
  width: 900,
  height: 480,
  margin: { top: 50, right: 50, bottom: 50, left: 50 },
  title: "Test Chart",
};

export { customRender, sampleChartData, defaultChartProps };

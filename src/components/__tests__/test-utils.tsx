import React from "react";
import { render, RenderOptions } from "@testing-library/react";
import { MichiVzProvider } from "../MichiVzProvider";

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
  global.SVGElement.prototype.getBBox =
    global.SVGElement.prototype.getBBox ||
    (() => ({
      x: 0,
      y: 0,
      width: 100,
      height: 100,
    }));

  global.SVGElement.prototype.getComputedTextLength =
    global.SVGElement.prototype.getComputedTextLength || (() => 100);

  global.SVGElement.prototype.getPointAtLength =
    global.SVGElement.prototype.getPointAtLength || (() => ({ x: 0, y: 0 }));

  // Add required properties without redefining them if they already exist
  const svgProps = {
    className: {
      configurable: true,
      get: function () {
        if (!this._className) {
          this._className = new SVGAnimatedString("");
        }
        return this._className;
      },
    },
    transform: {
      configurable: true,
      get: function () {
        if (!this._transform) {
          this._transform = { baseVal: { consolidate: () => null } };
        }
        return this._transform;
      },
    },
    x: {
      configurable: true,
      get: function () {
        if (!this._x) {
          this._x = new SVGAnimatedLength();
        }
        return this._x;
      },
    },
    y: {
      configurable: true,
      get: function () {
        if (!this._y) {
          this._y = new SVGAnimatedLength();
        }
        return this._y;
      },
    },
    width: {
      configurable: true,
      get: function () {
        if (!this._width) {
          this._width = new SVGAnimatedLength();
        }
        return this._width;
      },
    },
    height: {
      configurable: true,
      get: function () {
        if (!this._height) {
          this._height = new SVGAnimatedLength();
        }
        return this._height;
      },
    },
  };

  // Only define properties that don't already exist
  Object.keys(svgProps).forEach(key => {
    if (!Object.getOwnPropertyDescriptor(global.SVGElement.prototype, key)) {
      Object.defineProperty(global.SVGElement.prototype, key, svgProps[key]);
    }
  });

  // Mock ResizeObserver
  global.ResizeObserver = ResizeObserverMock;
};

// Clear the mocks
const clearMocks = () => {
  delete global.SVGElement.prototype.getBBox;
  delete global.SVGElement.prototype.getComputedTextLength;
  delete global.SVGElement.prototype.getPointAtLength;
  delete global.ResizeObserver;
};

// Custom render function that includes the MichiVzProvider
const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, "wrapper"> & {
    providerProps?: {
      disabledItems?: string[];
      highlightItems?: string[];
      colorsMapping?: { [key: string]: string };
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

// jest-dom adds custom jest matchers for asserting on DOM nodes.
require("@testing-library/jest-dom");

// Mock for React 19's new behavior
jest.mock("react", () => {
  const originalReact = jest.requireActual("react");
  return {
    ...originalReact,
    // Mock React 19 features that might cause issues in tests
    useTransition: () => [false, callback => callback()],
    useDeferredValue: value => value,
    // Use Identity Context doesn't need to be mocked for these tests
  };
});

// Mock for ResizeObserver
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.ResizeObserver = ResizeObserverMock;

// Mock SVG methods for D3
global.SVGElement.prototype.getBBox = () => ({
  x: 0,
  y: 0,
  width: 100,
  height: 100,
});

global.SVGElement.prototype.getComputedTextLength = () => 100;
global.SVGElement.prototype.getPointAtLength = () => ({ x: 0, y: 0 });

// Mock requestAnimationFrame and cancelAnimationFrame
global.requestAnimationFrame = callback => setTimeout(callback, 0);
global.cancelAnimationFrame = id => clearTimeout(id);

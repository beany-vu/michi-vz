import React from "react";
import { fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import ScatterPlotChart from "../ScatterPlotChart";
import { customRender } from "./test-utils";

const baseProps = {
  width: 900,
  height: 480,
  margin: { top: 50, right: 50, bottom: 50, left: 50 },
  title: "Scatter",
  xAxisDataType: "number" as const,
  xAxisDomain: [0, 100] as [number, number],
  yAxisDomain: [0, 100] as [number, number],
  showCrosshair: true,
  crosshairLabels: true,
};

// Pin a point by clicking its group (idempotent — only pins once), then return
// the badge <g> for an axis.
const pinAndGetBadge = (container: HTMLElement, axis: "x" | "y") => {
  const point = container.querySelector(".data-point") as SVGGElement;
  if (!container.querySelector("[data-crosshair-badge]")) {
    fireEvent.click(point);
  }
  return container.querySelector(`[data-crosshair-badge="${axis}"]`) as SVGGElement | null;
};

const transformOf = (el: SVGGElement | null) => el?.getAttribute("transform") ?? "";

describe("ScatterPlotChart crosshair badge flip", () => {
  test("mid-chart point keeps both badges on their default axes", () => {
    const { container } = customRender(
      <ScatterPlotChart {...baseProps} dataSet={[{ label: "A", x: 50, y: 50, d: 10 }]} />
    );
    expect(transformOf(pinAndGetBadge(container, "y"))).toContain("translate(50,");
    expect(transformOf(pinAndGetBadge(container, "x"))).toMatch(/,\s*430\)/);
  });

  test("point near the left axis flips the Y badge to the right axis", () => {
    const { container } = customRender(
      <ScatterPlotChart {...baseProps} dataSet={[{ label: "A", x: 0, y: 50, d: 10 }]} />
    );
    expect(transformOf(pinAndGetBadge(container, "y"))).toContain("translate(850,");
  });

  test("point near the bottom axis flips the X badge to the top", () => {
    const { container } = customRender(
      <ScatterPlotChart {...baseProps} dataSet={[{ label: "A", x: 50, y: 0, d: 10 }]} />
    );
    expect(transformOf(pinAndGetBadge(container, "x"))).toMatch(/,\s*50\)/);
  });

  test("crosshair badge renders after the data points so it paints on top", () => {
    const { container } = customRender(
      <ScatterPlotChart {...baseProps} dataSet={[{ label: "A", x: 50, y: 50, d: 10 }]} />
    );
    const badge = pinAndGetBadge(container, "y") as SVGGElement;
    const dataPoint = container.querySelector(".data-point") as SVGGElement;
    // In SVG, later elements paint on top — the badge must follow the data point.
    expect(
      dataPoint.compareDocumentPosition(badge) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });
});

describe("ScatterPlotChart crosshairLineStyle", () => {
  const pinFirstPoint = (container: HTMLElement) => {
    fireEvent.click(container.querySelector(".data-point") as SVGGElement);
  };
  const crosshairLines = (container: HTMLElement) =>
    Array.from(container.querySelectorAll("[data-crosshair-line]"));

  test("pinned crosshair is solid by default (backward compatible)", () => {
    const { container } = customRender(
      <ScatterPlotChart {...baseProps} dataSet={[{ label: "A", x: 50, y: 50, d: 10 }]} />
    );
    pinFirstPoint(container);
    const lines = crosshairLines(container);
    expect(lines.length).toBeGreaterThan(0);
    lines.forEach(l => expect(l.getAttribute("stroke-dasharray")).toBeNull());
  });

  test('crosshairLineStyle="dashed" keeps the pinned crosshair dashed', () => {
    const { container } = customRender(
      <ScatterPlotChart
        {...baseProps}
        crosshairLineStyle="dashed"
        dataSet={[{ label: "A", x: 50, y: 50, d: 10 }]}
      />
    );
    pinFirstPoint(container);
    const lines = crosshairLines(container);
    expect(lines.length).toBeGreaterThan(0);
    lines.forEach(l => expect(l.getAttribute("stroke-dasharray")).toBe("4 4"));
  });

  test('crosshairLineStyle="solid" forces an otherwise-dashed hover crosshair solid', () => {
    const { container } = customRender(
      <ScatterPlotChart
        {...baseProps}
        crosshairLineStyle="solid"
        dataSet={[{ label: "A", x: 50, y: 50, d: 10 }]}
      />
    );
    // Hover (not pin) to exercise the hover crosshair branch.
    fireEvent.mouseEnter(container.querySelector(".data-point") as SVGGElement);
    const lines = crosshairLines(container);
    expect(lines.length).toBeGreaterThan(0);
    lines.forEach(l => expect(l.getAttribute("stroke-dasharray")).toBeNull());
  });
});

describe("ScatterPlotChart crosshairSpan", () => {
  // Point A (x:50,y:50) projects to pixel (450, 240) given baseProps' 900×480
  // box, 50px margins and [0,100] domains. Plot edges: left=50, right=850,
  // top=50, bottom=430.
  const pinFirst = (container: HTMLElement) =>
    fireEvent.click(container.querySelector(".data-point") as SVGGElement);
  const line = (container: HTMLElement, axis: "x" | "y") => {
    const l = container.querySelector(`[data-crosshair-line="${axis}"]`) as SVGLineElement;
    return {
      x1: Number(l.getAttribute("x1")),
      x2: Number(l.getAttribute("x2")),
      y1: Number(l.getAttribute("y1")),
      y2: Number(l.getAttribute("y2")),
    };
  };

  test('span="full" (default) spans the whole plot (backward compatible)', () => {
    const { container } = customRender(
      <ScatterPlotChart {...baseProps} dataSet={[{ label: "A", x: 50, y: 50, d: 10 }]} />
    );
    pinFirst(container);
    expect(line(container, "x")).toMatchObject({ y1: 50, y2: 430 }); // top→bottom
    expect(line(container, "y")).toMatchObject({ x1: 50, x2: 850 }); // left→right
  });

  test('span="half" draws only the left + bottom arms', () => {
    const { container } = customRender(
      <ScatterPlotChart
        {...baseProps}
        crosshairSpan="half"
        dataSet={[{ label: "A", x: 50, y: 50, d: 10 }]}
      />
    );
    pinFirst(container);
    // vertical arm: bubble (cy=240) down to the X axis (430) — not the top.
    expect(line(container, "x")).toMatchObject({ x1: 450, x2: 450, y1: 240, y2: 430 });
    // horizontal arm: Y axis (50) across to the bubble (cx=450) — not the right.
    expect(line(container, "y")).toMatchObject({ x1: 50, x2: 450, y1: 240, y2: 240 });
  });
});

// Regression: the canvas renderer binds its pointer handlers imperatively to
// the <svg>, which is conditionally rendered (absent while isLoading). When a
// chart toggles isLoading true→false WITHOUT remounting (e.g. a consumer whose
// "loading" is a synthetic stale-data state that doesn't change the React key),
// the <svg> node is recreated. The listener effect must re-bind to the new
// node — depending on the live element, not a stable ref — or hover/crosshair/
// pin silently die after the first data load. See useScatterPlotChartCanvasRendering.
describe("ScatterPlotChart canvas pointer listeners survive an isLoading toggle", () => {
  // Point A (x:50,y:50,d:10) projects to pixel (450, 240) with radius 40 given
  // baseProps' 900×480 box, 50px margins and domains [0,100]. Firing a mousemove
  // at that pixel must hit-test onto A. (jsdom has no SVG CTM, so d3.pointer
  // falls back to clientX/clientY against a zeroed bounding rect.)
  const POINT = { label: "A", x: 50, y: 50, d: 10 };

  test("re-binds mousemove to the recreated <svg> after loading flips off (no remount)", () => {
    const onHighlightItem = jest.fn();

    const { container, rerender } = customRender(
      <ScatterPlotChart
        {...baseProps}
        renderer="canvas"
        isLoading
        dataSet={[]}
        onHighlightItem={onHighlightItem}
      />
    );
    // While loading, the <svg> isn't rendered at all — nothing to bind to yet.
    expect(container.querySelector("svg")).toBeNull();

    // Data arrives: SAME component instance (no key change), loading turns off,
    // a fresh <svg> mounts. This is the transition that previously left the
    // once-bound listener attached to nothing.
    rerender(
      <ScatterPlotChart
        {...baseProps}
        renderer="canvas"
        isLoading={false}
        dataSet={[POINT]}
        onHighlightItem={onHighlightItem}
      />
    );

    const svg = container.querySelector("svg") as SVGSVGElement;
    expect(svg).not.toBeNull();

    onHighlightItem.mockClear();
    fireEvent.mouseMove(svg, { clientX: 450, clientY: 240 });

    // A live mousemove listener on the recreated <svg> hit-tests onto A and
    // highlights it. Pre-fix this never fired (listener bound to the absent
    // loading-state svg, never re-bound), so the crosshair stayed dead.
    expect(onHighlightItem).toHaveBeenCalledWith(["A"]);
  });
});

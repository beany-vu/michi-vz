import { DEFAULT_CURVE, resolveCurveName, resolveCurveFactory } from "./curve";
import { curveBumpX, curveLinear, curveMonotoneX } from "d3";

describe("curve resolver", () => {
  it("defaults to curveMonotoneX when no curve is given", () => {
    expect(DEFAULT_CURVE).toBe("curveMonotoneX");
    expect(resolveCurveName(undefined)).toBe("curveMonotoneX");
    expect(resolveCurveFactory(undefined)).toBe(curveMonotoneX);
  });

  it("passes through each explicit curve name", () => {
    expect(resolveCurveName("curveBumpX")).toBe("curveBumpX");
    expect(resolveCurveName("curveLinear")).toBe("curveLinear");
    expect(resolveCurveName("curveMonotoneX")).toBe("curveMonotoneX");
  });

  it("maps each curve name to its d3 factory", () => {
    expect(resolveCurveFactory("curveBumpX")).toBe(curveBumpX);
    expect(resolveCurveFactory("curveLinear")).toBe(curveLinear);
    expect(resolveCurveFactory("curveMonotoneX")).toBe(curveMonotoneX);
  });
});

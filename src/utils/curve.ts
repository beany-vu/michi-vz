import { curveBumpX, curveLinear, curveMonotoneX } from "d3";
import type { CurveFactory } from "d3";
import type { CurveType } from "../types/data";

// Library-wide default interpolation. curveMonotoneX passes through every point,
// follows the data's local slope without overshoot, and emits a straight lineTo
// for exactly two points -- so a 2-point series is never drawn as an S-bend.
export const DEFAULT_CURVE: CurveType = "curveMonotoneX";

// SVG path strings are produced via d3's dynamic `d3[name]` lookup, so the SVG
// side only needs the resolved name.
export const resolveCurveName = (curve?: CurveType): CurveType => curve ?? DEFAULT_CURVE;

// Canvas renderers and reusable d3 generator instances need the factory itself.
const CURVE_FACTORIES: Record<CurveType, CurveFactory> = {
  curveBumpX,
  curveLinear,
  curveMonotoneX,
};

export const resolveCurveFactory = (curve?: CurveType): CurveFactory =>
  CURVE_FACTORIES[resolveCurveName(curve)];

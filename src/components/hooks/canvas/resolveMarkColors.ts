import { sanitizeForClassName } from "../lineChart/lineChartUtils";

// Resolve each label's mark colour the way the SVG renderer ends up coloured,
// honouring consumer CSS. This is the canvas-renderer counterpart of LineChart's
// `resolveSeriesColors` (see useLineChartCanvasRendering.ts), generalised so
// every chart can reuse it.
//
// Why it is needed: in `skipColorMappingDispatch` / external-CSS setups the
// data colour is the "transparent" placeholder and the real colour is applied
// by an injected `<style>` block — CSS rules targeting the SVG mark nodes
// (e.g. `.bar[data-label-safe="X"] { fill: ... }`). Canvas pixels cannot be
// styled by CSS, so a canvas renderer that just reads the data colour paints
// everything transparent. Instead we append a hidden probe element that mimics
// the real SVG mark (same tag/class/data-attributes), read the colour the
// browser computed for it (consumer CSS included) via getComputedStyle, then
// remove it. Probes are appended/read/removed in batches so the browser does a
// single style recalc.

export interface ColorProbe {
  // The element appended to the <svg>. It must carry the same tag, class and
  // data-* attributes as the chart's real SVG mark so consumer CSS selectors
  // match it.
  root: SVGElement;
  // The element whose computed style holds the resolved colour. Often the same
  // as `root`; for charts whose CSS targets a nested node (e.g. Comparable
  // HorizontalBarChart's `.bar > .value-based`) it is that descendant.
  target: SVGElement;
}

export type ColorProp = "fill" | "stroke";

// `buildProbe` receives the label, its sanitized (class-safe) form, and the
// data-colour fallback; it returns the probe element tree. The fallback should
// be pre-set on the probe's primary `colorProp` so that when no consumer CSS
// rule matches, getComputedStyle returns the fallback rather than an SVG
// default (black fill / no stroke).
//
// `colorProp` may be a single property or a priority list. With a list each
// property is tried in order and the first usable colour wins — e.g. a bar
// whose consumer CSS paints `fill` with an SVG `<pattern>` (unusable on canvas)
// but sets a real `stroke` colour is resolved by passing `["fill", "stroke"]`.
export const resolveMarkColors = (
  svgEl: SVGSVGElement | null,
  labels: string[],
  fallbackFor: (label: string) => string,
  buildProbe: (label: string, labelSafe: string, fallback: string) => ColorProbe,
  colorProp: ColorProp | ColorProp[]
): Map<string, string> => {
  const resolved = new Map<string, string>();

  // No SVG (jsdom / pre-mount) — fall back to the data colour for every label.
  if (!svgEl || typeof window === "undefined" || !window.getComputedStyle) {
    labels.forEach(label => resolved.set(label, fallbackFor(label)));
    return resolved;
  }

  const probes = labels.map(label => {
    const fallback = fallbackFor(label);
    const probe = buildProbe(label, sanitizeForClassName(label), fallback);
    svgEl.appendChild(probe.root);
    return { label, probe, fallback };
  });

  const props: ColorProp[] = Array.isArray(colorProp) ? colorProp : [colorProp];
  probes.forEach(({ label, probe, fallback }) => {
    const style = window.getComputedStyle(probe.target);
    // Try each property in priority order; the first usable colour wins.
    // `url(...)` is an SVG paint server (pattern/gradient) — canvas can't use
    // it; `none` / empty are likewise unusable, so move to the next property.
    let chosen = fallback;
    for (const prop of props) {
      const computed = style[prop];
      if (computed && computed !== "none" && computed !== "" && !computed.startsWith("url(")) {
        chosen = computed;
        break;
      }
    }
    resolved.set(label, chosen);
  });

  probes.forEach(({ probe }) => svgEl.removeChild(probe.root));
  return resolved;
};

// Convenience for the common case: a probe that is a single SVG element with a
// class and the standard `data-label` / `data-label-safe` attributes, with the
// fallback colour pre-applied. `tag` is the SVG element name (path/rect/...).
export const makeSimpleProbe = (
  tag: string,
  className: string,
  colorProp: "fill" | "stroke"
) => (label: string, labelSafe: string, fallback: string): ColorProbe => {
  const node = document.createElementNS("http://www.w3.org/2000/svg", tag) as SVGElement;
  node.setAttribute("class", className);
  node.setAttribute("data-label", label);
  node.setAttribute("data-label-safe", labelSafe);
  node.setAttribute(colorProp, fallback);
  node.setAttribute("visibility", "hidden");
  return { root: node, target: node };
};

import { useEffect, useRef, useState } from "react";
import { pointer } from "d3";
import DOMPurify from "dompurify";
import { resolveMarkColors, ColorProbe } from "../canvas/resolveMarkColors";

// Opt-in Canvas 2D renderer for RadarChart (Phase 4 of the performance
// overhaul). Draws each series' polar polygon and its per-pole point circles
// onto a single <canvas> instead of one retained SVG <g> per series. The
// radial grid (spokes + rings), the pole/ring labels, the HTML tooltip and the
// loading / no-data overlays stay in the SVG/HTML layer above the canvas.

const POINT_RADIUS = 5;
// Hovering within this many px of a polygon EDGE (not just a vertex) counts as a
// hit on that series — so hovering "the line" reveals the nearest dot + tooltip.
const EDGE_HIT_TOLERANCE = 6;
// Generous snap radius for the ACTIVE (non-dimmed) path only: hovering within
// this many px of any of its vertices snaps the tooltip to the nearest one, so
// the highlighted path's data points are easy to reach without landing exactly
// on the (thin, invisible-until-hovered) dot. Faded/dimmed paths never get this
// halo — they keep the tight vertex/edge target so they stay "ignorable".
const NEAREST_VERTEX_SNAP = 24;
const POLYGON_STROKE_WIDTH = 2;
// When any series in the chart is `dimmed: true`, the non-dimmed series get a
// thicker stroke so the highlighted subset stands out. Gated on "anyone is
// dimmed" rather than just `!dimmed` so consumers who don't use the field
// keep the original 2-px stroke (backward compatible).
const POLYGON_STROKE_WIDTH_HIGHLIGHT = 3;
// Pole-point opacity: invisible by default, fully opaque when the series is
// hovered/highlighted so the user sees a clear marker at the vertex they're
// inspecting. (SVG path used 0.3 historically; the brighter 1.0 gives canvas
// hover a stronger affordance, which the consumer asked for.)
const POINT_OPACITY_DEFAULT = 0;
const POINT_OPACITY_HIGHLIGHT = 1;
// Non-highlighted series are dimmed to 0.5 when any series is highlighted.
const SERIES_DIM_OPACITY = 0.5;
// Per-series `dimmed: true` reduces alpha by this factor on top of any
// highlight-based dim. Lets consumers express "highlight a subset, fade the
// rest" via the data instead of post-paint CSS (which doesn't apply to
// <canvas>).
const SERIES_DIMMED_FLAG_OPACITY = 0.2;
const FILL_OPACITY_CAP = 0.6;

// A drawn polygon vertex (one per pole), kept after the paint pass so the
// hover handler can hit-test without re-deriving the polar layout.
export interface PolarPoint {
  x: number;
  y: number;
  date: string;
  value: number;
}

// A drawn series, kept after the paint pass for hit-testing.
interface SeriesHit {
  label: string;
  // Vertices in pole order (missing/NaN poles are skipped, like the SVG path).
  points: PolarPoint[];
  // The raw data array, handed to the tooltip formatter unchanged.
  // `value` is typed loosely because RadarChart's DataPoint allows string|number.
  data: { value: string | number; date: string }[];
  // Mirrors RadarSeries.dimmed — lets the hit-test prefer the ACTIVE (non-dimmed)
  // series when an active polygon overlaps a dimmed (e.g. other-year) one.
  dimmed?: boolean;
}

interface DrawParams {
  width: number;
  height: number;
  series: RadarSeries[];
  poleLabels: string[];
  // Polar value scale: a numeric radial value -> pixel radius from the centre.
  scale: (n: number) => number;
  colorsMapping: { [key: string]: string };
  getColor: (mappedColor?: string, dataColor?: string) => string;
  // Per-series colours resolved from the DOM (honours consumer CSS). The raw
  // data colour (getColor(...)) is used only as a fallback when a label is
  // missing from this map.
  resolvedColors: Map<string, string>;
  disabledItems: string[];
  highlightItems: string[];
  showFilled: boolean;
  fillOpacity: number;
  hoveredLabel: string | null;
}

export interface RadarSeries {
  label: string;
  color?: string;
  data: { value: number | string; date: string }[];
  // Optional per-series visual dim. Multiplies with the highlight-based dim
  // (no replacement) so the two can compose. See SERIES_DIMMED_FLAG_OPACITY.
  dimmed?: boolean;
}

// Strip a trailing year suffix ("China-2021" -> "China") so the colour lookup
// matches the SVG renderer's keying.
const baseLabel = (label: string): string => label.replace(/-\d{4}$/, "");

// Probe replicating RadarChart's real SVG mark: a `<g class="series">` carrying
// `data-label` / `data-label-safe`, containing a `<polygon>` that also carries
// those data-attributes (the SVG renderer puts them on both nodes). The polygon
// has no semantic class — it is a styled-components node — so consumer CSS keys
// off the data-attributes. We pre-set the fallback colour on the polygon's
// `stroke` AND `fill` so that with no consumer CSS getComputedStyle returns the
// real fallback rather than an SVG default. `target` is the polygon, whose
// `stroke` (the series colour) we read.
const buildSeriesProbe = (
  label: string,
  labelSafe: string,
  fallback: string
): ColorProbe => {
  const ns = "http://www.w3.org/2000/svg";
  const g = document.createElementNS(ns, "g") as SVGGElement;
  g.setAttribute("class", "series");
  g.setAttribute("data-label", label);
  g.setAttribute("data-label-safe", labelSafe);
  g.setAttribute("visibility", "hidden");

  const polygon = document.createElementNS(ns, "polygon") as SVGPolygonElement;
  polygon.setAttribute("data-label", label);
  polygon.setAttribute("data-label-safe", labelSafe);
  polygon.setAttribute("stroke", fallback);
  polygon.setAttribute("fill", fallback);
  g.appendChild(polygon);

  return { root: g, target: polygon };
};

// Project one series' data into polar (x, y) vertices. Mirrors RadarChart's
// `genPolygonPoints`: angle `(poleIndex/numPoles)·2π`, radius `scale(value)`,
// x/y measured from the centre via sin/cos. Missing / NaN values become 0
// (the centre); poles not present in `poleLabels` are skipped.
const projectSeries = (
  data: { value: number | string; date: string }[],
  poleLabels: string[],
  scale: (n: number) => number,
  width: number,
  height: number
): PolarPoint[] => {
  const numPoles = poleLabels.length;
  const points: PolarPoint[] = [];
  for (const cur of data) {
    const poleIndex = poleLabels.indexOf(cur.date);
    if (poleIndex < 0) continue; // pole not defined — skip, as the SVG path does
    const parsed = cur?.value ? parseFloat(String(cur.value)) : 0;
    if (isNaN(parsed)) continue;
    const angle = (poleIndex / numPoles) * 2 * Math.PI;
    // scale() maps the value to a radius; negative values map inward toward the
    // centre. Clamp at the origin so a negative cannot invert past the centre.
    const radius = Math.max(0, scale(parsed));
    const x = Math.round(width / 2 + radius * Math.sin(angle));
    const y = Math.round(height / 2 + radius * Math.cos(angle) * -1);
    points.push({ x, y, date: cur.date, value: parsed });
  }
  return points;
};

// Standard ray-casting point-in-polygon test against a series' vertices.
const pointInPolygon = (mx: number, my: number, pts: PolarPoint[]): boolean => {
  if (pts.length < 3) return false;
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const xi = pts[i].x;
    const yi = pts[i].y;
    const xj = pts[j].x;
    const yj = pts[j].y;
    const intersects =
      yi > my !== yj > my && mx < ((xj - xi) * (my - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
};

// Distance from (mx,my) to the segment a→b — lets hovering ON a series' outline
// ("the line"), not just a vertex or the interior, register as a hit.
const distToSegment = (mx: number, my: number, a: PolarPoint, b: PolarPoint): number => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return Math.hypot(mx - a.x, my - a.y);
  let t = ((mx - a.x) * dx + (my - a.y) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(mx - (a.x + t * dx), my - (a.y + t * dy));
};

// Nearest vertex of a single series to (mx,my). Used by the forgiving subset to
// turn an interior / near-by hover into a concrete data point for the tooltip.
const nearestVertex = (h: SeriesHit, mx: number, my: number): PolarPoint | null => {
  let best: PolarPoint | null = null;
  let bestDist = Infinity;
  for (const pt of h.points) {
    const dist = Math.hypot(pt.x - mx, pt.y - my);
    if (dist < bestDist) {
      bestDist = dist;
      best = pt;
    }
  }
  return best;
};

// Hit-test a SUBSET of drawn series in priority order: pole-point (paints on
// top) → outline edge ("the line", within EDGE_HIT_TOLERANCE, returning the
// nearest vertex so its dot/tooltip show) → polygon interior.
//
// `forgiving` (set only for the ACTIVE/non-dimmed subset) makes the highlighted
// path easy to inspect: an interior hover snaps to the nearest vertex instead of
// returning a tooltip-less hit, and a final pass snaps to the nearest vertex
// within NEAREST_VERTEX_SNAP even when the cursor is just OUTSIDE the path. The
// tight (dimmed) subset passes `false`, preserving the historical behaviour —
// faded paths stay hard to hit on purpose.
const hitTestSubset = (
  subset: SeriesHit[],
  mx: number,
  my: number,
  forgiving = false
): { hit: SeriesHit; point: PolarPoint | null } | null => {
  // Pole-point hit first (nearest within the point radius).
  let pointHit: { hit: SeriesHit; point: PolarPoint } | null = null;
  let bestDist = POINT_RADIUS + 2;
  for (const h of subset) {
    for (const pt of h.points) {
      const dist = Math.hypot(pt.x - mx, pt.y - my);
      if (dist <= bestDist) {
        bestDist = dist;
        pointHit = { hit: h, point: pt };
      }
    }
  }
  if (pointHit) return pointHit;
  // Then the OUTLINE ("the line"): within a few px of any polygon edge counts as
  // a hit, returning the nearest vertex so its dot + tooltip show. Before this the
  // connecting edges weren't hittable at all — only a vertex (tiny target) or the
  // interior — so hovering the line did nothing and the dots (opacity 0 until
  // hovered) never appeared.
  let edgeHit: { hit: SeriesHit; point: PolarPoint } | null = null;
  let bestEdgeDist = EDGE_HIT_TOLERANCE;
  for (const h of subset) {
    const pts = h.points;
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % pts.length];
      const dist = distToSegment(mx, my, a, b);
      if (dist <= bestEdgeDist) {
        bestEdgeDist = dist;
        const nearest = Math.hypot(a.x - mx, a.y - my) <= Math.hypot(b.x - mx, b.y - my) ? a : b;
        edgeHit = { hit: h, point: nearest };
      }
    }
  }
  if (edgeHit) return edgeHit;
  // Then the polygon body. The forgiving subset snaps to the nearest vertex so
  // hovering anywhere inside the bright shape shows a tooltip; the tight subset
  // keeps the historical highlight-only (point: null) interior hit.
  for (const h of subset) {
    if (pointInPolygon(mx, my, h.points)) {
      return { hit: h, point: forgiving ? nearestVertex(h, mx, my) : null };
    }
  }
  // Forgiving-only final pass: snap to the nearest vertex within
  // NEAREST_VERTEX_SNAP so the highlighted path is reachable even when the
  // cursor sits just OUTSIDE it (the dots are tiny and hidden until hovered).
  if (forgiving) {
    let snapHit: { hit: SeriesHit; point: PolarPoint } | null = null;
    let bestSnap = NEAREST_VERTEX_SNAP;
    for (const h of subset) {
      for (const pt of h.points) {
        const dist = Math.hypot(pt.x - mx, pt.y - my);
        if (dist <= bestSnap) {
          bestSnap = dist;
          snapHit = { hit: h, point: pt };
        }
      }
    }
    if (snapHit) return snapHit;
  }
  return null;
};

// ACTIVE-over-dimmed priority: when an active (non-dimmed) polygon overlaps a
// dimmed one — e.g. the current-year radar line crossing a faded other-year line
// — the active series must win the hit so its dot/tooltip stays reachable. Sweep
// the non-dimmed series FIRST, then fall back to the dimmed ones. With no dimmed
// series the second pass is empty and behaviour is unchanged. Exported for tests.
export const pickHit = (
  hits: SeriesHit[],
  mx: number,
  my: number
): { hit: SeriesHit; point: PolarPoint | null } | null => {
  const active = hits.filter(h => !h.dimmed);
  const dimmed = hits.filter(h => h.dimmed);
  // Active subset is FORGIVING (body + nearby snap); dimmed subset stays tight.
  return hitTestSubset(active, mx, my, true) ?? hitTestSubset(dimmed, mx, my, false);
};

// Pure draw routine — clears the canvas, repaints every series and returns the
// drawn series for hit-testing. Kept at module scope (no React closure) so both
// the redraw effect and the hover handler can call it.
const drawChart = (canvas: HTMLCanvasElement | null, p: DrawParams): SeriesHit[] => {
  if (!canvas) return [];
  const ctx = canvas.getContext("2d");
  // jsdom has no canvas 2D context — getContext returns null there.
  if (!ctx) return [];

  const dpr = window.devicePixelRatio || 1;
  const pxW = Math.round(p.width * dpr);
  const pxH = Math.round(p.height * dpr);
  if (canvas.width !== pxW || canvas.height !== pxH) {
    canvas.width = pxW;
    canvas.height = pxH;
    canvas.style.width = `${p.width}px`;
    canvas.style.height = `${p.height}px`;
  }
  // Draw in CSS pixels; the dpr transform keeps marks crisp on retina screens.
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, p.width, p.height);

  const highlightSet = new Set(p.highlightItems);
  if (p.hoveredLabel) highlightSet.add(p.hoveredLabel);
  const anyHighlight = highlightSet.size > 0;
  // Track whether the consumer is using `dimmed` at all so we can promote
  // non-dimmed series to a thicker stroke without changing behaviour for
  // consumers who never set the field.
  const anyDimmed = p.series.some(s => s.dimmed);

  const hits: SeriesHit[] = [];

  for (const item of p.series) {
    if (p.disabledItems.includes(item.label)) continue; // culled before drawing
    const points = projectSeries(item.data, p.poleLabels, p.scale, p.width, p.height);
    hits.push({ label: item.label, points, data: item.data, dimmed: item.dimmed });
    if (points.length === 0) continue;

    // Prefer the DOM-resolved colour (honours consumer CSS in
    // skipColorMappingDispatch / external-CSS setups); fall back to the raw
    // data colour when the label is absent from the resolved map.
    const color =
      p.resolvedColors.get(item.label) ||
      p.getColor(p.colorsMapping[baseLabel(item.label)], item.color);
    const highlighted = highlightSet.has(item.label);
    // Series dimming: non-highlighted series fade to 0.5 when any is highlighted.
    // Per-series `dimmed: true` multiplies an additional factor on top — lets
    // consumers express data-driven dim (e.g. "all polygons except current
    // year") that can't be done with `highlightItems` alone.
    const highlightAlpha = anyHighlight && !highlighted ? SERIES_DIM_OPACITY : 1;
    const dimmedAlpha = item.dimmed ? SERIES_DIMMED_FLAG_OPACITY : 1;
    const seriesAlpha = highlightAlpha * dimmedAlpha;

    // --- polygon path ---
    ctx.beginPath();
    points.forEach((pt, i) => {
      if (i === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    });
    ctx.closePath();

    // Fill (only when showFilled). globalAlpha is global, so set it, fill(),
    // then reset before the stroke so fill and stroke opacities stay independent
    // — the SVG renderer carries separate fill-opacity and stroke opacity.
    if (p.showFilled) {
      // Highlighted series get a doubled fill opacity, capped at 0.6 — matches
      // the SVG renderer's `Math.min(fillOpacity * 2, 0.6)`.
      const effectiveFill = highlighted
        ? Math.min(p.fillOpacity * 2, FILL_OPACITY_CAP)
        : p.fillOpacity;
      ctx.globalAlpha = effectiveFill * seriesAlpha;
      ctx.fillStyle = color;
      ctx.fill();
    }

    // Stroke. When the chart is in "highlight subset via dimmed" mode
    // (anyDimmed=true), promote non-dimmed series to a thicker stroke so the
    // kept subset reads stronger against the faded background.
    ctx.globalAlpha = seriesAlpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = anyDimmed && !item.dimmed ? POLYGON_STROKE_WIDTH_HIGHLIGHT : POLYGON_STROKE_WIDTH;
    ctx.lineJoin = "round";
    ctx.stroke();

    // --- pole point circles (r5; opacity 0 default / 0.3 highlighted) ---
    const pointOpacity = highlighted ? POINT_OPACITY_HIGHLIGHT : POINT_OPACITY_DEFAULT;
    if (pointOpacity > 0) {
      for (const pt of points) {
        ctx.globalAlpha = pointOpacity * seriesAlpha;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, POINT_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#fff";
        ctx.stroke();
      }
    }
  }

  ctx.globalAlpha = 1;
  return hits;
};

export interface RadarCanvasRenderingOptions {
  enabled: boolean;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  svgRef: React.RefObject<SVGSVGElement | null>;
  tooltipRef: React.RefObject<HTMLDivElement | null>;
  tooltipContentRef: React.RefObject<HTMLDivElement | null>;
  series: RadarSeries[];
  poleLabels: string[];
  width: number;
  height: number;
  scale: (n: number) => number;
  colorsMapping: { [key: string]: string };
  getColor: (mappedColor?: string, dataColor?: string) => string;
  disabledItems: string[];
  highlightItems: string[];
  showFilled: boolean;
  fillOpacity: number;
  tooltipFormatter: (date: string, value: number, label: string) => string;
  onHighlightItem?: (labels: string[]) => void;
}

const useRadarChartCanvasRendering = (
  opts: RadarCanvasRenderingOptions
): { isSticky: boolean } => {
  const {
    enabled,
    canvasRef,
    svgRef,
    width,
    height,
    series,
    poleLabels,
    scale,
    colorsMapping,
    getColor,
    disabledItems,
    highlightItems,
    showFilled,
    fillOpacity,
  } = opts;

  // Latest options for the once-bound hover listener (avoids stale closures).
  const optsRef = useRef(opts);
  optsRef.current = opts;

  // Currently hovered series label — drives the dim/highlight on redraw.
  const hoveredRef = useRef<string | null>(null);

  // Series drawn by the last paint, reused by the hover handler's hit-test.
  const hitsRef = useRef<SeriesHit[]>([]);

  // Per-series colours resolved from the DOM (honouring consumer CSS), reused by
  // the hover redraw so it doesn't re-probe the DOM on every hover.
  const resolvedColorsRef = useRef<Map<string, string>>(new Map());

  // Sticky tooltip: a click on a series/point pins the tooltip; a click off
  // unpins it.
  const [isSticky, setIsSticky] = useState(false);
  const isStickyRef = useRef(false);
  isStickyRef.current = isSticky;

  // Redraw on EVERY render (intentionally not a dep-gated effect). Consumer CSS
  // colouring (skipColorMappingDispatch) arrives a render or two after mount,
  // and a <canvas> — unlike retained SVG nodes — does not auto-repaint when its
  // inputs (or external CSS) change. Re-resolving the colours + redrawing each
  // render keeps it in sync; both are cheap (few marks, one batched recalc).
  useEffect(() => {
    if (!enabled) return;
    const resolvedColors = resolveMarkColors(
      svgRef.current,
      series.map(s => s.label),
      label => {
        const item = series.find(s => s.label === label);
        return getColor(colorsMapping[baseLabel(label)], item?.color);
      },
      buildSeriesProbe,
      "stroke"
    );
    resolvedColorsRef.current = resolvedColors;
    hitsRef.current = drawChart(canvasRef.current, {
      width,
      height,
      series,
      poleLabels,
      scale,
      colorsMapping,
      getColor,
      resolvedColors,
      disabledItems,
      highlightItems,
      showFilled,
      fillOpacity,
      hoveredLabel: hoveredRef.current,
    });
  });

  // Hover + click-to-pin: hit-test against the drawn series, drive the HTML
  // tooltip + highlight. Bound once on the SVG (which sits above the canvas and
  // receives the pointer events).
  useEffect(() => {
    if (!enabled) return undefined;
    const svg = svgRef.current;
    if (!svg) return undefined;

    const redraw = () => {
      const o = optsRef.current;
      hitsRef.current = drawChart(o.canvasRef.current, {
        width: o.width,
        height: o.height,
        series: o.series,
        poleLabels: o.poleLabels,
        scale: o.scale,
        colorsMapping: o.colorsMapping,
        getColor: o.getColor,
        resolvedColors: resolvedColorsRef.current,
        disabledItems: o.disabledItems,
        highlightItems: o.highlightItems,
        showFilled: o.showFilled,
        fillOpacity: o.fillOpacity,
        hoveredLabel: hoveredRef.current,
      });
    };

    const hideTooltip = () => {
      const tip = optsRef.current.tooltipRef.current;
      if (tip) tip.style.opacity = "0";
    };

    const setHovered = (label: string | null) => {
      if (hoveredRef.current === label) return;
      hoveredRef.current = label;
      redraw();
      optsRef.current.onHighlightItem?.(label ? [label] : []);
    };

    // Series + (optional) pole point under the cursor — pole → edge → interior,
    // with ACTIVE-over-dimmed priority (see module-scope `pickHit`).
    const hitTest = (mx: number, my: number) => pickHit(hitsRef.current, mx, my);

    // Position + fill the HTML tooltip for a pole-point hit at pixel (mx, my).
    const showTooltip = (mx: number, my: number, hit: SeriesHit, point: PolarPoint) => {
      const o = optsRef.current;
      const tip = o.tooltipRef.current;
      if (!tip) return;
      tip.style.left = `${mx}px`;
      tip.style.top = `${my}px`;
      tip.style.opacity = "1";
      const contentEl = o.tooltipContentRef.current;
      if (contentEl) {
        // Sanitize the consumer's tooltipFormatter HTML before injecting it
        // (the SVG renderer relies on React for the same safety).
        const safeHtml = DOMPurify.sanitize(
          o.tooltipFormatter(point.date, point.value, hit.label)
        );
        contentEl.replaceChildren();
        contentEl.insertAdjacentHTML("afterbegin", safeHtml);
      }
    };

    const handleMove = (event: MouseEvent) => {
      const [mx, my] = pointer(event, svg);
      const result = hitTest(mx, my);
      if (result) {
        setHovered(result.hit.label);
        // A pinned tooltip is not moved or replaced by the pointer.
        if (!isStickyRef.current) {
          if (result.point) showTooltip(mx, my, result.hit, result.point);
          else hideTooltip();
        }
      } else if (hoveredRef.current) {
        setHovered(null);
        if (!isStickyRef.current) hideTooltip();
      }
    };

    const handleLeave = () => {
      setHovered(null);
      // A pinned tooltip survives the cursor leaving the chart.
      if (!isStickyRef.current) hideTooltip();
    };

    // Click on a pole point pins the tooltip there; click on empty area unpins.
    const handleClick = (event: MouseEvent) => {
      const [mx, my] = pointer(event, svg);
      const result = hitTest(mx, my);
      if (result && result.point) {
        isStickyRef.current = true;
        setIsSticky(true);
        setHovered(result.hit.label);
        showTooltip(mx, my, result.hit, result.point);
      }
    };

    // A click anywhere outside the chart and the tooltip unpins it.
    const handleDocClick = (event: MouseEvent) => {
      if (!isStickyRef.current) return;
      const target = event.target as HTMLElement | null;
      if (target && (svg.contains(target) || target.closest(".tooltip"))) return;
      hideTooltip();
      // Match the SVG renderer's 100ms unpin delay.
      setTimeout(() => {
        isStickyRef.current = false;
        setIsSticky(false);
      }, 100);
    };

    svg.addEventListener("mousemove", handleMove);
    svg.addEventListener("mouseleave", handleLeave);
    svg.addEventListener("click", handleClick);
    document.addEventListener("click", handleDocClick);
    return () => {
      svg.removeEventListener("mousemove", handleMove);
      svg.removeEventListener("mouseleave", handleLeave);
      svg.removeEventListener("click", handleClick);
      document.removeEventListener("click", handleDocClick);
    };
  }, [enabled, svgRef]);

  return { isSticky };
};

export default useRadarChartCanvasRendering;

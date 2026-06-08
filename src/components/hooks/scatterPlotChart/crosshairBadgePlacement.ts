// Collision-aware placement for crosshair axis value badges.
// Default anchors: Y badge on the left axis (x = margin.left, y = cy),
// X badge on the bottom axis (y = height - margin.bottom, x = cx).
//
// placement:
//  - "auto" (default): when the hovered/pinned bubble would cover the badge (or
//    it would clip the chart edge), the badge flips to the far axis: Y -> right,
//    X -> top. The flip is one-directional — the far side is not itself
//    collision-tested.
//  - "fixed": the badge always stays on the bottom/left axis and never flips,
//    even when the bubble overlaps it or it would clip the edge. Consumers that
//    want both value badges anchored to the origin corner pass this; the bubble
//    may then partly cover a badge near its axis.

export const CROSSHAIR_BADGE_HEIGHT = 18;

export interface CrosshairBadgeArgs {
  axis: "x" | "y";
  cx: number; // bubble center x (px)
  cy: number; // bubble center y (px)
  r: number; // bubble radius (px)
  badgeW: number; // badge box width (px)
  margin: { top: number; right: number; bottom: number; left: number };
  width: number;
  height: number;
  placement?: "auto" | "fixed";
}

export function resolveCrosshairBadgePlacement(args: CrosshairBadgeArgs): { x: number; y: number } {
  const { axis, cx, cy, r, badgeW, margin, width, height, placement = "auto" } = args;

  if (axis === "y") {
    if (placement === "fixed") return { x: margin.left, y: cy };
    const badgeRightEdge = margin.left + badgeW / 2;
    const overlapsBubble = cx - r < badgeRightEdge;
    const clipsEdge = margin.left - badgeW / 2 < 0;
    const flip = overlapsBubble || clipsEdge;
    return { x: flip ? width - margin.right : margin.left, y: cy };
  }

  // axis === "x"
  if (placement === "fixed") return { x: cx, y: height - margin.bottom };
  const half = CROSSHAIR_BADGE_HEIGHT / 2;
  const badgeTopEdge = height - margin.bottom - half;
  const overlapsBubble = cy + r > badgeTopEdge;
  return { x: cx, y: overlapsBubble ? margin.top : height - margin.bottom };
}

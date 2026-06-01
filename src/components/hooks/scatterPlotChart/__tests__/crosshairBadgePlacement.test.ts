import { resolveCrosshairBadgePlacement, CROSSHAIR_BADGE_HEIGHT } from "../crosshairBadgePlacement";

const margin = { top: 50, right: 50, bottom: 50, left: 50 };
const width = 900;
const height = 480;

describe("resolveCrosshairBadgePlacement", () => {
  test("badge height constant is 18", () => {
    expect(CROSSHAIR_BADGE_HEIGHT).toBe(18);
  });

  test("Y badge stays on the left axis for a mid-chart bubble", () => {
    const { x, y } = resolveCrosshairBadgePlacement({
      axis: "y",
      cx: 450,
      cy: 240,
      r: 40,
      badgeW: 28,
      margin,
      width,
      height,
    });
    expect(x).toBe(margin.left); // 50
    expect(y).toBe(240);
  });

  test("Y badge flips to the right axis when the bubble covers the left badge", () => {
    const { x, y } = resolveCrosshairBadgePlacement({
      axis: "y",
      cx: 60,
      cy: 240,
      r: 40,
      badgeW: 28,
      margin,
      width,
      height,
    });
    expect(x).toBe(width - margin.right); // 850
    expect(y).toBe(240);
  });

  test("X badge stays on the bottom axis for a mid-chart bubble", () => {
    const { x, y } = resolveCrosshairBadgePlacement({
      axis: "x",
      cx: 450,
      cy: 240,
      r: 40,
      badgeW: 28,
      margin,
      width,
      height,
    });
    expect(x).toBe(450);
    expect(y).toBe(height - margin.bottom); // 430
  });

  test("X badge flips to the top when the bubble covers the bottom badge", () => {
    const { x, y } = resolveCrosshairBadgePlacement({
      axis: "x",
      cx: 450,
      cy: 410,
      r: 40,
      badgeW: 28,
      margin,
      width,
      height,
    });
    expect(x).toBe(450);
    expect(y).toBe(margin.top); // 50
  });

  test("Y badge flips when the badge itself would clip the left edge", () => {
    const { x } = resolveCrosshairBadgePlacement({
      axis: "y",
      cx: 900,
      cy: 240,
      r: 5,
      badgeW: 28,
      margin: { top: 50, right: 50, bottom: 50, left: 10 },
      width: 900,
      height: 480,
    });
    expect(x).toBe(900 - 50); // 850 — flip comes from clipsEdge (10 - 14 < 0), not overlap
  });
});

import { test, expect } from "@playwright/test";

// Visual regression for chart curve rendering. Each story is rendered in a
// fixed-size `#chart-root` frame and screenshot-diffed against a committed
// baseline. Two-point stories must look straight; multi-point stories must look
// curved. Canvas variants verify the canvas renderer matches SVG (jsdom can't
// introspect a canvas, so this is the only place canvas output is checked).
const STORIES = [
  "visual-curve--line-two-points-svg",
  "visual-curve--line-multi-svg",
  "visual-curve--line-two-points-canvas",
  "visual-curve--line-multi-canvas",
  "visual-curve--area-two-points-svg",
  "visual-curve--area-multi-svg",
  "visual-curve--area-two-points-canvas",
  "visual-curve--area-multi-canvas",
  "visual-curve--range-two-points-svg",
  "visual-curve--range-multi-svg",
];

for (const id of STORIES) {
  test(`curve visual: ${id}`, async ({ page }) => {
    await page.goto(`/iframe.html?id=${id}&viewMode=story`);
    const chart = page.locator("#chart-root");
    await chart.waitFor({ state: "visible" });
    // Chart line/area transitions are <=100ms; wait for them to settle.
    await page.waitForTimeout(700);
    await expect(chart).toHaveScreenshot(`${id}.png`);
  });
}

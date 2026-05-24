// Shared Canvas 2D setup for the opt-in canvas renderers (Phase 4 of the
// performance overhaul). Sizes the backing store for devicePixelRatio so marks
// stay crisp on retina screens, applies the dpr transform so callers can draw
// in CSS pixels, and clears the frame.
//
// jsdom has no canvas 2D context — getContext("2d") returns null — so this
// returns null there; every canvas draw routine must early-return on null.

export interface CanvasSetup {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
}

export const setupCanvas = (
  canvas: HTMLCanvasElement | null,
  width: number,
  height: number
): CanvasSetup | null => {
  if (!canvas) return null;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const dpr = window.devicePixelRatio || 1;
  const pxW = Math.round(width * dpr);
  const pxH = Math.round(height * dpr);
  if (canvas.width !== pxW || canvas.height !== pxH) {
    canvas.width = pxW;
    canvas.height = pxH;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
  }
  // Draw in CSS pixels; the dpr transform keeps marks crisp on retina screens.
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);

  return { ctx, width, height };
};

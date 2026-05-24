const DEFAULT_FONT = "12px sans-serif";

let ctx: CanvasRenderingContext2D | null | undefined;

function getCtx(): CanvasRenderingContext2D | null {
  if (ctx !== undefined) return ctx;
  if (typeof document === "undefined") {
    ctx = null;
    return ctx;
  }
  const canvas = document.createElement("canvas");
  ctx = canvas.getContext("2d");
  if (ctx) ctx.font = DEFAULT_FONT;
  return ctx;
}

export function measureLabelWidth(label: string): number {
  if (!label) return 0;
  const c = getCtx();
  if (!c) {
    // Conservative fallback for SSR / contexts without canvas: assume 7px/char.
    return label.length * 7;
  }
  return c.measureText(label).width;
}

export function sanitizeForClassName(str: string): string {
  return str.replace(/[^a-z0-9]/gi, "_");
}

export function getPathLengthAtX(path: SVGPathElement, x: number): number | undefined {
  const l = path.getTotalLength();
  const precision = 90;
  if (!path || path.getTotalLength() === 0) {
    return 0;
  }
  for (let i = 0; i <= precision; i++) {
    const pos = path.getPointAtLength((l * i) / precision);
    if (pos.x >= x) return (l * i) / precision;
  }
}

export function getColor(mappedColor?: string, dataColor?: string): string {
  const FALLBACK_COLOR = "rgba(253, 253, 253, 0.5)";
  if (mappedColor) return mappedColor;
  if (dataColor) return dataColor;
  return FALLBACK_COLOR;
}

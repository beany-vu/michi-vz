import { XaxisDataType } from "src/types/data";

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

export function parseDate(value: number, xAxisDataType?: XaxisDataType) {
  if (xAxisDataType === "date_monthly") {
    const str = String(value);

    // Must be exactly 6 digits
    if (/^\d{6}$/.test(str)) {
      const year = parseInt(str.slice(0, 4), 10);
      const month = parseInt(str.slice(4, 6), 10);

      const isYYYYMM = year > 0 && month >= 1 && month <= 12;
      return isYYYYMM ? new Date(year, month - 1, 1) : null;
    }

    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  }

  if (xAxisDataType === "date_annual") {
    if (String(value).length === 4) {
      return new Date(`${value}-01-01`);
    }

    return new Date(value);
  }

  return value;
}

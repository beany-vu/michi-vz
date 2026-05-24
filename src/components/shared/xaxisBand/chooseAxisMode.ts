export type AxisMode = "horizontal" | "rotated" | "fallback";

export interface ChooseAxisModeParams {
  domain: string[];
  formatter: (d: string) => string;
  bandWidth: number;
  measure: (label: string) => number;
  padding?: number;
  maxTicks?: number;
  forceMode?: "auto" | "horizontal";
}

export interface ChooseAxisModeResult {
  mode: AxisMode;
  tickValues: string[];
}

export function chooseAxisMode(params: ChooseAxisModeParams): ChooseAxisModeResult {
  const { domain, formatter, bandWidth, measure, padding = 8 } = params;

  const labels = domain.map((d) => formatter(d));
  const maxLabelWidth = labels.reduce((max, label) => Math.max(max, measure(label)), 0);

  if (maxLabelWidth + padding <= bandWidth) {
    return { mode: "horizontal", tickValues: domain };
  }

  return { mode: "fallback", tickValues: domain };
}

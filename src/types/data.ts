export type DataPoint = {
  date: number;
  value: number;
  label?: string;
  certainty: boolean;
  code?: string;
};

export type LineChartDataItem = {
  label: string;
  color: string;
  shape?: "circle" | "square" | "triangle";
  curve?: "curveBumpX" | "curveLinear";
  series: DataPoint[];
};

export type DataPointRangeChart = {
  date: number;
  valueMedium?: number;
  label?: string;
  certainty: boolean;
  valueMax: number;
  valueMin: number;
  code?: string;
};

export type Margin = {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
  [key: string]: number | undefined;
};

export type Filter = {
  limit: number;
  date: number | string;
  criteria: string;
  sortingDir: "asc" | "desc";
};

export type XaxisDataType = "date_annual" | "date_monthly" | "number";

export type LegendItem = {
  label: string;
  color: string;
  order: number;
  disabled?: boolean;
  dataLabelSafe?: string;
  sortValue?: number;
};

export type ChartMetadata = {
  xAxisDomain: string[];
  yAxisDomain: [number, number];
  visibleItems: string[];
  renderedData: { [key: string]: DataPoint[] };
  chartType:
    | "line-chart"
    | "range-chart"
    | "bar-chart"
    | "pie-chart"
    | "scatter-chart"
    | "scatter-plot-chart"
    | "radar-chart"
    | "vertical-stack-bar-chart";
  legendData?: LegendItem[];
};

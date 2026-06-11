export type DataPoint = {
  date: number;
  value: number;
  label?: string;
  certainty: boolean;
  code?: string;
};

export type CurveType = "curveBumpX" | "curveLinear" | "curveMonotoneX";

export type LineChartDataItem = {
  label: string;
  color: string;
  shape?: "circle" | "square" | "triangle";
  curve?: CurveType;
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
  // Flat, chart-type-agnostic list of the rendered (post Top/Bottom-N slice)
  // item ids/codes, in ranked order. Lets a consumer read the rendered ranked set
  // uniformly for chart types whose renderedData shape isn't a { [label]: points }
  // map (scatter, horizontal-bar, area, …). Populated from the data items' `code`.
  renderedRankedIds?: string[];
  chartType:
    | "line-chart"
    | "range-chart"
    | "bar-chart"
    | "pie-chart"
    | "scatter-chart"
    | "scatter-plot-chart"
    | "radar-chart"
    | "vertical-stack-bar-chart"
    | "gap-chart";
  legendData?: LegendItem[];
};

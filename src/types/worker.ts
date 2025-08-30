import { DataPoint, XaxisDataType } from "./data";
import { ScaleLinear, ScaleTime } from "d3-scale";

export interface LineChartWorkerData {
  filteredDataSet: {
    label: string;
    color: string;
    shape?: "circle" | "square" | "triangle";
    curve?: "curveBumpX" | "curveLinear";
    series: DataPoint[];
  }[];
  visibleDataSets: {
    label: string;
    color: string;
    shape?: "circle" | "square" | "triangle";
    curve?: "curveBumpX" | "curveLinear";
    series: DataPoint[];
  }[];
  xScale: ScaleLinear<number, number> | ScaleTime<number, number>;
  yScale: ScaleLinear<number, number>;
  lineData: {
    label: string;
    color: string;
    points: DataPoint[];
  }[];
  chartMetadata: {
    xAxisDomain: string[];
    yAxisDomain: [number, number];
    visibleItems: string[];
    renderedData: { [key: string]: DataPoint[] };
  };
}

export interface LineChartWorkerInput {
  type: "calculate";
  data: {
    dataSet: {
      label: string;
      color: string;
      shape?: "circle" | "square" | "triangle";
      curve?: "curveBumpX" | "curveLinear";
      series: DataPoint[];
    }[];
    width: number;
    height: number;
    margin: { top: number; right: number; bottom: number; left: number };
    xAxisDataType: XaxisDataType;
    filter?: {
      limit: number;
      date: number | string;
      criteria: string;
      sortingDir: "asc" | "desc";
    };
    disabledItems: string[];
  };
}

export interface LineChartWorkerOutput {
  type: "result";
  data: LineChartWorkerData;
}

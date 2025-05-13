import React from "react";
import * as d3 from "d3";
interface DataPoint {
    x: number;
    y: number;
    label: string;
    color?: string;
    d: number;
    meta?: never;
    shape?: "square" | "circle" | "triangle";
    date?: string;
}
interface ChartMetadata {
    xAxisDomain: string[];
    yAxisDomain: [number, number];
    visibleItems: string[];
    renderedData: {
        [key: string]: DataPoint[];
    };
    chartType: "scatter-plot-chart";
}
interface ScatterPlotChartProps<T extends number | string> {
    dataSet: DataPoint[];
    width: number;
    height: number;
    margin: {
        top: number;
        right: number;
        bottom: number;
        left: number;
    };
    title: string;
    children?: React.ReactNode;
    isLoading?: boolean;
    isLoadingComponent?: React.ReactNode;
    isNodataComponent?: React.ReactNode;
    isNodata?: boolean | ((dataSet: DataPoint[]) => boolean);
    xAxisFormat?: (d: number | string) => string;
    yAxisFormat?: (d: number | string) => string;
    yTicksQty?: number;
    xAxisDataType?: "number" | "date_annual" | "date_monthly" | "band";
    tooltipFormatter?: (d: DataPoint) => string;
    showGrid?: {
        x: boolean;
        y: boolean;
    };
    xAxisDomain?: [T, T];
    yAxisDomain?: [T, T];
    dScaleLegend?: {
        title?: string;
        valueFormatter?: (d: number) => string;
    };
    dScaleLegendFormatter?: (domain: number[], dScale: d3.ScaleLinear<number, number>) => string;
    filter?: {
        limit: number;
        criteria: "x" | "y" | "d";
        sortingDir: "asc" | "desc";
        date?: string;
    };
    onChartDataProcessed?: (metadata: ChartMetadata) => void;
    onHighlightItem?: (labels: string[]) => void;
}
declare const ScatterPlotChart: React.FC<ScatterPlotChartProps<number | string>>;
export default ScatterPlotChart;

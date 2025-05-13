import React, { FC } from "react";
import { DataPoint } from "../types/data";
declare global {
    interface Window {
        hoverResetTimer?: number;
    }
}
interface LineChartProps {
    dataSet: {
        label: string;
        color: string;
        shape?: "circle" | "square" | "triangle";
        curve?: "curveBumpX" | "curveLinear";
        series: DataPoint[];
    }[];
    width: number;
    height: number;
    margin: {
        top: number;
        right: number;
        bottom: number;
        left: number;
    };
    title?: string;
    yAxisDomain?: [number, number];
    yAxisFormat?: (d: number) => string;
    xAxisFormat?: (d: number) => string;
    xAxisDataType: "number" | "date_annual" | "date_monthly";
    tooltipFormatter?: (d: DataPoint, series: DataPoint[], dataSet: {
        label: string;
        color: string;
        shape?: "circle" | "square" | "triangle";
        series: DataPoint[];
    }[]) => string;
    showCombined?: boolean;
    children?: React.ReactNode;
    isLoading?: boolean;
    isLoadingComponent?: React.ReactNode;
    isNodataComponent?: React.ReactNode;
    isNodata?: boolean | ((dataSet: {
        label: string;
        color: string;
        series: DataPoint[];
    }[]) => boolean);
    filter?: {
        limit: number;
        date: number | string;
        criteria: string;
        sortingDir: "asc" | "desc";
    };
    onChartDataProcessed?: (metadata: ChartMetadata) => void;
    onHighlightItem: (labels: string[]) => void;
    ticks?: number;
}
interface ChartMetadata {
    xAxisDomain: string[];
    yAxisDomain: [number, number];
    visibleItems: string[];
    renderedData: {
        [key: string]: DataPoint[];
    };
    chartType: "line-chart";
}
declare const LineChart: FC<LineChartProps>;
export default LineChart;

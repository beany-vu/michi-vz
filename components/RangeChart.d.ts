import React from "react";
import { DataPointRangeChart } from "../types/data";
interface RangeChartProps {
    dataSet: {
        label: string;
        color: string;
        series: DataPointRangeChart[];
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
    tooltipFormatter?: (d: DataPointRangeChart, series: DataPointRangeChart[], dataSet: {
        label: string;
        color: string;
        series: DataPointRangeChart[];
    }[]) => string;
    showCombined?: boolean;
    children?: React.ReactNode;
    isLoading?: boolean;
    isLoadingComponent?: React.ReactNode;
    isNodataComponent?: React.ReactNode;
    isNodata?: boolean | ((dataSet: {
        label: string;
        color: string;
        series: DataPointRangeChart[];
    }[]) => boolean);
    onChartDataProcessed?: (metadata: ChartMetadata) => void;
    onHighlightItem?: (labels: string[]) => void;
}
interface ChartMetadata {
    xAxisDomain: string[];
    yAxisDomain: [number, number];
    visibleItems: string[];
    renderedData: {
        [key: string]: DataPointRangeChart[];
    };
    chartType: "range-chart";
}
declare const RangeChart: React.FC<RangeChartProps>;
export default RangeChart;

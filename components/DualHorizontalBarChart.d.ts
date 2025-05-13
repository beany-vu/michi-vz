import React from "react";
interface DataPoint {
    label: string;
    color?: string;
    value1: number;
    value2: number;
}
interface LineChartProps {
    dataSet: DataPoint[];
    width: number;
    height: number;
    margin: {
        top: number;
        right: number;
        bottom: number;
        left: number;
    };
    xAxisFormat?: (d: number | {
        valueOf(): number;
    }) => string;
    xAxisDataType: "number" | "date_annual" | "date_monthly";
    yAxisFormat?: (d: number | string) => string;
    title?: string;
    tooltipFormatter?: (d: DataPoint | undefined, dataSet?: {
        label: string;
        color: string;
        series: DataPoint[];
    }[]) => string;
    children?: React.ReactNode;
    isLoading?: boolean;
    isLoadingComponent?: React.ReactNode;
    isNodataComponent?: React.ReactNode;
    isNodata?: boolean | ((dataSet: DataPoint[]) => boolean);
    filter?: {
        limit: number;
        criteria: "valueBased" | "valueCompared";
        sortingDir: "asc" | "desc";
    };
    onChartDataProcessed?: (metadata: ChartMetadata) => void;
    onHighlightItem?: (labels: string[]) => void;
}
interface ChartMetadata {
    xAxisDomain: string[];
    yAxisDomain: [number, number];
    visibleItems: string[];
    renderedData: {
        [key: string]: DataPoint[];
    };
    chartType: "dual-horizontal-bar-chart";
}
declare const DualHorizontalBarChart: React.FC<LineChartProps>;
export default DualHorizontalBarChart;

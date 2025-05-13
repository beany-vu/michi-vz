import React from "react";
interface DataPoint {
    [key: string]: number | undefined;
}
interface ChartMetadata {
    xAxisDomain: string[];
    yAxisDomain: [number, number];
    visibleItems: string[];
    renderedData: {
        [key: string]: DataPoint[];
    };
    chartType: "bar-bell-chart";
}
interface BarBellChartProps {
    dataSet: DataPoint[];
    keys: string[];
    width: number;
    height: number;
    margin: {
        top: number;
        right: number;
        bottom: number;
        left: number;
    };
    title: string;
    isLoading?: boolean;
    isLoadingComponent?: React.ReactNode;
    isNodataComponent?: React.ReactNode;
    isNodata?: boolean | ((dataSet: DataPoint[]) => boolean);
    xAxisFormat?: (d: number | string) => string;
    yAxisFormat?: (d: number | string) => string;
    xAxisDataType?: "number" | "date_annual" | "date_monthly";
    tooltipFormat?: (d: DataPoint, currentKey: string, currentValue: string | number) => string;
    showGrid?: {
        x: boolean;
        y: boolean;
    };
    children?: React.ReactNode;
    onChartDataProcessed?: (metadata: ChartMetadata) => void;
    onHighlightItem?: (labels: string[]) => void;
    filter?: {
        limit: number;
        criteria: string;
        sortingDir: string;
    };
}
declare const BarBellChart: React.FC<BarBellChartProps>;
export default BarBellChart;

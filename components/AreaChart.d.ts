import React from "react";
interface DataPoint {
    date: number;
    [key: string]: number | undefined;
}
interface ChartMetadata {
    xAxisDomain: string[];
    yAxisDomain: [number, number];
    visibleItems: string[];
    renderedData: {
        [key: string]: DataPoint[];
    };
    chartType: "area-chart";
}
interface Props {
    series: DataPoint[];
    keys: string[];
    width: number;
    height: number;
    margin: {
        top: number;
        right: number;
        bottom: number;
        left: number;
    };
    title?: string;
    xAxisFormat?: (d: number) => string;
    yAxisFormat?: (d: number) => string;
    yAxisDomain?: [number, number] | null;
    tooltipFormatter?: (d: DataPoint, series: DataPoint[], key: string) => string | null;
    children?: React.ReactNode;
    xAxisDataType: "number" | "date_annual" | "date_monthly";
    isLoading?: boolean;
    isLoadingComponent?: React.ReactNode;
    isNodataComponent?: React.ReactNode;
    isNodata?: boolean | ((dataSet: DataPoint[]) => boolean);
    onChartDataProcessed?: (metadata: ChartMetadata) => void;
    onHighlightItem?: (labels: string[]) => void;
    filter?: {
        date: number;
        sortingDir: "asc" | "desc";
    };
    ticks?: number;
}
declare const AreaChart: React.FC<Props>;
export default AreaChart;

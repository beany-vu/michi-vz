import React from "react";
interface DataPoint {
    label: string;
    color?: string;
    valueBased: number;
    valueCompared: number;
}
export declare const VALUE_TYPE: {
    readonly BASED: "based";
    readonly COMPARED: "compared";
};
export type TValueType = (typeof VALUE_TYPE)[keyof typeof VALUE_TYPE];
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
    yAxisFormat?: (d: number | string) => string;
    xAxisPredefinedDomain?: number[];
    xAxisDataType: "number" | "date_annual" | "date_monthly";
    title?: string;
    tooltipFormatter?: (d: DataPoint | undefined, dataSet?: DataPoint[], type?: TValueType) => React.ReactNode;
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
    chartType: "comparable-horizontal-bar-chart" | "";
}
declare const ComparableHorizontalBarChart: React.FC<LineChartProps>;
export default ComparableHorizontalBarChart;

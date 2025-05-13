import React from "react";
interface DataPoint {
    date: string | null;
    [key: string]: string | null | undefined;
}
interface DataSet {
    seriesKey: string;
    seriesKeyAbbreviation: string;
    series: DataPoint[];
    label?: string;
}
interface TooltipData {
    item: DataPoint;
    key: string;
    seriesKey: string;
    series: DataPoint[];
}
interface ChartMetadata {
    xAxisDomain: string[];
    visibleItems: string[];
    renderedData: {
        [key: string]: RectData[];
    };
    chartType: "vertical-stack-bar-chart";
}
interface Props {
    dataSet: DataSet[];
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
    xAxisDomain?: [string, string];
    yAxisDomain?: [number, number];
    tooltipFormatter?: (tooltipData: TooltipData) => string;
    showCombined?: boolean;
    children?: React.ReactNode;
    isLoading?: boolean;
    isLoadingComponent?: React.ReactNode;
    isNodataComponent?: React.ReactNode;
    isNodata?: boolean | ((dataSet: DataSet[]) => boolean);
    colorCallbackFn?: (key: string, d: RectData) => string;
    filter?: {
        limit: number;
        sortingDir: "asc" | "desc";
        date?: string;
    };
    onChartDataProcessed?: (metadata: ChartMetadata) => void;
    onHighlightItem?: (labels: string[]) => void;
}
export interface RectData {
    key: string;
    height: number;
    width: number;
    y: number;
    x: number;
    data: DataPoint;
    fill: string;
    seriesKey: string;
    seriesKeyAbbreviation: string;
    value: number | null;
    date: number;
    code?: string;
}
declare const VerticalStackBarChart: React.FC<Props>;
export default VerticalStackBarChart;

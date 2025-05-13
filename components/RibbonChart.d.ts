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
    chartType: "ribbon-chart";
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
    yAxisFormat?: (d: number) => string;
    xAxisFormat?: (d: string | number) => string;
    children?: React.ReactNode;
    isLoading?: boolean;
    isLoadingComponent?: React.ReactNode;
    isNodataComponent?: React.ReactNode;
    isNodata?: boolean | ((dataSet: DataPoint[]) => boolean);
    tooltipContent?: (data: DataPoint) => string;
    onChartDataProcessed?: (metadata: ChartMetadata) => void;
    onHighlightItem?: (labels: string[]) => void;
}
declare const RibbonChart: React.FC<Props>;
export default RibbonChart;

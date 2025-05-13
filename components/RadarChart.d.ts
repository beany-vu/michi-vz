import React from "react";
interface DataPoint {
    label: string;
    value: number;
    data: {
        value: number;
        date: string;
    }[];
    color?: string;
}
interface ChartMetadata {
    xAxisDomain: string[];
    yAxisDomain: [number, number];
    visibleItems: string[];
    renderedData: {
        [key: string]: DataPoint[];
    };
    chartType: "radar-chart";
}
export interface RadarChartProps {
    width: number;
    height: number;
    tooltipFormatter?: (data: {
        date: string;
        value: number;
        series: never[];
    }) => React.ReactNode;
    poleLabelFormatter?: (data: string) => string;
    radialLabelFormatter?: (data: number) => string;
    series: DataPoint[];
    poles?: {
        domain: number[];
        range: number[];
        labels: string[];
    };
    children?: React.ReactNode;
    isLoading?: boolean;
    isLoadingComponent?: React.ReactNode;
    isNodataComponent?: React.ReactNode;
    isNodata?: boolean | ((dataSet: DataPoint[]) => boolean);
    onChartDataProcessed?: (metadata: ChartMetadata) => void;
    onHighlightItem?: (labels: string[]) => void;
    tooltipContainerStyle?: React.CSSProperties;
}
export declare const RadarChart: React.FC<RadarChartProps>;
export default RadarChart;

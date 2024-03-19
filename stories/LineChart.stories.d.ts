declare const _default: import("@storybook/types").ComponentAnnotations<import("@storybook/react/dist/types-0fc72a6d").R, import("@storybook/types").Args>;
export default _default;
export declare const Primary: {
    args: {
        dataSet: ({
            label: string;
            shape: string;
            series: {
                year: number;
                date: string;
                value: number;
                certainty: boolean;
            }[];
        } | {
            label: string;
            series: {
                year: number;
                date: string;
                value: number;
                certainty: boolean;
            }[];
            shape?: undefined;
        })[];
        width: number;
        height: number;
        margin: {
            top: number;
            right: number;
            bottom: number;
            left: number;
        };
        showCombined: boolean;
        yAxisFormat: (d: any) => string;
        xAxisDataType: string;
        title: string;
        tooltipFormatter: (dataSet: any, d: any) => string;
    };
};

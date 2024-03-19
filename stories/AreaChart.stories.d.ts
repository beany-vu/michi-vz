declare const _default: import("@storybook/types").ComponentAnnotations<import("@storybook/react/dist/types-0fc72a6d").R, import("@storybook/types").Args>;
export default _default;
export declare const Primary: {
    args: {
        colorsMapping: {
            Raw: string;
            "Semi-processed": string;
            Processed: string;
        };
        keys: string[];
        series: {
            date: string;
            Raw: number;
            "Semi-processed": number;
            Processed: number;
        }[];
        width: number;
        height: number;
        margin: {
            top: number;
            right: number;
            bottom: number;
            left: number;
        };
        yAxisFormat: (d: any) => string;
        title: string;
        yAxisDomain: number[];
        xAxisDataType: string;
    };
};

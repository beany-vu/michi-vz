declare const _default: import("@storybook/types").ComponentAnnotations<import("@storybook/react/dist/types-0fc72a6d.js").R, import("@storybook/types").Args>;
export default _default;
export declare const Primary: {
    args: {
        width: number;
        height: number;
        margin: {
            top: number;
            right: number;
            bottom: number;
            left: number;
        };
        xAxisFormat: (d: any) => string;
        xAxisDataType: string;
        yAxisFormat: (d: any) => string;
        title: string;
        dataSet: ({
            year: string;
            sector: string;
            x: number;
            y: number;
            d: number;
            label: string;
            color: string;
            code: number;
        } | {
            year: string;
            sector: string;
            x: number;
            y: number;
            d: number;
            label: string;
            color: string;
            code?: undefined;
        })[];
    };
};

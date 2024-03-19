declare const _default: import("@storybook/types").ComponentAnnotations<import("@storybook/react/dist/types-0fc72a6d").R, import("@storybook/types").Args>;
export default _default;
export declare const Primary: {
    args: {
        dataSet: {
            date: string;
            step1: number;
            step2: number;
            step3: number;
        }[];
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
        xAxisFormat: (value: any) => any;
        yAxisFormat: (value: any) => string;
        showGrid: {
            x: boolean;
            y: boolean;
        };
        children: any;
    };
};

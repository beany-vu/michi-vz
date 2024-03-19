/// <reference types="react" />
declare const _default: import("@storybook/types").ComponentAnnotations<import("@storybook/react/dist/types-0fc72a6d").R, import("@storybook/types").Args>;
export default _default;
export declare const Primary: {
    args: {
        isNoDataComponent: JSX.Element;
        dataSet: {
            label: string;
            valueBased: number;
            valueCompared: number;
        }[];
        width: number;
        height: number;
        margin: {
            top: number;
            right: number;
            bottom: number;
            left: number;
        };
        showCombined: boolean;
        xAisFormat: (d: any) => string;
        yAxisFormat: (d: any) => string;
        title: string;
        tooltipFormatter: (d: any) => string;
        children: JSX.Element;
    };
};

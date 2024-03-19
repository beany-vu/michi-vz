declare const _default: import("@storybook/types").ComponentAnnotations<import("@storybook/react/dist/types-0fc72a6d").R, import("@storybook/types").Args>;
export default _default;
export declare const Primary: {
    args: {
        colorsMapping: {
            Africa: string;
            "Non-LDC": string;
            Asia: string;
        };
        keys: string[];
        dataSet: {
            seriesKey: string;
            seriesKeyAbbreviation: string;
            series: {
                date: number;
                Africa: number;
                "Non-LDC": number;
            }[];
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
    };
};

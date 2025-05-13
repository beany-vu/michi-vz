import React from "react";
import { render, RenderOptions } from "@testing-library/react";
declare global {
    interface SVGElement {
        getBBox(): {
            x: number;
            y: number;
            width: number;
            height: number;
        };
        getComputedTextLength(): number;
        getPointAtLength(length: number): {
            x: number;
            y: number;
        };
        _className?: any;
        _transform?: any;
        _x?: any;
        _y?: any;
        _width?: any;
        _height?: any;
    }
}
declare const customRender: (ui: React.ReactElement, options?: Omit<RenderOptions, "wrapper"> & {
    providerProps?: {
        disabledItems?: string[];
        highlightItems?: string[];
        colorsMapping?: {
            [key: string]: string;
        };
    };
}) => ReturnType<typeof render> & {
    cleanup: () => void;
};
declare const sampleChartData: ({
    seriesKey: string;
    seriesKeyAbbreviation: string;
    series: {
        date: string;
        Africa: string;
    }[];
} | {
    seriesKey: string;
    seriesKeyAbbreviation: string;
    series: {
        date: string;
        "Non-LDC": string;
    }[];
} | {
    seriesKey: string;
    seriesKeyAbbreviation: string;
    series: {
        date: string;
        Sudan: string;
    }[];
})[];
declare const defaultChartProps: {
    width: number;
    height: number;
    margin: {
        top: number;
        right: number;
        bottom: number;
        left: number;
    };
    title: string;
};
export { customRender, sampleChartData, defaultChartProps };

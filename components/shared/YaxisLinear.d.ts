import React from "react";
import { ScaleLinear } from "d3-scale";
interface Props {
    yScale: ScaleLinear<number, number>;
    width: number;
    height: number;
    highlightZeroLine?: boolean;
    margin: {
        top: number;
        right: number;
        bottom: number;
        left: number;
    };
    yAxisFormat?: (d: number) => string;
    yTicksQty?: number;
}
declare const _default: React.NamedExoticComponent<Props>;
export default _default;

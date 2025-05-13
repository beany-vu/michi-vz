import React from "react";
import { ScaleBand } from "d3-scale";
interface Props {
    xScale: ScaleBand<string>;
    height: number;
    margin: {
        top: number;
        right: number;
        bottom: number;
        left: number;
    };
    xAxisFormat?: (d: string | number) => string;
    xAxisDataType?: "text" | "number";
    ticks?: number;
    isLoading?: boolean;
    isEmpty?: boolean;
}
declare const _default: React.NamedExoticComponent<Props>;
export default _default;

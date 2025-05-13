import React from "react";
import { ScaleBand } from "d3-scale";
interface Props {
    yScale: ScaleBand<string>;
    width: number;
    margin: {
        top: number;
        right: number;
        bottom: number;
        left: number;
    };
    yAxisFormat?: (d: number | string) => string;
    showGrid?: boolean;
}
declare const _default: React.NamedExoticComponent<Props>;
export default _default;

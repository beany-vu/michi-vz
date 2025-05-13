import { FC } from "react";
import { ScaleTime, ScaleLinear } from "d3-scale";
interface Props {
    xScale: ScaleTime<number, number> | ScaleLinear<number, number>;
    height: number;
    margin: {
        top: number;
        right: number;
        bottom: number;
        left: number;
    };
    xAxisFormat?: (d: number | {
        valueOf(): number;
    } | string) => string;
    xAxisDataType?: "number" | "date_annual" | "date_monthly";
    ticks?: number;
    showGrid?: boolean;
    position?: "top" | "bottom";
    isLoading?: boolean;
    isEmpty?: boolean;
    tickValues?: (number | Date)[];
}
declare const XaxisLinear: FC<Props>;
export default XaxisLinear;

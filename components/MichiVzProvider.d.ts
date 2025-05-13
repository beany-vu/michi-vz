import React, { ReactNode } from "react";
interface ChartContextProps {
    disabledItems: string[];
    highlightItems: string[];
    colorsMapping: {
        [key: string]: string;
    };
    colorsBasedMapping: {
        [key: string]: string;
    };
    categoryMetadata: {
        [key: string]: {
            color?: string;
            label?: string;
        };
    };
    hiddenItems: string[];
    visibleItems: string[];
    availableItems: string[];
}
interface MichiVzProps {
    children: ReactNode;
    disabledItems?: string[];
    highlightItems?: string[];
    colorsMapping?: {
        [key: string]: string;
    };
    colorsBasedMapping?: {
        [key: string]: string;
    };
    categoryMetadata?: {
        [key: string]: {
            color: string;
            label: string;
        };
    };
    hiddenItems?: string[];
    visibleItems?: string[];
    availableItems?: string[];
}
export declare const MichiVzProvider: React.FC<MichiVzProps>;
export declare const useChartContext: () => ChartContextProps;
export {};

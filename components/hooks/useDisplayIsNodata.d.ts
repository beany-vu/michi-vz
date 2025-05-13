import React from "react";
export declare function useDisplayIsNodata<T>({ dataSet, isLoading, isNodataComponent, isNodata, }: {
    dataSet: T | null | undefined;
    isLoading: boolean;
    isNodataComponent: React.ReactNode;
    isNodata?: boolean | ((dataSet: T | null | undefined) => boolean);
}): boolean;

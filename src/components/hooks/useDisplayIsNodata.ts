import React, { useMemo } from "react";

export function useDisplayIsNodata<T>({
  dataSet,
  isLoading,
  isNodataComponent,
  isNodata,
}: {
  dataSet: T | null | undefined;
  isLoading: boolean;
  isNodataComponent: React.ReactNode;
  isNodata?: boolean | ((dataSet: T | null | undefined) => boolean);
}): boolean {
  const displayIsNodata = useMemo(() => {
    // If loading or no nodata component, always return false
    if (isLoading || !isNodataComponent) {
      return false;
    }

    // Check custom nodata function
    if (typeof isNodata === "function") {
      return isNodata(dataSet);
    }

    // Check boolean override
    if (typeof isNodata === "boolean") {
      return isNodata;
    }

    // Check if array is empty
    if (Array.isArray(dataSet)) {
      if (
        dataSet.length > 0 &&
        typeof dataSet[0] === "object" &&
        dataSet[0] !== null &&
        "series" in dataSet[0]
      ) {
        // Special case for series data
        return dataSet.every(d => !(Array.isArray(d.series) && d.series.length > 0));
      }

      return dataSet.length === 0;
    }

    // Default case
    return false;
  }, [isLoading, isNodataComponent, dataSet, isNodata]);

  return displayIsNodata;
}

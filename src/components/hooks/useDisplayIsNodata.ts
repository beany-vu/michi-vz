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
    if (!isLoading && isNodataComponent) {
      if (typeof isNodata === "function") {
        return isNodata(dataSet);
      }

      if (typeof isNodata === "boolean") {
        return isNodata;
      }

      if (Array.isArray(dataSet)) {
        return dataSet.length === 0;
      }

      return false;
    }

    return false;
  }, [isLoading, isNodataComponent, dataSet]);

  return displayIsNodata;
}

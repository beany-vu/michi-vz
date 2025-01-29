import React, { useMemo, useDeferredValue } from "react";

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
  const deferredDataSet = useDeferredValue(dataSet);

  const displayIsNodata = useMemo(() => {
    if (!isLoading && isNodataComponent) {
      if (typeof isNodata === "function") {
        return isNodata(deferredDataSet);
      }

      if (typeof isNodata === "boolean") {
        return isNodata;
      }

      if (Array.isArray(deferredDataSet)) {
        return deferredDataSet.length === 0;
      }

      return false;
    }

    return false;
  }, [isLoading, isNodataComponent, deferredDataSet]);

  return displayIsNodata;
}

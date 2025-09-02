import { useCallback, useMemo } from "react";
import * as d3 from "d3";
import { DataPoint, XaxisDataType } from "../../../types/data";
import { getPathLengthAtX } from "./lineChartUtils";
import { parseDate } from "./lineChartUtils";

interface UseLineChartGeometryArgs {
  dataSet: { label: string; color: string; series: DataPoint[] }[];
  xAxisDataType: XaxisDataType;
  xScale: d3.ScaleLinear<number, number> | d3.ScaleTime<number, number>;
  yScale: d3.ScaleLinear<number, number>;
}

export function useLineChartGeometry({
  dataSet,
  xAxisDataType,
  xScale,
  yScale,
}: UseLineChartGeometryArgs) {
  // Get Y value at X
  const getYValueAtX = useCallback(
    (series: DataPoint[], x: number | Date): number | undefined => {
      if (x instanceof Date) {
        const dataPoint = series.find(
          d => (parseDate(d.date, xAxisDataType) as Date).getTime() === x.getTime()
        );
        return dataPoint ? dataPoint.value : undefined;
      }
      const dataPoint = series.find(d => Number(d.date) === x);
      return dataPoint ? dataPoint.value : undefined;
    },
    [xAxisDataType]
  );

  // D3 line generator
  const line = useCallback(
    ({ d, curve }: { d: Iterable<DataPoint>; curve: string }) => {
      return d3
        .line<DataPoint>()
        .x(d => {
          const value = parseDate(d.date, xAxisDataType);
          return xScale(value);
        })
        .y(d => yScale(d.value))
        .curve(d3?.[curve] ?? d3.curveBumpX)(d);
    },
    [xScale, yScale, xAxisDataType]
  );

  // Memoized dash array generator
  const getDashArrayMemoized = useMemo(() => {
    return (
      series: DataPoint[],
      pathNode: SVGPathElement,
      xScale: d3.ScaleLinear<number, number> | d3.ScaleTime<number, number>
    ) => {
      const totalLength = pathNode.getTotalLength();
      const lengths = series.map(d =>
        getPathLengthAtX(pathNode, xScale(parseDate(d.date, xAxisDataType)))
      );

      const DASH_LENGTH = 4;
      const DASH_SEPARATOR_LENGTH = 4;
      const dashArray = [];

      for (let i = 1; i <= series.length; i++) {
        const segmentLength =
          i === series.length - 1 ? totalLength - lengths[i - 1] : lengths[i] - lengths[i - 1];

        if (!series[i]?.certainty) {
          const dashes = Math.floor(segmentLength / (DASH_LENGTH + DASH_SEPARATOR_LENGTH));
          const remainder = Math.ceil(
            segmentLength - dashes * (DASH_LENGTH + DASH_SEPARATOR_LENGTH)
          );

          for (let j = 0; j < dashes; j++) {
            dashArray.push(DASH_LENGTH);
            dashArray.push(DASH_SEPARATOR_LENGTH);
          }

          if (remainder > 0) dashArray.push(remainder);
        } else {
          if (dashArray.length % 2 === 1) {
            dashArray.push(0);
            dashArray.push(segmentLength);
          } else {
            dashArray.push(segmentLength);
          }
        }
      }
      return dashArray.join(",");
    };
  }, [xAxisDataType]);

  // Memoized line data
  const lineData = useMemo(
    () =>
      dataSet.map(set => ({
        label: set.label,
        color: set.color,
        points: set.series,
      })),
    [dataSet]
  );

  return {
    getYValueAtX,
    getPathLengthAtX,
    getDashArrayMemoized,
    line,
    lineData,
  };
}

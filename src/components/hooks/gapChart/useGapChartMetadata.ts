import { useRef, useLayoutEffect } from "react";
import useDeepCompareEffect from "use-deep-compare-effect";
import { ChartMetadata, DataPoint } from "src/types/data";

interface DataItem {
  label: string;
  code?: string;
  value1: number;
  value2: number;
  difference: number;
  date: string;
}

interface UseGapChartMetadataProps {
  processedDataSet: DataItem[];
  xAxisDomain: [number, number];
  onChartDataProcessed?: (metadata: ChartMetadata) => void;
}

export const useGapChartMetadata = ({
  processedDataSet,
  xAxisDomain,
  onChartDataProcessed,
}: UseGapChartMetadataProps) => {
  const prevChartDataRef = useRef<ChartMetadata | null>(null);
  const renderCompleteRef = useRef(false);

  useLayoutEffect(() => {
    renderCompleteRef.current = true;
  }, []);

  useDeepCompareEffect(() => {
    if (onChartDataProcessed && renderCompleteRef.current && processedDataSet.length > 0) {
      const currentMetadata: ChartMetadata = {
        xAxisDomain: xAxisDomain.map(String),
        yAxisDomain: xAxisDomain as [number, number],
        visibleItems: processedDataSet.map(d => d.label),
        renderedData: processedDataSet.reduce(
          (acc, item) => {
            acc[item.label] = [item as unknown as DataPoint];
            return acc;
          },
          {} as { [key: string]: DataPoint[] }
        ),
        chartType: "line-chart" as ChartMetadata["chartType"],
      };

      const hasChanged =
        !prevChartDataRef.current ||
        JSON.stringify(prevChartDataRef.current) !== JSON.stringify(currentMetadata);

      if (hasChanged) {
        onChartDataProcessed(currentMetadata);
        prevChartDataRef.current = currentMetadata;
      }
    }
  }, [processedDataSet, xAxisDomain, onChartDataProcessed]);
};

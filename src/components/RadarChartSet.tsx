import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import RadarChart, { RadarChartProps } from "./RadarChart";

type RadarChartMetadata = Parameters<NonNullable<RadarChartProps["onChartDataProcessed"]>>[0];
type RadarChartSetSharedProps = Omit<RadarChartProps, "series" | "onChartDataProcessed">;

export interface RadarChartSetItem {
  key: string;
  series: RadarChartProps["series"];
  props?: Partial<RadarChartSetSharedProps>;
}

export interface RadarChartSetProps extends Partial<RadarChartSetSharedProps> {
  items: RadarChartSetItem[];
  /**
   * Emits one merged metadata payload from all child RadarChart instances.
   * The callback fires only when metadata from every current item key is available.
   */
  onChartDataProcessed?: (metadata: RadarChartMetadata) => void;
  /**
   * Convenience callback that emits only merged legendData.
   */
  onLegendDataChange?: (legendData: NonNullable<RadarChartMetadata["legendData"]>) => void;
  /**
   * Optional item wrapper for custom layouts (grid/cards/separators).
   */
  renderItem?: (params: {
    item: RadarChartSetItem;
    index: number;
    chart: React.ReactNode;
  }) => React.ReactNode;
}

const buildMergedLegendData = (
  orderedKeys: string[],
  metadataByItem: Record<string, RadarChartMetadata>
): NonNullable<RadarChartMetadata["legendData"]> => {
  const mergedByLabel = new Map<
    string,
    {
      label: string;
      color: string;
      order: number;
      disabled?: boolean;
    }
  >();

  let orderCursor = 0;

  orderedKeys.forEach(itemKey => {
    const legend = metadataByItem[itemKey]?.legendData ?? [];

    legend.forEach(entry => {
      const existing = mergedByLabel.get(entry.label);
      if (!existing) {
        mergedByLabel.set(entry.label, {
          ...entry,
          order: orderCursor,
        });
        orderCursor += 1;
        return;
      }

      // Keep first occurrence order, but refresh color/derived metadata.
      // A label can appear in multiple sub-charts with the same intent.
      mergedByLabel.set(entry.label, {
        ...existing,
        color: entry.color,
        // If any occurrence is enabled, treat merged entry as enabled.
        disabled: Boolean(existing.disabled) && Boolean(entry.disabled),
      });
    });
  });

  return Array.from(mergedByLabel.values());
};

const mergeMetadata = (
  orderedKeys: string[],
  metadataByItem: Record<string, RadarChartMetadata>
): RadarChartMetadata | null => {
  if (orderedKeys.length === 0) return null;

  const allReady = orderedKeys.every(key => Boolean(metadataByItem[key]));
  if (!allReady) return null;

  const allMetadata = orderedKeys.map(key => metadataByItem[key]);

  const xAxisDomain = allMetadata[0]?.xAxisDomain ?? [];
  const yAxisMin = Math.min(...allMetadata.map(meta => meta.yAxisDomain?.[0] ?? 0));
  const yAxisMax = Math.max(...allMetadata.map(meta => meta.yAxisDomain?.[1] ?? 0));

  const visibleItems = Array.from(
    new Set(allMetadata.flatMap(meta => meta.visibleItems ?? []).filter(Boolean))
  );

  const renderedData = allMetadata.reduce<Record<string, unknown>>((acc, meta, index) => {
    const itemKey = orderedKeys[index];
    const entries = Object.entries(meta.renderedData ?? {});

    entries.forEach(([bucketKey, value]) => {
      const mergedKey = `${itemKey}::${bucketKey}`;
      acc[mergedKey] = value;
    });

    return acc;
  }, {});

  return {
    xAxisDomain,
    yAxisDomain: [yAxisMin, yAxisMax],
    visibleItems,
    renderedData: renderedData as RadarChartMetadata["renderedData"],
    chartType: "radar-chart",
    legendData: buildMergedLegendData(orderedKeys, metadataByItem),
  };
};

const RadarChartSet: React.FC<RadarChartSetProps> = ({
  items,
  onChartDataProcessed,
  onLegendDataChange,
  renderItem,
  ...sharedProps
}) => {
  const [metadataByItem, setMetadataByItem] = useState<Record<string, RadarChartMetadata>>({});
  const prevMergedRef = useRef<RadarChartMetadata | null>(null);

  const orderedKeys = useMemo(() => items.map(item => item.key), [items]);

  useEffect(() => {
    const active = new Set(orderedKeys);
    setMetadataByItem(prev => {
      const next = Object.fromEntries(Object.entries(prev).filter(([key]) => active.has(key)));
      return next;
    });
  }, [orderedKeys]);

  const handleChildMetadata = useCallback((itemKey: string, metadata: RadarChartMetadata) => {
    setMetadataByItem(prev => {
      const prevForKey = prev[itemKey];
      if (prevForKey && JSON.stringify(prevForKey) === JSON.stringify(metadata)) {
        return prev;
      }
      return {
        ...prev,
        [itemKey]: metadata,
      };
    });
  }, []);

  const mergedMetadata = useMemo(
    () => mergeMetadata(orderedKeys, metadataByItem),
    [orderedKeys, metadataByItem]
  );

  useEffect(() => {
    if (!mergedMetadata) return;

    const changed = JSON.stringify(prevMergedRef.current) !== JSON.stringify(mergedMetadata);
    if (!changed) return;

    prevMergedRef.current = mergedMetadata;
    onChartDataProcessed?.(mergedMetadata);
    if (mergedMetadata.legendData) {
      onLegendDataChange?.(mergedMetadata.legendData);
    }
  }, [mergedMetadata, onChartDataProcessed, onLegendDataChange]);

  return (
    <>
      {items.map((item, index) => {
        const chart = (
          <RadarChart
            key={item.key}
            {...(sharedProps as RadarChartSetSharedProps)}
            {...(item.props as RadarChartSetSharedProps)}
            series={item.series}
            onChartDataProcessed={metadata => handleChildMetadata(item.key, metadata)}
          />
        );

        if (renderItem) {
          return <React.Fragment key={item.key}>{renderItem({ item, index, chart })}</React.Fragment>;
        }

        return chart;
      })}
    </>
  );
};

export default RadarChartSet;

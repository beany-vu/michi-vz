import { useEffect, useRef, useMemo } from "react";
import { LineChartDataItem } from "../../../types/data";

const useGenerateColorMapping = (
  dataSet: LineChartDataItem[],
  colors: string[],
  existingMapping: { [key: string]: string } = {},
  onColorMappingGenerated?: (colorsMapping: { [key: string]: string }) => void,
  // When true:
  //  - the chart does NOT call `onColorMappingGenerated` (no Redux ping-pong
  //    when the consumer owns the legend store via another mechanism)
  //  - the auto-generated COLORS-array fallback is replaced with `"transparent"`
  //    so labels with no `item.color` and no `existingMapping` entry render
  //    invisibly until external colors arrive (CSS, Redux, etc.). This is
  //    "wait-for-legend" semantics: the consumer signals "I own colors, don't
  //    paint anything visible until I provide them" by setting this flag.
  //  - labels that DO have `item.color` or are present in `existingMapping`
  //    still paint with their proper color from frame 1.
  //
  // Use this whenever an external mechanism is the single source of truth for
  // colors — e.g. CSS rules with `!important`, or a Redux-side color generator
  // that feeds both chart and legend. Without this flag, the chart's
  // auto-generated COLORS-array mapping leaks into the consumer's legend store
  // and produces a visible mismatch (chart and legend disagree on what color a
  // given label should be).
  //
  // Default `false` preserves the original behaviour: COLORS-array fallback,
  // and `onColorMappingGenerated` dispatch.
  skipColorMappingDispatch: boolean = false
) => {
  const colorMappingRef = useRef<{ [key: string]: string }>({});

  // Generate initial color mapping synchronously to avoid empty mapping on first render
  const initialColorMapping = useMemo(() => {
    // In wait-for-legend mode (skipColorMappingDispatch=true) we deliberately
    // ignore `existingMapping` here. The consumer has signalled that an
    // external system (CSS, Redux color generator) owns colors, so passing
    // through whatever incidentally lives in `existingMapping` would let
    // wrong colors flash before the external source kicks in. By falling
    // through to the dataset/transparent path below, labels without a
    // theme-aware `item.color` paint as "transparent" until the consumer's
    // CSS / external mapping arrives — no blue→orange flash on first paint.
    if (!skipColorMappingDispatch && Object.keys(existingMapping).length > 0) {
      return { ...existingMapping };
    }

    const newMapping: { [key: string]: string } = {};
    let colorIndex = 0;

    // First, preserve existing colors for items that already have them
    dataSet.forEach(item => {
      if (item.color) {
        newMapping[item.label] = item.color;
      }
    });

    // Then assign colors to items that don't have them yet.
    // - Default behaviour (skipColorMappingDispatch=false): cycle through the
    //   provided COLORS array so the chart always has SOME stroke.
    // - Wait-for-legend behaviour (skipColorMappingDispatch=true): assign
    //   "transparent" so labels without an external color are invisible
    //   until the consumer provides them. The chart never paints "wrong"
    //   colors that contradict the external source of truth.
    const uniqueLabels = [...new Set(dataSet.map(item => item.label))];
    uniqueLabels.forEach(label => {
      if (!newMapping[label]) {
        newMapping[label] = skipColorMappingDispatch
          ? "transparent"
          : colors[colorIndex % colors.length];
        colorIndex++;
      }
    });

    return newMapping;
  }, [dataSet, colors, existingMapping]);

  // Initialize the ref with the initial mapping
  useEffect(() => {
    colorMappingRef.current = initialColorMapping;
  }, [initialColorMapping]);

  useEffect(() => {
    // Same wait-for-legend exception as in the useMemo above — see the
    // comment there. When skipColorMappingDispatch is true we ignore
    // `existingMapping` and fall through to the dataset/transparent path so
    // an externally-driven color system isn't briefly contradicted by V1.
    if (!skipColorMappingDispatch && Object.keys(existingMapping).length > 0) {
      colorMappingRef.current = { ...existingMapping };
      return;
    }

    const newMapping: { [key: string]: string } = { ...colorMappingRef.current };
    let colorIndex = 0;

    // First, preserve existing colors for items that already have them
    dataSet.forEach(item => {
      if (item.color) {
        newMapping[item.label] = item.color;
      }
    });

    // Then assign colors to items that don't have them yet.
    // - Default behaviour (skipColorMappingDispatch=false): cycle through the
    //   provided COLORS array so the chart always has SOME stroke.
    // - Wait-for-legend behaviour (skipColorMappingDispatch=true): assign
    //   "transparent" so labels without an external color are invisible
    //   until the consumer provides them. The chart never paints "wrong"
    //   colors that contradict the external source of truth.
    const uniqueLabels = [...new Set(dataSet.map(item => item.label))];
    uniqueLabels.forEach(label => {
      if (!newMapping[label]) {
        newMapping[label] = skipColorMappingDispatch
          ? "transparent"
          : colors[colorIndex % colors.length];
        colorIndex++;
      }
    });

    // Only update if the mapping has changed
    if (JSON.stringify(newMapping) !== JSON.stringify(colorMappingRef.current)) {
      colorMappingRef.current = newMapping;
      // Skip the dispatch when the consumer has signalled that an external
      // mechanism owns the legend colors. The local computation above is still
      // used for the chart's own paint (and for SVG export); it just doesn't
      // leave the library here.
      if (onColorMappingGenerated && !skipColorMappingDispatch) {
        onColorMappingGenerated(newMapping);
      }
    }
  }, [dataSet, colors, existingMapping, onColorMappingGenerated, skipColorMappingDispatch]);

  // Return the initial mapping to ensure colors are available on first render
  return initialColorMapping;
};

export default useGenerateColorMapping;

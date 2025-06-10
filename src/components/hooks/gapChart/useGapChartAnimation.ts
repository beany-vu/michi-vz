import { useEffect, useRef, useState } from "react";

interface DataItem {
  label: string;
  code?: string;
  value1: number;
  value2: number;
  difference: number;
  date: string;
}

interface AnimationState {
  entering: Set<string>;
  exiting: Set<string>;
  updating: Set<string>;
}

export const useGapChartAnimation = (
  processedDataSet: DataItem[],
  enableTransitions: boolean = true
) => {
  const previousDataRef = useRef<DataItem[]>([]);
  const [animationState, setAnimationState] = useState<AnimationState>({
    entering: new Set(),
    exiting: new Set(),
    updating: new Set(),
  });

  useEffect(() => {
    if (!enableTransitions) {
      previousDataRef.current = processedDataSet;
      return;
    }

    const previousData = previousDataRef.current;
    const currentLabels = new Set(processedDataSet.map(d => d.label));
    const previousLabels = new Set(previousData.map(d => d.label));

    // Identify entering items (new items not in previous data)
    const entering = new Set<string>();
    processedDataSet.forEach(d => {
      if (!previousLabels.has(d.label)) {
        entering.add(d.label);
      }
    });

    // Identify exiting items (items in previous data but not current)
    const exiting = new Set<string>();
    previousData.forEach(d => {
      if (!currentLabels.has(d.label)) {
        exiting.add(d.label);
      }
    });

    // Identify updating items (items that exist in both but may have changed position/values)
    const updating = new Set<string>();
    processedDataSet.forEach((d, index) => {
      const prevIndex = previousData.findIndex(pd => pd.label === d.label);
      if (
        prevIndex !== -1 &&
        (prevIndex !== index ||
          d.value1 !== previousData[prevIndex].value1 ||
          d.value2 !== previousData[prevIndex].value2)
      ) {
        updating.add(d.label);
      }
    });

    setAnimationState({ entering, exiting, updating });

    // Trigger enter animations
    if (entering.size > 0) {
      // Force reflow to ensure initial state is applied
      requestAnimationFrame(() => {
        setAnimationState(prev => ({
          ...prev,
          entering: new Set(),
        }));
      });
    }

    // Update previousDataRef immediately for exiting items
    previousDataRef.current = processedDataSet;
  }, [processedDataSet, enableTransitions]);

  // Get opacity for an item based on animation state
  const getItemOpacity = (label: string, defaultOpacity: number = 1) => {
    if (animationState.entering.has(label)) {
      return 0;
    }
    if (animationState.exiting.has(label)) {
      return 0;
    }
    return defaultOpacity;
  };

  // Get transform for an item based on animation state
  const getItemTransform = () => {
    // No transform animations, only fade
    return "";
  };

  // Don't include exiting items - they should disappear immediately
  const renderDataSet = [...processedDataSet];

  // Helper to check if an item should have transitions
  const shouldTransition = (label: string) => {
    // Only apply transitions to updating items, not entering or exiting
    return animationState.updating.has(label);
  };

  return {
    animationState,
    getItemOpacity,
    getItemTransform,
    renderDataSet,
    shouldTransition,
  };
};

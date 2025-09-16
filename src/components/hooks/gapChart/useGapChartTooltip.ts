import { useState, useCallback, useEffect, RefObject } from "react";
import * as d3 from "d3";

interface DataItem {
  label: string;
  code?: string;
  value1: number;
  value2: number;
  difference: number;
  date: string;
}

interface TooltipState {
  x: number;
  y: number;
  data: DataItem;
  isSticky?: boolean;
}

export const useGapChartTooltip = (
  svgRef: RefObject<SVGSVGElement>,
  containerRef: RefObject<HTMLDivElement>,
  onHighlightItem?: (item: DataItem) => void,
  onTooltipStickyChange?: (isSticky: boolean) => void
) => {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  // Handle mouse over
  const handleMouseOver = useCallback(
    (d: DataItem, event: React.MouseEvent<SVGElement>) => {
      // Don't update tooltip if it's sticky
      if (tooltip?.isSticky) return;

      if (svgRef.current) {
        const [mouseX, mouseY] = d3.pointer(event.nativeEvent, svgRef.current);
        setTooltip({
          x: mouseX,
          y: mouseY,
          data: d,
          isSticky: false,
        });
        onHighlightItem?.(d);
      }
    },
    [onHighlightItem, tooltip?.isSticky, svgRef]
  );

  // Handle mouse out
  const handleMouseOut = useCallback(() => {
    // Don't hide tooltip if it's sticky
    if (!tooltip?.isSticky) {
      setTooltip(null);
    }
  }, [tooltip?.isSticky]);

  // Handle click on chart elements to make tooltip sticky
  const handleChartElementClick = useCallback(
    (d: DataItem, event: React.MouseEvent<SVGElement>) => {
      event.stopPropagation();
      if (svgRef.current) {
        const [mouseX, mouseY] = d3.pointer(event.nativeEvent, svgRef.current);
        setTooltip({
          x: mouseX,
          y: mouseY,
          data: d,
          isSticky: true,
        });
        onHighlightItem?.(d);
        onTooltipStickyChange?.(true);
      }
    },
    [onHighlightItem, onTooltipStickyChange, svgRef]
  );

  // Handle tooltip click to make it sticky
  const handleTooltipClick = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      if (tooltip && !tooltip.isSticky) {
        setTooltip({ ...tooltip, isSticky: true });
        onTooltipStickyChange?.(true);
      }
    },
    [tooltip, onTooltipStickyChange]
  );

  // Handle click outside to close sticky tooltip
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tooltip?.isSticky) {
        const tooltipElement = (event.target as HTMLElement).closest(".tooltip");
        if (!tooltipElement) {
          setTooltip(null);
          // No need to call callback when unsticky - normal mouse events will handle highlighting
        }
      }
    };

    if (tooltip?.isSticky) {
      document.addEventListener("click", handleClickOutside);
      return () => {
        document.removeEventListener("click", handleClickOutside);
      };
    }
  }, [tooltip?.isSticky]);

  // Update tooltip position on scroll/resize
  useEffect(() => {
    if (!tooltip?.isSticky || !svgRef.current) return;

    const updateTooltipPosition = () => {
      if (svgRef.current && tooltip) {
        const containerRect = containerRef.current?.getBoundingClientRect();

        if (containerRect) {
          // Recalculate position relative to the container
          const newX = tooltip.x;
          const newY = tooltip.y;

          setTooltip(prev => (prev ? { ...prev, x: newX, y: newY } : null));
        }
      }
    };

    window.addEventListener("resize", updateTooltipPosition);
    window.addEventListener("scroll", updateTooltipPosition, true);

    return () => {
      window.removeEventListener("resize", updateTooltipPosition);
      window.removeEventListener("scroll", updateTooltipPosition, true);
    };
  }, [tooltip, svgRef, containerRef]);

  return {
    tooltip,
    handleMouseOver,
    handleMouseOut,
    handleChartElementClick,
    handleTooltipClick,
  };
};

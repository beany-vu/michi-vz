import { useRef } from "react";
import { ChartMetadata } from "../../../types/data";

export function useLineChartRefsAndState() {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const renderCompleteRef = useRef(false);
  const prevChartDataRef = useRef<ChartMetadata | null>(null);
  const isInitialMount = useRef(true);

  return {
    svgRef,
    tooltipRef,
    renderCompleteRef,
    prevChartDataRef,
    isInitialMount,
  };
}

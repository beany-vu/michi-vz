import { useRef, useState } from 'react';

export function useLineChartRefsAndState() {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const renderCompleteRef = useRef(false);
  const prevChartDataRef = useRef<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const isInitialMount = useRef(true);

  return {
    svgRef,
    tooltipRef,
    renderCompleteRef,
    prevChartDataRef,
    isProcessing,
    setIsProcessing,
    isInitialMount,
  };
} 
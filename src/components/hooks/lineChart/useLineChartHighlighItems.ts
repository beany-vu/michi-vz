import { useCallback } from "react";
import { select, pointer } from "d3";
import { DataPoint, LineChartDataItem } from "../../../types/data";

const useLineChartHighlighItems = (
  onHighlightItem: (labels: string[]) => void,
  svgRef: React.RefObject<SVGSVGElement>,
  tooltipRef: React.RefObject<HTMLDivElement>,
  tooltipFormatter: (point: DataPoint, series: DataPoint[], dataset: LineChartDataItem[]) => string,
  filteredDataSet: LineChartDataItem[]
) =>
  useCallback(
    (labels: string[], event?: MouseEvent, dataPoint?: DataPoint, series?: DataPoint[]) => {
      // Direct DOM manipulation for immediate visual feedback
      const svg = select(svgRef.current);
      if (svg.node() && labels.length > 0) {
        // Handle tooltip if event and data are provided
        if (event && dataPoint && series && tooltipRef?.current && svgRef.current) {
          const [mouseX, mouseY] = pointer(event, event.currentTarget as SVGElement);
          const tooltip = tooltipRef.current;
          const svgRect = svgRef.current.getBoundingClientRect();

          const tooltipContent = tooltipFormatter(dataPoint, series, filteredDataSet);
          tooltip.style.visibility = "visible";
          tooltip.innerHTML = tooltipContent;
          const tooltipRect = tooltip.getBoundingClientRect();

          const xPosition = mouseX + 10;
          const yPosition = mouseY - 25;

          // Handle tooltip positioning
          if (xPosition + tooltipRect.width > svgRect.width - 50) {
            tooltip.style.left = `${mouseX - tooltipRect.width - 10}px`;
          } else {
            tooltip.style.left = `${xPosition}px`;
          }

          if (yPosition < 50) {
            tooltip.style.top = `${mouseY + 10}px`;
          } else {
            tooltip.style.top = `${yPosition}px`;
          }
        }
      } else if (svg.node()) {
        if (tooltipRef?.current) {
          tooltipRef.current.style.visibility = "hidden";
        }
      }

      onHighlightItem(labels);
    },
    [onHighlightItem, svgRef, tooltipRef, tooltipFormatter, filteredDataSet]
  );

export default useLineChartHighlighItems;

import React, {
  FC,
  useRef,
  useState,
  useCallback,
  useLayoutEffect,
  useMemo,
  useEffect,
} from "react";
import * as d3 from "d3";
import styled from "styled-components";
import { ChartMetadata, DataPoint } from "src/types/data";
import Title from "./shared/Title";
import XaxisLinear from "./shared/XaxisLinear";
import YaxisBand from "./shared/YaxisBand";
import LoadingIndicator from "./shared/LoadingIndicator";
import { useChartContext } from "./MichiVzProvider";
import { useDisplayIsNodata } from "./hooks/useDisplayIsNodata";
import { useGapChartData } from "./hooks/gapChart/useGapChartData";
import { useGapChartScales } from "./hooks/gapChart/useGapChartScales";
import { useGapChartColors } from "./hooks/gapChart/useGapChartColors";
import useDeepCompareEffect from "use-deep-compare-effect";

const DEFAULT_WIDTH = 1000;
const DEFAULT_HEIGHT = 500;
const DEFAULT_MARGIN = { top: 50, right: 150, bottom: 100, left: 150 };

const GapChartStyled = styled.div`
  position: relative;

  .gap-bar {
    transition: opacity 0.2s ease-out;
  }

  .gap-line {
    stroke-width: 2;
    fill: none;
  }

  .gap-marker {
    transition: opacity 0.2s ease-out;
  }

  .tooltip {
    position: absolute;
    background: white;
    border: 1px solid #ccc;
    border-radius: 4px;
    padding: 8px;
    pointer-events: none;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    font-size: 12px;
    z-index: 10;

    &.sticky {
      pointer-events: auto;
      cursor: default;
      border-color: #666;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    }
  }
`;

interface DataItem {
  label: string;
  code?: string;
  value1: number;
  value2: number;
  difference: number; // sugggest formula to calculate difference is value1 - value2, we use this property for sorting items (when the filter property is defined)
  date: string;
}

interface Filter {
  limit: number;
  date: number | string;
  criteria: string;
  sortingDir: "asc" | "desc";
}

interface GapChartProps {
  dataSet: DataItem[];
  title: string;
  colors: string[];
  colorsMapping?: Record<string, string>; // predefined colors mapping for specific labels, if not defined, the colors array will be to use generated colors, and generated colors will be cached so that the color of a specific label will not change between renders
  colorMode?: "label" | "shape"; // whether to assign colors by label (default) or by shape
  shapeColorsMapping?: {
    value1?: string;
    value2?: string;
    gap?: string;
  }; // explicit color mapping for shapes when colorMode is "shape"
  highlightItems?: string[]; // items to highlight, if not defined, all items will be highlighted
  disabledItems?: string[]; // items to disable (not being rendered), if not defined, all items will be showed
  tooltipFormatter?: (data: DataItem) => string;
  filter: Filter | undefined;
  shapeValue1: "circle" | "square" | "triangle";
  shapeValue2: "circle" | "square" | "triangle";
  shapesLabelsMapping?: {
    value1?: string;
    value2?: string;
    gap?: string;
  };
  xAxisDataType: "number" | "date_annual" | "date_monthly";
  yAxisFormat?: (d: number) => string;
  xAxisFormat?: (d: number) => string;
  ticks?: number;
  width: number;
  height: number;
  margin: { top: number; right: number; bottom: number; left: number };
  onHighlightItem?: (item: DataItem) => void;
  onDisabledItem?: (item: DataItem) => void;
  onColorChange?: (item: DataItem, color: string) => void;
  onChartDataProcessed?: (metadata: ChartMetadata) => void;
  isNodata?: boolean | ((dataSet: DataItem[]) => boolean);
  isNodataComponent?: React.ReactNode;
  isLoading?: boolean;
  isLoadingComponent?: React.ReactNode;
}

const GapChart: FC<GapChartProps> = ({
  dataSet,
  title,
  colors,
  colorsMapping,
  colorMode = "label",
  shapeColorsMapping,
  highlightItems: propsHighlightItems,
  disabledItems: propsDisabledItems,
  tooltipFormatter,
  filter,
  shapeValue1,
  shapeValue2,
  shapesLabelsMapping,
  xAxisDataType,
  yAxisFormat,
  xAxisFormat,
  ticks = 5,
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
  margin = DEFAULT_MARGIN,
  onHighlightItem,
  onChartDataProcessed,
  isNodata,
  isNodataComponent,
  isLoading,
  isLoadingComponent,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    data: DataItem;
    isSticky?: boolean;
  } | null>(null);
  const [hoveredYItem, setHoveredYItem] = useState<string | null>(null);

  const { highlightItems: contextHighlightItems, disabledItems: contextDisabledItems } =
    useChartContext();
  const highlightItems = propsHighlightItems || contextHighlightItems || [];
  const disabledItems = propsDisabledItems || contextDisabledItems || [];

  // Process data and get domains
  const { processedDataSet, yAxisDomain, xAxisDomain } = useGapChartData(
    dataSet,
    filter,
    disabledItems
  );

  // Get scales
  const { xScale, yScale } = useGapChartScales(
    xAxisDomain,
    yAxisDomain,
    width,
    height,
    margin,
    xAxisDataType
  );

  // Get color function
  const { getColor, getShapeColor } = useGapChartColors(
    yAxisDomain,
    colors,
    colorsMapping,
    colorMode,
    shapeColorsMapping
  );

  // Handle mouse events
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
    [onHighlightItem, tooltip?.isSticky]
  );

  const handleMouseOut = useCallback(() => {
    // Don't hide tooltip if it's sticky
    if (!tooltip?.isSticky) {
      setTooltip(null);
    }
  }, [tooltip?.isSticky]);

  // Handle click on chart elements (bars and shapes) to make tooltip sticky
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
      }
    },
    [onHighlightItem]
  );

  // Handle tooltip click to make it sticky
  const handleTooltipClick = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      if (tooltip && !tooltip.isSticky) {
        setTooltip({ ...tooltip, isSticky: true });
      }
    },
    [tooltip]
  );

  // Handle click outside to close sticky tooltip
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tooltip?.isSticky) {
        const tooltipElement = (event.target as HTMLElement).closest(".tooltip");
        if (!tooltipElement) {
          setTooltip(null);
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
  }, [tooltip]);

  // Check if no data
  const displayIsNodata = useDisplayIsNodata({
    dataSet,
    isLoading,
    isNodataComponent,
    isNodata,
  });

  // Create shape path helper
  const getShapePath = useCallback((shape: string, size: number = 14) => {
    switch (shape) {
      case "circle":
        return d3
          .symbol()
          .type(d3.symbolCircle)
          .size(size * size)();
      case "square":
        return d3
          .symbol()
          .type(d3.symbolSquare)
          .size(size * size)();
      case "triangle":
        return d3
          .symbol()
          .type(d3.symbolTriangle)
          .size(size * size)();
      default:
        return d3
          .symbol()
          .type(d3.symbolCircle)
          .size(size * size)();
    }
  }, []);

  // Render gap bars
  const renderGapBars = useMemo(() => {
    return processedDataSet.map((d, i) => {
      const y = yScale(d.label) || 0;
      const barHeight = yScale.bandwidth();

      // Get colors based on color mode
      const gapColor = colorMode === "shape" ? getShapeColor("gap", d.label) : getColor(d.label);
      const value1Color =
        colorMode === "shape" ? getShapeColor("value1", d.label) : getColor(d.label);
      const value2Color =
        colorMode === "shape" ? getShapeColor("value2", d.label) : getColor(d.label);

      // Calculate positions
      const x1 = xScale(Math.min(d.value1, d.value2));
      const x2 = xScale(Math.max(d.value1, d.value2));
      const barWidth = x2 - x1;

      // Determine if highlighted
      const isHighlighted = highlightItems.length === 0 || highlightItems.includes(d.label);

      // Determine opacity based on hover state
      const barOpacity =
        hoveredYItem !== null
          ? hoveredYItem === d.label
            ? isHighlighted
              ? 0.7
              : 0.3
            : 0.3
          : isHighlighted
            ? 0.7
            : 0.3;

      const markerOpacity =
        hoveredYItem !== null ? (hoveredYItem === d.label ? 1 : 0.3) : isHighlighted ? 1 : 0.3;

      return (
        <g key={`gap-${i}`} className="gap-group">
          {/* Gap bar */}
          <rect
            className="gap-bar"
            x={x1}
            y={y + barHeight * 0.25}
            width={barWidth}
            height={barHeight * 0.5}
            fill={gapColor}
            opacity={barOpacity}
            rx={4}
            ry={4}
            onMouseOver={e => handleMouseOver(d, e)}
            onMouseOut={handleMouseOut}
            onClick={e => handleChartElementClick(d, e)}
            style={{ cursor: "pointer" }}
          />

          {/* Connecting line */}
          <line
            className="gap-line"
            x1={x1}
            y1={y + barHeight / 2}
            x2={x2}
            y2={y + barHeight / 2}
            stroke="white"
            strokeDasharray={d.difference < 0 ? "4,2" : "0"}
            opacity={markerOpacity}
          />

          {/* Value1 marker */}
          <path
            className="gap-marker value1-marker"
            d={getShapePath(shapeValue1) || ""}
            transform={`translate(${xScale(d.value1)}, ${y + barHeight / 2})`}
            fill={value1Color}
            stroke="white"
            strokeWidth={2}
            opacity={markerOpacity}
            onMouseOver={e => handleMouseOver(d, e)}
            onMouseOut={handleMouseOut}
            onClick={e => handleChartElementClick(d, e)}
            style={{ cursor: "pointer" }}
          />

          {/* Value2 marker */}
          <path
            className="gap-marker value2-marker"
            d={getShapePath(shapeValue2) || ""}
            transform={`translate(${xScale(d.value2)}, ${y + barHeight / 2})`}
            fill="white"
            stroke={value2Color}
            strokeWidth={2}
            opacity={markerOpacity}
            onMouseOver={e => handleMouseOver(d, e)}
            onMouseOut={handleMouseOut}
            onClick={e => handleChartElementClick(d, e)}
            style={{ cursor: "pointer" }}
          />
        </g>
      );
    });
  }, [
    processedDataSet,
    xScale,
    yScale,
    getColor,
    getShapeColor,
    colorMode,
    highlightItems,
    shapeValue1,
    shapeValue2,
    handleMouseOver,
    handleMouseOut,
    handleChartElementClick,
    hoveredYItem,
    getShapePath,
  ]);

  // Handle chart data processed callback
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

  return (
    <GapChartStyled ref={containerRef}>
      <svg ref={svgRef} width={width} height={height} style={{ overflow: "visible" }}>
        <Title x={width / 2} y={margin.top / 2}>
          {title}
        </Title>

        <XaxisLinear
          xScale={xScale}
          height={height}
          margin={margin}
          xAxisFormat={xAxisFormat}
          xAxisDataType={xAxisDataType}
          ticks={ticks}
          showGrid={true}
          showZeroLine={true}
        />

        <YaxisBand
          yScale={yScale}
          width={width}
          margin={margin}
          yAxisFormat={yAxisFormat}
          showGrid={true}
          onHover={setHoveredYItem}
          hoveredItem={hoveredYItem}
        />

        {renderGapBars}

        {/* Legend */}
        {shapesLabelsMapping && (
          <g transform={`translate(${width / 2}, ${height - margin.bottom / 2 + 20})`}>
            {/* Create a flex-like layout for legend items */}
            {(() => {
              const items = [];
              const itemWidth = 180;
              const itemSpacing = 40;
              const shapeOffset = 15;

              // Calculate total width needed
              const activeItems = [
                shapesLabelsMapping.value1 ? 1 : 0,
                shapesLabelsMapping.gap ? 1 : 0,
                shapesLabelsMapping.value2 ? 1 : 0,
              ].reduce((sum, val) => sum + val, 0);

              const totalWidth = activeItems * itemWidth + (activeItems - 1) * itemSpacing;
              let currentX = -totalWidth / 2;

              // Value1 Legend Item
              if (shapesLabelsMapping.value1) {
                items.push(
                  <g key="value1" transform={`translate(${currentX}, 0)`}>
                    <path
                      d={getShapePath(shapeValue1, 12) || ""}
                      fill="#666"
                      stroke="white"
                      strokeWidth={1}
                    />
                    <foreignObject
                      x={shapeOffset}
                      y={-10}
                      width={itemWidth - shapeOffset - 5}
                      height={20}
                    >
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#666",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          paddingLeft: "5px",
                        }}
                        title={shapesLabelsMapping.value1}
                      >
                        {shapesLabelsMapping.value1}
                      </div>
                    </foreignObject>
                  </g>
                );
                currentX += itemWidth + itemSpacing;
              }

              // Gap Legend Item
              if (shapesLabelsMapping.gap) {
                items.push(
                  <g key="gap" transform={`translate(${currentX}, 0)`}>
                    <rect
                      x={-10}
                      y={-5}
                      width={20}
                      height={10}
                      fill="#999"
                      opacity={0.7}
                      rx={2}
                      ry={2}
                    />
                    <foreignObject
                      x={shapeOffset + 5}
                      y={-10}
                      width={itemWidth - shapeOffset - 10}
                      height={20}
                    >
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#666",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          paddingLeft: "5px",
                        }}
                        title={shapesLabelsMapping.gap}
                      >
                        {shapesLabelsMapping.gap}
                      </div>
                    </foreignObject>
                  </g>
                );
                currentX += itemWidth + itemSpacing;
              }

              // Value2 Legend Item
              if (shapesLabelsMapping.value2) {
                items.push(
                  <g key="value2" transform={`translate(${currentX}, 0)`}>
                    <path
                      d={getShapePath(shapeValue2, 12) || ""}
                      fill="white"
                      stroke="#666"
                      strokeWidth={2}
                    />
                    <foreignObject
                      x={shapeOffset}
                      y={-10}
                      width={itemWidth - shapeOffset - 5}
                      height={20}
                    >
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#666",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          paddingLeft: "5px",
                        }}
                        title={shapesLabelsMapping.value2}
                      >
                        {shapesLabelsMapping.value2}
                      </div>
                    </foreignObject>
                  </g>
                );
              }

              return items;
            })()}
          </g>
        )}
      </svg>

      {tooltip && (
        <div
          className={`tooltip ${tooltip.isSticky ? "sticky" : ""}`}
          style={{
            left: `${tooltip.x + 10}px`,
            top: `${tooltip.y - 10}px`,
          }}
          onClick={handleTooltipClick}
        >
          {tooltipFormatter ? (
            tooltipFormatter(tooltip.data)
          ) : (
            <div>
              <strong>{tooltip.data.label}</strong>
              <br />
              Value 1: {tooltip.data.value1}
              <br />
              Value 2: {tooltip.data.value2}
              <br />
              Difference: {tooltip.data.difference}
            </div>
          )}
          {!tooltip.isSticky && (
            <div style={{ fontSize: "10px", marginTop: "4px", color: "#666", fontStyle: "italic" }}>
              Click chart or tooltip to pin
            </div>
          )}
        </div>
      )}

      {isLoading && (isLoadingComponent || <LoadingIndicator />)}
      {displayIsNodata && isNodataComponent}
    </GapChartStyled>
  );
};

export default GapChart;

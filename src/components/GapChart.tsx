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

const GapChartStyled = styled.div<{ $enableTransitions: boolean }>`
  position: relative;

  .gap-bar {
    ${props => props.$enableTransitions && "transition: opacity 0.2s ease-out;"}
  }

  .gap-line {
    stroke-width: 2;
    fill: none;
  }

  .gap-marker {
    ${props => props.$enableTransitions && "transition: opacity 0.2s ease-out;"}
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

interface LegendItem {
  type: "value1" | "value2" | "gap";
  label: string;
  color?: string;
  shape?: "circle" | "square" | "triangle";
  visible?: boolean;
}

interface GapChartProps {
  dataSet: DataItem[];
  title: string;
  colors?: string[];
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
  legendFormatter?: (items: LegendItem[]) => LegendItem[];
  xAxisDataType: "number" | "date_annual" | "date_monthly";
  yAxisFormat?: (d: number) => string;
  xAxisFormat?: (d: number) => string;
  ticks?: number;
  width: number;
  height: number;
  margin: { top: number; right: number; bottom: number; left: number };
  tickHtmlWidth?: number;
  onHighlightItem?: (item: DataItem) => void;
  onDisabledItem?: (item: DataItem) => void;
  onColorChange?: (item: DataItem, color: string) => void;
  onChartDataProcessed?: (metadata: ChartMetadata) => void;
  isNodata?: boolean | ((dataSet: DataItem[]) => boolean);
  isNodataComponent?: React.ReactNode;
  isLoading?: boolean;
  isLoadingComponent?: React.ReactNode;
  enableTransitions?: boolean;
  legendAlign?: "left" | "center" | "right";
}

const GapChart: FC<GapChartProps> = ({
  dataSet,
  title,
  colors = [
    "#1f77b4",
    "#ff7f0e",
    "#2ca02c",
    "#d62728",
    "#9467bd",
    "#8c564b",
    "#e377c2",
    "#7f7f7f",
    "#bcbd22",
    "#17becf",
  ],
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
  legendFormatter,
  xAxisDataType,
  yAxisFormat,
  xAxisFormat,
  ticks = 5,
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
  margin = DEFAULT_MARGIN,
  tickHtmlWidth,
  onHighlightItem,
  onChartDataProcessed,
  isNodata,
  isNodataComponent,
  isLoading,
  isLoadingComponent,
  enableTransitions = true,
  legendAlign = "left",
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
  const [isRendering, setIsRendering] = useState(false);

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

  // Track when data is being re-rendered
  useEffect(() => {
    setIsRendering(true);
    // Set a small delay to ensure the axis hides before shapes start rendering
    const timer = setTimeout(() => {
      setIsRendering(false);
    }, 100);

    return () => clearTimeout(timer);
  }, [processedDataSet, xScale, yScale, yAxisFormat]);

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
        // Make circle smaller - use 0.8x the size to match square visually
        return d3
          .symbol()
          .type(d3.symbolCircle)
          .size(size * 0.8 * (size * 0.8))();
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
          .size(size * 0.8 * (size * 0.8))();
    }
  }, []);

  // Render gap bars and shapes in layers
  const renderGapBars = useMemo(() => {
    const elements = processedDataSet.map((d, i) => {
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

      return {
        d,
        i,
        y,
        barHeight,
        gapColor,
        value1Color,
        value2Color,
        x1,
        x2,
        barWidth,
        barOpacity,
        markerOpacity,
      };
    });

    // Separate shapes by type for layering
    const squares: typeof elements = [];
    const nonSquares: typeof elements = [];

    elements.forEach(element => {
      const hasSquareValue1 = shapeValue1 === "square";
      const hasSquareValue2 = shapeValue2 === "square";

      if (hasSquareValue1 || hasSquareValue2) {
        squares.push(element);
      }
      if (!hasSquareValue1 || !hasSquareValue2) {
        nonSquares.push(element);
      }
    });

    return (
      <>
        {/* First layer: Render all gap bars and lines */}
        {elements.map(
          ({ d, i, y, barHeight, gapColor, x1, x2, barWidth, barOpacity, markerOpacity }) => (
            <g key={`gap-base-${i}`}>
              {/* Gap bar */}
              <rect
                className="gap-bar"
                x={x1}
                y={y + barHeight / 2 - 4}
                width={barWidth}
                height={8}
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
            </g>
          )
        )}

        {/* Second layer: Render all square shapes */}
        {squares.map(({ d, i, y, barHeight, value1Color, value2Color, markerOpacity }) => (
          <g key={`gap-squares-${i}`}>
            {shapeValue1 === "square" && (
              <path
                className="gap-marker value1-marker"
                d={getShapePath(shapeValue1) || ""}
                transform={`translate(${xScale(d.value1)}, ${y + barHeight / 2})`}
                fill={value1Color}
                opacity={markerOpacity}
                onMouseOver={e => handleMouseOver(d, e)}
                onMouseOut={handleMouseOut}
                onClick={e => handleChartElementClick(d, e)}
                style={{ cursor: "pointer" }}
              />
            )}
            {shapeValue2 === "square" && (
              <path
                className="gap-marker value2-marker"
                d={getShapePath(shapeValue2) || ""}
                transform={`translate(${xScale(d.value2)}, ${y + barHeight / 2})`}
                fill={value2Color}
                opacity={markerOpacity}
                onMouseOver={e => handleMouseOver(d, e)}
                onMouseOut={handleMouseOut}
                onClick={e => handleChartElementClick(d, e)}
                style={{ cursor: "pointer" }}
              />
            )}
          </g>
        ))}

        {/* Third layer: Render all circle and triangle shapes */}
        {nonSquares.map(({ d, i, y, barHeight, value1Color, value2Color, markerOpacity }) => (
          <g key={`gap-nonSquares-${i}`}>
            {shapeValue1 !== "square" && (
              <path
                className="gap-marker value1-marker"
                d={getShapePath(shapeValue1) || ""}
                transform={`translate(${xScale(d.value1)}, ${y + barHeight / 2})`}
                fill={value1Color}
                opacity={markerOpacity}
                onMouseOver={e => handleMouseOver(d, e)}
                onMouseOut={handleMouseOut}
                onClick={e => handleChartElementClick(d, e)}
                style={{ cursor: "pointer" }}
              />
            )}
            {shapeValue2 !== "square" && (
              <path
                className="gap-marker value2-marker"
                d={getShapePath(shapeValue2) || ""}
                transform={`translate(${xScale(d.value2)}, ${y + barHeight / 2})`}
                fill={value2Color}
                opacity={markerOpacity}
                onMouseOver={e => handleMouseOver(d, e)}
                onMouseOut={handleMouseOut}
                onClick={e => handleChartElementClick(d, e)}
                style={{ cursor: "pointer" }}
              />
            )}
          </g>
        ))}
      </>
    );
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
    <GapChartStyled ref={containerRef} $enableTransitions={enableTransitions}>
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
          tickHtmlWidth={tickHtmlWidth}
          enableTransitions={enableTransitions}
          isRendering={isRendering}
        />

        <g className="gap-chart-content">{renderGapBars}</g>

        {/* Legend */}
        {shapesLabelsMapping && (
          <g transform={`translate(${
            legendAlign === "left" 
              ? margin.left 
              : legendAlign === "right" 
                ? width - margin.right 
                : width / 2
          }, ${height - margin.bottom / 2 + 20})`}>
            {/* Create a flex-like layout for legend items */}
            {(() => {
              // Prepare default legend items
              const defaultLegendItems: LegendItem[] = [];

              if (shapesLabelsMapping.value1) {
                defaultLegendItems.push({
                  type: "value1",
                  label: shapesLabelsMapping.value1,
                  shape: shapeValue1,
                  color:
                    colorMode === "shape" && shapeColorsMapping?.value1
                      ? shapeColorsMapping.value1
                      : "#666",
                  visible: true,
                });
              }

              if (shapesLabelsMapping.gap) {
                defaultLegendItems.push({
                  type: "gap",
                  label: shapesLabelsMapping.gap,
                  color:
                    colorMode === "shape" && shapeColorsMapping?.gap
                      ? shapeColorsMapping.gap
                      : "#999",
                  visible: true,
                });
              }

              if (shapesLabelsMapping.value2) {
                defaultLegendItems.push({
                  type: "value2",
                  label: shapesLabelsMapping.value2,
                  shape: shapeValue2,
                  color:
                    colorMode === "shape" && shapeColorsMapping?.value2
                      ? shapeColorsMapping.value2
                      : "#666",
                  visible: true,
                });
              }

              // Apply formatter if provided
              const legendItems = legendFormatter
                ? legendFormatter(defaultLegendItems).filter(item => item.visible !== false)
                : defaultLegendItems;

              const items = [];
              const itemWidth = 180;
              const itemSpacing = 40;
              const shapeOffset = 15;

              // Calculate total width needed
              const activeItems = legendItems.length;

              const totalWidth = activeItems * itemWidth + (activeItems - 1) * itemSpacing;
              let currentX = legendAlign === "left" 
                ? 0 
                : legendAlign === "right" 
                  ? -totalWidth 
                  : -totalWidth / 2;

              // Render legend items based on the processed array
              legendItems.forEach(legendItem => {
                if (legendItem.type === "gap") {
                  items.push(
                    <g key={legendItem.type} transform={`translate(${currentX}, 0)`}>
                      <rect
                        x={-10}
                        y={-5}
                        width={20}
                        height={10}
                        fill={legendItem.color || "#999"}
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
                            color: legendItem.color || "#666",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            paddingLeft: "5px",
                          }}
                          title={legendItem.label}
                        >
                          {legendItem.label}
                        </div>
                      </foreignObject>
                    </g>
                  );
                } else {
                  // Value1 or Value2 shape items
                  items.push(
                    <g key={legendItem.type} transform={`translate(${currentX}, 0)`}>
                      <path
                        d={getShapePath(legendItem.shape || shapeValue1, 12) || ""}
                        fill={legendItem.color || "#666"}
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
                            color: legendItem.color || "#666",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            paddingLeft: "5px",
                          }}
                          title={legendItem.label}
                        >
                          {legendItem.label}
                        </div>
                      </foreignObject>
                    </g>
                  );
                }
                currentX += itemWidth + itemSpacing;
              });

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

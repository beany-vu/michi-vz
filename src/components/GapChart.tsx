import React, { FC, useRef, useState, useMemo, useLayoutEffect } from "react";
import isEqual from "lodash/isEqual";
import styled from "styled-components";
import { ChartMetadata, LegendItem } from "src/types/data";
import Title from "./shared/Title";
import XaxisLinear from "./shared/XaxisLinear";
import YaxisBand from "./shared/YaxisBand";
import LoadingIndicator from "./shared/LoadingIndicator";
import { useDisplayIsNodata } from "./hooks/useDisplayIsNodata";
import { useGapChartData } from "./hooks/gapChart/useGapChartData";
import { useGapChartScales } from "./hooks/gapChart/useGapChartScales";
import { useGapChartColors } from "./hooks/gapChart/useGapChartColors";
import { useGapChartTooltip } from "./hooks/gapChart/useGapChartTooltip";
import { useGapChartShapes } from "./hooks/gapChart/useGapChartShapes";
import { useGapChartRenderer } from "./hooks/gapChart/useGapChartRenderer";
import { useGapChartLegend } from "./hooks/gapChart/useGapChartLegend";
import { useGapChartMetadata } from "./hooks/gapChart/useGapChartMetadata";
import TooltipHint from "src/components/shared/TooltipHint";

const DEFAULT_COLORS = [
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
];

const DEFAULT_WIDTH = 1000;
const DEFAULT_HEIGHT = 500;
const DEFAULT_MARGIN = { top: 50, right: 150, bottom: 100, left: 150 };

const GapChartStyled = styled.div<{ $enableTransitions: boolean }>`
  position: relative;

  .gap-bar {
    /* Transitions are now handled inline based on animation state */
  }

  .gap-line {
    stroke-width: 2;
    fill: none;
    /* Transitions are now handled inline based on animation state */
  }

  .gap-marker {
    /* Transitions are now handled inline based on animation state */
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

interface GapChartLegendItem {
  type: "value1" | "value2" | "gap";
  label: string;
  color?: string;
  shape?: "circle" | "square" | "triangle";
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
  legendFormatter?: (items: GapChartLegendItem[]) => GapChartLegendItem[];
  xAxisDataType: "number" | "date_annual" | "date_monthly";
  yAxisFormat?: (d: number) => string;
  xAxisFormat?: (d: number, tickValues?: Array<string | number>) => string;
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
  squareRadius?: number; // border radius for square shapes (default: 2)
  enableShadow?: boolean; // enable shadow filter for shapes (default: false)
  shadowConfig?: {
    blur?: number;
    dx?: number;
    dy?: number;
    opacity?: number;
    color?: string;
  }; // custom shadow configuration
  onColorMappingGenerated?: (colorsMapping: { [key: string]: string }) => void;
  onLegendDataChange?: (legendData: LegendItem[]) => void;
}

const GapChart: FC<GapChartProps> = ({
  dataSet,
  title,
  colors = DEFAULT_COLORS,
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
  squareRadius = 2,
  enableShadow = false,
  shadowConfig = {
    blur: 3,
    dx: 0,
    dy: 2,
    opacity: 0.3,
    color: "#000000",
  },
  onColorMappingGenerated,
  onLegendDataChange,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hoveredYItem, setHoveredYItem] = useState<string | null>(null);

  const highlightItems = propsHighlightItems || [];
  const disabledItems = propsDisabledItems || [];

  // Process data and get domains
  const { processedDataSet, yAxisDomain, xAxisDomain, allLabels } = useGapChartData(
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

  // Get color function (use allLabels for complete color generation including disabled items)
  const { getColor, getShapeColor, generatedColorsMapping } = useGapChartColors(
    allLabels,
    colors,
    colorsMapping,
    colorMode,
    shapeColorsMapping
  );

  // Notify parent about generated color mapping with infinite loop protection
  const lastColorMappingSentRef = useRef<{ [key: string]: string }>({});
  useLayoutEffect(() => {
    if (
      onColorMappingGenerated &&
      !isEqual(generatedColorsMapping, lastColorMappingSentRef.current)
    ) {
      lastColorMappingSentRef.current = { ...generatedColorsMapping };
      onColorMappingGenerated(generatedColorsMapping);
    }
  }, [generatedColorsMapping, onColorMappingGenerated]);

  // Get tooltip handlers
  const { tooltip, handleMouseOver, handleMouseOut, handleChartElementClick, handleTooltipClick } =
    useGapChartTooltip(svgRef, containerRef, onHighlightItem);

  // Get shape generation function
  const { getShapePath, getSquareDimensions } = useGapChartShapes();

  // Helper for shadow filter
  const shadowFilter = enableShadow ? "url(#gapChartShadow)" : undefined;

  // Get render data
  const renderData = useGapChartRenderer({
    processedDataSet,
    xScale,
    yScale,
    getColor,
    getShapeColor,
    colorMode,
    highlightItems,
    shapeValue1,
    shapeValue2,
    hoveredYItem,
  });

  // Get legend items
  const { legendItems, globalLegendItems } = useGapChartLegend({
    shapesLabelsMapping,
    shapeValue1,
    shapeValue2,
    colorMode,
    shapeColorsMapping,
    legendFormatter,
    onLegendDataChange,
  });

  // Handle metadata
  useGapChartMetadata({
    processedDataSet,
    xAxisDomain,
    onChartDataProcessed,
    globalLegendItems,
  });

  // Check if no data
  const displayIsNodata = useDisplayIsNodata({
    dataSet,
    isLoading,
    isNodataComponent,
    isNodata,
  });

  // Render gap bars and shapes in layers
  const renderGapBars = useMemo(() => {
    const { elements, squares, nonSquares } = renderData;

    return (
      <>
        {/* First layer: Render all gap bars and lines */}
        {elements.map(
          ({ d, i, y, barHeight, gapColor, x1, x2, barWidth, barOpacity, markerOpacity }) => (
            <g key={`gap-base-${d.label}-${i}`}>
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
                style={{
                  cursor: "pointer",
                  transition: "none",
                }}
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
                style={{
                  transition: "none",
                }}
              />
            </g>
          )
        )}

        {/* Second layer: Render all square shapes */}
        {squares.map(({ d, i, y, barHeight, value1Color, value2Color, markerOpacity }) => (
          <g key={`gap-squares-${d.label}-${i}`}>
            {shapeValue1 === "square" &&
              (() => {
                const dims = getSquareDimensions();
                return (
                  <rect
                    className="gap-marker value1-marker"
                    x={xScale(d.value1) + dims.x}
                    y={y + barHeight / 2 + dims.y}
                    width={dims.width}
                    height={dims.height}
                    fill={value1Color}
                    opacity={markerOpacity}
                    rx={squareRadius}
                    ry={squareRadius}
                    onMouseOver={e => handleMouseOver(d, e)}
                    onMouseOut={handleMouseOut}
                    onClick={e => handleChartElementClick(d, e)}
                    style={{
                      cursor: "pointer",
                      transition: "none",
                      filter: shadowFilter,
                    }}
                  />
                );
              })()}
            {shapeValue2 === "square" &&
              (() => {
                const dims = getSquareDimensions();
                return (
                  <rect
                    className="gap-marker value2-marker"
                    x={xScale(d.value2) + dims.x}
                    y={y + barHeight / 2 + dims.y}
                    width={dims.width}
                    height={dims.height}
                    fill={value2Color}
                    opacity={markerOpacity}
                    rx={2}
                    ry={2}
                    onMouseOver={e => handleMouseOver(d, e)}
                    onMouseOut={handleMouseOut}
                    onClick={e => handleChartElementClick(d, e)}
                    style={{
                      cursor: "pointer",
                      transition: "none",
                    }}
                  />
                );
              })()}
          </g>
        ))}

        {/* Third layer: Render all circle and triangle shapes */}
        {nonSquares.map(({ d, i, y, barHeight, value1Color, value2Color, markerOpacity }) => (
          <g key={`gap-nonSquares-${d.label}-${i}`}>
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
                style={{
                  cursor: "pointer",
                  transition: "none",
                  filter: shadowFilter,
                }}
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
                style={{
                  cursor: "pointer",
                  transition: "none",
                }}
              />
            )}
          </g>
        ))}
      </>
    );
  }, [
    renderData,
    xScale,
    shapeValue1,
    shapeValue2,
    handleMouseOver,
    handleMouseOut,
    handleChartElementClick,
    getShapePath,
  ]);

  return (
    <GapChartStyled ref={containerRef} $enableTransitions={enableTransitions}>
      <svg ref={svgRef} width={width} height={height} style={{ overflow: "visible" }}>
        {/* Shadow filter definition */}
        {enableShadow && (
          <defs>
            <filter id="gapChartShadow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceAlpha" stdDeviation={shadowConfig.blur} />
              <feOffset dx={shadowConfig.dx} dy={shadowConfig.dy} result="offsetBlur" />
              <feFlood floodColor={shadowConfig.color} floodOpacity={shadowConfig.opacity} />
              <feComposite in2="offsetBlur" operator="in" />
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
        )}

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
        />

        <g className="gap-chart-content">{renderGapBars}</g>

        {/* Legend */}
        {shapesLabelsMapping && legendItems.length > 0 && (
          <g
            transform={`translate(${
              legendAlign === "left"
                ? margin.left
                : legendAlign === "right"
                  ? width - margin.right
                  : width / 2
            }, ${height - margin.bottom / 2 + 20})`}
          >
            {/* Create a flex-like layout for legend items */}
            {(() => {
              const items = [];
              const itemWidth = 180;
              const itemSpacing = 40;
              const shapeOffset = 15;

              // Calculate total width needed
              const activeItems = legendItems.length;

              const totalWidth = activeItems * itemWidth + (activeItems - 1) * itemSpacing;
              let currentX =
                legendAlign === "left"
                  ? 0
                  : legendAlign === "right"
                    ? -totalWidth
                    : -totalWidth / 2;

              // Render legend items based on the processed array
              (legendItems as GapChartLegendItem[]).forEach(legendItem => {
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
                  const shape = legendItem.shape || shapeValue1;
                  items.push(
                    <g key={legendItem.type} transform={`translate(${currentX}, 0)`}>
                      {shape === "square" ? (
                        (() => {
                          const dims = getSquareDimensions(12);
                          return (
                            <rect
                              x={dims.x}
                              y={dims.y}
                              width={dims.width}
                              height={dims.height}
                              fill={legendItem.color || "#666"}
                              rx={2}
                              ry={2}
                            />
                          );
                        })()
                      ) : (
                        <path d={getShapePath(shape, 12) || ""} fill={legendItem.color || "#666"} />
                      )}
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
          {!tooltip.isSticky && <TooltipHint />}
        </div>
      )}

      {isLoading && (isLoadingComponent || <LoadingIndicator />)}
      {displayIsNodata && isNodataComponent}
    </GapChartStyled>
  );
};

export default GapChart;

import React, { useMemo, useRef } from "react";
import * as d3 from "d3";
import Title from "./shared/Title";
import XaxisBand from "./shared/XaxisBand";
import YaxisLinear from "./shared/YaxisLinear";
import { useChartContext } from "./MichiVzProvider";
import LoadingIndicator from "./shared/LoadingIndicator";

interface DataPoint {
  date: number;
  [key: string]: number | undefined;
}

interface Props {
  series: DataPoint[];
  keys: string[];
  width: number;
  height: number;
  margin: { top: number; right: number; bottom: number; left: number };
  title?: string;
  yAxisFormat?: (d: number) => string;
  children?: React.ReactNode;
  isLoading?: boolean;
  isLoadingComponent?: React.ReactNode;
  isNodataComponent?: React.ReactNode;
}

interface RectData {
  key: string;
  height: number;
  width: number;
  y: number;
  x: number;
  data: DataPoint;
  fill: string;
}

const MARGIN = { top: 50, right: 50, bottom: 50, left: 50 };
const WIDTH = 900;
const HEIGHT = 480;

const RibbonChart: React.FC<Props> = ({
  series,
  width = WIDTH,
  height = HEIGHT,
  margin = MARGIN,
  title,
  yAxisFormat,
  keys,
  children,
  isLoading = false,
  isLoadingComponent,
  isNodataComponent,
}) => {
  const { colorsMapping, highlightItems, setHighlightItems, disabledItems } =
    useChartContext();
  const ref = useRef<SVGSVGElement>(null);

  // xScale
  const dates = useMemo(() => series.map((d) => String(d.date)), [series]);
  const xScale = useMemo(
    () =>
      d3
        .scaleBand()
        .domain(dates)
        .range([margin.left, width - margin.right])
        .padding(0.1),
    [series, width, height, margin],
  );

  // yScale
  const yScaleDomain = useMemo(() => {
    // return the max value of the sum of all the keys, don't count the date
    const max = d3.max(
      series,
      (d) =>
        d3.sum(
          Object.keys(d)
            .filter((key) => !disabledItems.includes(key))
            .map((key) => (key === "date" ? 0 : d[key] || 0)),
        ) || 0,
    );

    return [0, max];
  }, [series, keys]);

  const yScale = useMemo(
    () =>
      d3
        .scaleLinear()
        .domain(yScaleDomain)
        .range([height - margin.bottom, margin.top])
        .clamp(true)
        .nice(),
    [series, width, height, margin],
  );

  const prepareStackedData = (seriesData: DataPoint[]) => {
    let stackedData = keys.reduce((acc, key) => {
      acc[key] = null;
      return acc;
    }, {});
    seriesData.forEach((yearData) => {
      let y0 = 0;
      [...keys]
        .filter((key) => !disabledItems.includes(key))
        .sort((a, b) => (yearData[a] || 0) - (yearData[b] || 0))
        .forEach((key) => {
          const y1 = y0 + (yearData[key] || 0);
          const height = yScale(y0) - yScale(y1);
          const rectData = {
            key,
            height,
            width: 30,
            y: yScale(y1),
            x: xScale(String(yearData.date)) + xScale.bandwidth() / 2 - 30 / 2,
            fill: colorsMapping[key],
            data: yearData,
            certainty: yearData.certainty,
          };
          y0 = y1;
          stackedData = {
            ...stackedData,
            [key]: stackedData[key]
              ? [stackedData[key], rectData].flat()
              : [rectData],
          };
        });
    });
    return stackedData;
  };

  const stackedRectData = useMemo(
    // remove keys from object that are disabled
    () => prepareStackedData(series),
    [series, width, height, margin, disabledItems],
  );
  const generateTooltipContent = (data: DataPoint) => {
    // Process your data and generate HTML string as per requirements
    return `
    <div style="background: #fff; padding: 5px">
      <p>${data.date}</p>
      ${Object.keys(data)
        .filter((key) => key !== "date")
        .map(
          (key) =>
            `<p style="color:${colorsMapping[key]}">${key}: ${
              data[key] ?? "N/A"
            }</p>`,
        )
        .join("")}
    </div>`;
  };

  return (
    <div style={{ position: "relative" }}>
      <div
        className={"tooltip"}
        style={{
          position: "absolute",
          background: "white",
          padding: "5px",
          border: "1px solid #333",
          pointerEvents: "none",
          zIndex: 1000,
        }}
      />

      <svg
        className={"chart"}
        ref={ref}
        width={width}
        height={height}
        style={{ overflow: "visible" }}
        onMouseOut={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setHighlightItems([]);
          d3.select(".tooltip").style("visibility", "hidden");
        }}
      >
        {children}
        <Title x={width / 2} y={MARGIN.top / 2}>
          {title}
        </Title>
        <XaxisBand xScale={xScale} height={height} margin={margin} />
        <YaxisLinear
          yScale={yScale}
          width={width}
          height={height}
          margin={margin}
          highlightZeroLine={true}
          yAxisFormat={yAxisFormat}
        />
        <g>
          {keys
            .filter((key) => !disabledItems.includes(key))
            .map((key) => {
              return (
                <g
                  key={`stack-${key}.replaceAll(" ", "-").replaceAll(",", "")`}
                  className={`stack-${key}.replaceAll(" ", "-").replaceAll(",", "")`}
                >
                  {stackedRectData[key] &&
                    stackedRectData[key].map((d: RectData, i: number) => {
                      const pointTopLeft = {
                        x: d.x + d.width,
                        y: d.y,
                        height: d.height,
                      };
                      const pointTopRight = {
                        x: stackedRectData[key][i + 1]?.x,
                        y: stackedRectData[key][i + 1]?.y,
                        height: stackedRectData[key][i + 1]?.height,
                      };
                      const topCurveControl = `Q${d.x + d.width} ${d.y}`;
                      const segmentTopCurve = `M${pointTopLeft.x} ${
                        pointTopLeft.y
                      } ${topCurveControl} ${pointTopRight.x ?? 0} ${
                        pointTopRight.y ?? 0
                      }`;

                      const rightSideLine = `V ${
                        pointTopRight.y + pointTopRight.height
                      } `;
                      const segmentBottomCurve = `Q${d.x + d.width} ${
                        d.y + d.height
                      } ${pointTopLeft.x} ${
                        pointTopLeft.y + pointTopLeft.height
                      } `;
                      const leftSideLine = `V ${pointTopLeft.y} `;
                      const pathD = `${segmentTopCurve} ${rightSideLine} ${segmentBottomCurve} ${leftSideLine} Z`;

                      return (
                        <React.Fragment key={`item-${i}`}>
                          {i < stackedRectData[key].length - 1 && (
                            <path
                              d={pathD}
                              fill={d.fill}
                              opacity={
                                highlightItems.length === 0 ||
                                highlightItems.includes(d.key)
                                  ? 0.4
                                  : 0.1
                              }
                              stroke={"#fff"}
                              strokeOpacity={0.4}
                              style={{ transition: "opacity 0.1s ease-out" }}
                              onMouseOver={() => setHighlightItems([d.key])}
                              onMouseOut={() => setHighlightItems([])}
                            />
                          )}
                          <rect
                            key={`item-${i}`}
                            x={d.x}
                            y={d.y}
                            width={d.width}
                            height={d.height}
                            fill={d.fill}
                            rx={1.5}
                            stroke={"#fff"}
                            strokeOpacity={0.5}
                            opacity={
                              highlightItems.length === 0 ||
                              highlightItems.includes(d.key)
                                ? 1
                                : 0.1
                            }
                            ref={(node) => {
                              if (node) {
                                d3.select(node)
                                  .on("mouseover", function () {
                                    setHighlightItems([d.key]);
                                    d3.select(".tooltip")
                                      .style("visibility", "visible")
                                      .html(generateTooltipContent(d.data)); // you can define this function or inline its logic
                                  })
                                  .on("mousemove", function (event) {
                                    const [x, y] = d3.pointer(event);
                                    const tooltip = d3
                                      .select(".tooltip")
                                      .node() as HTMLElement;
                                    const tooltipWidth =
                                      tooltip.getBoundingClientRect().width;
                                    const tooltipHeight =
                                      tooltip.getBoundingClientRect().height;

                                    d3.select(".tooltip")
                                      .style(
                                        "left",
                                        x - tooltipWidth / 2 + "px",
                                      )
                                      .style(
                                        "top",
                                        y - tooltipHeight - 10 + "px",
                                      );
                                  })
                                  .on("mouseout", function () {
                                    setHighlightItems([]);
                                    d3.select(".tooltip").style(
                                      "visibility",
                                      "hidden",
                                    );
                                  });
                              }
                            }}
                          />
                        </React.Fragment>
                      );
                    })}
                </g>
              );
            })}
        </g>
      </svg>
      {isLoading && isLoadingComponent && <>{isLoadingComponent}</>}
      {isLoading && !isLoadingComponent && <LoadingIndicator />}
      {!isLoading && series.length === 0 && isNodataComponent && (
        <>{isNodataComponent}</>
      )}
    </div>
  );
};

export default RibbonChart;

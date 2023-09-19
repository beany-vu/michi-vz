import React, { useEffect, useMemo, useRef } from "react";
import * as d3 from "d3";
import { DataPoint } from "src/types/data";
import { ScaleLinear } from "d3-scale";
import Title from "./shared/Title";
import VerticalAxisLinear from "./shared/VerticalAxisLinear";
import HorizontalAxisLinear from "./shared/HorizontalAxisLinear";
import { useChartContext } from "./MichiVzProvider";

const MARGIN = { top: 50, right: 50, bottom: 50, left: 50 };
const WIDTH = 900 - MARGIN.left - MARGIN.right;
const HEIGHT = 480 - MARGIN.top - MARGIN.bottom;
const DASH_LENGTH = 4;
const DASH_SEPARATOR_LENGTH = 4;

interface LineChartProps {
  dataSet: {
    label: string;
    color: string;
    series: DataPoint[];
  }[];
  width: number;
  height: number;
  margin: { top: number; right: number; bottom: number; left: number };
  title?: string;
  yAxisFormat?: (d: number) => string;
  tooltipFormatter?: (
    d: DataPoint,
    series: DataPoint[],
    dataSet: {
      label: string;
      color: string;
      series: DataPoint[];
    }[],
  ) => string;
  showCombined?: boolean;
  children?: React.ReactNode;
}

const LineChart: React.FC<LineChartProps> = ({
  dataSet,
  title,
  width = WIDTH,
  height = HEIGHT,
  margin = MARGIN,
  yAxisFormat,
  tooltipFormatter = (d: DataPoint) =>
    `<div>${d.label} - ${d.date}: ${d.value}</div>`,
  showCombined = false,
  children,
}) => {
  const { colorsMapping, highlightItems, setHighlightItems } =
    useChartContext();
  const svgRef = useRef<SVGSVGElement | null>(null);

  const yScale = useMemo(
    () =>
      d3
        .scaleLinear()
        .domain([
          d3.min(
            dataSet.flatMap(({ series }) =>
              series.filter((dd) => dd.value !== null),
            ),
            (d) => d.value,
          ) || 0,
          d3.max(
            dataSet.flatMap(({ series }) =>
              series.filter((dd) => dd.value !== null),
            ),
            (d) => d.value,
          ) || 1,
        ])
        .range([height - margin.bottom, margin.top])
        .clamp(true)
        .nice(),
    [dataSet, width, height],
  );

  const xScale = useMemo(
    () =>
      d3
        .scaleLinear()
        .domain([
          d3.min(
            dataSet.flatMap((item) => item.series.map((d) => d.date as number)),
          ) || 0,
          d3.max(
            dataSet.flatMap((item) => item.series.map((d) => d.date as number)),
          ) || 1,
        ])
        .range([MARGIN.left, width - margin.right]),
    [dataSet, width, height],
  );

  function getYValueAtX(series: DataPoint[], x: number): number | undefined {
    const dataPoint = series.find((d) => d.date === x);
    return dataPoint ? dataPoint.value : undefined;
  }

  // function getMaxYValueAtX(x: number): number {
  //   return Math.max(
  //     ...dataSet.map((data) => getYValueAtX(data.series, x) || 0),
  //   );
  // }

  function getPathLengthAtX(path: SVGPathElement, x: number) {
    const l = path.getTotalLength();
    const precision = 90;

    for (let i = 0; i <= precision; i++) {
      const pos = path.getPointAtLength((l * i) / precision);
      if (pos.x >= x) return (l * i) / precision;
    }
    return 0;
  }

  function getDashArray(
    series: DataPoint[],
    pathNode: SVGPathElement,
    xScale: ScaleLinear<number, number, never>,
  ) {
    const totalLength = pathNode.getTotalLength();
    const lengths = series.map((d) =>
      getPathLengthAtX(pathNode, xScale(d.date)),
    );

    const dashArray = [];

    for (let i = 1; i <= series.length; i++) {
      const segmentLength =
        i === series.length - 1
          ? totalLength - lengths[i - 1]
          : lengths[i] - lengths[i - 1];

      if (!series[i]?.certainty ?? true) {
        const dashes = Math.floor(
          segmentLength / (DASH_LENGTH + DASH_SEPARATOR_LENGTH),
        );
        const remainder =
          Math.ceil(
            segmentLength - dashes * (DASH_LENGTH + DASH_SEPARATOR_LENGTH),
          ) - 20;

        for (let j = 0; j < dashes; j++) {
          dashArray.push(DASH_LENGTH);
          dashArray.push(DASH_SEPARATOR_LENGTH);
        }

        if (remainder > 0) dashArray.push(remainder);
      } else {
        // if dashArray.length is odd, then the coming up last segment is dash
        // we will have to add a "0" as space before we add the segmentLength so that the new added segment is not dashed
        if (dashArray.length % 2 === 1) {
          dashArray.push(0);
          dashArray.push(segmentLength);
        } else {
          dashArray.push(segmentLength);
        }
      }
    }
    return dashArray.join(",");
  }

  useEffect(() => {
    const svg = d3.select(svgRef.current);

    svg.selectAll(".line").remove();
    svg.selectAll(".line-overlay").remove();
    svg.selectAll(".circle-data").remove();

    const line = d3
      .line<DataPoint>()
      .x((d) => xScale(d.date))
      .y((d) => yScale(d.value))
      .curve(d3.curveBumpX);

    // draw lines

    dataSet.forEach((data, i) => {
      const path = svg
        .append("path")
        .datum(data.series)
        .attr(
          "class",
          `line line-${i} data-group data-group-${i} data-group-${data.label} line-group-${data.label}`,
        )
        .attr("d", (d: DataPoint[]) => line(d)) // Explicitly specify the type and use line function
        .attr("stroke", colorsMapping[data.label] ?? data.color)
        .attr("stroke-width", 5)
        .attr("fill", "none")
        .attr("pointer-events", "stroke")
        .attr("transition", "opacity 0.3s ease-out")
        .on("mouseover", () => {
          setHighlightItems([data.label]);
        })

        .on("mouseout", () => {
          setHighlightItems([]);
          d3.select("#tooltip").style("visibility", "hidden");
        });

      if (data.series) {
        path.attr("stroke-dasharray", function () {
          return getDashArray(data.series, this, xScale);
        });
      }
    });

    // draw lines one more time to fix the side effect of line losing focused on mouseover the dash array
    dataSet.forEach((data, i) => {
      svg
        .append("path")
        .datum(data.series)
        .attr(
          "class",
          `line-overlay line-overlay-${i} data-group-overlay data-group-${i} data-group-overlay-${data.label} line-group-overlay-${data.label}`,
        )
        .attr("d", (d: DataPoint[]) => line(d)) // Explicitly specify the type and use line function
        .attr("stroke", colorsMapping[data.label] ?? data.color)
        .attr("stroke-width", 5)
        .attr("fill", "none")
        .attr("pointer-events", "stroke")
        .attr("opacity", 0.1)
        .on("mouseenter", () => {
          setHighlightItems([data.label]);
        })

        .on("mouseout", () => {
          setHighlightItems([]);
          d3.select("#tooltip").style("visibility", "hidden");
        });
    });

    // draw circles on the line to indicate data points
    dataSet.forEach((data, i) => {
      svg
        .selectAll(`.circle-data-${i}`)
        .data(data.series)
        .enter()
        .append("circle")
        .attr(
          "class",
          `circle-data circle-data-${i} data-group data-group-${i} data-group-${data.label}`,
        )
        .attr("fill", colorsMapping[data.label] ?? data.color ?? "transparent")
        .attr("data-label", data.label)
        .attr("r", 5)
        .attr("pointer-events", "all")
        .attr("cx", (d: DataPoint) => xScale(d.date))
        .attr("cy", (d: DataPoint) => yScale(d.value))
        .attr("transition", "all 0.1s ease-out")

        .on("mouseover mousemove", (event, d) => {
          setHighlightItems([data.label]);
          const [x, y] = d3.pointer(event, svgRef.current);
          const tooltip = d3.select("#tooltip");
          const htmlContent = tooltipFormatter(
            { ...d, label: data.label } as DataPoint,
            data.series,
            dataSet,
          );

          // Position the tooltip near the circle
          tooltip
            .style("left", x + 10 + "px")
            .style("top", y - 25 + "px")
            .style("visibility", "visible")
            .style("background", "#fff")
            .style("padding", "5px")
            .html(htmlContent);
        })
        .on("mouseout", () => {
          const tooltip = d3.select("#tooltip");
          tooltip.style("visibility", "hidden").html();
        });
    });
  }, [JSON.stringify(dataSet), width, height, margin]);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    Object.keys(colorsMapping).forEach((key) => {
      svg
        .selectAll(`circle.data-group-${key}`)
        .attr("stroke", colorsMapping[key])
        .attr("fill", colorsMapping[key]);
      svg.selectAll(`.line-group-${key}`).attr("stroke", colorsMapping[key]);
    });
  }, [colorsMapping]);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg
      .selectAll(".data-group")
      .attr("opacity", highlightItems.length === 0 ? 1 : 0.2);
    highlightItems.forEach((item) => {
      svg.selectAll(`.data-group-${item}`).attr("opacity", 1);
    });
    if (highlightItems.length === 0) {
      d3.select("#tooltip").style("visibility", "hidden");
    }
    svg.selectAll("data-group-overlay").attr("opacity", 0.1);
  }, [highlightItems]);

  useEffect(() => {
    if (showCombined) {
      // Create a transparent overlay rectangle for capturing hover events
      const svg = d3.select(svgRef.current);
      const tooltip = document.getElementById("tooltip");
      let hoverLine: d3.Selection<SVGPathElement, unknown, null, undefined>;
      const hoverLinesGroup = svg.append("g");

      hoverLinesGroup.attr("class", "hover-lines").style("display", "none");
      svg
        .append("rect")
        .attr("class", "overlay")
        .attr("width", width)
        .attr("height", height)
        .style("fill", "none")
        .style("pointer-events", "all")
        .on("mouseover", () => {
          tooltip.style.visibility = "visible";
          hoverLinesGroup.style("display", "block");
        })
        .on("mouseout", () => {
          tooltip.style.visibility = "hidden";
          tooltip.style.opacity = "0";
          tooltip.style.pointerEvents = "none";
          tooltip.innerHTML = "";
          hoverLinesGroup.style("display", "none");
          if (hoverLine) {
            hoverLine.style("display", "none");
          }
        })
        .on("mousemove", function (event) {
          const [x, y] = d3.pointer(event.nativeEvent, svgRef.current);
          const xValue = Math.round(xScale.invert(x));

          const tooltipTitle = `<div class="tooltip-title">${xValue}</div>`;
          const tooltipContent = dataSet
            .map((data) => {
              const yValue = getYValueAtX(data.series, xValue);
              return `<div>${data.label}: ${yValue ?? "N/A"}</div>`;
            })
            .join("");
          tooltip.innerHTML = `<div style="background: #fff; padding: 5px">${tooltipTitle}${tooltipContent}</div>`;

          tooltip.style.left = x + "px";
          tooltip.style.top = y + "px";
          tooltip.style.opacity = "1";
          tooltip.style.pointerEvents = "auto";

          if (!hoverLine) {
            hoverLine = hoverLinesGroup
              .append("line")
              .attr("class", "hover-line")
              .attr("stroke", "lightgray")
              .attr("stroke-width", 1)
              .style("pointer-events", "stroke");
          }
          const xPosition = xScale(xValue);
          hoverLine
            .attr("x1", xPosition)
            .attr("x2", xPosition)
            .attr("y1", MARGIN.top)
            .attr("y2", HEIGHT - MARGIN.bottom + 20)
            .style("display", "block");

          hoverLinesGroup
            .selectAll(".hover-line")
            .filter((_, index) => index !== Math.round(xPosition));
        });
    }
  }, [showCombined]);

  return (
    <div style={{ position: "relative", width: width, height: height }}>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        onMouseOut={() => {
          setHighlightItems([]);
        }}
      >
        {children}
        <Title x={width / 2} y={margin.top / 2}>
          {title}
        </Title>
        {dataSet.length > 0 && (
          <>
            <HorizontalAxisLinear
              xScale={xScale}
              height={height}
              margin={margin}
            />
            <VerticalAxisLinear
              yScale={yScale}
              width={width}
              height={height}
              margin={margin}
              highlightZeroLine={true}
              format={yAxisFormat}
            />
          </>
        )}
      </svg>
      <div
        id="tooltip"
        style={{
          position: "absolute",
          transition: "visibility 0.1s ease-out,opacity 0.1s ease-out",
        }}
      />
    </div>
  );
};

export default LineChart;

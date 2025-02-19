import React, {
  FC,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  Suspense,
} from "react";
import { ScaleTime, ScaleLinear } from "d3-scale";
import * as d3 from "d3";
import range from "lodash/range";

// Function to get dates with equal distance
function getDatesWithEqualDistance(
  startDate: string | number | Date,
  endDate: string | number | Date,
  numDates: number,
) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diff = end.getTime() - start.getTime();
  const interval = diff / (numDates - 1);
  return range(0, numDates).map(
    (i) => new Date(start.getTime() + i * interval),
  );
}

interface Props {
  xScale: ScaleTime<number, number> | ScaleLinear<number, number>;
  height: number;
  margin: { top: number; right: number; bottom: number; left: number };
  xAxisFormat?: (d: number | { valueOf(): number } | string) => string;
  xAxisDataType?: "number" | "date_annual" | "date_monthly";
  ticks?: number;
  showGrid?: boolean;
  position?: "top" | "bottom";
  tickSize?: number;
  isLoading?: boolean;
}

const checkIsTimeScale = (
  scale: ScaleTime<number, number> | ScaleLinear<number, number>,
  xAxisDataType?: "number" | "date_annual" | "date_monthly",
): scale is ScaleTime<number, number> => {
  if (xAxisDataType === "date_annual" || xAxisDataType === "date_monthly") {
    return true;
  }

  if ("ticks" in scale && "domain" in scale && "range" in scale) {
    const timeScale = scale as ScaleTime<number, number>;
    return (
      timeScale.ticks !== undefined &&
      timeScale.domain instanceof Array &&
      timeScale.range instanceof Array &&
      ((typeof timeScale.domain[0] === "number" &&
        typeof timeScale.range[0] === "number") ||
        (timeScale.domain[0] instanceof Date &&
          timeScale.range[0] instanceof Date))
    );
  }
  return false;
};

const XaxisLinear: FC<Props> = ({
  xScale = d3.scaleLinear().domain([0, 100]),
  height,
  margin = { top: 0, right: 0, bottom: 0, left: 0 }, // Add default margin values
  xAxisFormat,
  xAxisDataType = "number",
  ticks = 5,
  showGrid = false,
  position = "bottom",
  tickSize = 6, // Add default tick size
  isLoading = false,
}) => {
  const ref = useRef<SVGGElement>(null);

  const isTimeScale = useMemo(
    () => checkIsTimeScale(xScale, xAxisDataType),
    [xScale, xAxisDataType],
  );

  const minTick = useMemo(() => {
    return xAxisDataType === "date_annual"
      ? d3.timeYear.floor(xScale.domain()[0] as Date)
      : xAxisDataType === "date_monthly"
        ? d3.timeMonth.floor(xScale.domain()[0] as Date)
        : xScale.domain()[0];
  }, [xScale, xAxisDataType]);

  const maxTick = useMemo(() => {
    return xAxisDataType === "date_annual"
      ? d3.timeYear.ceil(xScale.domain()[1] as Date)
      : xAxisDataType === "date_monthly"
        ? d3.timeMonth.ceil(xScale.domain()[1] as Date)
        : xScale.domain()[1];
  }, [xScale, xAxisDataType]);

  const counts = useMemo(() => {
    return d3.timeMonth.range(minTick as Date, maxTick as Date, 1).length;
  }, [minTick, maxTick]);

  const tickValues = useMemo(() => {
    let values: number[];
    switch (xAxisDataType) {
      case "date_annual":
        values = d3.timeYear
          .range(minTick as Date, maxTick as Date, 1)
          .map((d) => d.valueOf());
        break;
      case "date_monthly":
        values = d3.timeMonth
          .range(minTick as Date, maxTick as Date, null)
          .map((d) => d.valueOf());
        break;
      default:
        values = d3.ticks(minTick as number, maxTick as number, 1);
        break;
    }

    // Include zero as a tick if minTick is zero
    if (minTick === 0) {
      values = [0, ...(values as number[]), maxTick as number];
    }

    return values;
  }, [xAxisDataType, minTick, maxTick]);

  const drawAxis = useCallback(() => {
    const defaultFormatter = (d: number | Date) => {
      if (isTimeScale) {
        const dateObj = new Date(d);
        const month = dateObj.toLocaleString("en-US", { month: "2-digit" });
        const year = dateObj.getFullYear();
        return xAxisDataType === "date_annual" ? `${year}` : `${month}-${year}`;
      } else {
        return String(d);
      }
    };

    const g = d3.select(ref.current);

    let axisBottom: d3.Axis<d3.NumberValue>;

    switch (xAxisDataType) {
      case "date_annual":
      case "date_monthly":
        axisBottom = d3
          .axisBottom(xScale)
          .tickValues(tickValues)
          .tickFormat((domainValue: number | Date) =>
            xAxisFormat
              ? xAxisFormat(domainValue)
              : defaultFormatter(domainValue),
          );
        break;
      default:
        axisBottom = d3
          .axisBottom(xScale)
          .ticks(ticks)
          .tickFormat((domainValue: number | Date) =>
            xAxisFormat
              ? xAxisFormat(domainValue)
              : defaultFormatter(domainValue),
          );
        break;
    }

    g.attr("class", "x-axis x-axis-linear")
      .attr(
        "style",
        position === "top"
          ? `transform:translate(${margin?.left ?? 0}px, ${margin.top - 15}px)`
          : `transform:translate(0,${height - margin.bottom + 15}px)`,
      )
      .call(
        d3
          .axisBottom(xScale)
          .tickSize(tickSize) // Use the new tickSize prop
          .tickValues(tickValues)
          .tickFormat((domainValue: number | Date) =>
            xAxisFormat
              ? xAxisFormat(domainValue)
              : defaultFormatter(domainValue),
          ),
      )
      .call(axisBottom)
      .call((g) => g.select(".domain").attr("stroke-opacity", 1))
      .call((g) => g.select(".domain").remove())
      .call((g) => g.selectAll("line").remove())
      .call((g) => g.selectAll(".tick-line").remove())
      .call((g) => g.selectAll(".tickValueDot").remove());

    // Add vertical dashed lines for each tick
    g.selectAll(".tick")
      .append("line")
      .attr("class", "tick-line")
      .attr("x1", 0)
      .attr(
        "y1",
        position === "top" ? height - margin.bottom - margin.top : -15,
      ) // Adjust as needed
      .attr("x2", 0)
      .attr(
        "y2",
        position === "top"
          ? margin.top - 15
          : -height + margin.bottom + margin.top - 15,
      ) // Adjust as needed
      .style("stroke-dasharray", "3,3") // Set dash pattern
      .style("stroke", showGrid ? "lightgray" : "transparent"); // Color of the dashed line

    g.selectAll(".tick")
      .append("circle")
      .attr("class", "tickValueDot")
      .attr("cx", 0)
      .attr("cy", 0)
      .attr("r", 2)
      .attr("fill", "lightgray");
  }, [
    xScale,
    height,
    margin,
    isTimeScale,
    xAxisFormat,
    xAxisDataType,
    showGrid,
    position,
    tickValues,
    counts,
    tickSize,
  ]);

  useEffect(() => {
    if (isLoading) {
      return;
    }
    drawAxis();
  }, [drawAxis, isLoading]);

  return (
    <Suspense fallback={null}>
      <g className={"x-axis-linear"} ref={ref} />
    </Suspense>
  );
};

export default React.memo(XaxisLinear);

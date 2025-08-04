import React, { FC, useRef, useCallback, useEffect, useMemo } from "react";
import * as d3 from "d3";
import { DataPoint } from "src/types/data";

interface DataItem {
  label: string;
  color: string;
  shape?: "circle" | "square" | "triangle";
  curve?: "curveBumpX" | "curveLinear";
  series: DataPoint[];
}

interface Margin {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

interface LineChartMouseLineProps {
  xScale: d3.ScaleLinear<number, number> | d3.ScaleTime<number, number>;
  yScale: d3.ScaleLinear<number, number>;
  height: number;
  dataSet: DataItem[];
  margin: Margin;
  children?: React.ReactNode;
  className?: string;
  anchorEl: React.RefObject<SVGGElement>;
  xAxisDataType: "number" | "date_annual" | "date_monthly";
  ticks: number;
  tickValues: (string | number | Date)[];
}

const LineChartMouseLine: FC<LineChartMouseLineProps> = ({
  xScale,
  yScale,
  height = 0,
  dataSet = [],
  margin = { top: 0, right: 0, bottom: 0, left: 0 },
  children,
  anchorEl,
  xAxisDataType,
  ticks,
  tickValues,
  ...props
}) => {
  const data = useMemo(() => {
    if (!dataSet || !Array.isArray(dataSet) || !dataSet.length) {
      return [];
    }
    return dataSet.filter(
      d => d && d.series && Array.isArray(d.series) && d.series.length === tickValues.length
    );
  }, [dataSet]);
  const ref = useRef<SVGGElement>(null);
  const drawLine = useCallback(
    (x: number) => {
      d3.select(ref.current)
        .select(".mouseLine")
        .attr("x1", x)
        .attr("x2", x)
        .attr("y1", margin.top)
        .attr("y2", height);

      d3.selectAll(".mouseLineContainer")
        .select(".mouseLine")
        .attr("x1", x)
        .attr("x2", x)
        .attr("y1", margin.top)
        .attr("y2", height);
    },
    [height, margin.top]
  );

  const followPoints = useCallback(
    (e: MouseEvent) => {
      const [x] = [e.layerX];
      const xDate = xScale.invert(x) as number | Date;
      const bisectDate = d3.bisector((d: DataPoint) => d.date).left;
      const getNumericalValueFromData = (data: string | number | Date) => {
        if (typeof data === "number") {
          return data;
        }

        if (data instanceof Date) {
          return data.getTime();
        }

        if (xAxisDataType === "date_annual") {
          return new Date(`${data}-01-01T00:00:00Z`).getTime();
        } else if (xAxisDataType === "date_monthly") {
          return new Date(`${data}-01T00:00:00Z`).getTime();
        }

        return Number(data);
      };
      const getStringValueFromData = (data: string | number | Date) => {
        if (typeof data === "string") {
          return data;
        }

        if (typeof data === "number") {
          return String(data);
        }

        if (data instanceof Date) {
          if (xAxisDataType === "date_annual") {
            return data.getFullYear().toString();
          }

          if (xAxisDataType === "date_monthly") {
            return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}`;
          }
        }

        return data;
      };

      let baseXPos = 0;

      d3.selectAll(".mouseLineContainer")
        .selectAll(".mouseLinePoint")
        .attr("transform", (cur, i) => {
          const dataItems = data[i]?.series;
          if (!dataItems || !dataItems.length) return "translate(-100,-100)";

          const index = bisectDate(dataItems, getStringValueFromData(xDate));
          const d0 = dataItems[index];
          const d1 = dataItems[index + 1];
          let d;

          if (d0 == null && d1 != null) {
            d = d1;
          } else if (d1 == null && d0 != null) {
            d = d0;
          } else if (d0 != null && d1 != null) {
            const epochOfXDate = xDate instanceof Date ? xDate.getTime() : xDate;
            const d0Epoch = getNumericalValueFromData(d0.date);
            const d1Epoch = getNumericalValueFromData(d1.date);

            d = Math.abs(epochOfXDate - d0Epoch) < Math.abs(epochOfXDate - d1Epoch) ? d0 : d1;
          }

          if (!d || (d.date === undefined && d.value === undefined)) {
            // move point out of container
            return "translate(-100,-100)";
          }

          const xPos = xScale(new Date(getNumericalValueFromData(d.date)));
          if (i === 0) {
            baseXPos = xPos;
          }

          let isVisible = true;
          if (xPos !== baseXPos) {
            isVisible = false;
          }
          const yPos = yScale(d.value);

          return isVisible ? `translate(${xPos}, ${yPos})` : "translate(-100,-100)";
        });

      drawLine(baseXPos);
    },
    [drawLine, xScale, yScale, data]
  );

  useEffect(() => {
    if (!anchorEl.current) return;

    d3.select(anchorEl.current)
      .on("mouseout.mouseLineContainer", () => {
        d3.select(ref.current).attr("opacity", 0);
        d3.selectAll(".mouseLineContainer").attr("opacity", 0);
      })
      .on("mouseover.mouseLineContainer", () => {
        d3.select(ref.current).attr("opacity", 1);
        d3.selectAll(".mouseLineContainer").attr("opacity", 1);
      })
      .on("mousemove.mouseLineContainer", (e: MouseEvent) => {
        d3.select(ref.current).selectAll(".mouseLinePoint").attr("opacity", 1);
        d3.selectAll(".mouseLineContainer").selectAll(".mouseLinePoint").attr("opacity", 1);
        followPoints(e);
      });
  }, [anchorEl.current, followPoints]);

  if (!data.length) return null;

  return (
    <g ref={ref} opacity={1} {...props}>
      <line className="mouseLine" />
      {data.map(({ label }) => (
        <circle className="mouseLinePoint" r={1} key={label} opacity={0} />
      ))}
      {children}
    </g>
  );
};

export default LineChartMouseLine;

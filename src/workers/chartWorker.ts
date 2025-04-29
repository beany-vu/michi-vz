import * as d3 from "d3";
import { DataPoint } from "../types/data";

// Types for worker messages
interface WorkerInput {
  type: "calculate";
  data: {
    dataSet: {
      label: string;
      color: string;
      shape?: "circle" | "square" | "triangle";
      curve?: "curveBumpX" | "curveLinear";
      series: DataPoint[];
    }[];
    width: number;
    height: number;
    margin: { top: number; right: number; bottom: number; left: number };
    xAxisDataType: "number" | "date_annual" | "date_monthly";
    filter?: {
      limit: number;
      date: number | string;
      criteria: string;
      sortingDir: "asc" | "desc";
    };
    disabledItems: string[];
  };
}

interface WorkerOutput {
  type: "result";
  data: {
    filteredDataSet: any[];
    visibleDataSets: any[];
    xScale: any;
    yScale: any;
    lineData: any[];
    chartMetadata: {
      xAxisDomain: string[];
      yAxisDomain: [number, number];
      visibleItems: string[];
      renderedData: { [key: string]: DataPoint[] };
    };
  };
}

// Constants
const DASH_LENGTH = 4;
const DASH_SEPARATOR_LENGTH = 4;

// Helper function to get path length at x position
const getPathLengthAtX = (path: SVGPathElement, x: number) => {
  const l = path.getTotalLength();
  const precision = 90;
  if (!path || path.getTotalLength() === 0) {
    return 0;
  }
  for (let i = 0; i <= precision; i++) {
    const pos = path.getPointAtLength((l * i) / precision);
    if (pos.x >= x) return (l * i) / precision;
  }
};

// Main worker message handler
self.onmessage = (e: MessageEvent<WorkerInput>) => {
  if (e.data.type === "calculate") {
    const { dataSet, width, height, margin, xAxisDataType, filter, disabledItems } = e.data.data;

    // Filter dataset
    const filteredDataSet = filter
      ? dataSet
          .filter(d => !disabledItems.includes(d.label))
          .filter(item => {
            const targetPoint = item.series.find(d => d.date.toString() === filter.date.toString());
            return targetPoint !== undefined;
          })
          .sort((a, b) => {
            const aPoint = a.series.find(d => d.date.toString() === filter.date.toString());
            const bPoint = b.series.find(d => d.date.toString() === filter.date.toString());
            const aVal = aPoint ? Number(aPoint[filter.criteria]) : 0;
            const bVal = bPoint ? Number(bPoint[filter.criteria]) : 0;
            return filter.sortingDir === "desc" ? bVal - aVal : aVal - bVal;
          })
          .slice(0, filter.limit)
      : dataSet.filter(d => !disabledItems.includes(d.label));

    // Calculate scales
    const yScale = d3
      .scaleLinear()
      .domain([
        d3.min(
          filteredDataSet.flatMap(({ series }) => series.filter(dd => dd.value !== null)),
          d => d.value
        ) || 0,
        d3.max(
          filteredDataSet.flatMap(({ series }) => series.filter(dd => dd.value !== null)),
          d => d.value
        ) || 1,
      ])
      .range([height - margin.bottom, margin.top])
      .clamp(true)
      .nice();

    const xScale =
      xAxisDataType === "number"
        ? d3
            .scaleLinear()
            .domain([
              d3.min(filteredDataSet.flatMap(item => item.series.map(d => d.date as number))) || 0,
              d3.max(filteredDataSet.flatMap(item => item.series.map(d => d.date as number))) || 1,
            ])
            .range([margin.left, width - margin.right])
            .clamp(true)
            .nice()
        : d3
            .scaleTime()
            .domain([
              d3.min(filteredDataSet.flatMap(item => item.series.map(d => new Date(d.date)))) || 0,
              d3.max(filteredDataSet.flatMap(item => item.series.map(d => new Date(d.date)))) || 1,
            ])
            .range([margin.left, width - margin.right]);

    // Calculate line data
    const lineData = dataSet.map(set => ({
      label: set.label,
      color: set.color,
      points: set.series,
    }));

    // Calculate visible datasets
    const visibleDataSets = filteredDataSet.filter(d => d.series.length > 1);

    // Calculate chart metadata
    const allDates = dataSet.flatMap(set =>
      set.series.map(point => (xAxisDataType === "number" ? point.date : String(point.date)))
    );
    const uniqueDates = [...new Set(allDates)];

    let visibleSeries = dataSet.map(d => d.label);
    if (filter?.date) {
      visibleSeries = visibleSeries.sort((a, b) => {
        const aData = dataSet.find(d => d.label === a);
        const bData = dataSet.find(d => d.label === b);
        const aValue = aData?.series.find(d => String(d.date) === String(filter.date))?.value || 0;
        const bValue = bData?.series.find(d => String(d.date) === String(filter.date))?.value || 0;
        return filter.sortingDir === "desc" ? bValue - aValue : aValue - bValue;
      });

      if (filter.limit) {
        visibleSeries = visibleSeries.slice(0, filter.limit);
      }
    }

    const chartMetadata = {
      xAxisDomain: uniqueDates.map(String),
      yAxisDomain: yScale.domain() as [number, number],
      visibleItems: visibleSeries.filter(
        label =>
          !disabledItems.includes(label) && dataSet.find(d => d.label === label)?.series.length > 0
      ),
      renderedData: lineData.reduce(
        (acc, item) => {
          if (item.points.length > 0 && visibleSeries.includes(item.label)) {
            acc[item.label] = item.points;
          }
          return acc;
        },
        {} as { [key: string]: DataPoint[] }
      ),
    };

    // Send results back to main thread
    const output: WorkerOutput = {
      type: "result",
      data: {
        filteredDataSet,
        visibleDataSets,
        xScale,
        yScale,
        lineData,
        chartMetadata,
      },
    };

    self.postMessage(output);
  }
};

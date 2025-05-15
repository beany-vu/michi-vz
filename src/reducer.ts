// This is the common reducer for the charts
// Components will interact with it by useReducer hook
// This state will be shared among the document with CustomEvent

type LineChart = "line-chart";
type HorizontalBarChart = "horizontal-bar-chart";
type VerticalBarChart = "vertical-stack-bar-chart";
type ScatterPlotChart = "scatter-plot-chart";
type AreaChart = "area-chart";
type RadarChart = "radar-chart";
type BarbellChart = "barbell-chart";
type RangeChart = "range-chart";

const ActionSetChartType = "SET_CHART_TYPE";
const ActionSetHighlightedItems = "SET_HIGHLIGHTED_ITEMS";
const ActionSetVisibleItems = "SET_VISIBLE_ITEMS";
const ActionSetDisabledItems = "SET_DISABLED_ITEMS";
const ActionSetXAxisDomain = "SET_X_AXIS_DOMAIN";
const ActionSetYAxisDomain = "SET_Y_AXIS_DOMAIN";
const ActionSetColorsMapping = "SET_COLORS_MAPPING";
const ActionSetDateRange = "SET_DATE_RANGE";

type State = {
  chartType:
    | LineChart
    | HorizontalBarChart
    | VerticalBarChart
    | ScatterPlotChart
    | AreaChart
    | RadarChart
    | BarbellChart
    | RangeChart
    | null;
  highlightedItems: string[];
  visibleItems: string[];
  disabledItems: string[];
  xAxisDomain: any;
  yAxisDomain: any;
  colorsMapping: { [key: string]: string };
  dateRange: [number, number];
};

export const reducer = (state: State, action) => {
  switch (action.type) {
    case ActionSetChartType:
      return { ...state, chartType: action.payload };
    case ActionSetHighlightedItems:
      return { ...state, highlightedItems: action.payload };
    case ActionSetVisibleItems:
      return { ...state, visibleItems: action.payload };
    case ActionSetDisabledItems:
      return { ...state, disabledItems: action.payload };
    case ActionSetXAxisDomain:
      return { ...state, xAxisDomain: action.payload };
    case ActionSetYAxisDomain:
      return { ...state, yAxisDomain: action.payload };
    case ActionSetColorsMapping:
      return { ...state, colorsMapping: action.payload };
    case ActionSetDateRange:
      return { ...state, dateRange: action.payload };
    default:
      throw new Error(`Unknown action type: ${action.type}`);
  }
};

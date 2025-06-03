import { XaxisDataType } from "./data";

export const CONST_DATE_ANNUAL: XaxisDataType = "date_annual";
export const CONST_DATE_MONTHLY: XaxisDataType = "date_monthly";
export const CONST_NUMBER: XaxisDataType = "number";

// Chart dimension constants
export const DEFAULT_CHART_DIMENSIONS = {
  WIDTH: 900,
  HEIGHT: 480,
  MARGIN: { top: 50, right: 50, bottom: 50, left: 50 },
};

export const GAP_CHART_DIMENSIONS = {
  WIDTH: 1000,
  HEIGHT: 500,
  MARGIN: { top: 50, right: 150, bottom: 100, left: 150 },
};

// Common chart values
export const DEFAULT_TICKS = 5;

// Opacity values
export const OPACITY_VALUES = {
  FULL: 1,
  HIGH: 0.9,
  MEDIUM: 0.7,
  LOW: 0.3,
  VERY_LOW: 0.1,
  HIDDEN: 0,
};

// Transition
export const DEFAULT_TRANSITION = "0.1s ease-out";

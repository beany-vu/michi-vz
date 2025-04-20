export type DataPoint = {
  date: number;
  value: number;
  label?: string;
  certainty: boolean;
  code?: string;
};

export type DataPointRangeChart = {
  date: number;
  valueMedium?: number;
  label?: string;
  certainty: boolean;
  valueMax: number;
  valueMin: number;
  code?: string;
};

export interface Margin {
  bottom?: number;
  left?: number;
  right?: number;
  [key: string]: number | undefined;
}

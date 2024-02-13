export type DataPoint = {
  date: number;
  value: number;
  label?: string;
  certainty: boolean;
};

export type DataPointRangeChart = {
  date: number;
  valueMedium?: number;
  label?: string;
  certainty: boolean;
  valueMax: number;
  valueMin: number;
};

export interface Margin {
  bottom?: number;
  left?: number;
  right?: number;
  [key: string]: number | undefined; // This allows for other properties too, if needed
}

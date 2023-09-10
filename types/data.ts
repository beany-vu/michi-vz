export type DataPoint = {
    year: number;
    value: number;
    certainty: boolean;
};

export interface Margin {
    bottom?: number;
    left?: number;
    right?: number;
    [key: string]: number | undefined;  // This allows for other properties too, if needed
}
export type DataPoint = {
    date: number;
    value: number;
    label?: string;
    certainty: boolean;
};

export interface Margin {
    bottom?: number;
    left?: number;
    right?: number;
    [key: string]: number | undefined;  // This allows for other properties too, if needed
}
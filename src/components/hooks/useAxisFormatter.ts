import { XaxisDataType } from "src/types/data";

/*
  xAxisDataType: "number" | "date_annual" | "date_monthly";
 */
export default (
  xAxisDataType: XaxisDataType
): ((value: string | number | { valueOf(): number }) => string) => {
  switch (xAxisDataType) {
    case "date_annual":
      return (value: string | number | { valueOf(): number }) => `${new Date(typeof value === "object" ? value.valueOf() : value).getFullYear()}`;
    case "date_monthly":
      return (value: string | number | { valueOf(): number }) =>
        `${new Date(typeof value === "object" ? value.valueOf() : value).toLocaleString("default", { month: "2-digit" })}`;
    default:
      return (value: string | number | { valueOf(): number }) => `${typeof value === "object" ? value.valueOf() : value}`;
  }
};

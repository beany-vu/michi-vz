/*
  xAxisDataType: "number" | "date_annual" | "date_monthly";
 */
export default (
  xAxisDataType: "number" | "date_annual" | "date_monthly",
): ((value: string | number | { valueOf(): number }) => string) => {
  console.log({ xAxisDataType });
  switch (xAxisDataType) {
    case "date_annual":
      return (value: string | number) => `${new Date(value).getFullYear()}`;
    case "date_monthly":
      return (value: string | number) =>
        `${new Date(value).toLocaleString("default", { month: "2-digit" })}`;
    default:
      return (value: string | number) => `${value}`;
  }
};

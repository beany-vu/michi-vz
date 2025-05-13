"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
  xAxisDataType: "number" | "date_annual" | "date_monthly";
 */
exports.default = (xAxisDataType) => {
    switch (xAxisDataType) {
        case "date_annual":
            return (value) => `${new Date(value).getFullYear()}`;
        case "date_monthly":
            return (value) => `${new Date(value).toLocaleString("default", { month: "2-digit" })}`;
        default:
            return (value) => `${value}`;
    }
};

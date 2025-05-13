"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useDisplayIsNodata = useDisplayIsNodata;
const react_1 = require("react");
function useDisplayIsNodata({ dataSet, isLoading, isNodataComponent, isNodata, }) {
    const displayIsNodata = (0, react_1.useMemo)(() => {
        // If loading or no nodata component, always return false
        if (isLoading || !isNodataComponent) {
            return false;
        }
        // Check custom nodata function
        if (typeof isNodata === "function") {
            return isNodata(dataSet);
        }
        // Check boolean override
        if (typeof isNodata === "boolean") {
            return isNodata;
        }
        // Check if array is empty
        if (Array.isArray(dataSet)) {
            return dataSet.length === 0;
        }
        // Default case
        return false;
    }, [isLoading, isNodataComponent, dataSet, isNodata]);
    return displayIsNodata;
}

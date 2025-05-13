"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useChartContext = exports.MichiVzProvider = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
// 2. Provide default values for the context
const defaultChartContext = {
    disabledItems: [],
    highlightItems: [],
    colorsMapping: {},
    colorsBasedMapping: {},
    categoryMetadata: {},
    hiddenItems: [],
    visibleItems: [],
    availableItems: [],
};
const MichiVzContext = (0, react_1.createContext)(defaultChartContext);
const MichiVzProvider = ({ children, disabledItems = [], highlightItems = [], colorsMapping = {}, colorsBasedMapping = {}, categoryMetadata = {}, hiddenItems = [], visibleItems = [], availableItems = visibleItems, }) => {
    const contextValue = {
        disabledItems,
        highlightItems,
        colorsMapping,
        colorsBasedMapping,
        categoryMetadata,
        hiddenItems,
        visibleItems,
        availableItems,
    };
    return ((0, jsx_runtime_1.jsx)(MichiVzContext.Provider, { value: contextValue, children: children }));
};
exports.MichiVzProvider = MichiVzProvider;
// 4. Create a custom hook for easier access
const useChartContext = () => {
    return (0, react_1.useContext)(MichiVzContext);
};
exports.useChartContext = useChartContext;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const Title = ({ x, y, children }) => {
    return children ? ((0, jsx_runtime_1.jsx)("text", { className: "title", x: x, y: y, textAnchor: "middle", children: children })) : null;
};
exports.default = Title;

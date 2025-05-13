"use strict";
// Desc: Helper functions
Object.defineProperty(exports, "__esModule", { value: true });
exports.drawHalfLeftCircle = void 0;
// Draw an arc of half left circle with a given x, y, radius x, radius y, and color
// @param {number} x
// @param {number} y
// @param {number} radiusX
// @param {number} radiusY
// @return string - SVG path
const drawHalfLeftCircle = (x, y, radiusX, radiusY) => {
    return `M ${x},${y} A ${radiusX},${radiusY} 0 0 1, ${x} ${y - radiusX - radiusY}`;
};
exports.drawHalfLeftCircle = drawHalfLeftCircle;

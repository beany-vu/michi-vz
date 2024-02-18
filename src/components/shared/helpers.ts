// Desc: Helper functions

// Draw an arc of half left circle with a given x, y, radius x, radius y, and color
// @param {number} x
// @param {number} y
// @param {number} radiusX
// @param {number} radiusY
// @return string - SVG path
export const drawHalfLeftCircle = (
  x: number,
  y: number,
  radiusX: number,
  radiusY: number,
) => {
  return `M ${x},${y} A ${radiusX},${radiusY} 0 0 1, ${x} ${y - radiusX - radiusY}`;
};

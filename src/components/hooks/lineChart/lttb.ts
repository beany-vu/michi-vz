import { DataPoint } from "../../../types/data";

// LTTB (Largest-Triangle-Three-Buckets) downsampling.
//
// Reduces a series to roughly `threshold` points while preserving the shape a
// human reads off a line chart: peaks, troughs and inflection points survive,
// only redundant near-collinear points in between are dropped. This makes the
// LineChart Canvas renderer cheap for very large series without a visible
// difference from drawing every point.
//
// The function is pure and framework-free. It never constructs new points: the
// result is always a subset of the original `DataPoint` objects, so `certainty`,
// `label` and `code` are carried through untouched and identity is preserved.
//
// `getX` / `getY` project a point onto the plane the triangle areas are measured
// in. Callers pass a pixel-space x-projector (so bucket sizing and triangle
// areas match what is actually drawn) and `d => d.value` for y.
export function lttb(
  points: DataPoint[],
  threshold: number,
  getX: (d: DataPoint) => number,
  getY: (d: DataPoint) => number
): DataPoint[] {
  // Nothing to gain: the series already fits, or the threshold is too small to
  // form even one middle bucket. Return the input untouched (same reference) so
  // small series incur zero overhead and zero visual change.
  if (threshold < 3 || points.length <= threshold) {
    return points;
  }

  const sampled: DataPoint[] = [];
  // Number of points to choose between the fixed first and last point.
  const bucketSize = (points.length - 2) / (threshold - 2);

  // The first point is always kept.
  sampled.push(points[0]);
  let prevSelectedIndex = 0;

  for (let i = 0; i < threshold - 2; i++) {
    // Average point of the *next* bucket — the third triangle vertex.
    // The last bucket's "next" is the final point itself.
    let avgX = 0;
    let avgY = 0;
    let avgRangeStart = Math.floor((i + 1) * bucketSize) + 1;
    let avgRangeEnd = Math.floor((i + 2) * bucketSize) + 1;
    avgRangeEnd = avgRangeEnd < points.length ? avgRangeEnd : points.length;

    const avgRangeLength = avgRangeEnd - avgRangeStart;
    for (; avgRangeStart < avgRangeEnd; avgRangeStart++) {
      avgX += getX(points[avgRangeStart]);
      avgY += getY(points[avgRangeStart]);
    }
    avgX /= avgRangeLength;
    avgY /= avgRangeLength;

    // Current bucket: the candidate points for this slot.
    let rangeOffset = Math.floor(i * bucketSize) + 1;
    const rangeTo = Math.floor((i + 1) * bucketSize) + 1;

    // Anchor: the previously selected point.
    const pointAX = getX(points[prevSelectedIndex]);
    const pointAY = getY(points[prevSelectedIndex]);

    let maxArea = -1;
    let maxAreaIndex = rangeOffset;
    for (; rangeOffset < rangeTo; rangeOffset++) {
      // Twice the triangle area (anchor, candidate, next-bucket-average).
      // The constant 0.5 factor is irrelevant for an argmax, so it is dropped.
      const area = Math.abs(
        (pointAX - avgX) * (getY(points[rangeOffset]) - pointAY) -
          (pointAX - getX(points[rangeOffset])) * (avgY - pointAY)
      );
      if (area > maxArea) {
        maxArea = area;
        maxAreaIndex = rangeOffset;
      }
    }

    sampled.push(points[maxAreaIndex]);
    prevSelectedIndex = maxAreaIndex;
  }

  // The last point is always kept.
  sampled.push(points[points.length - 1]);

  return sampled;
}

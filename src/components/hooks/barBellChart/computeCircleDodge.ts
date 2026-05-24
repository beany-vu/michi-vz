// When several end-cap "bell" circles in a BarBellChart row land within a
// circle-diameter of each other — typically because their key values are 0 or
// near-0, so the cumulative bar segment has no width — they stack on top of one
// another and only the topmost is visible. This spreads such a cluster
// vertically into a column centred on the row's centre line, so every circle
// stays visible: side by side vertically, centred on the line.
//
// `cxs` are the circle centre x-positions in draw order. They are cumulative
// (monotonically non-decreasing), so a cluster is simply a run of consecutive
// circles each within a diameter of the previous one. Returns a vertical offset
// (px, delta from the row centre line) for each circle — 0 for circles that do
// not overlap a neighbour. Shared by the SVG renderer and the canvas renderer
// so both dodge identically.
export const computeCircleDodgeOffsets = (cxs: number[], radius: number): number[] => {
  const n = cxs.length;
  const offsets = new Array<number>(n).fill(0);
  if (n < 2) return offsets;
  const diameter = radius * 2;

  // Spread one cluster [start, end) symmetrically around the centre line:
  // size 2 -> [-d/2, +d/2]; size 3 -> [-d, 0, +d]; etc.
  const spread = (start: number, end: number): void => {
    const size = end - start;
    if (size < 2) return;
    for (let i = start; i < end; i++) {
      offsets[i] = (i - start - (size - 1) / 2) * diameter;
    }
  };

  let clusterStart = 0;
  for (let i = 1; i < n; i++) {
    // A gap of a full diameter or more ends the current cluster.
    if (cxs[i] - cxs[i - 1] >= diameter) {
      spread(clusterStart, i);
      clusterStart = i;
    }
  }
  spread(clusterStart, n);
  return offsets;
};

export default computeCircleDodgeOffsets;

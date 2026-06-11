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
//
// `boxHeight` (optional) is the row's vertical "box" — its y-band height. When
// given, a cluster's spread is bounded to that box: the circles stay inside it
// (50% above / 50% below the bar line) instead of spilling into neighbouring
// rows. The natural one-diameter spacing is kept whenever it fits; only when a
// cluster is too tall for the box is the spacing compressed to make it fit.
// Omitting `boxHeight` preserves the original unbounded, fixed-diameter spread.
export const computeCircleDodgeOffsets = (
  cxs: number[],
  radius: number,
  boxHeight?: number
): number[] => {
  const n = cxs.length;
  const offsets = new Array<number>(n).fill(0);
  if (n < 2) return offsets;
  const diameter = radius * 2;

  // Spread one cluster [start, end) symmetrically around the centre line:
  // size 2 -> [-d/2, +d/2]; size 3 -> [-d, 0, +d]; etc.
  const spread = (start: number, end: number): void => {
    const size = end - start;
    if (size < 2) return;
    // Default step keeps neighbouring circles exactly touching (one diameter
    // centre-to-centre). When a box height is given, the circle centres must
    // fit within +/- (boxHeight/2 - radius) so the circles themselves stay
    // inside the box; that caps the usable centre span at `boxHeight - diameter`
    // shared across the (size - 1) gaps. Compress the step to the smaller of the
    // two (never expand beyond the natural diameter).
    let step = diameter;
    if (boxHeight !== undefined) {
      const fitStep = Math.max(0, (boxHeight - diameter) / (size - 1));
      step = Math.min(diameter, fitStep);
    }
    for (let i = start; i < end; i++) {
      offsets[i] = (i - start - (size - 1) / 2) * step;
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

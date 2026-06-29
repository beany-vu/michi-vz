import { pickHit } from "../hooks/radarChart/useRadarChartCanvasRendering";

// pickHit is the pure core of the radar canvas hit-test: pole-point -> outline
// edge -> polygon interior, sweeping ACTIVE (non-dimmed) series before dimmed
// ones so an active polygon overlapping a dimmed (e.g. other-year) one still wins
// the hit. Canvas itself can't run in jsdom, but this geometry is pure.

const active = {
  label: "active-2022",
  dimmed: false,
  data: [],
  points: [
    { x: 100, y: 100, date: "01", value: 9 },
    { x: 200, y: 100, date: "02", value: 9 },
    { x: 150, y: 180, date: "03", value: 9 },
  ],
};

const dimmed = {
  label: "dimmed-2021",
  dimmed: true,
  data: [],
  points: [
    { x: 100, y: 100, date: "01", value: 5 }, // overlaps the active series' first vertex
    { x: 400, y: 400, date: "02", value: 5 }, // a point only the dimmed series has
    { x: 380, y: 420, date: "03", value: 5 },
  ],
};

describe("radar pickHit — active-over-dimmed priority + edge hover", () => {
  it("prefers the ACTIVE series when an active vertex overlaps a dimmed one", () => {
    // Both series carry a vertex at (100,100); the dimmed one is listed FIRST, so
    // only the pass-priority (not array order) makes the active series win.
    expect(pickHit([dimmed, active], 100, 100)?.hit.label).toBe("active-2022");
  });

  it("falls back to a dimmed series where no active series is near", () => {
    expect(pickHit([dimmed, active], 400, 400)?.hit.label).toBe("dimmed-2021");
  });

  it("registers a hit on the LINE (edge), returning the nearest vertex", () => {
    // (120,103) is ~3px from the (100,100)->(200,100) edge but ~20px+ from any
    // vertex — before edge hit-testing this registered nothing.
    const r = pickHit([active], 120, 103);
    expect(r?.hit.label).toBe("active-2022");
    expect(r?.point).not.toBeNull();
    expect(r?.point?.date).toBe("01"); // nearest vertex on that edge = (100,100)
  });

  it("with no dimmed series, picks the nearest series' vertex (unchanged behaviour)", () => {
    const a = {
      label: "A",
      dimmed: false,
      data: [],
      points: [
        { x: 50, y: 50, date: "01", value: 1 },
        { x: 60, y: 60, date: "02", value: 1 },
        { x: 40, y: 60, date: "03", value: 1 },
      ],
    };
    const b = {
      label: "B",
      dimmed: false,
      data: [],
      points: [
        { x: 300, y: 300, date: "01", value: 1 },
        { x: 310, y: 310, date: "02", value: 1 },
        { x: 290, y: 310, date: "03", value: 1 },
      ],
    };
    expect(pickHit([a, b], 50, 50)?.hit.label).toBe("A");
  });

  it("returns null when the cursor is far from every series", () => {
    expect(pickHit([active, dimmed], 1000, 1000)).toBeNull();
  });
});

describe("radar pickHit — forgiving active-path hover (body + nearby snap)", () => {
  // A dimmed series whose body sits well away from the active triangle, used to
  // prove the active path is preferred and that dimmed paths stay "tight".
  const dimmedAway = {
    label: "dimmed-away",
    dimmed: true,
    data: [],
    points: [
      { x: 300, y: 300, date: "01", value: 5 },
      { x: 400, y: 300, date: "02", value: 5 },
      { x: 350, y: 380, date: "03", value: 5 },
    ],
  };

  it("shows the nearest data point when hovering INSIDE the active polygon body", () => {
    // (150,127) is inside the active triangle but >7px from every vertex and
    // >6px from every edge — previously an interior hit returned point:null
    // (highlight only, no tooltip). The active path must now snap to its
    // nearest vertex so the whole bright shape is a tooltip target.
    const r = pickHit([active], 150, 127);
    expect(r?.hit.label).toBe("active-2022");
    expect(r?.point).not.toBeNull();
    expect(r?.point?.date).toBe("03"); // (150,180) is the nearest vertex
  });

  it("snaps to the nearest active vertex when hovering just OUTSIDE the path", () => {
    // (100,88) is ~12px above the (100,100) vertex — outside the polygon, too
    // far for the 7px vertex / 6px edge tests, but within the snap radius.
    const r = pickHit([active], 100, 88);
    expect(r?.hit.label).toBe("active-2022");
    expect(r?.point?.date).toBe("01");
  });

  it("lets the active body win even when a dimmed vertex sits under the cursor", () => {
    const dimmedUnder = {
      label: "dimmed-under",
      dimmed: true,
      data: [],
      points: [
        { x: 150, y: 130, date: "01", value: 5 }, // inside the active triangle
        { x: 500, y: 500, date: "02", value: 5 },
        { x: 520, y: 520, date: "03", value: 5 },
      ],
    };
    const r = pickHit([dimmedUnder, active], 150, 130);
    expect(r?.hit.label).toBe("active-2022");
    expect(r?.point).not.toBeNull();
  });

  it("keeps dimmed paths TIGHT — hovering a dimmed body shows no tooltip point", () => {
    // No active series near (350,327): the dimmed body is hit, but the tight
    // interior behaviour (point:null = highlight only) is preserved.
    const r = pickHit([dimmedAway], 350, 327);
    expect(r?.hit.label).toBe("dimmed-away");
    expect(r?.point).toBeNull();
  });

  it("gives dimmed paths NO snap halo — just outside a dimmed vertex misses", () => {
    // (300,288) is ~12px outside the dimmed vertex (300,300); with no active
    // series the forgiving snap must not apply, so this is a clean miss.
    expect(pickHit([dimmedAway], 300, 288)).toBeNull();
  });
});

import { computeCircleDodgeOffsets } from "./computeCircleDodge";

describe("computeCircleDodgeOffsets", () => {
  const RADIUS = 6;

  describe("without a box-height bound (backward compatible)", () => {
    it("returns no offset for a single circle", () => {
      expect(computeCircleDodgeOffsets([10], RADIUS)).toEqual([0]);
    });

    it("leaves well-separated circles on the bar line", () => {
      // A gap of a full diameter or more is not an overlap, so no dodge.
      expect(computeCircleDodgeOffsets([0, 100], RADIUS)).toEqual([0, 0]);
    });

    it("spreads an overlapping pair symmetrically by one diameter", () => {
      expect(computeCircleDodgeOffsets([0, 0], RADIUS)).toEqual([-RADIUS, RADIUS]);
    });
  });

  describe("with a box-height bound", () => {
    it("keeps the natural diameter spacing when the box is tall enough", () => {
      // A 100px-tall box easily holds a pair (24px of vertical extent), so the
      // spacing is unchanged from the unbounded case.
      expect(computeCircleDodgeOffsets([0, 0], RADIUS, 100)).toEqual([-RADIUS, RADIUS]);
    });

    it("compresses the spread so an overlapping pair stays inside a short box", () => {
      // Box 20 tall: circle centres must fit within +/- (20/2 - radius) = +/- 4
      // so the circles (radius 6) do not spill out of the box.
      expect(computeCircleDodgeOffsets([0, 0], RADIUS, 20)).toEqual([-4, 4]);
    });

    it("never lets a circle escape the box, however many overlap", () => {
      const box = 30;
      const offsets = computeCircleDodgeOffsets([0, 0, 0, 0, 0], RADIUS, box);
      const half = box / 2;
      for (const offset of offsets) {
        // A circle's far edge is |offset| + radius from the bar centre; it must
        // not cross the box edge at half the box height.
        expect(Math.abs(offset) + RADIUS).toBeLessThanOrEqual(half + 1e-9);
      }
      // The cluster stays centred on the bar (50% above / 50% below).
      const sum = offsets.reduce((a, b) => a + b, 0);
      expect(Math.abs(sum)).toBeLessThan(1e-9);
    });

    it("dodges only the overlapping cluster, leaving a separate circle on the line", () => {
      // First two share an x (a cluster); the third is far away and stays put.
      const offsets = computeCircleDodgeOffsets([0, 0, 100], RADIUS, 40);
      expect(offsets[2]).toBe(0);
      expect(offsets[0]).toBeCloseTo(-offsets[1]);
      expect(offsets[0]).not.toBe(0);
    });
  });
});

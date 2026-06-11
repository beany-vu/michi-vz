import React from "react";
import { waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import BarBellChart from "../BarBellChart";
import { customRender } from "./test-utils";

// End-cap circles whose values collapse to the same x (here: two zero-value
// keys after a non-zero one) form a cluster that the chart dodges vertically so
// every circle stays visible. This suite pins the contract the dodge must honour
// in the SVG renderer: that vertical spread is bounded to each row's "box" (its
// y-band), so circles never spill into the neighbouring row even when the rows
// are short.
describe("BarBellChart end-cap circle dodge", () => {
  // Three keys per row; only the first has a value, so all three end-cap circles
  // land at the same x and must be dodged apart.
  const keys = ["a", "b", "c"];
  // BarBellChart's DataPoint type models every property as numeric, but rows
  // legitimately carry a string `date` label (as the stories do). The runtime
  // shape is correct; cast through `unknown` to satisfy the narrow prop type.
  const dataSet = [
    { date: "Row0", a: 1, b: 0, c: 0 },
    { date: "Row1", a: 1, b: 0, c: 0 },
    { date: "Row2", a: 1, b: 0, c: 0 },
    { date: "Row3", a: 1, b: 0, c: 0 },
  ] as unknown as React.ComponentProps<typeof BarBellChart>["dataSet"];

  // Deliberately short rows: height 120 with no top/bottom margin gives a y-band
  // range of [20, 120] split across 4 rows -> a 25px band. A 3-circle cluster
  // spread at the natural one-diameter step would span 36px and overflow such a
  // band; the bound must compress it to fit.
  const margin = { top: 0, right: 50, bottom: 0, left: 100 };
  const height = 120;
  const width = 400;
  const RADIUS = 6;

  const rangeStart = margin.top + 20; // 20 — matches yScale range in the component
  const rangeEnd = height - margin.bottom; // 120
  const bandHeight = (rangeEnd - rangeStart) / dataSet.length; // 25

  it("keeps every dodged circle inside its row's band", async () => {
    const { container } = customRender(
      <BarBellChart
        dataSet={dataSet}
        keys={keys}
        width={width}
        height={height}
        margin={margin}
        title="dodge bound"
        onHighlightItem={() => {}}
      />
    );

    await waitFor(() => {
      expect(container.querySelectorAll(".bar-data-point").length).toBeGreaterThan(0);
    });

    dataSet.forEach((_, rowIndex) => {
      const group = container.querySelector(`.group-line-${rowIndex}`);
      expect(group).not.toBeNull();

      const caps = Array.from(
        group!.querySelectorAll<SVGForeignObjectElement>(".bar-data-point")
      );
      expect(caps.length).toBe(keys.length);

      const bandTop = rangeStart + bandHeight * rowIndex;
      const bandBottom = bandTop + bandHeight;
      const bandCenter = bandTop + bandHeight / 2;

      const centers = caps.map(cap => {
        // foreignObject is 12px tall; its centre is y + RADIUS.
        const y = Number(cap.getAttribute("y"));
        return y + RADIUS;
      });

      centers.forEach(center => {
        // Every circle (centre +/- radius) stays within the band — never spills
        // into the neighbouring row.
        expect(center - RADIUS).toBeGreaterThanOrEqual(bandTop - 1e-6);
        expect(center + RADIUS).toBeLessThanOrEqual(bandBottom + 1e-6);
      });

      // The cluster is still spread (the dodge is active, not collapsed)...
      const spread = Math.max(...centers) - Math.min(...centers);
      expect(spread).toBeGreaterThan(0);

      // ...and stays centred on the bar line (50% above / 50% below).
      const mean = centers.reduce((a, b) => a + b, 0) / centers.length;
      expect(Math.abs(mean - bandCenter)).toBeLessThan(0.5);
    });
  });
});

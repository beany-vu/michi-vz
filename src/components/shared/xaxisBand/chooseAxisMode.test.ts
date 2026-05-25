import { chooseAxisMode } from "./chooseAxisMode";

describe("chooseAxisMode", () => {
  // Predictable measurer: each character is 7px wide.
  const measure = (label: string) => label.length * 7;

  test("returns horizontal when widest label + padding fits a single band", () => {
    const result = chooseAxisMode({
      domain: ["01-2023", "02-2023", "03-2023"],
      formatter: d => String(d),
      bandWidth: 80,
      measure,
      padding: 8,
    });

    expect(result.mode).toBe("horizontal");
    expect(result.tickValues).toEqual(["01-2023", "02-2023", "03-2023"]);
  });

  test("returns rotated when horizontal overflows but -45° fits", () => {
    // 7-char labels @ 7px = 49px wide. Band width 35px → horizontal overflows.
    // 49 * cos(45°) ≈ 34.6, plus padding 8 = 42.6, which fits a 50px band.
    const result = chooseAxisMode({
      domain: ["01-2023", "02-2023", "03-2023"],
      formatter: d => String(d),
      bandWidth: 50,
      measure,
      padding: 8,
    });

    expect(result.mode).toBe("rotated");
    expect(result.tickValues).toEqual(["01-2023", "02-2023", "03-2023"]);
  });

  test("returns fallback with evenly-spaced sample when even rotation overflows", () => {
    // 8-char labels @ 7px = 56px. Rotated: 56 * 0.707 ≈ 39.6 + 8 = 47.6.
    // Band width 20 → both horizontal and rotated overflow.
    // 5 domain items at band width 20 = total range 100px.
    // estimatedTickWidth fallback uses 80px → max 1 tick fits, clamped to 2 → first + last.
    const result = chooseAxisMode({
      domain: ["12-01-23", "12-02-23", "12-03-23", "12-04-23", "12-05-23"],
      formatter: d => String(d),
      bandWidth: 20,
      measure,
      padding: 8,
      maxTicks: 15,
    });

    expect(result.mode).toBe("fallback");
    expect(result.tickValues).toEqual(["12-01-23", "12-05-23"]);
  });

  test("fallback samples evenly when more than 2 ticks fit", () => {
    // 13-char labels @ 7px = 91px. Rotated footprint 91 * 0.707 ≈ 64.3.
    // With ROTATED_MAX_OVERLAP = 1.5, rotation needs bandWidth ≥ 64.3 / 1.5 ≈ 43.
    // At bandWidth 25, even relaxed rotation overflows → fallback.
    // 10 items × 25px band = 250px total. 250 / 80 = 3 ticks fit.
    const domain = Array.from({ length: 10 }, (_, i) => `2023-month-${String(i).padStart(2, "0")}`);
    const result = chooseAxisMode({
      domain,
      formatter: d => String(d),
      bandWidth: 25,
      measure,
      padding: 8,
      maxTicks: 15,
    });

    expect(result.mode).toBe("fallback");
    expect(result.tickValues).toEqual([domain[0], domain[5], domain[9]]);
  });

  test("empty domain returns horizontal with no ticks", () => {
    const result = chooseAxisMode({
      domain: [],
      formatter: d => String(d),
      bandWidth: 80,
      measure,
    });

    expect(result.mode).toBe("horizontal");
    expect(result.tickValues).toEqual([]);
  });

  test("single item always fits horizontally regardless of band width", () => {
    const result = chooseAxisMode({
      domain: ["only-one-very-long-label"],
      formatter: d => String(d),
      bandWidth: 5,
      measure,
    });

    expect(result.mode).toBe("horizontal");
    expect(result.tickValues).toEqual(["only-one-very-long-label"]);
  });

  test("forceMode='horizontal' skips rotation and falls back to current sampling", () => {
    const result = chooseAxisMode({
      domain: ["01-2023", "02-2023", "03-2023", "04-2023", "05-2023"],
      formatter: d => String(d),
      bandWidth: 50, // would normally choose rotated
      measure,
      padding: 8,
      forceMode: "horizontal",
    });

    expect(result.mode).toBe("fallback");
    expect(result.tickValues).toEqual(["01-2023", "03-2023", "05-2023"]);
  });
});

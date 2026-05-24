import { chooseAxisMode } from "./chooseAxisMode";

describe("chooseAxisMode", () => {
  // Predictable measurer: each character is 7px wide.
  const measure = (label: string) => label.length * 7;

  test("returns horizontal when widest label + padding fits a single band", () => {
    const result = chooseAxisMode({
      domain: ["01-2023", "02-2023", "03-2023"],
      formatter: (d) => String(d),
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
      formatter: (d) => String(d),
      bandWidth: 50,
      measure,
      padding: 8,
    });

    expect(result.mode).toBe("rotated");
    expect(result.tickValues).toEqual(["01-2023", "02-2023", "03-2023"]);
  });
});

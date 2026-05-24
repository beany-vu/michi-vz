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
});

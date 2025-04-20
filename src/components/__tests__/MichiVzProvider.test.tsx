import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MichiVzProvider, useChartContext } from "../MichiVzProvider";

describe("MichiVzProvider", () => {
  test("renders children", () => {
    const { getByText } = render(
      <MichiVzProvider>
        <div>Test Child</div>
      </MichiVzProvider>
    );

    expect(getByText("Test Child")).toBeInTheDocument();
  });

  test("provides default context values", () => {
    const TestComponent = () => {
      const context = useChartContext();
      return (
        <div>
          <span data-testid="disabled-items">{JSON.stringify(context.disabledItems)}</span>
          <span data-testid="colors-mapping">{JSON.stringify(context.colorsMapping)}</span>
        </div>
      );
    };

    const { getByTestId } = render(
      <MichiVzProvider>
        <TestComponent />
      </MichiVzProvider>
    );

    expect(getByTestId("disabled-items")).toHaveTextContent("[]");
    expect(getByTestId("colors-mapping")).toHaveTextContent("{}");
  });

  test("accepts custom context values", () => {
    const TestComponent = () => {
      const context = useChartContext();
      return (
        <div>
          <span data-testid="disabled-items">{JSON.stringify(context.disabledItems)}</span>
          <span data-testid="colors-mapping">{JSON.stringify(context.colorsMapping)}</span>
        </div>
      );
    };

    const customValues = {
      disabledItems: ["item1", "item2"],
      colorsMapping: { key1: "red", key2: "blue" },
    };

    const { getByTestId } = render(
      <MichiVzProvider
        disabledItems={customValues.disabledItems}
        colorsMapping={customValues.colorsMapping}
      >
        <TestComponent />
      </MichiVzProvider>
    );

    expect(getByTestId("disabled-items")).toHaveTextContent(
      JSON.stringify(customValues.disabledItems)
    );
    expect(getByTestId("colors-mapping")).toHaveTextContent(
      JSON.stringify(customValues.colorsMapping)
    );
  });
});

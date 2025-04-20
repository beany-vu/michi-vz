import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import LoadingIndicator from "./LoadingIndicator";

describe("LoadingIndicator component", () => {
  test("renders with correct styling", () => {
    const { container } = render(<LoadingIndicator />);

    // Check if the loading indicator element is rendered
    const loadingElement = container.firstChild;
    expect(loadingElement).toBeInTheDocument();

    // Check if styled component applied appropriate styles
    expect(loadingElement).toHaveStyle({
      position: "absolute",
      backgroundColor: "pink",
      cursor: "wait",
      pointerEvents: "none",
    });
  });

  test("is positioned correctly", () => {
    const { container } = render(<LoadingIndicator />);

    const loadingElement = container.firstChild as HTMLElement;
    expect(loadingElement).toHaveStyle({
      top: "5px",
      left: "5px",
      right: "5px",
      bottom: "5px",
    });
  });

  test("has animation applied", () => {
    const { container } = render(<LoadingIndicator />);

    // Check if the element has animation-related styles
    const computedStyle = window.getComputedStyle(container.firstChild as Element);
    expect(computedStyle.animation).not.toBe("");
  });
});

import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Title from "./Title";

describe("Title component", () => {
  test("renders title text when provided", () => {
    const testText = "Test Title";
    render(
      <Title x={100} y={50}>
        {testText}
      </Title>
    );

    expect(screen.getByText(testText)).toBeInTheDocument();
  });

  test("has correct position attributes", () => {
    const testText = "Test Title";
    const { container } = render(
      <Title x={100} y={50}>
        {testText}
      </Title>
    );

    const titleElement = container.querySelector(".title");
    expect(titleElement).toHaveAttribute("x", "100");
    expect(titleElement).toHaveAttribute("y", "50");
  });

  test("renders nothing when children is empty", () => {
    const { container } = render(
      <Title x={100} y={50}>
        {""}
      </Title>
    );

    const titleElement = container.querySelector(".title");
    expect(titleElement).not.toBeInTheDocument();
  });
});

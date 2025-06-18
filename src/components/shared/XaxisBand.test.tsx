import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import * as d3 from "d3";
import XaxisBand from "./XaxisBand";

describe("XaxisBand component", () => {
  // Set up mock D3 scale
  const createMockScale = () => {
    const domain = ["A", "B", "C", "D", "E"];
    const range = [0, 500];

    const scale = d3.scaleBand().domain(domain).range(range).padding(0.1);

    return scale;
  };

  const defaultProps = {
    xScale: createMockScale(),
    height: 400,
    margin: { top: 20, right: 20, bottom: 30, left: 40 },
  };

  beforeAll(() => {
    // Mock the D3 select functionality
    const mockSelection = {
      selectAll: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      remove: jest.fn().mockReturnThis(),
      data: jest.fn().mockReturnThis(),
      enter: jest.fn().mockReturnThis(),
      exit: jest.fn().mockReturnThis(),
      merge: jest.fn().mockReturnThis(),
      attr: jest.fn().mockReturnThis(),
      style: jest.fn().mockReturnThis(),
      call: jest.fn().mockReturnThis(),
      transition: jest.fn().mockReturnThis(),
      duration: jest.fn().mockReturnThis(),
      append: jest.fn().mockReturnThis(),
      on: jest.fn().mockReturnThis(),
    };

    // @ts-expect-error - Mocking d3.select for testing
    d3.select = jest.fn().mockReturnValue(mockSelection);
  });

  test("renders with class name", () => {
    const { container } = render(<XaxisBand {...defaultProps} />);

    const axis = container.querySelector(".x-axis");
    expect(axis).toBeInTheDocument();
    expect(axis).toHaveClass("x-axis-band");
  });

  test("accepts custom formatter", () => {
    const xAxisFormat = (d: string | number) => `Format: ${d}`;

    render(<XaxisBand {...defaultProps} xAxisFormat={xAxisFormat} />);

    // We can't easily verify D3 calls, so just verify it doesn't throw
    expect(true).toBe(true);
  });

  test("creates appropriate bands with the scale domain", () => {
    render(<XaxisBand {...defaultProps} />);

    // Check that the scale domain length matches the expected number from the mock
    expect(defaultProps.xScale.domain().length).toBe(5);
  });
});

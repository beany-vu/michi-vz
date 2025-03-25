import React from "react";
import { render, waitFor } from "@testing-library/react";
import * as d3 from "d3";
import XaxisBand from "./XaxisBand"; // adjust path as necessary

jest.mock("d3", () => {
  const realD3 = jest.requireActual("d3");
  return {
    ...realD3,
    // select: jest.fn(),
    // axisBottom: jest.fn(),
    // ... add other necessary mocks
  };
});

// Mock data
const mockXScale = d3.scaleBand().domain(["A", "B", "C"]).range([0, 100]);
const mockHeight = 500;
const mockMargin = { top: 10, right: 10, bottom: 10, left: 10 };

describe("<HorizontalAxisBand />", () => {
  it("renders and applies D3 manipulations", async () => {
    // Render the component within an SVG
    const { container } = render(
      <svg>
        <XaxisBand
          xScale={mockXScale}
          height={mockHeight}
          margin={mockMargin}
        />
      </svg>
    );

    // Wait for useEffect to apply D3 manipulations and then make assertions
    await waitFor(
      () => {
        expect(container.querySelector(".x-axis")).not.toBeNull();
        expect(container.querySelectorAll(".tick").length).toBe(3);
      },
      { timeout: 5000 }
    );
  }, 5000);

  it("applies the correct transformation", async () => {
    const { container } = render(
      <svg>
        <XaxisBand
          xScale={mockXScale}
          height={mockHeight}
          margin={mockMargin}
        />
      </svg>
    );

    // Wait for useEffect to apply D3 manipulations and then make assertions
    await waitFor(
      () => {
        const g = container.querySelector(".x-axis");
        expect(g).toBeTruthy();
        expect(g.getAttribute("transform")).toBe(
          `translate(0,${mockHeight - mockMargin.bottom + 25})`
        );
      },
      { timeout: 5000 }
    );
  });

  it("removes .domain", () => {
    const { container } = render(
      <svg>
        <XaxisBand
          xScale={mockXScale}
          height={mockHeight}
          margin={mockMargin}
        />
      </svg>
    );

    const domain = container.querySelector(".domain");
    expect(domain).toBeNull();
  });

  it("removes tick lines", () => {
    const { container } = render(
      <svg>
        <XaxisBand
          xScale={mockXScale}
          height={mockHeight}
          margin={mockMargin}
        />
      </svg>
    );

    const tickLines = container.querySelectorAll(".tick line");
    expect(tickLines.length).toBe(0);
  });

  // it("adds tick value circles", async () => {
  //   const { container } = render(
  //     <svg>
  //       <HorizontalAxisBand
  //         xScale={mockXScale}
  //         height={mockHeight}
  //         margin={mockMargin}
  //       />
  //     </svg>,
  //   );
  //
  //   await waitFor(
  //     () => {
  //       const tickCircles = container.querySelectorAll(".tick .tickValueDot");
  //       expect(tickCircles.length).toBeGreaterThan(0); // Assuming there will be at least one circle for your domain
  //
  //       // Test the first circle's attributes as a sample:
  //       const firstCircle = tickCircles[0];
  //       expect(firstCircle.getAttribute("cx")).toBe("0");
  //       expect(firstCircle.getAttribute("cy")).toBe("0");
  //       expect(firstCircle.getAttribute("r")).toBe("2");
  //       expect(firstCircle.getAttribute("fill")).toBe("lightgray");
  //     },
  //     { timeout: 1000 },
  //   );
  // }, 5000);
});

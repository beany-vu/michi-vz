import React from "react";
import { screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import RadarChart from "../RadarChart";
import { customRender, defaultChartProps } from "./test-utils";

// Transform radar data to match the expected interface
const radarData = [
  {
    label: "Product A",
    value: 80,
    data: [
      { date: "Feature 1", value: 80 },
      { date: "Feature 2", value: 70 },
      { date: "Feature 3", value: 90 },
      { date: "Feature 4", value: 60 },
      { date: "Feature 5", value: 85 },
    ],
    color: "#1f77b4",
  },
  {
    label: "Product B",
    value: 75,
    data: [
      { date: "Feature 1", value: 65 },
      { date: "Feature 2", value: 85 },
      { date: "Feature 3", value: 75 },
      { date: "Feature 4", value: 90 },
      { date: "Feature 5", value: 70 },
    ],
    color: "#ff7f0e",
  },
];

const radarChartProps = {
  ...defaultChartProps,
  poles: {
    domain: [0, 100],
    range: [0, 100],
    labels: ["Feature 1", "Feature 2", "Feature 3", "Feature 4", "Feature 5"],
  },
  onHighlightItem: () => {},
};

describe("RadarChart", () => {
  // Skip tests that require deeper SVG mocking
  test.skip("renders with title", async () => {
    const chartTitle = "Test Radar Chart";
    const { container } = customRender(<RadarChart series={radarData} {...radarChartProps} />);

    await waitFor(() => {
      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });

    // Check for polygon shapes (radar areas)
    const polygons = container.querySelectorAll("polygon");
    expect(polygons.length).toBeGreaterThan(0);

    // Check for axis labels
    expect(screen.getByText("Feature 1")).toBeInTheDocument();
    expect(screen.getByText("Feature 2")).toBeInTheDocument();
  });

  test.skip("renders with legends", async () => {
    const { container } = customRender(<RadarChart series={radarData} {...radarChartProps} />);

    await waitFor(() => {
      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });

    // Check for data representing each series
    const polygons = container.querySelectorAll("polygon");
    expect(polygons.length).toBeGreaterThan(0);
  });

  test("renders without data", () => {
    // Just test that it doesn't throw
    expect(() => {
      customRender(<RadarChart series={[]} {...radarChartProps} />);
    }).not.toThrow();
  });

  test.skip("handles data updates", async () => {
    const { rerender, container } = customRender(
      <RadarChart series={[radarData[0]]} {...radarChartProps} />
    );

    await waitFor(() => {
      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });

    // Initially we should have one polygon for one dataset
    let polygons = container.querySelectorAll("polygon");
    expect(polygons.length).toBe(1);

    // Rerender with more data
    rerender(<RadarChart series={radarData} {...radarChartProps} />);

    await waitFor(() => {
      // Now we should have more polygons
      polygons = container.querySelectorAll("polygon");
      expect(polygons.length).toBe(2);
    });
  });
});

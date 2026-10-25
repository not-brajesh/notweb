import { describe, expect, it } from "vitest";

import {
  analyzeResponsiveDesign,
  getResponsiveMetrics,
} from "./index.js";

describe("Responsive Engine", () => {
  it("should detect a missing viewport meta tag", () => {
    const result = analyzeResponsiveDesign({
      html: "<html><head></head><body><h1>Test</h1></body></html>",
    });

    expect(result.issues.length).toBeGreaterThan(0);
    expect(
      result.issues.some((issue) => issue.id === "responsive-missing-viewport"),
    ).toBe(true);
  });

  it("should recognize a responsive viewport declaration", () => {
    const result = analyzeResponsiveDesign({
      html: `
        <html>
          <head>
            <meta
              name="viewport"
              content="width=device-width, initial-scale=1"
            >
          </head>
          <body><h1>Responsive page</h1></body>
        </html>
      `,
    });

    expect(
      result.issues.some(
        (issue) => issue.id === "responsive-missing-viewport",
      ),
    ).toBe(false);
  });

  it("should count images in the supplied HTML", () => {
    const metrics = getResponsiveMetrics({
      html: `
        <html>
          <body>
            <img src="one.jpg" alt="First image">
            <img src="two.jpg" alt="Second image">
          </body>
        </html>
      `,
    });

    expect(metrics.imageCount).toBe(2);
  });

  it("should calculate a score between 0 and 100", () => {
    const result = analyzeResponsiveDesign({
      html: `
        <html>
          <head>
            <meta
              name="viewport"
              content="width=device-width, initial-scale=1"
            >
          </head>
          <body><h1>Test</h1></body>
        </html>
      `,
    });

    expect(typeof result.score.score).toBe("number");
    expect(result.score.score).toBeGreaterThanOrEqual(0);
    expect(result.score.score).toBeLessThanOrEqual(100);
  });

  it("should return a valid score object with grade and label", () => {
    const result = analyzeResponsiveDesign({
      html: `
        <html>
          <head>
            <meta
              name="viewport"
              content="width=device-width, initial-scale=1"
            >
          </head>
          <body><h1>Test</h1></body>
        </html>
      `,
    });

    // The score is based on detected issues, so check its valid range.
    expect(result.score.score).toBeGreaterThanOrEqual(0);
    expect(result.score.score).toBeLessThanOrEqual(100);
    expect(["A", "B", "C", "D", "F"]).toContain(result.score.grade);
    expect(typeof result.score.label).toBe("string");
    expect(result.score.label.length).toBeGreaterThan(0);
  });
});
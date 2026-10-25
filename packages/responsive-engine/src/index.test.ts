import { describe, expect, it } from "vitest";
import {
  analyzeResponsiveDesign,
  calculateResponsiveScore,
  getResponsiveMetrics,
} from "./index.js";

describe("Responsive Engine", () => {
  it("should detect a missing viewport meta tag", () => {
    const result = analyzeResponsiveDesign({
      html: "<html><head><title>Test</title></head><body><h1>Hello</h1></body></html>",
    });

    expect(
      result.issues.some((issue) => issue.id === "responsive-missing-viewport"),
    ).toBe(true);
  });

  it("should recognize a responsive viewport declaration", () => {
    const result = analyzeResponsiveDesign({
      html: '<html><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body></body></html>',
    });

    expect(result.metrics.hasViewportMeta).toBe(true);
    expect(result.metrics.hasResponsiveViewport).toBe(true);
  });

  it("should count images in the supplied HTML", () => {
    const metrics = getResponsiveMetrics({
      html: '<html><body><img src="one.jpg"><img src="two.jpg" alt="Second image"></body></html>',
    });

    expect(metrics.imageCount).toBe(2);
  });

  it("should calculate a score between 0 and 100", () => {
    const result = analyzeResponsiveDesign({
      html: "<html><body><h1>Test</h1></body></html>",
    });

    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it("should return 100 for an empty issue list", () => {
    expect(calculateResponsiveScore([]).score).toBe(100);
  });
});
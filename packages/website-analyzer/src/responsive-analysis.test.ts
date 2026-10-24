
import { describe, expect, it } from "vitest";

import {
  analyzeResponsiveDesign,
  getResponsiveDesignIssues,
} from "./responsive-analysis.js";

describe("Responsive Design Analysis", () => {
  it("detects a missing viewport meta tag", () => {
    const result = analyzeResponsiveDesign({
      html: "<html><head><title>Example</title></head><body></body></html>",
    });

    expect(
      result.issues.some(
        (issue) => issue.id === "responsive-missing-viewport",
      ),
    ).toBe(true);
  });

  it("accepts a valid viewport meta tag", () => {
    const result = analyzeResponsiveDesign({
      html: `
        <html>
          <head>
            <meta
              name="viewport"
              content="width=device-width, initial-scale=1"
            />
          </head>
          <body></body>
        </html>
      `,
    });

    expect(result.metrics.hasViewportMeta).toBe(true);
    expect(
      result.issues.some(
        (issue) => issue.id === "responsive-missing-viewport",
      ),
    ).toBe(false);
  });

  it("detects potential fixed-width layout constraints", () => {
    const result = analyzeResponsiveDesign({
      html: `
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <style>
              .container { width: 1200px; }
              .sidebar { min-width: 1000px; }
            </style>
          </head>
          <body></body>
        </html>
      `,
    });

    expect(result.metrics.fixedWidthIndicators).toBeGreaterThan(0);
    expect(
      result.issues.some(
        (issue) => issue.id === "responsive-fixed-width-indicators",
      ),
    ).toBe(true);
  });

  it("detects images without explicit sizing hints", () => {
    const result = analyzeResponsiveDesign({
      html: `
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1" />
          </head>
          <body>
            <img src="/images/example.jpg" alt="Example" />
          </body>
        </html>
      `,
    });

    expect(result.metrics.totalImages).toBe(1);
    expect(result.metrics.imagesWithoutSizing).toBe(1);
  });

  it("recognizes responsive image hints", () => {
    const result = analyzeResponsiveDesign({
      html: `
        <html>
          <body>
            <img
              src="/images/example.jpg"
              srcset="/images/example-small.jpg 480w, /images/example-large.jpg 1200w"
              sizes="(max-width: 600px) 100vw, 50vw"
              alt="Example"
            />
          </body>
        </html>
      `,
    });

    expect(result.metrics.hasResponsiveImages).toBe(true);
  });

  it("recognizes the picture element", () => {
    const result = analyzeResponsiveDesign({
      html: `
        <picture>
          <source srcset="/images/example.webp" type="image/webp" />
          <img src="/images/example.jpg" alt="Example" />
        </picture>
      `,
    });

    expect(result.metrics.hasPictureElement).toBe(true);
  });

  it("detects media queries in inspected HTML", () => {
    const result = analyzeResponsiveDesign({
      html: `
        <html>
          <head>
            <style>
              @media (max-width: 600px) {
                .container { width: 100%; }
              }
            </style>
          </head>
          <body></body>
        </html>
      `,
    });

    expect(result.metrics.hasMediaQueries).toBe(true);
  });

  it("returns a score between 0 and 100", () => {
    const result = analyzeResponsiveDesign({
      html: `
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1" />
          </head>
          <body></body>
        </html>
      `,
    });

    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it("returns responsive findings through the convenience helper", () => {
    const input = {
      html: "<html><head></head><body></body></html>",
    };

    expect(getResponsiveDesignIssues(input)).toEqual(
      analyzeResponsiveDesign(input).issues,
    );
  });

  it("reports the number of checks performed", () => {
    const result = analyzeResponsiveDesign({
      html: "<html><head></head><body></body></html>",
    });

    expect(result.checksPerformed).toBeGreaterThan(0);
  });
});

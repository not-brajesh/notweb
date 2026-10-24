
import { describe, expect, it } from "vitest";

import {
  analyzeWebsite,
  runWebsiteAnalysis,
} from "./analyzer.js";

const validUrl = "https://example.com";

const sampleHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Example Website</title>
  <meta name="description" content="A sample website for testing.">
  <meta property="og:title" content="Example Website">
  <meta property="og:description" content="A sample website.">
</head>
<body>
  <header>
    <h1>Welcome to Example</h1>
  </header>
  <main>
    <p>This is a sample page.</p>
    <img src="/image.jpg" alt="Example image" width="320" height="200">
    <a href="/about">About us</a>
  </main>
</body>
</html>`;

describe("Website analysis pipeline", () => {
  describe("runWebsiteAnalysis", () => {
    it("successfully analyzes valid HTML", () => {
      const outcome = runWebsiteAnalysis({
        url: validUrl,
        html: sampleHtml,
      });

      expect(outcome.success).toBe(true);
      expect(outcome.error).toBeNull();
      expect(outcome.result).not.toBeNull();
    });

    it("returns completed analysis results", () => {
      const outcome = runWebsiteAnalysis({
        url: validUrl,
        html: sampleHtml,
      });

      expect(outcome.result?.status).toBe("completed");
      expect(outcome.result?.requestedUrl).toBe(validUrl);
      expect(outcome.result?.analyzedUrl).toBe(validUrl);
      expect(outcome.result?.completedAt).not.toBeNull();
    });

    it("extracts website metadata", () => {
      const outcome = runWebsiteAnalysis({
        url: validUrl,
        html: sampleHtml,
      });

      expect(outcome.result?.metadata?.title).toBe(
        "Example Website",
      );

      expect(outcome.result?.metadata?.description).toBe(
        "A sample website for testing.",
      );
    });

    it("collects analysis issues", () => {
      const outcome = runWebsiteAnalysis({
        url: validUrl,
        html: sampleHtml,
      });

      expect(outcome.success).toBe(true);
      expect(Array.isArray(outcome.result?.issues)).toBe(true);
    });

    it("calculates category scores", () => {
      const outcome = runWebsiteAnalysis({
        url: validUrl,
        html: sampleHtml,
      });

      expect(outcome.result?.scores.length).toBeGreaterThan(0);

      for (const score of outcome.result?.scores ?? []) {
        expect(score.score).toBeGreaterThanOrEqual(0);
        expect(score.score).toBeLessThanOrEqual(100);
      }
    });

    it("supports selecting specific categories", () => {
      const outcome = runWebsiteAnalysis({
        url: validUrl,
        html: sampleHtml,
        includeCategories: ["seo"],
      });

      expect(outcome.success).toBe(true);

      expect(
        outcome.result?.scores.map((score) => score.category),
      ).toEqual(["seo"]);

      expect(
        outcome.result?.issues.every(
          (issue) => issue.category === "seo",
        ),
      ).toBe(true);
    });

    it("rejects an invalid website URL", () => {
      const outcome = runWebsiteAnalysis({
        url: "javascript:alert(1)",
        html: sampleHtml,
      });

      expect(outcome.success).toBe(false);
      expect(outcome.result).toBeNull();
      expect(outcome.error).toBeTruthy();
    });

    it("rejects empty HTML", () => {
      const outcome = runWebsiteAnalysis({
        url: validUrl,
        html: "   ",
      });

      expect(outcome.success).toBe(false);
      expect(outcome.result).toBeNull();
      expect(outcome.error).toContain("HTML content is required");
    });

    it("uses the final URL when provided", () => {
      const outcome = runWebsiteAnalysis({
        url: validUrl,
        finalUrl: "https://example.com/final",
        html: sampleHtml,
      });

      expect(outcome.result?.requestedUrl).toBe(validUrl);
      expect(outcome.result?.analyzedUrl).toBe(
        "https://example.com/final",
      );
    });
  });

  describe("analyzeWebsite", () => {
    it("returns the analysis result directly", () => {
      const result = analyzeWebsite({
        url: validUrl,
        html: sampleHtml,
      });

      expect(result.status).toBe("completed");
      expect(result.metadata?.title).toBe("Example Website");
    });

    it("throws when the analysis cannot be completed", () => {
      expect(() =>
        analyzeWebsite({
          url: validUrl,
          html: "",
        }),
      ).toThrow("HTML content is required");
    });
  });
});

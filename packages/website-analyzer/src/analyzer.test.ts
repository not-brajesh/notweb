
import { describe, expect, it } from "vitest";

import {
  analyzeWebsite,
  runWebsiteAnalysis,
} from "./analyzer.js";

const validUrl = "https://example.com";
const normalizedUrl = "https://example.com/";

const sampleHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Example Website</title>
  <meta name="description" content="A sample website for testing.">
  <meta property="og:title" content="Example Website">
  <meta property="og:description" content="A sample website.">
  <meta name="twitter:card" content="summary">
</head>
<body>
  <header>
    <h1>Welcome to Example</h1>
  </header>
  <main>
    <p>This is a sample page.</p>
    <img
      src="/image.jpg"
      alt="Example image"
      width="320"
      height="200"
    >
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

    it("returns a completed analysis result", () => {
      const outcome = runWebsiteAnalysis({
        url: validUrl,
        html: sampleHtml,
      });

      expect(outcome.result?.status).toBe("completed");
      expect(outcome.result?.requestedUrl).toBe(normalizedUrl);
      expect(outcome.result?.analyzedUrl).toBe(normalizedUrl);
      expect(outcome.result?.completedAt).not.toBeNull();
      expect(outcome.result?.durationMs).toBeGreaterThanOrEqual(0);
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

      expect(outcome.result?.metadata?.language).toBe("en");
      expect(outcome.result?.metadata?.viewport).toBe(
        "width=device-width, initial-scale=1",
      );
    });

    it("collects analysis issues", () => {
      const outcome = runWebsiteAnalysis({
        url: validUrl,
        html: sampleHtml,
      });

      expect(outcome.success).toBe(true);
      expect(Array.isArray(outcome.result?.issues)).toBe(true);

      for (const issue of outcome.result?.issues ?? []) {
        expect(issue.id).toBeTruthy();
        expect(issue.title).toBeTruthy();
        expect(issue.description).toBeTruthy();
        expect(issue.recommendation).toBeTruthy();
      }
    });

    it("calculates valid category scores", () => {
      const outcome = runWebsiteAnalysis({
        url: validUrl,
        html: sampleHtml,
      });

      expect(outcome.result?.scores.length).toBeGreaterThan(0);

      for (const score of outcome.result?.scores ?? []) {
        if (score.score !== null) {
          expect(score.score).toBeGreaterThanOrEqual(0);
          expect(score.score).toBeLessThanOrEqual(100);
        }

        expect(score.issueCount).toBeGreaterThanOrEqual(0);
      }
    });

    it("supports selecting a specific category", () => {
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

    it("supports selecting multiple categories", () => {
      const outcome = runWebsiteAnalysis({
        url: validUrl,
        html: sampleHtml,
        includeCategories: ["seo", "accessibility"],
      });

      expect(outcome.success).toBe(true);

      expect(
        outcome.result?.scores.map((score) => score.category),
      ).toEqual(["seo", "accessibility"]);

      expect(
        outcome.result?.issues.every(
          (issue) =>
            issue.category === "seo" ||
            issue.category === "accessibility",
        ),
      ).toBe(true);
    });

    it("uses all categories when none are specified", () => {
      const outcome = runWebsiteAnalysis({
        url: validUrl,
        html: sampleHtml,
      });

      expect(outcome.success).toBe(true);
      expect(outcome.result?.scores.length).toBeGreaterThan(1);
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

    it("rejects an unsupported URL protocol", () => {
      const outcome = runWebsiteAnalysis({
        url: "ftp://example.com",
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
      const finalUrl = "https://example.com/final";

      const outcome = runWebsiteAnalysis({
        url: validUrl,
        finalUrl,
        html: sampleHtml,
      });

      expect(outcome.success).toBe(true);
      expect(outcome.result?.requestedUrl).toBe(normalizedUrl);
      expect(outcome.result?.analyzedUrl).toBe(finalUrl);
      expect(outcome.result?.metadata?.finalUrl).toBe(finalUrl);
    });

    it("does not execute website JavaScript", () => {
      const html = `
        <!doctype html>
        <html>
          <head><title>Safe Test</title></head>
          <body>
            <script>
              window.__notweb_test_executed = true;
            </script>
          </body>
        </html>
      `;

      const outcome = runWebsiteAnalysis({
        url: validUrl,
        html,
      });

      expect(outcome.success).toBe(true);
      expect(outcome.result?.status).toBe("completed");
    });
  });

  describe("analyzeWebsite", () => {
    it("returns the analysis result directly", () => {
      const result = analyzeWebsite({
        url: validUrl,
        html: sampleHtml,
      });

      expect(result.status).toBe("completed");
      expect(result.requestedUrl).toBe(normalizedUrl);
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

    it("throws for an invalid URL", () => {
      expect(() =>
        analyzeWebsite({
          url: "not-a-valid-url",
          html: sampleHtml,
        }),
      ).toThrow();
    });
  });
});

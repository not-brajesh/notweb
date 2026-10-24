
import { describe, expect, it } from "vitest";

import {
  analyzeWebsite,
  runWebsiteAnalysis,
  websiteAnalysisPipeline,
} from "./analyzer.js";

const VALID_URL = "https://example.com";

const GOOD_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Example Website</title>
  <meta name="description" content="A useful example website for testing.">
  <link rel="canonical" href="https://example.com/">
  <meta property="og:title" content="Example Website">
  <meta property="og:description" content="A useful example website.">
</head>
<body>
  <header>
    <nav aria-label="Main navigation">
      <a href="/">Home</a>
    </nav>
  </header>
  <main>
    <h1>Welcome</h1>
    <p>This is an example website.</p>
    <img
      src="/images/example.webp"
      alt="Example illustration"
      width="640"
      height="480"
      loading="lazy"
    >
    <a href="/about">About us</a>
    <button type="button" aria-label="Open menu">Open</button>
  </main>
</body>
</html>`;

describe("runWebsiteAnalysis", () => {
  it("successfully analyzes valid HTML", () => {
    const outcome = runWebsiteAnalysis({
      url: VALID_URL,
      html: GOOD_HTML,
    });

    expect(outcome.success).toBe(true);
    expect(outcome.error).toBeNull();
    expect(outcome.result).not.toBeNull();
  });

  it("returns a completed analysis result", () => {
    const outcome = runWebsiteAnalysis({
      url: VALID_URL,
      html: GOOD_HTML,
    });

    expect(outcome.result?.status).toBe("completed");
    expect(outcome.result?.completedAt).not.toBeNull();
    expect(outcome.result?.durationMs).toBeGreaterThanOrEqual(0);
  });

  it("normalizes the requested URL", () => {
    const outcome = runWebsiteAnalysis({
      url: "  https://example.com  ",
      html: GOOD_HTML,
    });

    expect(outcome.success).toBe(true);
    expect(outcome.result?.requestedUrl).toBe("https://example.com/");
  });

  it("rejects an invalid URL", () => {
    const outcome = runWebsiteAnalysis({
      url: "not-a-valid-url",
      html: GOOD_HTML,
    });

    expect(outcome.success).toBe(false);
    expect(outcome.result).toBeNull();
    expect(outcome.error).toBeTruthy();
  });

  it("rejects empty HTML", () => {
    const outcome = runWebsiteAnalysis({
      url: VALID_URL,
      html: "   ",
    });

    expect(outcome.success).toBe(false);
    expect(outcome.result).toBeNull();
    expect(outcome.error).toContain("HTML content is required");
  });

  it("rejects a non-HTTP URL scheme", () => {
    const outcome = runWebsiteAnalysis({
      url: "javascript:alert(1)",
      html: GOOD_HTML,
    });

    expect(outcome.success).toBe(false);
    expect(outcome.result).toBeNull();
  });

  it("uses the provided final URL", () => {
    const outcome = runWebsiteAnalysis({
      url: VALID_URL,
      finalUrl: "https://example.com/final",
      html: GOOD_HTML,
    });

    expect(outcome.success).toBe(true);
    expect(outcome.result?.analyzedUrl).toBe(
      "https://example.com/final",
    );
    expect(outcome.result?.requestedUrl).toBe("https://example.com/");
  });

  it("extracts website metadata", () => {
    const outcome = runWebsiteAnalysis({
      url: VALID_URL,
      html: GOOD_HTML,
    });

    expect(outcome.result?.metadata?.title).toBe("Example Website");
    expect(outcome.result?.metadata?.description).toBe(
      "A useful example website for testing.",
    );
    expect(outcome.result?.metadata?.language).toBe("en");
    expect(outcome.result?.metadata?.viewport).toContain("width=device-width");
  });

  it("includes issues as an array", () => {
    const outcome = runWebsiteAnalysis({
      url: VALID_URL,
      html: GOOD_HTML,
    });

    expect(outcome.result?.issues).toEqual(
      expect.any(Array),
    );
  });

  it("includes category scores", () => {
    const outcome = runWebsiteAnalysis({
      url: VALID_URL,
      html: GOOD_HTML,
    });

    expect(outcome.result?.scores.length).toBeGreaterThan(0);

    for (const score of outcome.result?.scores ?? []) {
      expect(score.issueCount).toBeGreaterThanOrEqual(0);

      if (score.score !== null) {
        expect(score.score).toBeGreaterThanOrEqual(0);
        expect(score.score).toBeLessThanOrEqual(100);
      }
    }
  });

  it("only includes requested analysis categories", () => {
    const outcome = runWebsiteAnalysis({
      url: VALID_URL,
      html: GOOD_HTML,
      includeCategories: ["seo"],
    });

    expect(outcome.success).toBe(true);
    expect(outcome.result?.scores.map((score) => score.category)).toEqual([
      "seo",
    ]);
    expect(
      outcome.result?.issues.every((issue) => issue.category === "seo"),
    ).toBe(true);
  });

  it("removes duplicate requested categories", () => {
    const outcome = runWebsiteAnalysis({
      url: VALID_URL,
      html: GOOD_HTML,
      includeCategories: ["seo", "seo"],
    });

    expect(outcome.success).toBe(true);
    expect(outcome.result?.scores.map((score) => score.category)).toEqual([
      "seo",
    ]);
  });

  it("returns the result directly through analyzeWebsite", () => {
    const result = analyzeWebsite({
      url: VALID_URL,
      html: GOOD_HTML,
    });

    expect(result.status).toBe("completed");
    expect(result.requestedUrl).toBe("https://example.com/");
  });

  it("throws when analyzeWebsite receives invalid input", () => {
    expect(() =>
      analyzeWebsite({
        url: "invalid-url",
        html: GOOD_HTML,
      }),
    ).toThrow();
  });

  it("exposes the pipeline convenience API", () => {
    expect(websiteAnalysisPipeline.run).toBe(runWebsiteAnalysis);
    expect(websiteAnalysisPipeline.analyze).toBe(analyzeWebsite);
  });
});


import { describe, expect, it } from "vitest";

import {
  analyzeWebsite,
  runWebsiteAnalysis,
  websiteAnalysisPipeline,
} from "./analyzer.js";

const SAMPLE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NOTWEB Test Website</title>
  <meta name="description" content="A sample website used to test the NOTWEB analysis pipeline.">
  <link rel="canonical" href="https://example.com/">
  <meta property="og:title" content="NOTWEB Test Website">
  <meta property="og:description" content="A sample Open Graph description.">
  <meta property="og:image" content="https://example.com/preview.png">
  <meta name="twitter:card" content="summary_large_image">
</head>
<body>
  <header>
    <h1>Welcome to NOTWEB</h1>
  </header>
  <main>
    <p>This is a sample page for automated analysis.</p>
    <img src="/image.jpg" alt="Sample website image" width="640" height="480">
    <a href="/about">About us</a>
  </main>
</body>
</html>`;

describe("Website Analysis Pipeline", () => {
  it("analyzes valid HTML successfully", () => {
    const outcome = runWebsiteAnalysis({
      url: "https://example.com",
      html: SAMPLE_HTML,
    });

    expect(outcome.success).toBe(true);
    expect(outcome.error).toBeNull();
    expect(outcome.result).not.toBeNull();
    expect(outcome.result?.status).toBe("completed");
  });

  it("rejects an invalid website URL", () => {
    const outcome = runWebsiteAnalysis({
      url: "not-a-valid-url",
      html: SAMPLE_HTML,
    });

    expect(outcome.success).toBe(false);
    expect(outcome.result).toBeNull();
    expect(outcome.error).toBeTruthy();
  });

  it("rejects empty HTML", () => {
    const outcome = runWebsiteAnalysis({
      url: "https://example.com",
      html: "   ",
    });

    expect(outcome.success).toBe(false);
    expect(outcome.result).toBeNull();
    expect(outcome.error).toContain("HTML content is required");
  });

  it("extracts metadata from the supplied HTML", () => {
    const outcome = runWebsiteAnalysis({
      url: "https://example.com",
      html: SAMPLE_HTML,
    });

    expect(outcome.success).toBe(true);
    expect(outcome.result?.metadata?.title).toBe(
      "NOTWEB Test Website",
    );
    expect(outcome.result?.metadata?.language).toBe("en");
    expect(outcome.result?.metadata?.viewport).toContain(
      "width=device-width",
    );
  });

  it("records the requested and final URLs", () => {
    const outcome = runWebsiteAnalysis({
      url: "https://example.com",
      finalUrl: "https://example.com/home",
      html: SAMPLE_HTML,
    });

    expect(outcome.success).toBe(true);
    expect(outcome.result?.requestedUrl).toBe(
      "https://example.com/",
    );
    expect(outcome.result?.analyzedUrl).toBe(
      "https://example.com/home",
    );
    expect(outcome.result?.metadata?.finalUrl).toBe(
      "https://example.com/home",
    );
  });

  it("runs only the requested analysis categories", () => {
    const outcome = runWebsiteAnalysis({
      url: "https://example.com",
      html: SAMPLE_HTML,
      includeCategories: ["security"],
    });

    expect(outcome.success).toBe(true);

    const categories = new Set(
      outcome.result?.issues.map((issue) => issue.category),
    );

    for (const category of categories) {
      expect(category).toBe("security");
    }

    expect(outcome.result?.scores).toHaveLength(1);
    expect(outcome.result?.scores[0]?.category).toBe("security");
  });

  it("includes category scores and issue counts", () => {
    const outcome = runWebsiteAnalysis({
      url: "https://example.com",
      html: SAMPLE_HTML,
    });

    expect(outcome.success).toBe(true);

    for (const score of outcome.result?.scores ?? []) {
      expect(score.score).toBeGreaterThanOrEqual(0);
      expect(score.score).toBeLessThanOrEqual(100);
      expect(score.issueCount).toBeGreaterThanOrEqual(0);
    }
  });

  it("creates a completed result with timing information", () => {
    const outcome = runWebsiteAnalysis({
      url: "https://example.com",
      html: SAMPLE_HTML,
    });

    expect(outcome.success).toBe(true);
    expect(outcome.result?.id).toBeTruthy();
    expect(outcome.result?.startedAt).toBeTruthy();
    expect(outcome.result?.completedAt).toBeTruthy();
    expect(outcome.result?.durationMs).toBeGreaterThanOrEqual(0);
  });

  it("throws when analyzeWebsite receives invalid input", () => {
    expect(() =>
      analyzeWebsite({
        url: "invalid-url",
        html: SAMPLE_HTML,
      }),
    ).toThrow();
  });

  it("exposes the pipeline through its public API", () => {
    expect(websiteAnalysisPipeline.run).toBe(
      runWebsiteAnalysis,
    );
    expect(websiteAnalysisPipeline.analyze).toBe(
      analyzeWebsite,
    );
  });
});

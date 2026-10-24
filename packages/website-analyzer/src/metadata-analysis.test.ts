
import { describe, expect, it } from "vitest";

import {
  analyzeMetadata,
  getMetadataIssues,
} from "./metadata-analysis.js";

import type {
  WebsiteMetadata,
} from "./index.js";

function createMetadata(
  overrides: Partial<WebsiteMetadata> = {},
): WebsiteMetadata {
  return {
    url: "https://example.com/",
    title: "Example Website",
    description: "A website used for metadata analysis tests.",
    language: "en",
    charset: "UTF-8",
    viewport: "width=device-width, initial-scale=1",
    canonicalUrl: "https://example.com/",
    faviconUrl: "https://example.com/favicon.ico",
    robots: "index, follow",
    author: "NOTWEB",
    keywords: "website, testing",
    openGraph: {
      title: "Example Website",
      description: "A website used for metadata analysis tests.",
      image: "https://example.com/preview.png",
    },
    twitterCard: {
      card: "summary_large_image",
      title: "Example Website",
      description: "A website used for metadata analysis tests.",
    },
    twitter: {
      card: "summary_large_image",
    },
    ...overrides,
  };
}

describe("metadata analysis", () => {
  it("returns a perfect score when all checked metadata is present", () => {
    const result = analyzeMetadata({
      metadata: createMetadata(),
      html: "<html lang=\"en\"><head><title>Example Website</title></head></html>",
    });

    expect(result.score).toBe(100);
    expect(result.issues).toHaveLength(0);
    expect(result.checksPerformed).toBeGreaterThan(0);
  });

  it("reports a missing page title", () => {
    const result = analyzeMetadata({
      metadata: createMetadata({
        title: null,
      }),
    });

    expect(
      result.issues.some(
        (issue) => issue.id === "metadata-missing-title",
      ),
    ).toBe(true);
  });

  it("reports a missing meta description", () => {
    const result = analyzeMetadata({
      metadata: createMetadata({
        description: null,
      }),
    });

    expect(
      result.issues.some(
        (issue) => issue.id === "metadata-missing-description",
      ),
    ).toBe(true);
  });

  it("reports a title that exceeds 60 characters", () => {
    const result = analyzeMetadata({
      metadata: createMetadata({
        title: "A".repeat(61),
      }),
    });

    expect(
      result.issues.some(
        (issue) => issue.id === "metadata-long-title",
      ),
    ).toBe(true);
  });

  it("reports a description that exceeds 160 characters", () => {
    const result = analyzeMetadata({
      metadata: createMetadata({
        description: "A".repeat(161),
      }),
    });

    expect(
      result.issues.some(
        (issue) => issue.id === "metadata-long-description",
      ),
    ).toBe(true);
  });

  it("reports missing document language", () => {
    const result = analyzeMetadata({
      metadata: createMetadata({
        language: null,
      }),
    });

    expect(
      result.issues.some(
        (issue) => issue.id === "metadata-missing-language",
      ),
    ).toBe(true);
  });

  it("reports missing viewport metadata", () => {
    const result = analyzeMetadata({
      metadata: createMetadata({
        viewport: null,
      }),
    });

    expect(
      result.issues.some(
        (issue) => issue.id === "metadata-missing-viewport",
      ),
    ).toBe(true);
  });

  it("reports a missing canonical URL", () => {
    const result = analyzeMetadata({
      metadata: createMetadata({
        canonicalUrl: null,
      }),
    });

    expect(
      result.issues.some(
        (issue) => issue.id === "metadata-missing-canonical",
      ),
    ).toBe(true);
  });

  it("reports missing Open Graph fields", () => {
    const result = analyzeMetadata({
      metadata: createMetadata({
        openGraph: {},
      }),
    });

    const issueIds = result.issues.map((issue) => issue.id);

    expect(issueIds).toContain("metadata-missing-og-title");
    expect(issueIds).toContain("metadata-missing-og-description");
    expect(issueIds).toContain("metadata-missing-og-image");
  });

  it("reports missing Twitter card metadata", () => {
    const result = analyzeMetadata({
      metadata: createMetadata({
        twitterCard: {},
      }),
    });

    expect(
      result.issues.some(
        (issue) => issue.id === "metadata-missing-twitter-card",
      ),
    ).toBe(true);
  });

  it("reports a missing title element in supplied HTML", () => {
    const result = analyzeMetadata({
      metadata: createMetadata(),
      html: "<html><head></head><body>Example</body></html>",
    });

    expect(
      result.issues.some(
        (issue) => issue.id === "metadata-title-element-missing",
      ),
    ).toBe(true);
  });

  it("does not duplicate the missing-title finding", () => {
    const result = analyzeMetadata({
      metadata: createMetadata({
        title: null,
      }),
      html: "<html><head></head></html>",
    });

    const matchingIssues = result.issues.filter(
      (issue) =>
        issue.id === "metadata-missing-title" ||
        issue.id === "metadata-title-element-missing",
    );

    expect(matchingIssues).toHaveLength(1);
    expect(matchingIssues[0]?.id).toBe("metadata-missing-title");
  });

  it("calculates a score between 0 and 100", () => {
    const result = analyzeMetadata({
      metadata: createMetadata({
        title: null,
        description: null,
        language: null,
        viewport: null,
        canonicalUrl: null,
        openGraph: {},
        twitterCard: {},
      }),
    });

    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it("returns only issues through getMetadataIssues", () => {
    const metadata = createMetadata({
      title: null,
    });

    const issues = getMetadataIssues({ metadata });

    expect(Array.isArray(issues)).toBe(true);
    expect(
      issues.some(
        (issue) => issue.id === "metadata-missing-title",
      ),
    ).toBe(true);
  });

  it("treats whitespace-only titles and descriptions as missing", () => {
    const result = analyzeMetadata({
      metadata: createMetadata({
        title: "   ",
        description: "   ",
      }),
    });

    const issueIds = result.issues.map((issue) => issue.id);

    expect(issueIds).toContain("metadata-missing-title");
    expect(issueIds).toContain("metadata-missing-description");
  });
});

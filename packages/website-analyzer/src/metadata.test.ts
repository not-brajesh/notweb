

import { describe, expect, it } from "vitest";

import {
  extractWebsiteMetadata,
  extractMetadata,
  getMetadataOrigin,
} from "./metadata.js";

describe("extractWebsiteMetadata", () => {
  it("extracts the document title", () => {
    const result = extractWebsiteMetadata(
      "<html><head><title>Example Website</title></head></html>",
    );

    expect(result.metadata.title).toBe("Example Website");
  });

  it("extracts the meta description", () => {
    const html = `
      <html>
        <head>
          <meta name="description" content="A sample website description">
        </head>
      </html>
    `;

    const result = extractWebsiteMetadata(html);

    expect(result.metadata.description).toBe(
      "A sample website description",
    );
  });

  it("extracts the document language", () => {
    const result = extractWebsiteMetadata(
      '<html lang="en"><head></head></html>',
    );

    expect(result.metadata.language).toBe("en");
  });

  it("extracts viewport metadata", () => {
    const result = extractWebsiteMetadata(
      '<meta name="viewport" content="width=device-width, initial-scale=1">',
    );

    expect(result.metadata.viewport).toBe(
      "width=device-width, initial-scale=1",
    );
  });

  it("extracts Open Graph metadata", () => {
    const html = `
      <meta property="og:title" content="Social Title">
      <meta property="og:description" content="Social Description">
      <meta property="og:type" content="website">
    `;

    const result = extractWebsiteMetadata(html);

    expect(result.metadata.openGraph.title).toBe("Social Title");
    expect(result.metadata.openGraph.description).toBe(
      "Social Description",
    );
    expect(result.metadata.openGraph.type).toBe("website");
  });

  it("extracts Twitter card metadata", () => {
    const html = `
      <meta name="twitter:card" content="summary_large_image">
      <meta name="twitter:title" content="Twitter Title">
    `;

    const result = extractWebsiteMetadata(html);

    expect(result.metadata.twitterCard.card).toBe(
      "summary_large_image",
    );
    expect(result.metadata.twitterCard.title).toBe("Twitter Title");
  });

  it("resolves relative canonical URLs", () => {
    const result = extractWebsiteMetadata(
      '<link rel="canonical" href="/products">',
      { baseUrl: "https://example.com/page" },
    );

    expect(result.metadata.canonicalUrl).toBe(
      "https://example.com/products",
    );
  });

  it("resolves relative favicon URLs", () => {
    const result = extractWebsiteMetadata(
      '<link rel="icon" href="/favicon.ico">',
      { baseUrl: "https://example.com/page" },
    );

    expect(result.metadata.faviconUrl).toBe(
      "https://example.com/favicon.ico",
    );
  });

  it("reports missing title and description", () => {
    const result = extractWebsiteMetadata("<html><head></head></html>");

    expect(result.errors).toContain(
      "The HTML document does not contain a title.",
    );

    expect(result.errors).toContain(
      "The HTML document does not contain a meta description.",
    );
  });

  it("decodes common HTML entities", () => {
    const result = extractWebsiteMetadata(
      "<title>Tom &amp; Jerry</title>",
    );

    expect(result.metadata.title).toBe("Tom & Jerry");
  });
});

describe("extractMetadata", () => {
  it("returns the metadata object directly", () => {
    const metadata = extractMetadata("<title>Direct Helper</title>");

    expect(metadata.title).toBe("Direct Helper");
    expect(metadata.openGraph).toEqual({});
    expect(metadata.twitterCard).toEqual({});
  });
});

describe("getMetadataOrigin", () => {
  it("returns the origin of an HTTPS URL", () => {
    expect(
      getMetadataOrigin("https://example.com/products?id=1"),
    ).toBe("https://example.com");
  });

  it("returns undefined for unsupported protocols", () => {
    expect(getMetadataOrigin("javascript:alert(1)")).toBeUndefined();
  });

  it("returns undefined for malformed URLs", () => {
    expect(getMetadataOrigin("not a URL")).toBeUndefined();
  });

  it("returns undefined for URLs containing credentials", () => {
    expect(
      getMetadataOrigin("https://user:password@example.com"),
    ).toBeUndefined();
  });
});

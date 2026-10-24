
import { describe, expect, it } from "vitest";

import { validateAnalysisUrl } from "./index.js";

describe("validateAnalysisUrl", () => {
  describe("valid URLs", () => {
    it("accepts HTTPS URLs", () => {
      const result = validateAnalysisUrl("https://example.com");

      expect(result.valid).toBe(true);
      expect(result.normalizedUrl).toBe("https://example.com/");
    });

    it("accepts HTTP URLs", () => {
      const result = validateAnalysisUrl("http://example.com");

      expect(result.valid).toBe(true);
      expect(result.normalizedUrl).toBe("http://example.com/");
    });

    it("normalizes URLs with surrounding whitespace", () => {
      const result = validateAnalysisUrl("  https://example.com  ");

      expect(result.valid).toBe(true);
      expect(result.normalizedUrl).toBe("https://example.com/");
    });

    it("preserves paths and query parameters", () => {
      const result = validateAnalysisUrl(
        "https://example.com/products?id=123",
      );

      expect(result.valid).toBe(true);
      expect(result.normalizedUrl).toBe(
        "https://example.com/products?id=123",
      );
    });
  });

  describe("invalid URLs", () => {
    it("rejects an empty URL", () => {
      const result = validateAnalysisUrl("");

      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("rejects whitespace-only input", () => {
      const result = validateAnalysisUrl("   ");

      expect(result.valid).toBe(false);
    });

    it("rejects URLs without a protocol", () => {
      const result = validateAnalysisUrl("example.com");

      expect(result.valid).toBe(false);
    });

    it("rejects unsupported protocols", () => {
      const result = validateAnalysisUrl("ftp://example.com");

      expect(result.valid).toBe(false);
    });

    it("rejects JavaScript URLs", () => {
      const result = validateAnalysisUrl(
        "javascript:alert(1)",
      );

      expect(result.valid).toBe(false);
    });

    it("rejects URLs containing credentials", () => {
      const result = validateAnalysisUrl(
        "https://user:password@example.com",
      );

      expect(result.valid).toBe(false);
    });

    it("rejects malformed URLs", () => {
      const result = validateAnalysisUrl("https://");

      expect(result.valid).toBe(false);
    });
  });
});

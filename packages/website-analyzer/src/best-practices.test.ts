
import { describe, expect, it } from "vitest";

import {
  analyzeBestPractices,
  getBestPracticesIssues,
} from "./best-practices.js";

const VALID_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>NOTWEB Test Page</title>
</head>
<body>
  <main>
    <h1>Welcome</h1>
    <p>This is a valid test page.</p>
    <img src="/image.png" alt="Example image">
    <a href="/about">About us</a>
    <button type="button">Continue</button>
  </main>
</body>
</html>`;

describe("Best Practices Analysis", () => {
  it("returns a perfect score for clean HTML", () => {
    const result = analyzeBestPractices({ html: VALID_HTML });

    expect(result.score).toBe(100);
    expect(result.issues).toHaveLength(0);
    expect(result.checksPerformed).toBe(10);
  });

  it("detects a missing HTML doctype", () => {
    const result = analyzeBestPractices({
      html: "<html lang=\"en\"><head></head><body></body></html>",
    });

    expect(result.issues).toContainEqual(
      expect.objectContaining({
        id: "best-practices-missing-doctype",
        severity: "medium",
      }),
    );

    expect(result.metrics.hasDoctype).toBe(false);
  });

  it("detects a missing HTML root element", () => {
    const result = analyzeBestPractices({
      html: "<!DOCTYPE html><head></head><body>Hello</body>",
    });

    expect(result.issues).toContainEqual(
      expect.objectContaining({
        id: "best-practices-missing-html-element",
      }),
    );
  });

  it("detects missing head and body elements", () => {
    const result = analyzeBestPractices({
      html: "<!DOCTYPE html><html lang=\"en\"></html>",
    });

    const issueIds = result.issues.map((issue) => issue.id);

    expect(issueIds).toContain("best-practices-missing-head");
    expect(issueIds).toContain("best-practices-missing-body");
  });

  it("detects a missing document language", () => {
    const result = analyzeBestPractices({
      html: "<!DOCTYPE html><html><head></head><body></body></html>",
    });

    expect(result.issues).toContainEqual(
      expect.objectContaining({
        id: "best-practices-missing-language",
      }),
    );

    expect(result.metrics.hasDocumentLanguage).toBe(false);
  });

  it("accepts quoted and unquoted language attributes", () => {
    const quoted = analyzeBestPractices({
      html: '<!DOCTYPE html><html lang="en"><head></head><body></body></html>',
    });

    const unquoted = analyzeBestPractices({
      html: "<!DOCTYPE html><html lang=en><head></head><body></body></html>",
    });

    expect(quoted.metrics.hasDocumentLanguage).toBe(true);
    expect(unquoted.metrics.hasDocumentLanguage).toBe(true);
  });

  it("detects deprecated presentational elements", () => {
    const result = analyzeBestPractices({
      html: "<!DOCTYPE html><html><body><font>Text</font><center>Title</center></body></html>",
    });

    expect(result.metrics.deprecatedElementCount).toBe(2);

    expect(result.issues).toContainEqual(
      expect.objectContaining({
        id: "best-practices-deprecated-elements",
      }),
    );
  });

  it("detects inline event handlers", () => {
    const result = analyzeBestPractices({
      html: '<!DOCTYPE html><html><body><button onclick="run()" onfocus="focus()">Run</button></body></html>',
    });

    expect(result.metrics.inlineEventHandlerCount).toBe(2);

    expect(result.issues).toContainEqual(
      expect.objectContaining({
        id: "best-practices-inline-event-handlers",
      }),
    );
  });

  it("detects links with an empty href", () => {
    const result = analyzeBestPractices({
      html: '<!DOCTYPE html><html><body><a href="">Empty</a><a href=""> </a></body></html>',
    });

    expect(result.metrics.emptyLinkCount).toBe(2);

    expect(result.issues).toContainEqual(
      expect.objectContaining({
        id: "best-practices-empty-links",
        severity: "high",
      }),
    );
  });

  it("detects empty buttons", () => {
    const result = analyzeBestPractices({
      html: "<!DOCTYPE html><html><body><button></button><button> </button></body></html>",
    });

    expect(result.metrics.emptyButtonCount).toBe(2);

    expect(result.issues).toContainEqual(
      expect.objectContaining({
        id: "best-practices-empty-buttons",
      }),
    );
  });

  it("detects inline style attributes", () => {
    const result = analyzeBestPractices({
      html: '<!DOCTYPE html><html><body><p style="color: red">One</p><div style="margin: 0">Two</div></body></html>',
    });

    expect(result.metrics.inlineStyleCount).toBe(2);

    expect(result.issues).toContainEqual(
      expect.objectContaining({
        id: "best-practices-inline-styles",
        severity: "info",
      }),
    );
  });

  it("detects images without alt attributes", () => {
    const result = analyzeBestPractices({
      html: '<!DOCTYPE html><html><body><img src="one.png"><img src="two.png" alt="Second image"></body></html>',
    });

    expect(result.metrics.missingImageAltCount).toBe(1);

    expect(result.issues).toContainEqual(
      expect.objectContaining({
        id: "best-practices-images-without-alt",
        severity: "high",
      }),
    );
  });

  it("does not report an image with an empty alt attribute as missing alt", () => {
    const result = analyzeBestPractices({
      html: '<!DOCTYPE html><html><body><img src="decorative.png" alt=""></body></html>',
    });

    expect(result.metrics.missingImageAltCount).toBe(0);
    expect(result.issues).not.toContainEqual(
      expect.objectContaining({
        id: "best-practices-images-without-alt",
      }),
    );
  });

  it("calculates a score between 0 and 100", () => {
    const result = analyzeBestPractices({
      html: "<font onclick=\"run()\"><img src=\"image.png\"><a href=\"\"> </a></font>",
    });

    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it("returns issues through the convenience helper", () => {
    const input = {
      html: "<html><body><img src=\"image.png\"></body></html>",
    };

    expect(getBestPracticesIssues(input)).toEqual(
      analyzeBestPractices(input).issues,
    );
  });

  it("returns no issues for an empty string beyond missing document structure", () => {
    const result = analyzeBestPractices({ html: "" });
    const issueIds = result.issues.map((issue) => issue.id);

    expect(issueIds).toContain("best-practices-missing-doctype");
    expect(issueIds).toContain("best-practices-missing-html-element");
    expect(issueIds).toContain("best-practices-missing-head");
    expect(issueIds).toContain("best-practices-missing-body");
    expect(result.checksPerformed).toBe(10);
  });
});


/**
 * NOTWEB — Performance Analyzer
 *
 * Detects potential performance issues in supplied HTML.
 *
 * This module does not fetch resources, execute JavaScript, or measure
 * real-world loading performance. Findings are static HTML heuristics.
 */

import type {
  AnalysisIssue,
  AnalysisSeverity,
} from "./index.js";

export interface PerformanceAnalysisInput {
  html: string;
}

export interface PerformanceAnalysisResult {
  score: number;
  issues: AnalysisIssue[];
  checksPerformed: number;
  metrics: {
    htmlSizeBytes: number;
    scriptCount: number;
    stylesheetCount: number;
    imageCount: number;
    imagesWithoutDimensions: number;
    imagesWithoutLazyLoading: number;
    renderBlockingScripts: number;
    inlineScriptBytes: number;
  };
}

interface PerformanceCheck {
  id: string;
  title: string;
  description: string;
  recommendation: string;
  severity: AnalysisSeverity;
  failed: boolean;
  element?: string;
  documentationUrl?: string;
}

function getAttributes(tag: string): string {
  return tag.replace(/^<\/?\w+\b/i, "").replace(/\/?>$/, "");
}

function getAttribute(
  attributes: string,
  name: string,
): string | undefined {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const expression = new RegExp(
    `(?:^|\\s)${escapedName}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'=<>\\x60]+))`,
    "i",
  );

  const match = expression.exec(attributes);

  return match?.[1] ?? match?.[2] ?? match?.[3];
}

function hasAttribute(attributes: string, name: string): boolean {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  return new RegExp(`(?:^|\\s)${escapedName}(?:\\s|=|$)`, "i").test(
    attributes,
  );
}

function getTagMatches(html: string, tagName: string): string[] {
  const escapedName = tagName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const expression = new RegExp(
    `<${escapedName}\\b[^>]*>`,
    "gi",
  );

  return html.match(expression) ?? [];
}



function getInlineScriptBytes(html: string): number {
  const scripts = [
    ...html.matchAll(
      /<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi,
    ),
  ];

  let total = 0;

  for (const match of scripts) {
    const attributes = match[1] ?? "";
    const content = match[2] ?? "";

    if (!hasAttribute(attributes, "src")) {
      total += new TextEncoder().encode(content).byteLength;
    }
  }

  return total;
}

function createIssue(check: PerformanceCheck): AnalysisIssue {
  return {
    id: check.id,
    category: "performance",
    severity: check.severity,
    title: check.title,
    description: check.description,
    recommendation: check.recommendation,
    ...(check.element !== undefined ? { element: check.element } : {}),
    ...(check.documentationUrl !== undefined
      ? { documentationUrl: check.documentationUrl }
      : {}),
  };
}

/**
 * Analyze potential performance concerns using static HTML.
 */
export function analyzePerformance(
  input: PerformanceAnalysisInput,
): PerformanceAnalysisResult {
  const { html } = input;

  const issues: AnalysisIssue[] = [];
  const checks: PerformanceCheck[] = [];

  const scripts = getTagMatches(html, "script");
  const stylesheets = (html.match(/<link\b[^>]*>/gi) ?? []).filter(
    (tag) => {
      const rel = getAttribute(getAttributes(tag), "rel");

      return rel?.toLowerCase().split(/\s+/).includes("stylesheet") ?? false;
    },
  );

  const images = getTagMatches(html, "img");

  const imagesWithoutDimensions = images.filter((image) => {
    const attributes = getAttributes(image);

    return (
      !getAttribute(attributes, "width") ||
      !getAttribute(attributes, "height")
    );
  });

  const imagesWithoutLazyLoading = images.filter((image) => {
    const attributes = getAttributes(image);
    const loading = getAttribute(attributes, "loading")?.toLowerCase();

    return loading !== "lazy" && loading !== "eager";
  });

  const renderBlockingScripts = scripts.filter((script) => {
    const attributes = getAttributes(script);

    return (
      !hasAttribute(attributes, "src") ||
      (!hasAttribute(attributes, "defer") &&
        !hasAttribute(attributes, "async") &&
        getAttribute(attributes, "type")?.toLowerCase() !== "module")
    );
  });

  const inlineScriptBytes = getInlineScriptBytes(html);
  const htmlSizeBytes = new TextEncoder().encode(html).byteLength;

  const addCheck = (check: PerformanceCheck): void => {
    checks.push(check);

    if (check.failed) {
      issues.push(createIssue(check));
    }
  };

  addCheck({
    id: "performance-html-size",
    title: "Large HTML document",
    description:
      `The supplied HTML is ${htmlSizeBytes.toLocaleString()} bytes. This heuristic flags documents larger than 100 KB.`,
    recommendation:
      "Review unnecessary markup and large inline payloads. Consider server-side compression and reducing redundant HTML.",
    severity: "medium",
    failed: htmlSizeBytes > 100 * 1024,
    element: "HTML document",
  });

  addCheck({
    id: "performance-render-blocking-scripts",
    title: "Potential render-blocking scripts",
    description:
      `${renderBlockingScripts.length} script elements may block HTML parsing or rendering. This static check cannot determine actual runtime impact.`,
    recommendation:
      "Where appropriate, use defer, async, or type=\"module\". Preserve execution order and dependencies when changing script loading behavior.",
    severity: "medium",
    failed: renderBlockingScripts.length > 0,
    element: "<script>",
    documentationUrl:
      "https://web.dev/articles/efficiently-load-third-party-javascript",
  });

  addCheck({
    id: "performance-images-missing-dimensions",
    title: "Images missing explicit dimensions",
    description:
      `${imagesWithoutDimensions.length} of ${images.length} images lack a detectable width or height attribute.`,
    recommendation:
      "Specify image dimensions or an appropriate aspect ratio to help browsers reserve layout space and reduce layout shifts.",
    severity: "low",
    failed: imagesWithoutDimensions.length > 0,
    element: "<img>",
    documentationUrl:
      "https://web.dev/articles/optimize-cls",
  });

  addCheck({
    id: "performance-images-lazy-loading",
    title: "Images without an explicit loading hint",
    description:
      `${imagesWithoutLazyLoading.length} of ${images.length} images do not declare loading=\"lazy\" or loading=\"eager\".`,
    recommendation:
      "Consider lazy-loading below-the-fold images. Keep important above-the-fold and Largest Contentful Paint images eager when appropriate.",
    severity: "info",
    failed: imagesWithoutLazyLoading.length > 0,
    element: "<img loading>",
    documentationUrl:
      "https://web.dev/articles/browser-level-image-lazy-loading",
  });

  
  addCheck({
    id: "performance-many-scripts",
    title: "Many script elements detected",
    description:
      `${scripts.length} script elements were found. This heuristic flags documents containing more than 10 script elements.`,
    recommendation:
      "Review script loading and dependency usage. Consolidation is not always beneficial when caching or code splitting is involved.",
    severity: "low",
    failed: scripts.length > 10,
    element: "<script>",
  });

  addCheck({
    id: "performance-many-stylesheets",
    title: "Many stylesheet references detected",
    description:
      `${stylesheets.length} stylesheet links were found. This heuristic flags documents containing more than 5 stylesheet references.`,
    recommendation:
      "Review CSS delivery, unused styles, and critical rendering requirements. Avoid combining files blindly if it harms caching or code splitting.",
    severity: "low",
    failed: stylesheets.length > 5,
    element: '<link rel="stylesheet">',
  });

  addCheck({
    id: "performance-large-inline-scripts",
    title: "Large inline JavaScript payload",
    description:
      `Inline script content totals ${inlineScriptBytes.toLocaleString()} bytes. This heuristic flags totals above 50 KB.`,
    recommendation:
      "Review large inline scripts. External files may improve caching, but choose the strategy based on the application's delivery and security requirements.",
    severity: "medium",
    failed: inlineScriptBytes > 50 * 1024,
    element: "<script>",
  });

  const preloadLinks = (html.match(/<link\b[^>]*>/gi) ?? []).filter(
    (tag) => {
      const rel = getAttribute(getAttributes(tag), "rel");

      return rel?.toLowerCase() === "preload";
    },
  );

  addCheck({
    id: "performance-preload-review",
    title: "Resource preload strategy needs review",
    description:
      "Static HTML analysis cannot determine whether critical resources are appropriately prioritized.",
    recommendation:
      "Use preload only for resources needed very early in the page lifecycle, and verify its impact using browser performance traces.",
    severity: "info",
    failed: preloadLinks.length === 0,
    element: '<link rel="preload">',
  });

  const penaltyBySeverity: Record<AnalysisSeverity, number> = {
    critical: 25,
    high: 15,
    medium: 8,
    low: 3,
    info: 0,
  };

  const penalty = issues.reduce(
    (total, issue) => total + penaltyBySeverity[issue.severity],
    0,
  );

  return {
    score: Math.max(0, 100 - penalty),
    issues,
    checksPerformed: checks.length,
    metrics: {
      htmlSizeBytes,
      scriptCount: scripts.length,
      stylesheetCount: stylesheets.length,
      imageCount: images.length,
      imagesWithoutDimensions: imagesWithoutDimensions.length,
      imagesWithoutLazyLoading: imagesWithoutLazyLoading.length,
      renderBlockingScripts: renderBlockingScripts.length,
      inlineScriptBytes,
    },
  };
}

/**
 * Convenience helper returning only performance findings.
 */
export function getPerformanceIssues(
  input: PerformanceAnalysisInput,
): AnalysisIssue[] {
  return analyzePerformance(input).issues;
}

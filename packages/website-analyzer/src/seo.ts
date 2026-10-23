
/**
 * NOTWEB — SEO Analyzer
 *
 * Performs deterministic SEO checks on already-available HTML and metadata.
 * This module does not fetch websites or execute JavaScript.
 */

import type {
  AnalysisIssue,
  AnalysisSeverity,
  WebsiteMetadata,
} from "./index.js";

export interface SeoAnalysisInput {
  html: string;
  metadata: WebsiteMetadata;
  /** Optional observed HTTP status from a trusted fetching layer. */
  statusCode?: number;
}

export interface SeoAnalysisResult {
  score: number;
  issues: AnalysisIssue[];
  checksPerformed: number;
}

interface SeoCheck {
  id: string;
  title: string;
  description: string;
  recommendation: string;
  severity: AnalysisSeverity;
  failed: boolean;
  element?: string;
  documentationUrl?: string;
}

function countMatches(html: string, expression: RegExp): number {
  return [...html.matchAll(expression)].length;
}

function getTagAttributes(tag: string): string {
  return tag.replace(/^<\w+\b/i, "").replace(/\/?>$/, "");
}

function getAttribute(
  attributes: string,
  attributeName: string,
): string | undefined {
  const escapedName = attributeName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const expression = new RegExp(
    `(?:^|\\s)${escapedName}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'=<>\\x60]+))`,
    "i",
  );

  const match = expression.exec(attributes);
  return match?.[1] ?? match?.[2] ?? match?.[3];
}

function extractTitleTags(html: string): string[] {
  return [...html.matchAll(/<title\b[^>]*>([\s\S]*?)<\/title\s*>/gi)]
    .map((match) => (match[1] ?? "").replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function extractMetaTags(html: string): Array<{
  name: string;
  content: string;
}> {
  const tags = html.match(/<meta\b[^>]*>/gi) ?? [];

  return tags.flatMap((tag) => {
    const attributes = getTagAttributes(tag);
    const name =
      getAttribute(attributes, "name") ??
      getAttribute(attributes, "property");

    const content = getAttribute(attributes, "content");

    return name && content !== undefined
      ? [{ name: name.trim().toLowerCase(), content: content.trim() }]
      : [];
  });
}

function getMetaValues(
  metaTags: Array<{ name: string; content: string }>,
  names: readonly string[],
): string[] {
  const acceptedNames = new Set(names.map((name) => name.toLowerCase()));

  return metaTags
    .filter((tag) => acceptedNames.has(tag.name))
    .map((tag) => tag.content)
    .filter((value) => value.length > 0);
}

function createIssue(check: SeoCheck): AnalysisIssue {
  return {
    id: check.id,
    category: "seo",
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
 * Analyze common on-page SEO signals.
 *
 * The score is a heuristic for prioritization, not a Google ranking
 * prediction or a substitute for a complete SEO audit.
 */
export function analyzeSeo(input: SeoAnalysisInput): SeoAnalysisResult {
  const { html, metadata, statusCode } = input;
  const issues: AnalysisIssue[] = [];
  const checks: SeoCheck[] = [];

  const titleTags = extractTitleTags(html);
  const metaTags = extractMetaTags(html);
  const descriptionTags = getMetaValues(metaTags, ["description"]);
  const robotsTags = getMetaValues(metaTags, ["robots"]);
  const h1Count = countMatches(html, /<h1\b[^>]*>/gi);
  const imageTags = html.match(/<img\b[^>]*>/gi) ?? [];

  const addCheck = (check: SeoCheck): void => {
    checks.push(check);

    if (check.failed) {
      issues.push(createIssue(check));
    }
  };

  addCheck({
    id: "seo-title-missing",
    title: "Missing page title",
    description: "The HTML document does not contain a non-empty title tag.",
    recommendation:
      "Add one descriptive <title> element that accurately represents the page.",
    severity: "high",
    failed: titleTags.length === 0 || titleTags.every((title) => !title),
    element: "<title>",
    documentationUrl: "https://developers.google.com/search/docs/appearance/title-link",
  });

  const title = titleTags[0] ?? metadata.title ?? "";

  addCheck({
    id: "seo-title-length",
    title: "Page title length may need improvement",
    description: `The detected title contains ${title.length} characters. This check flags titles shorter than 10 or longer than 60 characters as a heuristic.`,
    recommendation:
      "Write a unique, descriptive title. Treat character counts as guidance rather than a strict search-engine limit.",
    severity: "low",
    failed: title.length > 0 && (title.length < 10 || title.length > 60),
    element: "<title>",
    documentationUrl: "https://developers.google.com/search/docs/appearance/title-link",
  });

  addCheck({
    id: "seo-description-missing",
    title: "Missing meta description",
    description:
      "No non-empty standard meta description was found in the HTML.",
    recommendation:
      "Add a concise, page-specific <meta name=\"description\"> tag.",
    severity: "medium",
    failed: descriptionTags.length === 0 && !metadata.description,
    element: '<meta name="description">',
    documentationUrl:
      "https://developers.google.com/search/docs/appearance/snippet",
  });

  const description = descriptionTags[0] ?? metadata.description ?? "";

  addCheck({
    id: "seo-description-length",
    title: "Meta description length may need improvement",
    description: `The detected description contains ${description.length} characters. This check flags descriptions shorter than 50 or longer than 160 characters as a heuristic.`,
    recommendation:
      "Write a useful, unique summary of the page. Search engines may display a different snippet.",
    severity: "low",
    failed:
      description.length > 0 &&
      (description.length < 50 || description.length > 160),
    element: '<meta name="description">',
    documentationUrl:
      "https://developers.google.com/search/docs/appearance/snippet",
  });

  addCheck({
    id: "seo-h1-missing",
    title: "Missing primary heading",
    description: "No H1 heading was found in the supplied HTML.",
    recommendation:
      "Add a clear main heading that describes the page's primary content.",
    severity: "medium",
    failed: h1Count === 0,
    element: "<h1>",
  });

  addCheck({
    id: "seo-h1-multiple",
    title: "Multiple H1 headings detected",
    description: `${h1Count} H1 elements were found. Multiple H1 elements are allowed in HTML, so this is a review suggestion rather than a standards violation.`,
    recommendation:
      "Check that the heading hierarchy communicates the page structure clearly.",
    severity: "info",
    failed: h1Count > 1,
    element: "<h1>",
  });

  const canonicalTags = (html.match(/<link\b[^>]*>/gi) ?? []).filter(
    (tag) => {
      const rel = getAttribute(getTagAttributes(tag), "rel");

      return rel?.toLowerCase().split(/\s+/).includes("canonical") ?? false;
    },
  );

  addCheck({
    id: "seo-canonical-missing",
    title: "Canonical link not found",
    description:
      "The supplied HTML does not contain a canonical link element.",
    recommendation:
      "If the page has duplicate or equivalent URLs, provide the preferred URL using a canonical link.",
    severity: "low",
    failed: canonicalTags.length === 0 && !metadata.canonicalUrl,
    element: '<link rel="canonical">',
    documentationUrl:
      "https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls",
  });

  addCheck({
    id: "seo-canonical-duplicate",
    title: "Multiple canonical links detected",
    description: `${canonicalTags.length} canonical link elements were found.`,
    recommendation:
      "Review the canonical declarations and ensure the page has one clear preferred canonical URL.",
    severity: "medium",
    failed: canonicalTags.length > 1,
    element: '<link rel="canonical">',
    documentationUrl:
      "https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls",
  });

  const imagesWithoutAlt = imageTags.filter((tag) => {
    const attributes = getTagAttributes(tag);
    return getAttribute(attributes, "alt") === undefined;
  });

  addCheck({
    id: "seo-images-alt-missing",
    title: "Images without alt attributes",
    description: `${imagesWithoutAlt.length} of ${imageTags.length} image elements lack an alt attribute. Decorative images may use an empty alt value.`,
    recommendation:
      "Add meaningful alternative text to informative images and alt=\"\" to decorative images.",
    severity: "medium",
    failed: imagesWithoutAlt.length > 0,
    element: "<img>",
    documentationUrl:
      "https://www.w3.org/WAI/tutorials/images/",
  });

  const viewportTags = getMetaValues(metaTags, ["viewport"]);

  addCheck({
    id: "seo-viewport-missing",
    title: "Viewport meta tag missing",
    description:
      "The supplied HTML does not contain a standard viewport meta tag.",
    recommendation:
      'Add <meta name="viewport" content="width=device-width, initial-scale=1"> to support mobile viewport sizing.',
    severity: "medium",
    failed: viewportTags.length === 0 && !metadata.viewport,
    element: '<meta name="viewport">',
    documentationUrl:
      "https://developer.mozilla.org/docs/Web/HTML/Viewport_meta_tag",
  });

  addCheck({
    id: "seo-open-graph-missing",
    title: "Open Graph title or description missing",
    description:
      "Open Graph title or description metadata is incomplete.",
    recommendation:
      "Add og:title and og:description to improve how the page is represented when shared on supported platforms.",
    severity: "low",
    failed:
      !metadata.openGraph.title?.trim() ||
      !metadata.openGraph.description?.trim(),
    element: '<meta property="og:title"> / <meta property="og:description">',
  });

  addCheck({
    id: "seo-robots-noindex",
    title: "Page has a noindex directive",
    description:
      "A robots meta tag appears to contain the noindex directive.",
    recommendation:
      "Confirm that search exclusion is intentional. Remove noindex only if the page should be eligible for indexing.",
    severity: "high",
    failed: robotsTags.some((value) => /(?:^|[,\s])noindex(?:$|[,\s])/i.test(value)),
    element: '<meta name="robots">',
  });

  addCheck({
    id: "seo-http-status",
    title: "Unsuccessful HTTP status",
    description: `The supplied response status is ${statusCode ?? "unknown"}.`,
    recommendation:
      "Inspect the response status in the fetching layer and resolve unexpected client or server errors.",
    severity: "high",
    failed: statusCode !== undefined && statusCode >= 400,
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
  };
}

/**
 * Convenience helper returning only SEO issues.
 */
export function getSeoIssues(input: SeoAnalysisInput): AnalysisIssue[] {
  return analyzeSeo(input).issues;
}


/**
 * NOTWEB — Website Analyzer
 *
 * Analyzes HTML documents for basic SEO, accessibility,
 * metadata, headings, images, and links.
 *
 * This module analyzes HTML supplied by the caller.
 * It does not fetch websites or execute page scripts.
 */

export type FindingSeverity = "error" | "warning" | "info";

export type FindingCategory =
  | "seo"
  | "accessibility"
  | "metadata"
  | "headings"
  | "images"
  | "links";

export interface WebsiteFinding {
  readonly code: string;
  readonly category: FindingCategory;
  readonly severity: FindingSeverity;
  readonly message: string;
  readonly element?: string;
  readonly recommendation: string;
}

export interface WebsiteAnalysisSummary {
  readonly errors: number;
  readonly warnings: number;
  readonly info: number;
  readonly score: number;
}

export interface WebsiteMetadata {
  readonly title: string | null;
  readonly description: string | null;
  readonly canonicalUrl: string | null;
  readonly language: string | null;
  readonly viewport: string | null;
}

export interface HeadingSummary {
  readonly level: number;
  readonly text: string;
}

export interface ImageSummary {
  readonly total: number;
  readonly missingAlt: number;
  readonly emptyAlt: number;
}

export interface LinkSummary {
  readonly total: number;
  readonly withoutAccessibleName: number;
}

export interface WebsiteAnalysisResult {
  readonly analyzerVersion: "0.1.0";
  readonly analyzedAt: string;
  readonly metadata: WebsiteMetadata;
  readonly headings: readonly HeadingSummary[];
  readonly images: ImageSummary;
  readonly links: LinkSummary;
  readonly findings: readonly WebsiteFinding[];
  readonly summary: WebsiteAnalysisSummary;
}

export interface AnalyzeHtmlOptions {
  /**
   * Optional URL used to validate canonical-link URLs.
   * This does not trigger a network request.
   */
  readonly pageUrl?: string;
}

function countMatches(html: string, pattern: RegExp): number {
  return [...html.matchAll(pattern)].length;
}

function extractAttribute(
  attributes: string,
  name: string,
): string | null {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const pattern = new RegExp(
    `(?:^|\\s)${escapedName}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'=<>\\x60]+))`,
    "i",
  );

  const match = pattern.exec(attributes);

  if (!match) {
    return null;
  }

  return match[1] ?? match[2] ?? match[3] ?? "";
}

function extractText(value: string): string {
  return value
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTagAttributes(
  html: string,
  tagName: string,
): string[] {
  const escapedTag = tagName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(
    `<${escapedTag}\\b([^>]*)>`,
    "gi",
  );

  return [...html.matchAll(pattern)].map((match) => match[1] ?? "");
}

function extractMetaContent(
  html: string,
  name: string,
): string | null {
  for (const attributes of extractTagAttributes(html, "meta")) {
    const metaName =
      extractAttribute(attributes, "name") ??
      extractAttribute(attributes, "property");

    if (metaName?.toLowerCase() === name.toLowerCase()) {
      return extractAttribute(attributes, "content")?.trim() || null;
    }
  }

  return null;
}

function extractHeadings(html: string): HeadingSummary[] {
  const headings: HeadingSummary[] = [];
  const pattern = /<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1\s*>/gi;

  for (const match of html.matchAll(pattern)) {
    const text = extractText(match[2] ?? "");

    if (text) {
      headings.push({
        level: Number(match[1]),
        text,
      });
    }
  }

  return headings;
}

function calculateScore(findings: readonly WebsiteFinding[]): number {
  let deductions = 0;

  for (const finding of findings) {
    if (finding.severity === "error") {
      deductions += 15;
    } else if (finding.severity === "warning") {
      deductions += 7;
    } else {
      deductions += 2;
    }
  }

  return Math.max(0, Math.min(100, 100 - deductions));
}

/**
 * Analyze an HTML string without making network requests.
 *
 * This is a lightweight static inspection tool, not a full browser
 * accessibility audit, HTML parser, SEO crawler, or security scanner.
 */
export function analyzeHtml(
  html: string,
  options: AnalyzeHtmlOptions = {},
): WebsiteAnalysisResult {
  if (typeof html !== "string") {
    throw new TypeError("HTML input must be a string.");
  }

  const findings: WebsiteFinding[] = [];

  const addFinding = (
    finding: WebsiteFinding,
  ): void => {
    findings.push(finding);
  };

  const titleMatch = /<title\b[^>]*>([\s\S]*?)<\/title\s*>/i.exec(html);
  const title = titleMatch
    ? extractText(titleMatch[1] ?? "") || null
    : null;

  const description = extractMetaContent(html, "description");

  const viewport = extractMetaContent(html, "viewport");

  const htmlTag = /<html\b([^>]*)>/i.exec(html);
  const language = htmlTag
    ? extractAttribute(htmlTag[1] ?? "", "lang")
    : null;

  let canonicalUrl: string | null = null;

  for (const attributes of extractTagAttributes(html, "link")) {
    const rel = extractAttribute(attributes, "rel");

    if (rel?.toLowerCase().split(/\s+/).includes("canonical")) {
      const href = extractAttribute(attributes, "href");

      if (href) {
        try {
          canonicalUrl = options.pageUrl
            ? new URL(href, options.pageUrl).href
            : new URL(href).href;
        } catch {
          addFinding({
            code: "INVALID_CANONICAL_URL",
            category: "metadata",
            severity: "warning",
            message: "The canonical URL is missing a valid absolute base URL or is malformed.",
            element: "<link rel=\"canonical\">",
            recommendation:
              "Provide a valid absolute canonical URL or analyze the page with its URL.",
          });
        }
      }

      break;
    }
  }

  if (!title) {
    addFinding({
      code: "MISSING_TITLE",
      category: "seo",
      severity: "error",
      message: "The page has no usable title element.",
      element: "<title>",
      recommendation:
        "Add a concise, descriptive title that accurately represents the page.",
    });
  } else if (title.length > 60) {
    addFinding({
      code: "LONG_TITLE",
      category: "seo",
      severity: "info",
      message: "The page title is longer than 60 characters.",
      element: "<title>",
      recommendation:
        "Review the title for clarity and concision. Search engines may display different title lengths.",
    });
  }

  if (!description) {
    addFinding({
      code: "MISSING_META_DESCRIPTION",
      category: "seo",
      severity: "warning",
      message: "The page has no usable meta description.",
      element: "<meta name=\"description\">",
      recommendation:
        "Add a unique, useful meta description for the page.",
    });
  }

  if (!viewport) {
    addFinding({
      code: "MISSING_VIEWPORT",
      category: "metadata",
      severity: "warning",
      message: "The page has no viewport meta tag.",
      element: "<meta name=\"viewport\">",
      recommendation:
        "Add a viewport meta tag to help the page render appropriately on mobile devices.",
    });
  }

  if (!language?.trim()) {
    addFinding({
      code: "MISSING_DOCUMENT_LANGUAGE",
      category: "accessibility",
      severity: "warning",
      message: "The HTML element does not declare a document language.",
      element: "<html lang>",
      recommendation:
        "Set the lang attribute to the primary language of the page.",
    });
  }

  const headings = extractHeadings(html);
  const h1Count = headings.filter((heading) => heading.level === 1).length;

  if (h1Count === 0) {
    addFinding({
      code: "MISSING_H1",
      category: "headings",
      severity: "warning",
      message: "No level-one heading was found.",
      element: "<h1>",
      recommendation:
        "Consider adding a clear main heading that describes the page's primary content.",
    });
  } else if (h1Count > 1) {
    addFinding({
      code: "MULTIPLE_H1",
      category: "headings",
      severity: "info",
      message: "Multiple level-one headings were found.",
      element: "<h1>",
      recommendation:
        "Check that the heading structure clearly communicates the page's content hierarchy.",
    });
  }

  const imageAttributes = extractTagAttributes(html, "img");
  let missingAlt = 0;
  let emptyAlt = 0;

  for (const attributes of imageAttributes) {
    const alt = extractAttribute(attributes, "alt");

    if (alt === null) {
      missingAlt += 1;

      addFinding({
        code: "IMAGE_MISSING_ALT",
        category: "accessibility",
        severity: "warning",
        message: "An image has no alt attribute.",
        element: "<img>",
        recommendation:
          "Provide meaningful alternative text, or alt=\"\" for a decorative image.",
      });
    } else if (!alt.trim()) {
      emptyAlt += 1;
    }
  }

  const linkAttributes = extractTagAttributes(html, "a");
  let withoutAccessibleName = 0;

  for (const attributes of linkAttributes) {
    const href = extractAttribute(attributes, "href");

    if (href === null) {
      continue;
    }

    const accessibleName = extractAttribute(attributes, "aria-label");
    const titleAttribute = extractAttribute(attributes, "title");

    if (!accessibleName?.trim() && !titleAttribute?.trim()) {
      withoutAccessibleName += 1;
    }
  }

  if (linkAttributes.length === 0) {
    // No link-specific finding is necessary when a page has no links.
  }

  const openLinks = countMatches(html, /<a\b[^>]*>/gi);

  if (openLinks !== linkAttributes.length) {
    addFinding({
      code: "LINK_SCAN_INCOMPLETE",
      category: "links",
      severity: "info",
      message: "Some link markup may not have been fully inspected.",
      recommendation:
        "Use a standards-compliant HTML parser for more reliable analysis of malformed markup.",
    });
  }

  const summary: WebsiteAnalysisSummary = {
    errors: findings.filter((finding) => finding.severity === "error").length,
    warnings: findings.filter((finding) => finding.severity === "warning").length,
    info: findings.filter((finding) => finding.severity === "info").length,
    score: calculateScore(findings),
  };

  return {
    analyzerVersion: "0.1.0",
    analyzedAt: new Date().toISOString(),
    metadata: {
      title,
      description,
      canonicalUrl,
      language,
      viewport,
    },
    headings,
    images: {
      total: imageAttributes.length,
      missingAlt,
      emptyAlt,
    },
    links: {
      total: linkAttributes.length,
      withoutAccessibleName,
    },
    findings,
    summary,
  };
}

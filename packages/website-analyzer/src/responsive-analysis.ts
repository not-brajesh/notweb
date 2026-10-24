
/**
 * NOTWEB — Responsive Design Analysis
 *
 * Detects potential responsive-design problems from HTML source.
 *
 * Important:
 * HTML-only analysis cannot confirm actual rendered overflow or
 * layout behavior. Browser-based viewport testing is required
 * to verify visual responsiveness.
 */

import type {
  AnalysisIssue,
  AnalysisSeverity,
} from "./index.js";

export interface ResponsiveAnalysisInput {
  html: string;
  pageUrl?: string;
}

export interface ResponsiveAnalysisMetrics {
  hasViewportMeta: boolean;
  hasResponsiveImages: boolean;
  hasPictureElement: boolean;
  hasMediaQueries: boolean | null;
  fixedWidthIndicators: number;
  imagesWithoutSizing: number;
  inlineFixedWidthIndicators: number;
  totalImages: number;
  totalStylesheets: number;
}

export interface ResponsiveAnalysisResult {
  score: number;
  issues: AnalysisIssue[];
  checksPerformed: number;
  metrics: ResponsiveAnalysisMetrics;
}

interface IssueDefinition {
  id: string;
  severity: AnalysisSeverity;
  title: string;
  description: string;
  recommendation: string;
  element?: string;
}

function createIssue(
  definition: IssueDefinition,
): AnalysisIssue {
  return {
    ...definition,
    category: "responsive-design",
  };
}

function countMatches(
  source: string,
  pattern: RegExp,
): number {
  return [...source.matchAll(pattern)].length;
}

function getTagAttributes(
  tag: string,
): Record<string, string> {
  const attributes: Record<string, string> = {};

  const attributePattern =
    /([^\s=/>]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/g;

  for (const match of tag.matchAll(attributePattern)) {
    const name = match[1]?.toLowerCase();
    const value = match[2] ?? match[3] ?? match[4] ?? "";

    if (name) {
      attributes[name] = value;
    }
  }

  return attributes;
}

function hasResponsiveViewport(html: string): boolean {
  const metaTags = html.match(/<meta\b[^>]*>/gi) ?? [];

  return metaTags.some((tag) => {
    const attributes = getTagAttributes(tag);

    return attributes.name?.toLowerCase() === "viewport";
  });
}

function getImages(html: string): string[] {
  return html.match(/<img\b[^>]*>/gi) ?? [];
}

function getStylesheetLinks(html: string): string[] {
  const links = html.match(/<link\b[^>]*>/gi) ?? [];

  return links.filter((tag) => {
    const attributes = getTagAttributes(tag);

    return attributes.rel
      ?.toLowerCase()
      .split(/\s+/)
      .includes("stylesheet") ?? false;
  });
}

function hasResponsiveImageHints(html: string): boolean {
  return (
    /\bsrcset\s*=/i.test(html) ||
    /\bsizes\s*=/i.test(html)
  );
}

function countFixedWidthIndicators(html: string): number {
  const widthPatterns = [
    /\bwidth\s*:\s*\d{3,}\s*px\b/gi,
    /\bmin-width\s*:\s*\d{3,}\s*px\b/gi,
    /\bwidth\s*=\s*["']\d{3,}["']/gi,
  ];

  return widthPatterns.reduce(
    (total, pattern) => total + countMatches(html, pattern),
    0,
  );
}

function countInlineFixedWidthIndicators(
  images: readonly string[],
): number {
  return images.filter((tag) => {
    const attributes = getTagAttributes(tag);
    const style = attributes.style ?? "";

    return (
      /\bwidth\s*:\s*\d{3,}\s*px\b/i.test(style) ||
      /^\d{3,}$/.test(attributes.width ?? "")
    );
  }).length;
}

function calculateScore(
  issues: readonly AnalysisIssue[],
): number {
  const penalties: Record<AnalysisSeverity, number> = {
    critical: 25,
    high: 15,
    medium: 8,
    low: 3,
    info: 0,
  };

  const totalPenalty = issues.reduce(
    (total, issue) => total + penalties[issue.severity],
    0,
  );

  return Math.max(0, 100 - totalPenalty);
}

/**
 * Analyzes HTML for potential responsive-design issues.
 *
 * Media-query detection is reported as unknown because CSS may be
 * external, embedded, generated dynamically, or imported elsewhere.
 */
export function analyzeResponsiveDesign(
  input: ResponsiveAnalysisInput,
): ResponsiveAnalysisResult {
  const html = input.html;
  const issues: AnalysisIssue[] = [];
  let checksPerformed = 0;

  const viewportPresent = hasResponsiveViewport(html);
  checksPerformed += 1;

  if (!viewportPresent) {
    issues.push(
      createIssue({
        id: "responsive-missing-viewport",
        severity: "high",
        title: "Missing viewport meta tag",
        description:
          "No viewport meta tag was found in the HTML document.",
        recommendation:
          'Add <meta name="viewport" content="width=device-width, initial-scale=1"> inside the document head.',
        element: "head",
      }),
    );
  }

  const images = getImages(html);
  const responsiveImages = hasResponsiveImageHints(html);
  const picturePresent = /<picture\b/i.test(html);

  checksPerformed += 1;

  if (images.length > 0) {
    const imagesWithoutSizing = images.filter((tag) => {
      const attributes = getTagAttributes(tag);

      return (
        !attributes.width &&
        !attributes.height &&
        !attributes.style?.includes("max-width")
      );
    });

    if (imagesWithoutSizing.length > 0) {
      issues.push(
        createIssue({
          id: "responsive-images-without-dimensions",
          severity: "low",
          title: "Images lack explicit dimensions",
          description:
            `${imagesWithoutSizing.length} of ${images.length} image elements lack explicit width and height attributes or an inline max-width hint.`,
          recommendation:
            "Provide image dimensions to reduce layout shifts, and use CSS such as max-width: 100%; height: auto; to help images fit their containers.",
        }),
      );
    }

    checksPerformed += 1;

    if (!responsiveImages && !picturePresent) {
      issues.push(
        createIssue({
          id: "responsive-no-adaptive-image-hints",
          severity: "info",
          title: "No adaptive image hints detected",
          description:
            "The HTML does not contain srcset, sizes, or a picture element.",
          recommendation:
            "Consider srcset, sizes, and picture sources when serving different image sizes or formats to different devices.",
        }),
      );
    }
  }

  const fixedWidthIndicators = countFixedWidthIndicators(html);
  checksPerformed += 1;

  if (fixedWidthIndicators > 0) {
    issues.push(
      createIssue({
        id: "responsive-fixed-width-indicators",
        severity: "medium",
        title: "Potential fixed-width layout constraints",
        description:
          `Found ${fixedWidthIndicators} fixed-width CSS or HTML indicators that may cause problems on narrow screens.`,
        recommendation:
          "Review these declarations. Prefer fluid widths, max-width constraints, flexible grids, and appropriately scoped media queries where needed.",
      }),
    );
  }

  const inlineFixedWidthIndicators =
    countInlineFixedWidthIndicators(images);

  checksPerformed += 1;

  if (inlineFixedWidthIndicators > 0) {
    issues.push(
      createIssue({
        id: "responsive-fixed-width-images",
        severity: "medium",
        title: "Images may have fixed widths",
        description:
          `${inlineFixedWidthIndicators} image elements have fixed-width indicators in their attributes or inline styles.`,
        recommendation:
          "Check whether these images can exceed their containers on mobile screens. Consider responsive CSS sizing.",
      }),
    );
  }

  const stylesheetLinks = getStylesheetLinks(html);
  checksPerformed += 1;

  const hasEmbeddedStyles =
    /<style\b[^>]*>[\s\S]*?<\/style\s*>/i.test(html);

  const hasInlineStyleAttributes =
    /\bstyle\s*=/i.test(html);

  const hasInlineCss =
    hasEmbeddedStyles || hasInlineStyleAttributes;

  const hasMediaQueriesInHtml =
    /@media\b/i.test(html);

  const hasMediaQueries: boolean | null =
    hasMediaQueriesInHtml
      ? true
      : stylesheetLinks.length > 0
        ? null
        : hasInlineCss
          ? false
          : null;

  if (hasMediaQueries === false) {
    issues.push(
      createIssue({
        id: "responsive-no-media-query-hints",
        severity: "info",
        title: "No media-query hints detected",
        description:
          "No CSS media queries were found in the embedded or inline styles inspected.",
        recommendation:
          "Review the complete stylesheet set before concluding that breakpoints are missing. Use media queries when the layout needs to adapt at different viewport widths.",
      }),
    );
  }

  const metrics: ResponsiveAnalysisMetrics = {
    hasViewportMeta: viewportPresent,
    hasResponsiveImages: responsiveImages,
    hasPictureElement: picturePresent,
    hasMediaQueries,
    fixedWidthIndicators,
    imagesWithoutSizing: images.filter((tag) => {
      const attributes = getTagAttributes(tag);

      return (
        !attributes.width &&
        !attributes.height &&
        !attributes.style?.includes("max-width")
      );
    }).length,
    inlineFixedWidthIndicators,
    totalImages: images.length,
    totalStylesheets: stylesheetLinks.length,
  };

  return {
    score: calculateScore(issues),
    issues,
    checksPerformed,
    metrics,
  };
}

/**
 * Returns only the responsive-design findings.
 */
export function getResponsiveDesignIssues(
  input: ResponsiveAnalysisInput,
): AnalysisIssue[] {
  return analyzeResponsiveDesign(input).issues;
}

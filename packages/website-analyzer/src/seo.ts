
/**
 * NOTWEB — SEO Analysis Engine
 *
 * Analyzes website metadata and reports actionable SEO issues.
 *
 * This module performs local analysis only.
 * It does not fetch websites or guarantee search-engine rankings.
 */

import type {
  AnalysisIssue,
  WebsiteMetadata,
} from "./index.js";

/* -------------------------------------------------------------------------- */
/*                                  Options                                   */
/* -------------------------------------------------------------------------- */

export interface SeoAnalysisOptions {
  /** Recommended title length upper bound. */
  maxTitleLength?: number;

  /** Recommended title length lower bound. */
  minTitleLength?: number;

  /** Recommended description length upper bound. */
  maxDescriptionLength?: number;

  /** Recommended description length lower bound. */
  minDescriptionLength?: number;
}

const DEFAULT_OPTIONS: Required<SeoAnalysisOptions> = {
  minTitleLength: 30,
  maxTitleLength: 60,
  minDescriptionLength: 70,
  maxDescriptionLength: 160,
};

/* -------------------------------------------------------------------------- */
/*                                  Helpers                                   */
/* -------------------------------------------------------------------------- */

function createIssue(
  issue: Omit<AnalysisIssue, "id">,
): AnalysisIssue {
  return {
    id: `seo-${issue.category}-${issue.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")}`,
    ...issue,
  };
}

function normalizeOptions(
  options: SeoAnalysisOptions,
): Required<SeoAnalysisOptions> {
  const normalized = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  if (
    normalized.minTitleLength < 0 ||
    normalized.maxTitleLength < normalized.minTitleLength ||
    normalized.minDescriptionLength < 0 ||
    normalized.maxDescriptionLength <
      normalized.minDescriptionLength
  ) {
    throw new RangeError(
      "SEO length limits must be non-negative and maximums must be at least minimums.",
    );
  }

  return normalized;
}

function hasHttpUrl(value: string | undefined): boolean {
  if (!value) {
    return false;
  }

  try {
    const url = new URL(value);

    return (
      (url.protocol === "http:" || url.protocol === "https:") &&
      url.hostname.length > 0 &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}

/* -------------------------------------------------------------------------- */
/*                               SEO Analysis                                 */
/* -------------------------------------------------------------------------- */

/**
 * Analyze metadata and return actionable SEO findings.
 *
 * Only checks that can be evaluated from the supplied metadata are included.
 */
export function analyzeSeoMetadata(
  metadata: WebsiteMetadata,
  options: SeoAnalysisOptions = {},
): AnalysisIssue[] {
  const limits = normalizeOptions(options);
  const issues: AnalysisIssue[] = [];

  const title = metadata.title?.trim() ?? "";
  const description = metadata.description?.trim() ?? "";
  const canonicalUrl = metadata.canonicalUrl?.trim() ?? "";

  /* -------------------------------- Title --------------------------------- */

  if (!title) {
    issues.push(
      createIssue({
        category: "seo",
        severity: "high",
        title: "Missing page title",
        description:
          "The page does not provide a title in its analyzed metadata.",
        recommendation:
          "Add a unique, descriptive HTML title that explains the page's main topic.",
      }),
    );
  } else if (title.length < limits.minTitleLength) {
    issues.push(
      createIssue({
        category: "seo",
        severity: "low",
        title: "Page title may be too short",
        description:
          `The page title contains ${title.length} characters; ` +
          `the configured recommended minimum is ${limits.minTitleLength}.`,
        recommendation:
          "Consider making the title more descriptive without adding unnecessary words.",
      }),
    );
  } else if (title.length > limits.maxTitleLength) {
    issues.push(
      createIssue({
        category: "seo",
        severity: "medium",
        title: "Page title may be too long",
        description:
          `The page title contains ${title.length} characters; ` +
          `the configured recommended maximum is ${limits.maxTitleLength}.`,
        recommendation:
          "Shorten the title while preserving its most important information.",
      }),
    );
  }

  /* ---------------------------- Description ------------------------------ */

  if (!description) {
    issues.push(
      createIssue({
        category: "seo",
        severity: "high",
        title: "Missing meta description",
        description:
          "The analyzed metadata does not contain a meta description.",
        recommendation:
          "Add a concise, page-specific meta description summarizing the page.",
      }),
    );
  } else if (description.length < limits.minDescriptionLength) {
    issues.push(
      createIssue({
        category: "seo",
        severity: "low",
        title: "Meta description may be too short",
        description:
          `The meta description contains ${description.length} characters; ` +
          `the configured recommended minimum is ${limits.minDescriptionLength}.`,
        recommendation:
          "Expand the description with useful information that accurately represents the page.",
      }),
    );
  } else if (description.length > limits.maxDescriptionLength) {
    issues.push(
      createIssue({
        category: "seo",
        severity: "medium",
        title: "Meta description may be too long",
        description:
          `The meta description contains ${description.length} characters; ` +
          `the configured recommended maximum is ${limits.maxDescriptionLength}.`,
        recommendation:
          "Shorten the description and keep the most useful information near the beginning.",
      }),
    );
  }

  /* ----------------------------- Canonical URL --------------------------- */

  if (!canonicalUrl) {
    issues.push(
      createIssue({
        category: "seo",
        severity: "low",
        title: "Canonical URL not provided",
        description:
          "No canonical URL was found in the analyzed metadata.",
        recommendation:
          "Consider adding a canonical link when the page may be accessible through multiple URLs.",
      }),
    );
  } else if (!hasHttpUrl(canonicalUrl)) {
    issues.push(
      createIssue({
        category: "seo",
        severity: "medium",
        title: "Invalid canonical URL",
        description:
          "The canonical URL is not a valid absolute HTTP or HTTPS URL.",
        recommendation:
          "Check the canonical link and provide the intended absolute page URL.",
      }),
    );
  }

  /* ---------------------------- Open Graph ------------------------------- */

  const openGraph = metadata.openGraph;

  if (!openGraph.title?.trim()) {
    issues.push(
      createIssue({
        category: "seo",
        severity: "low",
        title: "Open Graph title missing",
        description:
          "The metadata does not provide an Open Graph title.",
        recommendation:
          "Consider adding an og:title value for more descriptive social-sharing previews.",
      }),
    );
  }

  if (!openGraph.description?.trim()) {
    issues.push(
      createIssue({
        category: "seo",
        severity: "low",
        title: "Open Graph description missing",
        description:
          "The metadata does not provide an Open Graph description.",
        recommendation:
          "Consider adding an og:description value that summarizes the page.",
      }),
    );
  }

  if (!hasHttpUrl(openGraph.image)) {
    issues.push(
      createIssue({
        category: "seo",
        severity: "low",
        title: "Open Graph image missing or invalid",
        description:
          "A valid absolute HTTP or HTTPS Open Graph image URL was not found.",
        recommendation:
          "Consider providing an accessible og:image URL for social-sharing previews.",
      }),
    );
  }

  /* ---------------------------- Twitter Card ----------------------------- */

  const twitterCard = metadata.twitterCard;

  if (!twitterCard.card?.trim()) {
    issues.push(
      createIssue({
        category: "seo",
        severity: "info",
        title: "Twitter Card type missing",
        description:
          "The analyzed metadata does not specify a Twitter Card type.",
        recommendation:
          "Consider specifying twitter:card, for example summary or summary_large_image.",
      }),
    );
  }

  return issues;
}

/**
 * Returns a simple SEO score from 0 to 100.
 *
 * This is a NOTWEB heuristic, not an official search-engine score.
 */
export function calculateSeoScore(
  issues: readonly AnalysisIssue[],
): number {
  const penalties = {
    critical: 25,
    high: 15,
    medium: 8,
    low: 3,
    info: 0,
  } as const;

  const totalPenalty = issues
    .filter((issue) => issue.category === "seo")
    .reduce(
      (total, issue) => total + penalties[issue.severity],
      0,
    );

  return Math.max(0, Math.min(100, 100 - totalPenalty));
}

/**
 * Convenience API for the website analyzer package.
 */
export const seoAnalyzer = Object.freeze({
  analyze: analyzeSeoMetadata,
  calculateScore: calculateSeoScore,
});

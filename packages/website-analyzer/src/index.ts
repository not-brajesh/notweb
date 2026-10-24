
/**
 * NOTWEB — Website Analyzer
 *
 * Core contracts and utilities for analyzing website structure,
 * metadata, SEO, accessibility, and performance.
 *
 * Security:
 * URL validation alone does not make a URL safe to fetch.
 * Network access must use a dedicated SSRF-safe fetching layer.
 */

import {
  MAX_WEBSITE_URL_LENGTH,
  SUPPORTED_URL_PROTOCOLS,
  validateWebsiteUrl,
} from "@notweb/shared";

/* -------------------------------------------------------------------------- */
/*                                  Types                                     */
/* -------------------------------------------------------------------------- */

export type AnalysisSeverity =
  | "critical"
  | "high"
  | "medium"
  | "low"
  | "info";

export type AnalysisCategory =
  | "seo"
  | "accessibility"
  | "performance"
  | "security"
  | "metadata"
  | "responsive-design"
  | "best-practices";

export type AnalysisStatus =
  | "queued"
  | "running"
  | "completed"
  | "failed";

export interface WebsiteMetadata {
  /** Original URL supplied for analysis. */
  url: string;

  /** Final URL after redirects, when available. */
  finalUrl?: string;

  /** Document title. */
  title: string | null;

  /** Meta description. */
  description: string | null;

  /** HTML document language. */
  language: string | null;

  /** Document character encoding. */
  charset: string | null;

  /** Viewport configuration. */
  viewport: string | null;

  /** Canonical page URL. */
  canonicalUrl: string | null;

  /** Resolved favicon URL. */
  faviconUrl: string | null;

  /** Robots directives. */
  robots: string | null;

  /** Document author. */
  author?: string | null;

  /** Search keywords. */
  keywords?: string | null;

  /** Open Graph metadata. */
  openGraph: Record<string, string>;

  /** Twitter card metadata represented as key-value pairs. */
  twitterCard: Record<string, string>;

  /** Structured Twitter metadata retained by the extractor. */
  twitter?: Record<string, string>;
}

export interface AnalysisIssue {
  id: string;
  category: AnalysisCategory;
  severity: AnalysisSeverity;
  title: string;
  description: string;
  recommendation: string;
  element?: string;
  documentationUrl?: string;
}

export interface CategoryScore {
  category: AnalysisCategory;
  score: number | null;
  issueCount: number;
}

export interface WebsiteAnalysisResult {
  id: string;
  requestedUrl: string;
  analyzedUrl: string;
  status: AnalysisStatus;
  startedAt: string;
  completedAt: string | null;
  durationMs: number | null;
  metadata: WebsiteMetadata | null;
  issues: AnalysisIssue[];
  scores: CategoryScore[];
  error: AnalysisError | null;
}

export interface AnalysisError {
  code: string;
  message: string;
  retryable: boolean;
}

export interface AnalyzeWebsiteOptions {
  timeoutMs?: number;
  maxRedirects?: number;
  includeCategories?: AnalysisCategory[];
  userAgent?: string;
}

export interface WebsiteUrlValidation {
  valid: boolean;
  normalizedUrl?: string;
  error?: string;
}

/* -------------------------------------------------------------------------- */
/*                                Constants                                   */
/* -------------------------------------------------------------------------- */

export const ANALYZER_VERSION = "0.1.0";

export const DEFAULT_ANALYSIS_OPTIONS: Readonly<
  Required<Pick<AnalyzeWebsiteOptions, "timeoutMs" | "maxRedirects">>
> = Object.freeze({
  timeoutMs: 15_000,
  maxRedirects: 5,
});

export const ANALYSIS_CATEGORIES: readonly AnalysisCategory[] = [
  "seo",
  "accessibility",
  "performance",
  "security",
  "metadata",
  "responsive-design",
  "best-practices",
];

/* -------------------------------------------------------------------------- */
/*                             URL Validation                                 */
/* -------------------------------------------------------------------------- */

/**
 * Performs basic syntactic validation and normalization.
 *
 * This function does NOT fetch the URL and does NOT protect against SSRF.
 * Before fetching, validate DNS results and every redirect destination,
 * block private/loopback/link-local IP addresses, and restrict protocols.
 */
export function validateAnalysisUrl(
  value: string,
): WebsiteUrlValidation {
  if (typeof value !== "string" || value.trim().length === 0) {
    return {
      valid: false,
      error: "A website URL is required.",
    };
  }

  const input = value.trim();

  if (input.length > MAX_WEBSITE_URL_LENGTH) {
    return {
      valid: false,
      error: `The URL must not exceed ${MAX_WEBSITE_URL_LENGTH} characters.`,
    };
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(input);
  } catch {
    return {
      valid: false,
      error: "Enter a valid absolute website URL, including https://.",
    };
  }

  if (
    !SUPPORTED_URL_PROTOCOLS.includes(
      parsedUrl.protocol as (typeof SUPPORTED_URL_PROTOCOLS)[number],
    )
  ) {
    return {
      valid: false,
      error: "Only HTTP and HTTPS website URLs are supported.",
    };
  }

  if (
    !parsedUrl.hostname ||
    parsedUrl.username ||
    parsedUrl.password
  ) {
    return {
      valid: false,
      error:
        "The URL must contain a hostname and must not include credentials.",
    };
  }

  const sharedValidation = validateWebsiteUrl(input);

  if (!sharedValidation.valid) {
    return {
      valid: false,
      error:
        sharedValidation.errors[0] ??
        "The website URL is invalid.",
    };
  }

  return {
    valid: true,
    normalizedUrl: parsedUrl.href,
  };
}

/* -------------------------------------------------------------------------- */
/*                             Score Utilities                                */
/* -------------------------------------------------------------------------- */

/**
 * Returns a score from 0 to 100.
 * A null score means that the category has not been evaluated.
 */
export function normalizeScore(
  value: number | null,
): number | null {
  if (value === null || !Number.isFinite(value)) {
    return null;
  }

  return Math.max(0, Math.min(100, Math.round(value)));
}

/**
 * Calculates a simple issue-based score.
 *
 * This is a heuristic, not a standards-compliance guarantee.
 * Pass only issues belonging to the category being scored.
 */
export function calculateCategoryScore(
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

  return normalizeScore(100 - totalPenalty) ?? 0;
}

/* -------------------------------------------------------------------------- */
/*                             Result Utilities                               */
/* -------------------------------------------------------------------------- */

/**
 * Creates an empty metadata record for a URL.
 * Actual metadata must be extracted by a separate HTML parser.
 */
export function createEmptyMetadata(
  url: string,
): WebsiteMetadata {
  return {
    url,
    title: null,
    description: null,
    language: null,
    charset: null,
    viewport: null,
    canonicalUrl: null,
    faviconUrl: null,
    robots: null,
    author: null,
    keywords: null,
    openGraph: {},
    twitterCard: {},
    twitter: {},
  };
}

/**
 * Creates a predictable initial analysis result.
 */
export function createAnalysisResult(
  id: string,
  url: string,
): WebsiteAnalysisResult {
  const now = new Date().toISOString();

  return {
    id,
    requestedUrl: url,
    analyzedUrl: url,
    status: "queued",
    startedAt: now,
    completedAt: null,
    durationMs: null,
    metadata: null,
    issues: [],
    scores: ANALYSIS_CATEGORIES.map((category) => ({
      category,
      score: null,
      issueCount: 0,
    })),
    error: null,
  };
}

/**
 * Groups issues by category and calculates category scores.
 */
export function summarizeIssues(
  issues: readonly AnalysisIssue[],
): CategoryScore[] {
  return ANALYSIS_CATEGORIES.map((category) => {
    const categoryIssues = issues.filter(
      (issue) => issue.category === category,
    );

    return {
      category,
      score: calculateCategoryScore(categoryIssues),
      issueCount: categoryIssues.length,
    };
  });
}

/* -------------------------------------------------------------------------- */
/*                             Public API                                     */
/* -------------------------------------------------------------------------- */

export const websiteAnalyzer = Object.freeze({
  version: ANALYZER_VERSION,
  validateUrl: validateAnalysisUrl,
  createResult: createAnalysisResult,
  createEmptyMetadata,
  calculateCategoryScore,
  summarizeIssues,
});
export {
  analyzeSecurity,
  getSecurityIssues,
} from "./security.js";

export type {
  SecurityAnalysisInput,
  SecurityAnalysisResult,
} from "./security.js";

export {
  analyzeWebsite,
  runWebsiteAnalysis,
  websiteAnalysisPipeline,
} from "./analyzer.js";

export type {
  RunWebsiteAnalysisOptions,
  WebsiteAnalysisPipelineResult,
} from "./analyzer.js";

export {
  analysisReport,
  createAnalysisReport,
  createPriorityReport,
  exportReportJson,
  formatReportSummary,
  getPriorityIssues,
  groupIssuesBySeverity,
  isValidAnalysisReport,
  sortReportIssues,
} from "./report.js";

export type {
  AnalysisReport,
  AnalysisReportCategory,
  AnalysisReportSummary,
  ReportOptions,
} from "./report.js";
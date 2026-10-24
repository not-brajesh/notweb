
/**
 * NOTWEB — Website Analysis Pipeline
 *
 * Combines metadata extraction with SEO, accessibility,
 * performance, and security analysis.
 *
 * This module analyzes supplied HTML only.
 * It does not fetch URLs or execute website JavaScript.
 */

import type {
  AnalysisCategory,
  AnalysisIssue,
  CategoryScore,
  WebsiteAnalysisResult,
  WebsiteMetadata,
} from "./index.js";

import {
  ANALYSIS_CATEGORIES,
  calculateCategoryScore,
  createAnalysisResult,
  validateAnalysisUrl,
} from "./index.js";

import { extractWebsiteMetadata } from "./metadata.js";
import { analyzeSeo } from "./seo.js";
import { analyzeAccessibility } from "./accessibility.js";
import { analyzePerformance } from "./performance.js";
import { analyzeSecurity } from "./security.js";

/* -------------------------------------------------------------------------- */
/*                                    Types                                   */
/* -------------------------------------------------------------------------- */

export interface RunWebsiteAnalysisOptions {
  url: string;
  html: string;
  statusCode?: number;
  finalUrl?: string;
  includeCategories?: AnalysisCategory[];
}

export interface WebsiteAnalysisPipelineResult {
  success: boolean;
  result: WebsiteAnalysisResult | null;
  error: string | null;
}

/* -------------------------------------------------------------------------- */
/*                                  Utilities                                 */
/* -------------------------------------------------------------------------- */

function createFailure(
  message: string,
): WebsiteAnalysisPipelineResult {
  return {
    success: false,
    result: null,
    error: message,
  };
}

function getSelectedCategories(
  requested?: AnalysisCategory[],
): AnalysisCategory[] {
  if (!requested || requested.length === 0) {
    return [...ANALYSIS_CATEGORIES];
  }

  const allowed = new Set<AnalysisCategory>(ANALYSIS_CATEGORIES);

  return [...new Set(requested)].filter((category) =>
    allowed.has(category),
  );
}

function createMetadata(
  url: string,
  finalUrl: string,
  html: string,
): WebsiteMetadata {
  const extraction = extractWebsiteMetadata(html, {
    baseUrl: finalUrl,
  });

  const extracted = extraction.metadata;

  return {
    ...extracted,
    url,
    finalUrl,
    title: extracted.title || null,
    description: extracted.description || null,
    language: extracted.language || null,
    charset: extracted.charset || null,
    viewport: extracted.viewport || null,
    canonicalUrl: extracted.canonicalUrl || null,
    faviconUrl: extracted.faviconUrl || null,
    robots: extracted.robots || null,
  };
}

function calculateScores(
  issues: readonly AnalysisIssue[],
  categories: readonly AnalysisCategory[],
): CategoryScore[] {
  return categories.map((category) => {
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
/*                              Main Analysis                                 */
/* -------------------------------------------------------------------------- */

/**
 * Analyzes HTML that has already been obtained by the caller.
 *
 * Important:
 * - This function does not fetch the supplied URL.
 * - It does not execute JavaScript.
 * - URL validation is syntactic, not SSRF protection.
 */
export function runWebsiteAnalysis(
  options: RunWebsiteAnalysisOptions,
): WebsiteAnalysisPipelineResult {
  const validation = validateAnalysisUrl(options.url);

  if (!validation.valid || !validation.normalizedUrl) {
    return createFailure(
      validation.error ?? "The supplied website URL is invalid.",
    );
  }

  if (
    typeof options.html !== "string" ||
    options.html.trim().length === 0
  ) {
    return createFailure(
      "HTML content is required to analyze a website.",
    );
  }

  const requestedUrl = validation.normalizedUrl;
  const analyzedUrl = options.finalUrl ?? requestedUrl;
  const selectedCategories = getSelectedCategories(
    options.includeCategories,
  );

  let result: WebsiteAnalysisResult;

  try {
    const startedAt = new Date().toISOString();

    const metadata = createMetadata(
      requestedUrl,
      analyzedUrl,
      options.html,
    );

    const issues: AnalysisIssue[] = [];

    if (selectedCategories.includes("seo")) {
      const seoResult = analyzeSeo({
        html: options.html,
        metadata,
        ...(options.statusCode !== undefined
          ? { statusCode: options.statusCode }
          : {}),
      });

      issues.push(...seoResult.issues);
    }

    if (selectedCategories.includes("accessibility")) {
      const accessibilityResult = analyzeAccessibility({
        html: options.html,
      });

      issues.push(...accessibilityResult.issues);
    }

    if (selectedCategories.includes("performance")) {
      const performanceResult = analyzePerformance({
        html: options.html,
      });

      issues.push(...performanceResult.issues);
    }

    if (selectedCategories.includes("security")) {
      const securityResult = analyzeSecurity({
        html: options.html,
        pageUrl: analyzedUrl,
      });

      issues.push(...securityResult.issues);
    }

    const completedAt = new Date().toISOString();

    result = createAnalysisResult(
      crypto.randomUUID(),
      requestedUrl,
    );

    result.analyzedUrl = analyzedUrl;
    result.status = "completed";
    result.startedAt = startedAt;
    result.completedAt = completedAt;
    result.durationMs = Math.max(
      0,
      Date.parse(completedAt) - Date.parse(startedAt),
    );
    result.metadata = metadata;
    result.issues = issues;
    result.scores = calculateScores(issues, selectedCategories);
    result.error = null;

    return {
      success: true,
      result,
      error: null,
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "An unexpected error occurred during website analysis.";

    return createFailure(message);
  }
}

/**
 * Convenience function that returns the result directly.
 * Throws an Error if analysis cannot be completed.
 */
export function analyzeWebsite(
  options: RunWebsiteAnalysisOptions,
): WebsiteAnalysisResult {
  const outcome = runWebsiteAnalysis(options);

  if (!outcome.success || outcome.result === null) {
    throw new Error(
      outcome.error ?? "Website analysis failed.",
    );
  }

  return outcome.result;
}

/* -------------------------------------------------------------------------- */
/*                                  Public API                                */
/* -------------------------------------------------------------------------- */

export const websiteAnalysisPipeline = Object.freeze({
  run: runWebsiteAnalysis,
  analyze: analyzeWebsite,
});

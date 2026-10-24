
import type {
  AnalysisCategory,
  AnalysisIssue,
  AnalysisStatus,
  CategoryScore,
  WebsiteAnalysisResult,
  WebsiteMetadata,
} from "./index.js";

import {
  ANALYSIS_CATEGORIES,
  DEFAULT_ANALYSIS_OPTIONS,
  calculateCategoryScore,
  createAnalysisResult,
  validateAnalysisUrl,
} from "./index.js";

import {
  extractWebsiteMetadata,
} from "./metadata.js";

import {
  analyzeSeo,
} from "./seo.js";

import {
  analyzeAccessibility,
} from "./accessibility.js";

import {
  analyzePerformance,
} from "./performance.js";

import {
  analyzeSecurity,
} from "./security.js";

export interface RunWebsiteAnalysisOptions {
  url: string;
  html: string;
  statusCode?: number;
  finalUrl?: string;
  timeoutMs?: number;
  includeCategories?: AnalysisCategory[];
}

export interface WebsiteAnalysisPipelineResult {
  success: boolean;
  result: WebsiteAnalysisResult | null;
  error: string | null;
}

function createFailure(
  message: string,
): WebsiteAnalysisPipelineResult {
  return {
    success: false,
    result: null,
    error: message,
  };
}

function createMetadata(
  url: string,
  html: string,
): WebsiteMetadata {
  const extracted = extractWebsiteMetadata(html, {
    baseUrl: url,
  });

  return {
    url,
    title: extracted.title || null,
    description: extracted.description || null,
    language: extracted.language || null,
    charset: extracted.charset || null,
    viewport: extracted.viewport || null,
    canonicalUrl: extracted.canonicalUrl || null,
    faviconUrl: extracted.faviconUrl || null,
    robots: extracted.robots || null,
    openGraph: extracted.openGraph ?? {},
    twitterCard: extracted.twitterCard ?? {},
  };
}

function calculateScores(
  issues: AnalysisIssue[],
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

function getSelectedCategories(
  requested?: AnalysisCategory[],
): AnalysisCategory[] {
  if (!requested || requested.length === 0) {
    return [...ANALYSIS_CATEGORIES];
  }

  const validCategories = new Set<AnalysisCategory>(
    ANALYSIS_CATEGORIES,
  );

  return [...new Set(requested)].filter((category) =>
    validCategories.has(category),
  );
}

/**
 * Runs the available website analysis modules against supplied HTML.
 *
 * This function analyzes HTML that has already been obtained.
 * It does not fetch websites or execute JavaScript.
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

  if (typeof options.html !== "string" || !options.html.trim()) {
    return createFailure(
      "HTML content is required to analyze a website.",
    );
  }

  const startedAt = new Date().toISOString();
  const normalizedUrl = validation.normalizedUrl;
  const analyzedUrl = options.finalUrl ?? normalizedUrl;

  const selectedCategories = getSelectedCategories(
    options.includeCategories,
  );

  const issues: AnalysisIssue[] = [];
  let metadata: WebsiteMetadata | null = null;

  try {
    metadata = createMetadata(normalizedUrl, options.html);

    if (selectedCategories.includes("seo")) {
      issues.push(
        ...analyzeSeo({
          html: options.html,
          metadata,
          statusCode: options.statusCode,
        }).issues,
      );
    }

    if (selectedCategories.includes("accessibility")) {
      issues.push(
        ...analyzeAccessibility({
          html: options.html,
        }).issues,
      );
    }

    if (selectedCategories.includes("performance")) {
      issues.push(
        ...analyzePerformance({
          html: options.html,
        }).issues,
      );
    }

    if (selectedCategories.includes("security")) {
      issues.push(
        ...analyzeSecurity({
          html: options.html,
          pageUrl: analyzedUrl,
        }).issues,
      );
    }

    const scores = calculateScores(
      issues,
      selectedCategories,
    );

    const completedAt = new Date().toISOString();
    const durationMs = Math.max(
      0,
      Date.parse(completedAt) - Date.parse(startedAt),
    );

    const result = createAnalysisResult({
      requestedUrl: normalizedUrl,
      analyzedUrl,
      status: "completed" satisfies AnalysisStatus,
      startedAt,
      completedAt,
      durationMs,
      metadata,
      issues,
      scores,
      error: null,
    });

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
 * Returns the analysis result or throws if analysis fails.
 */
export function analyzeWebsite(
  options: RunWebsiteAnalysisOptions,
): WebsiteAnalysisResult {
  const outcome = runWebsiteAnalysis(options);

  if (!outcome.success || !outcome.result) {
    throw new Error(
      outcome.error ?? "Website analysis failed.",
    );
  }

  return outcome.result;
}

/**
 * Exposes the pipeline through a small public API.
 */
export const websiteAnalysisPipeline = Object.freeze({
  run: runWebsiteAnalysis,
  analyze: analyzeWebsite,
});

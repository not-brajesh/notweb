
/**
 * NOTWEB — Website Analysis Report
 *
 * Converts website analysis results into structured,
 * normalized, and export-ready report data.
 *
 * This module does not fetch URLs or execute website code.
 */

import type {
  AnalysisIssue,
  AnalysisSeverity,
  CategoryScore,
  WebsiteAnalysisResult,
} from "./index.js";

/* -------------------------------------------------------------------------- */
/*                                    Types                                   */
/* -------------------------------------------------------------------------- */

export interface AnalysisReportSummary {
  totalIssues: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  info: number;
  overallScore: number | null;
  passedCategories: number;
  failedCategories: number;
  unscoredCategories: number;
}

export interface AnalysisReportCategory extends CategoryScore {
  severityCounts: Record<AnalysisSeverity, number>;
}

export interface AnalysisReport {
  reportVersion: "1.1";
  generatedAt: string;

  website: {
    requestedUrl: string;
    analyzedUrl: string;
    title: string | null;
    description: string | null;
  };

  analysis: {
    id: string;
    status: WebsiteAnalysisResult["status"];
    startedAt: string;
    completedAt: string | null;
    durationMs: number | null;
  };

  summary: AnalysisReportSummary;
  categories: AnalysisReportCategory[];
  issues: AnalysisIssue[];
  error: WebsiteAnalysisResult["error"];
}

export interface ReportOptions {
  /** Sort issues from most to least severe. Defaults to true. */
  sortIssues?: boolean;

  /** Include informational issues in the report. Defaults to true. */
  includeInfo?: boolean;
}

/* -------------------------------------------------------------------------- */
/*                                  Constants                                 */
/* -------------------------------------------------------------------------- */

const SEVERITY_RANK: Readonly<Record<AnalysisSeverity, number>> =
  Object.freeze({
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
    info: 4,
  });

const SEVERITIES: readonly AnalysisSeverity[] = [
  "critical",
  "high",
  "medium",
  "low",
  "info",
];

/* -------------------------------------------------------------------------- */
/*                                  Utilities                                 */
/* -------------------------------------------------------------------------- */

function countBySeverity(
  issues: readonly AnalysisIssue[],
  severity: AnalysisSeverity,
): number {
  return issues.reduce(
    (count, issue) => count + Number(issue.severity === severity),
    0,
  );
}

function createSeverityCounts(
  issues: readonly AnalysisIssue[],
): Record<AnalysisSeverity, number> {
  return {
    critical: countBySeverity(issues, "critical"),
    high: countBySeverity(issues, "high"),
    medium: countBySeverity(issues, "medium"),
    low: countBySeverity(issues, "low"),
    info: countBySeverity(issues, "info"),
  };
}

function calculateOverallScore(
  categories: readonly CategoryScore[],
): number | null {
  const scoredCategories = categories.filter(
    (category) =>
      category.score !== null &&
      Number.isFinite(category.score),
  );

  if (scoredCategories.length === 0) {
    return null;
  }

  const total = scoredCategories.reduce(
    (sum, category) => sum + (category.score ?? 0),
    0,
  );

  return Math.round(total / scoredCategories.length);
}

function countPassedCategories(
  categories: readonly CategoryScore[],
): number {
  return categories.filter(
    (category) =>
      category.score !== null && category.score >= 80,
  ).length;
}

function countFailedCategories(
  categories: readonly CategoryScore[],
): number {
  return categories.filter(
    (category) =>
      category.score !== null && category.score < 50,
  ).length;
}

function countUnscoredCategories(
  categories: readonly CategoryScore[],
): number {
  return categories.filter(
    (category) =>
      category.score === null ||
      !Number.isFinite(category.score),
  ).length;
}

/* -------------------------------------------------------------------------- */
/*                               Issue Sorting                                */
/* -------------------------------------------------------------------------- */

/**
 * Sorts issues by severity, then alphabetically by title.
 * The input array is never mutated.
 */
export function sortReportIssues(
  issues: readonly AnalysisIssue[],
): AnalysisIssue[] {
  return [...issues].sort((a, b) => {
    const severityDifference =
      SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity];

    if (severityDifference !== 0) {
      return severityDifference;
    }

    return a.title.localeCompare(b.title);
  });
}

/**
 * Groups issues by severity.
 */
export function groupIssuesBySeverity(
  issues: readonly AnalysisIssue[],
): Record<AnalysisSeverity, AnalysisIssue[]> {
  const groups: Record<AnalysisSeverity, AnalysisIssue[]> = {
    critical: [],
    high: [],
    medium: [],
    low: [],
    info: [],
  };

  for (const issue of issues) {
    groups[issue.severity].push(issue);
  }

  return groups;
}

/**
 * Returns issues that should be prioritized for remediation.
 */
export function getPriorityIssues(
  issues: readonly AnalysisIssue[],
  limit = 10,
): AnalysisIssue[] {
  const safeLimit = Number.isFinite(limit)
    ? Math.max(0, Math.floor(limit))
    : 10;

  return sortReportIssues(
    issues.filter((issue) => issue.severity !== "info"),
  ).slice(0, safeLimit);
}

/* -------------------------------------------------------------------------- */
/*                              Report Creation                               */
/* -------------------------------------------------------------------------- */

/**
 * Builds a normalized report from a website analysis result.
 */
export function createAnalysisReport(
  result: WebsiteAnalysisResult,
  options: ReportOptions = {},
): AnalysisReport {
  const {
    sortIssues = true,
    includeInfo = true,
  } = options;

  const filteredIssues = result.issues.filter(
    (issue) => includeInfo || issue.severity !== "info",
  );

  const issues = sortIssues
    ? sortReportIssues(filteredIssues)
    : [...filteredIssues];

  const categories: AnalysisReportCategory[] =
    result.scores.map((category) => {
      const categoryIssues = issues.filter(
        (issue) => issue.category === category.category,
      );

      return {
        ...category,
        severityCounts: createSeverityCounts(categoryIssues),
      };
    });

  const severityCounts = createSeverityCounts(issues);

  return {
    reportVersion: "1.1",
    generatedAt: new Date().toISOString(),

    website: {
      requestedUrl: result.requestedUrl,
      analyzedUrl: result.analyzedUrl,
      title: result.metadata?.title ?? null,
      description: result.metadata?.description ?? null,
    },

    analysis: {
      id: result.id,
      status: result.status,
      startedAt: result.startedAt,
      completedAt: result.completedAt,
      durationMs: result.durationMs,
    },

    summary: {
      totalIssues: issues.length,
      ...severityCounts,
      overallScore: calculateOverallScore(categories),
      passedCategories: countPassedCategories(categories),
      failedCategories: countFailedCategories(categories),
      unscoredCategories: countUnscoredCategories(categories),
    },

    categories,
    issues,
    error: result.error,
  };
}

/* -------------------------------------------------------------------------- */
/*                              Report Formatting                             */
/* -------------------------------------------------------------------------- */

/**
 * Produces a compact, human-readable report summary.
 */
export function formatReportSummary(
  report: AnalysisReport,
): string {
  const score =
    report.summary.overallScore === null
      ? "Not available"
      : `${report.summary.overallScore}/100`;

  return [
    "NOTWEB — Website Analysis Report",
    "================================",
    `Website: ${report.website.analyzedUrl}`,
    `Title: ${report.website.title ?? "Not available"}`,
    `Status: ${report.analysis.status}`,
    `Overall score: ${score}`,
    "",
    "Issue Summary",
    "-------------",
    `Total issues: ${report.summary.totalIssues}`,
    `Critical: ${report.summary.critical}`,
    `High: ${report.summary.high}`,
    `Medium: ${report.summary.medium}`,
    `Low: ${report.summary.low}`,
    `Info: ${report.summary.info}`,
    "",
    "Category Summary",
    "----------------",
    `Passed categories: ${report.summary.passedCategories}`,
    `Failed categories: ${report.summary.failedCategories}`,
    `Unscored categories: ${report.summary.unscoredCategories}`,
  ].join("\n");
}

/**
 * Serializes a report as formatted JSON.
 */
export function exportReportJson(
  report: AnalysisReport,
): string {
  return JSON.stringify(report, null, 2);
}

/**
 * Creates a report with only remediation-priority issues.
 */
export function createPriorityReport(
  result: WebsiteAnalysisResult,
  limit = 10,
): AnalysisReport {
  const report = createAnalysisReport(result);

  const priorityIssues = getPriorityIssues(report.issues, limit);

  const categories: AnalysisReportCategory[] =
    report.categories.map((category) => {
      const categoryIssues = priorityIssues.filter(
        (issue) => issue.category === category.category,
      );

      return {
        ...category,
        severityCounts: createSeverityCounts(categoryIssues),
      };
    });

  const severityCounts = createSeverityCounts(priorityIssues);

  return {
    ...report,
    categories,
    issues: priorityIssues,
    summary: {
      ...report.summary,
      totalIssues: priorityIssues.length,
      ...severityCounts,
    },
  };
}

/**
 * Checks whether the report contains the required core fields.
 */
export function isValidAnalysisReport(
  value: unknown,
): value is AnalysisReport {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<AnalysisReport>;

  return (
    candidate.reportVersion === "1.1" &&
    typeof candidate.generatedAt === "string" &&
    typeof candidate.website === "object" &&
    candidate.website !== null &&
    typeof candidate.analysis === "object" &&
    candidate.analysis !== null &&
    typeof candidate.summary === "object" &&
    candidate.summary !== null &&
    Array.isArray(candidate.categories) &&
    Array.isArray(candidate.issues) &&
    "error" in candidate
  );
}

/* -------------------------------------------------------------------------- */
/*                                  Public API                                */
/* -------------------------------------------------------------------------- */

export const analysisReport = Object.freeze({
  create: createAnalysisReport,
  createPriority: createPriorityReport,
  formatSummary: formatReportSummary,
  exportJson: exportReportJson,
  sortIssues: sortReportIssues,
  groupIssuesBySeverity,
  getPriorityIssues,
  isValid: isValidAnalysisReport,
});

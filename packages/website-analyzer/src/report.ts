
/**
 * NOTWEB — Website Analysis Report
 *
 * Converts website analysis results into structured report data.
 */

import type {
  AnalysisIssue,
  AnalysisSeverity,
  CategoryScore,
  WebsiteAnalysisResult,
} from "./index.js";

export interface AnalysisReportSummary {
  totalIssues: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  info: number;
  overallScore: number | null;
}

export interface AnalysisReport {
  reportVersion: "1.0";
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
  categories: CategoryScore[];
  issues: AnalysisIssue[];
  error: WebsiteAnalysisResult["error"];
}

function countBySeverity(
  issues: readonly AnalysisIssue[],
  severity: AnalysisSeverity,
): number {
  return issues.filter((issue) => issue.severity === severity).length;
}

function calculateOverallScore(
  categories: readonly CategoryScore[],
): number | null {
  const scoredCategories = categories.filter(
    (category) => category.score !== null,
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

/**
 * Builds a normalized report from a website analysis result.
 */
export function createAnalysisReport(
  result: WebsiteAnalysisResult,
): AnalysisReport {
  const issues = [...result.issues];

  return {
    reportVersion: "1.0",
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
      critical: countBySeverity(issues, "critical"),
      high: countBySeverity(issues, "high"),
      medium: countBySeverity(issues, "medium"),
      low: countBySeverity(issues, "low"),
      info: countBySeverity(issues, "info"),
      overallScore: calculateOverallScore(result.scores),
    },

    categories: result.scores.map((category) => ({ ...category })),
    issues,
    error: result.error,
  };
}

/**
 * Sorts report issues by severity.
 */
export function sortReportIssues(
  issues: readonly AnalysisIssue[],
): AnalysisIssue[] {
  const severityRank: Record<AnalysisSeverity, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
    info: 4,
  };

  return [...issues].sort(
    (a, b) => severityRank[a.severity] - severityRank[b.severity],
  );
}

/**
 * Returns a compact, human-readable report summary.
 */
export function formatReportSummary(
  report: AnalysisReport,
): string {
  const score =
    report.summary.overallScore === null
      ? "Not available"
      : `${report.summary.overallScore}/100`;

  return [
    `Website: ${report.website.analyzedUrl}`,
    `Status: ${report.analysis.status}`,
    `Overall score: ${score}`,
    `Total issues: ${report.summary.totalIssues}`,
    `Critical: ${report.summary.critical}`,
    `High: ${report.summary.high}`,
    `Medium: ${report.summary.medium}`,
    `Low: ${report.summary.low}`,
    `Info: ${report.summary.info}`,
  ].join("\n");
}

/**
 * Serializes the report as formatted JSON.
 */
export function exportReportJson(
  report: AnalysisReport,
): string {
  return JSON.stringify(report, null, 2);
}

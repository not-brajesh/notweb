
import { describe, expect, it } from "vitest";

import {
  exportReport,
  exportReportAsJson,
  exportReportAsCsv,
  exportScoresAsCsv,
} from "./export.js";

import type { AnalysisReport } from "./report.js";

function createTestReport(): AnalysisReport {
  return {
    reportVersion: "1.1",
    generatedAt: "2026-10-24T00:00:00.000Z",
    website: {
      requestedUrl: "https://example.com",
      analyzedUrl: "https://example.com",
      title: "Example Website",
      description: "A website for testing exports.",
    },
    analysis: {
      id: "test-analysis-001",
      status: "completed",
      startedAt: "2026-10-24T00:00:00.000Z",
      completedAt: "2026-10-24T00:00:02.000Z",
      durationMs: 2000,
    },
    summary: {
      totalIssues: 1,
      critical: 0,
      high: 1,
      medium: 0,
      low: 0,
      info: 0,
      overallScore: 85,
      passedCategories: 1,
      failedCategories: 0,
      unscoredCategories: 0,
    },
    categories: [
      {
        category: "seo",
        score: 85,
        issueCount: 1,
        severityCounts: {
          critical: 0,
          high: 1,
          medium: 0,
          low: 0,
          info: 0,
        },
      },
    ],
    issues: [
      {
        id: "issue-001",
        category: "seo",
        severity: "high",
        title: "Missing meta description",
        description: "The page does not have a meta description.",
        recommendation: "Add a meaningful meta description.",
      },
    ],
    error: null,
  };
}

describe("Report export utilities", () => {
  it("exports a report as formatted JSON", () => {
    const report = createTestReport();
    const result = exportReportAsJson(report);

    expect(result.filename).toBe("example-com-report.json");
    expect(result.mimeType).toBe("application/json;charset=utf-8");

    const parsed = JSON.parse(result.content);

    expect(parsed.website.title).toBe("Example Website");
    expect(parsed.summary.totalIssues).toBe(1);
  });

  it("exports report issues as CSV", () => {
    const result = exportReportAsCsv(createTestReport());

    expect(result.filename).toBe("example-com-issues.csv");
    expect(result.mimeType).toBe("text/csv;charset=utf-8");
    expect(result.content).toContain("Issue ID");
    expect(result.content).toContain("Missing meta description");
    expect(result.content).toContain("\uFEFF");
  });

  it("exports category scores as CSV", () => {
    const result = exportScoresAsCsv(createTestReport());

    expect(result.filename).toBe("example-com-scores.csv");
    expect(result.content).toContain("Category");
    expect(result.content).toContain("seo");
    expect(result.content).toContain("85");
  });

  it("dispatches JSON and CSV export formats", () => {
    const report = createTestReport();

    expect(exportReport(report, "json").filename).toContain(".json");
    expect(exportReport(report, "csv").filename).toContain(".csv");
  });

  it("escapes quotes correctly in CSV cells", () => {
    const report = createTestReport();
    report.issues[0]!.title = 'A "quoted" issue';

    const result = exportReportAsCsv(report);

    expect(result.content).toContain('"A ""quoted"" issue"');
  });
});

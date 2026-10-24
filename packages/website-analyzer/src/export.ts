
/**
 * NOTWEB — Report Export Utilities
 *
 * Exports analysis reports as JSON and CSV.
 */

import type { AnalysisIssue } from "./index.js";
import type { AnalysisReport } from "./report.js";

export type ReportExportFormat = "json" | "csv";

export interface ReportExport {
  filename: string;
  mimeType: string;
  content: string;
}

function escapeCsvCell(value: unknown): string {
  const text =
    value === null || value === undefined
      ? ""
      : String(value);

  return `"${text.replace(/"/g, '""')}"`;
}

function createCsv(
  headers: readonly string[],
  rows: readonly (readonly unknown[])[],
): string {
  const lines = [
    headers.map(escapeCsvCell).join(","),
    ...rows.map((row) => row.map(escapeCsvCell).join(",")),
  ];

  // UTF-8 BOM improves compatibility with spreadsheet software.
  return `\uFEFF${lines.join("\r\n")}`;
}

function issueRows(
  issues: readonly AnalysisIssue[],
): unknown[][] {
  return issues.map((issue) => [
    issue.id,
    issue.category,
    issue.severity,
    issue.title,
    issue.description,
    issue.recommendation,
    issue.element ?? "",
    issue.documentationUrl ?? "",
  ]);
}

function safeFilenamePart(value: string): string {
  return value
    .replace(/^https?:\/\//i, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "website";
}

/**
 * Export a report as formatted JSON.
 */
export function exportReportAsJson(
  report: AnalysisReport,
): ReportExport {
  const filename = `${safeFilenamePart(
    report.website.analyzedUrl,
  )}-report.json`;

  return {
    filename,
    mimeType: "application/json;charset=utf-8",
    content: JSON.stringify(report, null, 2),
  };
}

/**
 * Export report issues as CSV.
 */
export function exportReportAsCsv(
  report: AnalysisReport,
): ReportExport {
  const headers = [
    "Issue ID",
    "Category",
    "Severity",
    "Title",
    "Description",
    "Recommendation",
    "Element",
    "Documentation URL",
  ];

  const content = createCsv(
    headers,
    issueRows(report.issues),
  );

  return {
    filename: `${safeFilenamePart(
      report.website.analyzedUrl,
    )}-issues.csv`,
    mimeType: "text/csv;charset=utf-8",
    content,
  };
}

/**
 * Export category scores as CSV.
 */
export function exportScoresAsCsv(
  report: AnalysisReport,
): ReportExport {
  const headers = [
    "Category",
    "Score",
    "Issue Count",
  ];

  const rows = report.categories.map((category) => [
    category.category,
    category.score ?? "",
    category.issueCount,
  ]);

  return {
    filename: `${safeFilenamePart(
      report.website.analyzedUrl,
    )}-scores.csv`,
    mimeType: "text/csv;charset=utf-8",
    content: createCsv(headers, rows),
  };
}

/**
 * Select an export format.
 */
export function exportReport(
  report: AnalysisReport,
  format: ReportExportFormat,
): ReportExport {
  switch (format) {
    case "json":
      return exportReportAsJson(report);

    case "csv":
      return exportReportAsCsv(report);

    default: {
      const unsupported: never = format;
      throw new Error(
        `Unsupported report format: ${String(unsupported)}`,
      );
    }
  }
}

/**
 * Trigger a browser download.
 *
 * Call this function only in a browser environment.
 */
export function downloadReport(
  reportExport: ReportExport,
): void {
  if (
    typeof window === "undefined" ||
    typeof document === "undefined" ||
    typeof Blob === "undefined" ||
    typeof URL.createObjectURL !== "function"
  ) {
    throw new Error(
      "Report downloads are available only in a browser environment.",
    );
  }

  const blob = new Blob(
    [reportExport.content],
    { type: reportExport.mimeType },
  );

  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = objectUrl;
  anchor.download = reportExport.filename;
  anchor.style.display = "none";

  document.body.appendChild(anchor);

  try {
    anchor.click();
  } finally {
    anchor.remove();

    // Delay revocation to allow the browser to start the download.
    window.setTimeout(() => {
      URL.revokeObjectURL(objectUrl);
    }, 1000);
  }
}


/**
 * NOTWEB — Report Export Utilities
 *
 * Production-oriented utilities for exporting website analysis reports
 * as JSON and CSV, with browser download support.
 *
 * Security:
 * - CSV formula injection mitigation
 * - Sanitized filenames
 * - JSON serialization error handling
 * - Browser environment validation
 * - Object URL cleanup
 *
 * This module does not fetch URLs or execute website code.
 */

import type { AnalysisIssue } from "./index.js";
import type { AnalysisReport } from "./report.js";

/* -------------------------------------------------------------------------- */
/*                                    Types                                   */
/* -------------------------------------------------------------------------- */

export type ReportExportFormat = "json" | "csv";

export interface ReportExport {
  filename: string;
  mimeType: string;
  content: string;
}

export interface ExportOptions {
  /** Optional filename prefix, without an extension. */
  filenamePrefix?: string;
}

export interface ExportValidationResult {
  valid: boolean;
  errors: string[];
}

/* -------------------------------------------------------------------------- */
/*                                  Constants                                 */
/* -------------------------------------------------------------------------- */

const MAX_FILENAME_LENGTH = 100;
const DOWNLOAD_URL_CLEANUP_DELAY_MS = 1_000;

const ISSUE_CSV_HEADERS = [
  "Issue ID",
  "Category",
  "Severity",
  "Title",
  "Description",
  "Recommendation",
  "Element",
  "Documentation URL",
] as const;

const SCORE_CSV_HEADERS = [
  "Category",
  "Score",
  "Issue Count",
] as const;

/* -------------------------------------------------------------------------- */
/*                               CSV Utilities                                */
/* -------------------------------------------------------------------------- */

/**
 * Neutralizes spreadsheet formula prefixes before CSV escaping.
 *
 * Spreadsheet applications may interpret cells beginning with formula
 * characters as executable formulas. Prefixing dangerous values with an
 * apostrophe reduces this risk, although spreadsheet behavior varies.
 */
function neutralizeCsvFormula(value: string): string {
  const normalized = value.replace(/^[\u0000-\u0020]+/, "");

  if (/^[=+\-@\t\r]/.test(normalized)) {
    return `'${value}`;
  }

  return value;
}

/**
 * Escapes a value as a CSV cell.
 */
function escapeCsvCell(value: unknown): string {
  let text =
    value === null || value === undefined
      ? ""
      : String(value);

  text = neutralizeCsvFormula(text);

  return `"${text.replace(/"/g, '""')}"`;
}

/**
 * Creates CSV content with CRLF line endings and a UTF-8 BOM.
 */
function createCsv(
  headers: readonly string[],
  rows: readonly (readonly unknown[])[],
): string {
  const lines = [
    headers.map(escapeCsvCell).join(","),
    ...rows.map((row) => row.map(escapeCsvCell).join(",")),
  ];

  return `\uFEFF${lines.join("\r\n")}`;
}

/**
 * Converts analysis issues into CSV rows.
 */
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

/* -------------------------------------------------------------------------- */
/*                             Filename Utilities                             */
/* -------------------------------------------------------------------------- */

/**
 * Produces a filesystem-safe filename component.
 */
function safeFilenamePart(value: string): string {
  const sanitized = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/^https?:\/\//i, "")
    .replace(/[?#].*$/, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_FILENAME_LENGTH)
    .replace(/-+$/g, "");

  return sanitized || "website";
}

/**
 * Creates a filename from a report URL and suffix.
 */
function createReportFilename(
  report: AnalysisReport,
  suffix: string,
  options?: ExportOptions,
): string {
  const prefix = options?.filenamePrefix
    ? safeFilenamePart(options.filenamePrefix)
    : safeFilenamePart(report.website.analyzedUrl);

  return `${prefix}-${suffix}`;
}

/* -------------------------------------------------------------------------- */
/*                             Validation Utilities                          */
/* -------------------------------------------------------------------------- */

/**
 * Performs basic validation before exporting a report.
 */
export function validateReportForExport(
  report: AnalysisReport,
): ExportValidationResult {
  const errors: string[] = [];

  if (!report || typeof report !== "object") {
    return {
      valid: false,
      errors: ["A valid analysis report is required."],
    };
  }

  if (
    typeof report.website?.analyzedUrl !== "string" ||
    report.website.analyzedUrl.trim().length === 0
  ) {
    errors.push("The report must contain an analyzed website URL.");
  }

  if (!Array.isArray(report.issues)) {
    errors.push("The report issues must be an array.");
  }

  if (!Array.isArray(report.categories)) {
    errors.push("The report categories must be an array.");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

function assertValidReport(report: AnalysisReport): void {
  const validation = validateReportForExport(report);

  if (!validation.valid) {
    throw new Error(
      `Cannot export report: ${validation.errors.join(" ")}`,
    );
  }
}

/* -------------------------------------------------------------------------- */
/*                                JSON Export                                 */
/* -------------------------------------------------------------------------- */

/**
 * Exports a report as formatted JSON.
 */
export function exportReportAsJson(
  report: AnalysisReport,
  options?: ExportOptions,
): ReportExport {
  assertValidReport(report);

  let content: string | undefined;

  try {
    content = JSON.stringify(report, null, 2);
  } catch {
    throw new Error("Failed to serialize the analysis report as JSON.");
  }

  if (content === undefined) {
    throw new Error("The analysis report could not be serialized.");
  }

  return {
    filename: createReportFilename(
      report,
      "report.json",
      options,
    ),
    mimeType: "application/json;charset=utf-8",
    content,
  };
}

/* -------------------------------------------------------------------------- */
/*                                 CSV Export                                 */
/* -------------------------------------------------------------------------- */

/**
 * Exports report issues as CSV.
 */
export function exportReportAsCsv(
  report: AnalysisReport,
  options?: ExportOptions,
): ReportExport {
  assertValidReport(report);

  return {
    filename: createReportFilename(
      report,
      "issues.csv",
      options,
    ),
    mimeType: "text/csv;charset=utf-8",
    content: createCsv(
      ISSUE_CSV_HEADERS,
      issueRows(report.issues),
    ),
  };
}

/**
 * Exports category scores as CSV.
 */
export function exportScoresAsCsv(
  report: AnalysisReport,
  options?: ExportOptions,
): ReportExport {
  assertValidReport(report);

  const rows = report.categories.map((category) => [
    category.category,
    category.score ?? "",
    category.issueCount,
  ]);

  return {
    filename: createReportFilename(
      report,
      "scores.csv",
      options,
    ),
    mimeType: "text/csv;charset=utf-8",
    content: createCsv(SCORE_CSV_HEADERS, rows),
  };
}

/* -------------------------------------------------------------------------- */
/*                               Export Selector                              */
/* -------------------------------------------------------------------------- */

/**
 * Exports a report in the requested format.
 */
export function exportReport(
  report: AnalysisReport,
  format: ReportExportFormat,
  options?: ExportOptions,
): ReportExport {
  switch (format) {
    case "json":
      return exportReportAsJson(report, options);

    case "csv":
      return exportReportAsCsv(report, options);

    default: {
      const unsupported: never = format;

      throw new Error(
        `Unsupported report format: ${String(unsupported)}`,
      );
    }
  }
}

/* -------------------------------------------------------------------------- */
/*                              Browser Download                             */
/* -------------------------------------------------------------------------- */

/**
 * Triggers a browser download.
 *
 * Call only in a browser environment after a user-initiated action.
 */
export function downloadReport(
  reportExport: ReportExport,
): void {
  if (
    typeof window === "undefined" ||
    typeof document === "undefined" ||
    typeof Blob === "undefined" ||
    typeof URL === "undefined" ||
    typeof URL.createObjectURL !== "function" ||
    typeof URL.revokeObjectURL !== "function"
  ) {
    throw new Error(
      "Report downloads are available only in a supported browser environment.",
    );
  }

  if (
    !reportExport ||
    typeof reportExport.content !== "string" ||
    typeof reportExport.filename !== "string" ||
    typeof reportExport.mimeType !== "string"
  ) {
    throw new Error("A valid report export is required for download.");
  }

  const safeFilename =
    safeFilenamePart(reportExport.filename.replace(/\.[^.]+$/, "")) +
    getSafeExtension(reportExport.filename);

  const blob = new Blob(
    [reportExport.content],
    { type: reportExport.mimeType },
  );

  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = objectUrl;
  anchor.download = safeFilename;
  anchor.style.display = "none";
  anchor.rel = "noopener";

  try {
    document.body.appendChild(anchor);
    anchor.click();
  } catch {
    URL.revokeObjectURL(objectUrl);

    throw new Error("The browser could not start the report download.");
  } finally {
    anchor.remove();
  }

  window.setTimeout(() => {
    URL.revokeObjectURL(objectUrl);
  }, DOWNLOAD_URL_CLEANUP_DELAY_MS);
}

function getSafeExtension(filename: string): string {
  const match = filename.match(/\.(json|csv)$/i);


const extension = match?.[1];

return extension ? `.${extension.toLowerCase()}:` : ".json";

}

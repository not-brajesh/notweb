
/**
 * NOTWEB — Metadata Analysis
 *
 * Converts extracted website metadata into actionable findings.
 */

import type {
  AnalysisIssue,
  WebsiteMetadata,
} from "./index.js";

export interface MetadataAnalysisResult {
  score: number;
  issues: AnalysisIssue[];
  checksPerformed: number;
}

export interface MetadataAnalysisOptions {
  metadata: WebsiteMetadata;
  html?: string;
}

function createIssue(
  id: string,
  severity: AnalysisIssue["severity"],
  title: string,
  description: string,
  recommendation: string,
): AnalysisIssue {
  return {
    id,
    category: "metadata",
    severity,
    title,
    description,
    recommendation,
  };
}

/**
 * Analyze document and social-sharing metadata.
 */
export function analyzeMetadata(
  options: MetadataAnalysisOptions,
): MetadataAnalysisResult {
  const { metadata, html = "" } = options;

  const issues: AnalysisIssue[] = [];
  let checksPerformed = 0;

  checksPerformed += 1;

  if (!metadata.title?.trim()) {
    issues.push(
      createIssue(
        "metadata-missing-title",
        "high",
        "Missing page title",
        "The page does not have a usable document title.",
        "Add a descriptive title element that accurately represents the page.",
      ),
    );
  } else {
    checksPerformed += 1;

    if (metadata.title.trim().length > 60) {
      issues.push(
        createIssue(
          "metadata-long-title",
          "low",
          "Long page title",
          "The document title is longer than 60 characters.",
          "Consider a concise title while preserving the page's meaning.",
        ),
      );
    }
  }

  checksPerformed += 1;

  if (!metadata.description?.trim()) {
    issues.push(
      createIssue(
        "metadata-missing-description",
        "medium",
        "Missing meta description",
        "No usable meta description was found.",
        "Add a concise description that summarizes the page content.",
      ),
    );
  } else {
    checksPerformed += 1;

    if (metadata.description.trim().length > 160) {
      issues.push(
        createIssue(
          "metadata-long-description",
          "low",
          "Long meta description",
          "The meta description is longer than 160 characters.",
          "Consider shortening the description without losing important information.",
        ),
      );
    }
  }

  checksPerformed += 1;

  if (!metadata.language?.trim()) {
    issues.push(
      createIssue(
        "metadata-missing-language",
        "medium",
        "Missing document language",
        "The HTML document does not declare a language.",
        "Add an appropriate lang attribute to the HTML element.",
      ),
    );
  }

  checksPerformed += 1;

  if (!metadata.viewport?.trim()) {
    issues.push(
      createIssue(
        "metadata-missing-viewport",
        "medium",
        "Missing viewport metadata",
        "No viewport meta tag was detected.",
        "Add a viewport meta tag to support appropriate mobile rendering.",
      ),
    );
  }

  checksPerformed += 1;

  if (!metadata.canonicalUrl?.trim()) {
    issues.push(
      createIssue(
        "metadata-missing-canonical",
        "low",
        "Missing canonical URL",
        "No canonical URL was extracted from the document.",
        "Add a canonical link when the page requires a preferred URL.",
      ),
    );
  }

  checksPerformed += 1;

  if (!metadata.openGraph.title?.trim()) {
    issues.push(
      createIssue(
        "metadata-missing-og-title",
        "low",
        "Missing Open Graph title",
        "The page has no Open Graph title for social sharing.",
        "Consider adding an og:title meta tag.",
      ),
    );
  }

  checksPerformed += 1;

  if (!metadata.openGraph.description?.trim()) {
    issues.push(
      createIssue(
        "metadata-missing-og-description",
        "low",
        "Missing Open Graph description",
        "The page has no Open Graph description.",
        "Consider adding an og:description meta tag.",
      ),
    );
  }

  checksPerformed += 1;

  if (!metadata.openGraph.image?.trim()) {
    issues.push(
      createIssue(
        "metadata-missing-og-image",
        "info",
        "Missing Open Graph image",
        "No Open Graph image was extracted.",
        "Consider specifying an appropriate og:image for link previews.",
      ),
    );
  }

  checksPerformed += 1;

  if (!metadata.twitterCard.card?.trim()) {
    issues.push(
      createIssue(
        "metadata-missing-twitter-card",
        "info",
        "Missing Twitter card metadata",
        "No Twitter card type was extracted.",
        "Consider adding a twitter:card meta tag if social previews are needed.",
      ),
    );
  }

  // Check whether the supplied HTML declares a document title.
  // This is a separate source-level check from extracted metadata.
  if (html) {
    checksPerformed += 1;

    if (!/<title\b[^>]*>[\s\S]*?<\/title\s*>/i.test(html)) {
      const alreadyReported = issues.some(
        (issue) => issue.id === "metadata-missing-title",
      );

      if (!alreadyReported) {
        issues.push(
          createIssue(
            "metadata-title-element-missing",
            "medium",
            "Missing title element",
            "No title element was found in the supplied HTML.",
            "Add a title element inside the document head.",
          ),
        );
      }
    }
  }

  const penalties: Record<AnalysisIssue["severity"], number> = {
    critical: 25,
    high: 15,
    medium: 8,
    low: 3,
    info: 0,
  };

  const penalty = issues.reduce(
    (total, issue) => total + penalties[issue.severity],
    0,
  );

  return {
    score: Math.max(0, 100 - penalty),
    issues,
    checksPerformed,
  };
}

/**
 * Convenience helper for callers that only need findings.
 */
export function getMetadataIssues(
  options: MetadataAnalysisOptions,
): AnalysisIssue[] {
  return analyzeMetadata(options).issues;
}

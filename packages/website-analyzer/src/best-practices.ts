
/**
 * NOTWEB — Best Practices Analysis
 *
 * Evaluates common HTML implementation practices using supplied HTML.
 *
 * Scope:
 * - Static HTML inspection only.
 * - Does not fetch URLs or execute JavaScript.
 * - Does not claim to verify HTTP headers, TLS configuration,
 *   runtime behavior, or external resources.
 */

import type {
  AnalysisIssue,
  AnalysisSeverity,
} from "./index.js";

/* -------------------------------------------------------------------------- */
/*                                    Types                                   */
/* -------------------------------------------------------------------------- */

export interface BestPracticesAnalysisInput {
  html: string;
}

export interface BestPracticesAnalysisResult {
  score: number;
  issues: AnalysisIssue[];
  checksPerformed: number;
  metrics: {
    hasDoctype: boolean;
    hasDocumentLanguage: boolean;
    deprecatedElementCount: number;
    inlineEventHandlerCount: number;
    emptyLinkCount: number;
    emptyButtonCount: number;
    inlineStyleCount: number;
    missingImageAltCount: number;
  };
}

/* -------------------------------------------------------------------------- */
/*                                  Utilities                                 */
/* -------------------------------------------------------------------------- */

function countMatches(html: string, pattern: RegExp): number {
  return [...html.matchAll(pattern)].length;
}

function createIssue(
  id: string,
  severity: AnalysisSeverity,
  title: string,
  description: string,
  recommendation: string,
  element?: string,
): AnalysisIssue {
  return {
    id,
    category: "best-practices",
    severity,
    title,
    description,
    recommendation,
    ...(element !== undefined ? { element } : {}),
  };
}

function calculateScore(
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

  return Math.max(0, Math.min(100, 100 - totalPenalty));
}

/* -------------------------------------------------------------------------- */
/*                               Main Analysis                                */
/* -------------------------------------------------------------------------- */

export function analyzeBestPractices(
  input: BestPracticesAnalysisInput,
): BestPracticesAnalysisResult {
  const html = input.html;
  const issues: AnalysisIssue[] = [];
  let checksPerformed = 0;

  const hasDoctype = /^\s*<!doctype\s+html\b/i.test(html);
  const hasDocumentLanguage =
    /<html\b[^>]*\blang\s*=\s*(['"])[^'"]+\1/i.test(html) ||
    /<html\b[^>]*\blang\s*=\s*[^\s>]+/i.test(html);

  const deprecatedElementCount = countMatches(
    html,
    /<(?:font|center|marquee|big|strike|tt)\b/gi,
  );

  const inlineEventHandlerCount = countMatches(
    html,
    /\s+on(?:click|load|error|mouseover|mouseout|focus|blur|change|submit|keydown|keyup|input)\s*=/gi,
  );

  const emptyLinkCount = countMatches(
    html,
    /<a\b(?=[^>]*\bhref\s*=\s*(['"])\s*\1)[^>]*>\s*(?:<\/a\s*>)?/gi,
  );

  const emptyButtonCount = countMatches(
    html,
    /<button\b[^>]*>\s*<\/button\s*>/gi,
  );

  const inlineStyleCount = countMatches(
    html,
    /\sstyle\s*=\s*(['"])[\s\S]*?\1/gi,
  );

  const missingImageAltCount = countMatches(
    html,
    /<img\b(?![^>]*\balt\s*=)[^>]*>/gi,
  );

  /* HTML document structure */

  checksPerformed += 1;

  if (!hasDoctype) {
    issues.push(
      createIssue(
        "best-practices-missing-doctype",
        "medium",
        "Missing HTML doctype",
        "The supplied document does not begin with an HTML5 doctype declaration.",
        "Add <!DOCTYPE html> at the beginning of the HTML document.",
        "<!DOCTYPE html>",
      ),
    );
  }

  checksPerformed += 1;

  if (!/<html\b/i.test(html)) {
    issues.push(
      createIssue(
        "best-practices-missing-html-element",
        "medium",
        "Missing HTML root element",
        "No HTML root element was found in the supplied markup.",
        "Use a single <html> root element around the document content.",
        "<html>",
      ),
    );
  }

  checksPerformed += 1;

  if (!/<head\b/i.test(html)) {
    issues.push(
      createIssue(
        "best-practices-missing-head",
        "low",
        "Missing head element",
        "No head element was detected in the supplied HTML.",
        "Add a head element for document metadata and resource declarations.",
        "<head>",
      ),
    );
  }

  checksPerformed += 1;

  if (!/<body\b/i.test(html)) {
    issues.push(
      createIssue(
        "best-practices-missing-body",
        "low",
        "Missing body element",
        "No body element was detected in the supplied HTML.",
        "Use a body element for the page's visible document content.",
        "<body>",
      ),
    );
  }

  /* Language declaration */

  checksPerformed += 1;

  if (/<html\b/i.test(html) && !hasDocumentLanguage) {
    issues.push(
      createIssue(
        "best-practices-missing-language",
        "medium",
        "Missing document language",
        "The HTML root element does not declare a recognizable lang attribute.",
        'Add the appropriate language code, for example <html lang="en">.',
        "<html lang>",
      ),
    );
  }

  /* Deprecated HTML elements */

  checksPerformed += 1;

  if (deprecatedElementCount > 0) {
    issues.push(
      createIssue(
        "best-practices-deprecated-elements",
        "medium",
        "Deprecated HTML elements detected",
        `Found ${deprecatedElementCount} occurrence(s) of commonly deprecated presentational elements.`,
        "Replace deprecated presentational elements with semantic HTML and CSS.",
      ),
    );
  }

  /* Inline event handlers */

  checksPerformed += 1;

  if (inlineEventHandlerCount > 0) {
    issues.push(
      createIssue(
        "best-practices-inline-event-handlers",
        "low",
        "Inline event handlers detected",
        `Found ${inlineEventHandlerCount} inline event handler attribute(s).`,
        "Prefer registering event handlers through JavaScript modules or framework event APIs.",
      ),
    );
  }

  /* Empty links */

  checksPerformed += 1;

  if (emptyLinkCount > 0) {
    issues.push(
      createIssue(
        "best-practices-empty-links",
        "high",
        "Empty links detected",
        `Found ${emptyLinkCount} anchor element(s) with an empty href value.`,
        "Provide a meaningful destination or use a button for an action.",
        "<a>",
      ),
    );
  }

  /* Empty buttons */

  checksPerformed += 1;

  if (emptyButtonCount > 0) {
    issues.push(
      createIssue(
        "best-practices-empty-buttons",
        "medium",
        "Empty buttons detected",
        `Found ${emptyButtonCount} button element(s) without text content.`,
        "Give each button an accessible name, including an aria-label for icon-only buttons.",
        "<button>",
      ),
    );
  }

  /* Inline styling */

  checksPerformed += 1;

  if (inlineStyleCount > 0) {
    issues.push(
      createIssue(
        "best-practices-inline-styles",
        "info",
        "Inline styles detected",
        `Found ${inlineStyleCount} inline style attribute(s).`,
        "Consider using reusable CSS classes when styles should be shared or maintained centrally.",
      ),
    );
  }

  /* Image alternative text */

  checksPerformed += 1;

  if (missingImageAltCount > 0) {
    issues.push(
      createIssue(
        "best-practices-images-without-alt",
        "high",
        "Images missing alt attributes",
        `Found ${missingImageAltCount} image element(s) without an alt attribute.`,
        'Provide meaningful alt text for informative images. Use alt="" for decorative images.',
        "<img>",
      ),
    );
  }

  return {
    score: calculateScore(issues),
    issues,
    checksPerformed,
    metrics: {
      hasDoctype,
      hasDocumentLanguage,
      deprecatedElementCount,
      inlineEventHandlerCount,
      emptyLinkCount,
      emptyButtonCount,
      inlineStyleCount,
      missingImageAltCount,
    },
  };
}

/* -------------------------------------------------------------------------- */
/*                                Convenience                                 */
/* -------------------------------------------------------------------------- */

export function getBestPracticesIssues(
  input: BestPracticesAnalysisInput,
): AnalysisIssue[] {
  return analyzeBestPractices(input).issues;
}

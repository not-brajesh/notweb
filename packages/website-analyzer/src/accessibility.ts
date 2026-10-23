
/**
 * NOTWEB — Accessibility Analyzer
 *
 * Performs basic accessibility checks on supplied HTML.
 *
 * Limitations:
 * - Does not execute JavaScript.
 * - Does not calculate visual contrast.
 * - Does not claim WCAG compliance.
 * - Results are heuristic findings and should be reviewed.
 */

import type {
  AnalysisIssue,
  AnalysisSeverity,
} from "./index.js";

export interface AccessibilityAnalysisInput {
  html: string;
}

export interface AccessibilityAnalysisResult {
  score: number;
  issues: AnalysisIssue[];
  checksPerformed: number;
}

interface AccessibilityCheck {
  id: string;
  title: string;
  description: string;
  recommendation: string;
  severity: AnalysisSeverity;
  failed: boolean;
  element?: string;
  documentationUrl?: string;
}

function getAttributes(tag: string): string {
  return tag.replace(/^<\/?\w+\b/i, "").replace(/\/?>$/, "");
}

function getAttribute(
  attributes: string,
  name: string,
): string | undefined {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const expression = new RegExp(
    `(?:^|\\s)${escapedName}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'=<>\\x60]+))`,
    "i",
  );

  const match = expression.exec(attributes);

  return match?.[1] ?? match?.[2] ?? match?.[3];
}

function decodeBasicEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'");
}

function stripTags(value: string): string {
  return decodeBasicEntities(
    value.replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, " ")
      .replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi, " ")
      .replace(/<[^>]*>/g, " "),
  )
    .replace(/\s+/g, " ")
    .trim();
}

function getInnerText(tag: string): string {
  const match = />([\s\S]*?)<\/[\w:-]+\s*>$/.exec(tag);

  return stripTags(match?.[1] ?? "");
}

function hasAccessibleName(
  tag: string,
  attributes: string,
  innerText: string,
): boolean {
  const ariaLabel = getAttribute(attributes, "aria-label")?.trim();
  const ariaLabelledBy = getAttribute(attributes, "aria-labelledby")?.trim();
  const title = getAttribute(attributes, "title")?.trim();

  if (ariaLabel || ariaLabelledBy || title || innerText.trim()) {
    return true;
  }

  // An image-only button may still have an accessible name through its image.
  if (/<img\b/i.test(tag)) {
    const imageTags = tag.match(/<img\b[^>]*>/gi) ?? [];

    return imageTags.some((imageTag) => {
      const imageAttributes = getAttributes(imageTag);

      return Boolean(getAttribute(imageAttributes, "alt")?.trim());
    });
  }

  return false;
}

function createIssue(check: AccessibilityCheck): AnalysisIssue {
  return {
    id: check.id,
    category: "accessibility",
    severity: check.severity,
    title: check.title,
    description: check.description,
    recommendation: check.recommendation,
    ...(check.element !== undefined ? { element: check.element } : {}),
    ...(check.documentationUrl !== undefined
      ? { documentationUrl: check.documentationUrl }
      : {}),
  };
}

/**
 * Analyze common accessibility signals in static HTML.
 */
export function analyzeAccessibility(
  input: AccessibilityAnalysisInput,
): AccessibilityAnalysisResult {
  const { html } = input;
  const issues: AnalysisIssue[] = [];
  const checks: AccessibilityCheck[] = [];

  const addCheck = (check: AccessibilityCheck): void => {
    checks.push(check);

    if (check.failed) {
      issues.push(createIssue(check));
    }
  };

  const images = html.match(/<img\b[^>]*>/gi) ?? [];

  const missingAltImages = images.filter((image) => {
    const attributes = getAttributes(image);

    // alt="" is valid for decorative images.
    return getAttribute(attributes, "alt") === undefined;
  });

  addCheck({
    id: "a11y-image-alt-missing",
    title: "Images missing alternative text",
    description:
      `${missingAltImages.length} of ${images.length} image elements have no alt attribute.`,
    recommendation:
      'Provide meaningful alt text for informative images and alt="" for decorative images.',
    severity: "high",
    failed: missingAltImages.length > 0,
    element: "<img>",
    documentationUrl: "https://www.w3.org/WAI/tutorials/images/",
  });

  const buttons = html.match(/<button\b[^>]*>[\s\S]*?<\/button\s*>/gi) ?? [];
  const unnamedButtons = buttons.filter((button) => {
    const attributes = getAttributes(button);
    const innerText = getInnerText(button);

    return !hasAccessibleName(button, attributes, innerText);
  });

  addCheck({
    id: "a11y-button-name-missing",
    title: "Buttons may lack accessible names",
    description:
      `${unnamedButtons.length} of ${buttons.length} button elements have no detectable accessible name.`,
    recommendation:
      "Give each button meaningful text, an aria-label, or a valid aria-labelledby reference.",
    severity: "high",
    failed: unnamedButtons.length > 0,
    element: "<button>",
    documentationUrl:
      "https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html",
  });

  const inputs = html.match(
    /<input\b[^>]*>|<select\b[^>]*>|<textarea\b[^>]*>/gi,
  ) ?? [];

  const labels = html.match(/<label\b[^>]*>[\s\S]*?<\/label\s*>/gi) ?? [];

  const labelForIds = new Set(
    labels
      .map((label) => getAttribute(getAttributes(label), "for"))
      .filter((id): id is string => Boolean(id)),
  );

 

  const unlabelledInputs = inputs.filter((input) => {
    const attributes = getAttributes(input);
    const type = getAttribute(attributes, "type")?.toLowerCase() ?? "";

    // These input types generally do not require a visible text label.
    if (["hidden", "submit", "reset", "button", "image"].includes(type)) {
      return false;
    }

    const id = getAttribute(attributes, "id");
    const ariaLabel = getAttribute(attributes, "aria-label")?.trim();
    const ariaLabelledBy = getAttribute(attributes, "aria-labelledby")?.trim();

    const hasExplicitLabel = Boolean(id && labelForIds.has(id));
    const hasWrappingLabel = labels.some((label) => {
      return label.toLowerCase().includes(input.toLowerCase());
    });

    return !(
      hasExplicitLabel ||
      hasWrappingLabel ||
      ariaLabel ||
      ariaLabelledBy
    );
  });

  addCheck({
    id: "a11y-form-label-missing",
    title: "Form controls may lack labels",
    description:
      `${unlabelledInputs.length} of ${inputs.length} detected form controls have no detectable label.`,
    recommendation:
      "Associate each form control with a <label>, or provide an appropriate accessible name.",
    severity: "high",
    failed: unlabelledInputs.length > 0,
    element: "<input>, <select>, <textarea>",
    documentationUrl:
      "https://www.w3.org/WAI/tutorials/forms/labels/",
  });

  const headings = [...html.matchAll(/<h([1-6])\b[^>]*>/gi)].map(
    (match) => Number(match[1]),
  );

  const h1Count = headings.filter((level) => level === 1).length;

  addCheck({
    id: "a11y-heading-h1-missing",
    title: "No level-one heading found",
    description:
      "No <h1> heading was detected in the supplied HTML.",
    recommendation:
      "Use headings to describe the page structure and include a suitable primary heading when appropriate.",
    severity: "medium",
    failed: h1Count === 0,
    element: "<h1>",
    documentationUrl:
      "https://www.w3.org/WAI/tutorials/page-structure/headings/",
  });

  const skippedHeadingLevels = headings.some((level, index) => {
    if (index === 0) {
      return level > 1;
    }

    const previousLevel = headings[index - 1];

    return previousLevel !== undefined && level > previousLevel + 1;
  });

  addCheck({
    id: "a11y-heading-level-skip",
    title: "Heading levels may be skipped",
    description:
      "The heading sequence contains a jump of more than one level.",
    recommendation:
      "Review heading levels so they communicate a logical content hierarchy. Heading structure should reflect the document, not visual styling.",
    severity: "medium",
    failed: skippedHeadingLevels,
    element: "<h1>–<h6>",
    documentationUrl:
      "https://www.w3.org/WAI/tutorials/page-structure/headings/",
  });

  const htmlTag = /<html\b([^>]*)>/i.exec(html);
  const language = htmlTag?.[1]
    ? getAttribute(htmlTag[1], "lang")
    : undefined;

  addCheck({
    id: "a11y-document-language-missing",
    title: "Document language is missing",
    description:
      "The root HTML element has no detectable lang attribute.",
    recommendation:
      'Set the document language, for example <html lang="en">, using the appropriate BCP 47 language tag.',
    severity: "medium",
    failed: !language?.trim(),
    element: "<html lang>",
    documentationUrl:
      "https://www.w3.org/WAI/WCAG22/Understanding/language-of-page.html",
  });

  const mainCount = (
    html.match(/<main\b[^>]*>/gi) ?? []
  ).length;

  addCheck({
    id: "a11y-main-landmark-missing",
    title: "Main landmark not detected",
    description:
      "No <main> landmark was found in the supplied HTML.",
    recommendation:
      "Consider using one main landmark to identify the document's primary content.",
    severity: "low",
    failed: mainCount === 0,
    element: "<main>",
    documentationUrl:
      "https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/",
  });

  const links = html.match(/<a\b[^>]*>[\s\S]*?<\/a\s*>/gi) ?? [];

  const unnamedLinks = links.filter((link) => {
    const attributes = getAttributes(link);
    const innerText = getInnerText(link);

    return !hasAccessibleName(link, attributes, innerText);
  });

  addCheck({
    id: "a11y-link-name-missing",
    title: "Links may lack accessible names",
    description:
      `${unnamedLinks.length} of ${links.length} links have no detectable text or accessible name.`,
    recommendation:
      "Give each link descriptive text or an accessible name that explains its destination or purpose.",
    severity: "high",
    failed: unnamedLinks.length > 0,
    element: "<a>",
    documentationUrl:
      "https://www.w3.org/WAI/WCAG22/Understanding/link-purpose-in-context.html",
  });

  const rolePresentationElements = html.match(
    /<(?:img|button|a|input|select|textarea)\b[^>]*\brole\s*=\s*["']presentation["'][^>]*>/gi,
  ) ?? [];

  addCheck({
    id: "a11y-presentation-role-review",
    title: "Presentation roles need review",
    description:
      `${rolePresentationElements.length} elements explicitly use role="presentation".`,
    recommendation:
      "Verify that removing the element's semantic role is intentional and does not hide necessary information or interaction semantics.",
    severity: "info",
    failed: rolePresentationElements.length > 0,
  });

  const penaltyBySeverity: Record<AnalysisSeverity, number> = {
    critical: 25,
    high: 15,
    medium: 8,
    low: 3,
    info: 0,
  };

  const penalty = issues.reduce(
    (total, issue) => total + penaltyBySeverity[issue.severity],
    0,
  );

  return {
    score: Math.max(0, 100 - penalty),
    issues,
    checksPerformed: checks.length,
  };
}

/**
 * Convenience helper returning only accessibility findings.
 */
export function getAccessibilityIssues(
  input: AccessibilityAnalysisInput,
): AnalysisIssue[] {
  return analyzeAccessibility(input).issues;
}

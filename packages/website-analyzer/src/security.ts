

/**
 * NOTWEB — Static HTML Security Analyzer
 *
 * Detects potentially risky patterns in supplied HTML.
 *
 * IMPORTANT:
 * - This is a static heuristic analyzer, not a penetration-testing tool.
 * - It does not fetch URLs or execute scripts.
 * - It cannot establish whether a website is secure.
 * - HTML parsing with regular expressions is approximate.
 */

import type {
  AnalysisIssue,
  AnalysisSeverity,
} from "./index.js";

export interface SecurityAnalysisInput {
  html: string;
  /** Optional URL of the page that supplied the HTML. */
  pageUrl?: string;
}

export interface SecurityAnalysisResult {
  score: number;
  issues: AnalysisIssue[];
  checksPerformed: number;
  metrics: {
    scriptCount: number;
    inlineScriptCount: number;
    insecureResourceCount: number;
    formsWithoutAction: number;
    inlineEventHandlerCount: number;
    suspiciousUrlCount: number;
  };
}

interface SecurityCheck {
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

function getTags(html: string, tagName: string): string[] {
  const escapedName = tagName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  return html.match(
    new RegExp(`<${escapedName}\\b[^>]*>`, "gi"),
  ) ?? [];
}

function isHttpPage(pageUrl: string | undefined): boolean {
  if (!pageUrl) {
    return false;
  }

  try {
    return new URL(pageUrl).protocol === "http:";
  } catch {
    return false;
  }
}

function createIssue(check: SecurityCheck): AnalysisIssue {
  return {
    id: check.id,
    category: "security",
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
 * Analyze security-related signals in static HTML.
 */
export function analyzeSecurity(
  input: SecurityAnalysisInput,
): SecurityAnalysisResult {
  const { html, pageUrl } = input;

  const issues: AnalysisIssue[] = [];
  const checks: SecurityCheck[] = [];

  const scripts = getTags(html, "script");
  const resources = [
    ...getTags(html, "script"),
    ...getTags(html, "img"),
    ...getTags(html, "iframe"),
    ...getTags(html, "source"),
    ...getTags(html, "audio"),
    ...getTags(html, "video"),
    ...getTags(html, "link"),
  ];

  const insecureResources = resources.filter((tag) => {
    const attributes = getAttributes(tag);
    const candidate =
      getAttribute(attributes, "src") ??
      getAttribute(attributes, "href");

    if (!candidate) {
      return false;
    }

    return /^http:\/\//i.test(candidate.trim());
  });

  const forms = getTags(html, "form");

  const formsWithoutAction = forms.filter((tag) => {
    const action = getAttribute(getAttributes(tag), "action");

    return action === undefined || action.trim() === "";
  });

  const inlineEventHandlers = html.match(
    /\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi,
  ) ?? [];

  const suspiciousUrlAttributes: string[] = [];

  const urlAttributes = [
    ...html.matchAll(
      /\b(?:href|src|action|formaction|xlink:href)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/gi,
    ),
  ];

  for (const match of urlAttributes) {
    const value = (match[1] ?? match[2] ?? match[3] ?? "")
      .trim()
      .replace(/[\u0000-\u0020]+/g, "");

    if (/^(?:javascript|vbscript):/i.test(value)) {
      suspiciousUrlAttributes.push(value);
    }
  }

  const inlineScripts = scripts.filter((tag) => {
    return !/\bsrc\s*=/i.test(getAttributes(tag));
  });

  const addCheck = (check: SecurityCheck): void => {
    checks.push(check);

    if (check.failed) {
      issues.push(createIssue(check));
    }
  };

  addCheck({
    id: "security-insecure-page-transport",
    title: "Page uses HTTP",
    description:
      "The supplied page URL uses HTTP rather than HTTPS.",
    recommendation:
      "Use HTTPS for production websites and ensure redirects and canonical URLs are configured correctly.",
    severity: "high",
    failed: isHttpPage(pageUrl),
    element: "Page URL",
    documentationUrl: "https://developer.mozilla.org/en-US/docs/Web/Security",
  });

  addCheck({
    id: "security-insecure-resources",
    title: "Potentially insecure HTTP resources",
    description:
      `${insecureResources.length} resource tags reference URLs beginning with http://. The browser may block or upgrade some mixed-content requests.`,
    recommendation:
      "Review resource URLs and use HTTPS where supported. Verify third-party resource behavior in the browser.",
    severity: "medium",
    failed: insecureResources.length > 0,
    element: "Resource URL",
    documentationUrl:
      "https://developer.mozilla.org/en-US/docs/Web/Security/Mixed_content",
  });

  addCheck({
    id: "security-inline-event-handlers",
    title: "Inline event handlers detected",
    description:
      `${inlineEventHandlers.length} inline event-handler attributes were detected. Their presence is not proof of a vulnerability, but can complicate a strict Content Security Policy.`,
    recommendation:
      "Review inline handlers and consider registering event listeners in JavaScript modules where practical.",
    severity: "low",
    failed: inlineEventHandlers.length > 0,
    element: "on* attributes",
    documentationUrl:
      "https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP",
  });

  addCheck({
    id: "security-suspicious-url-schemes",
    title: "Potentially dangerous URL schemes",
    description:
      `${suspiciousUrlAttributes.length} URL attributes use javascript: or vbscript: schemes.`,
    recommendation:
      "Inspect each URL and remove executable URL schemes where they are not explicitly required. Validate and sanitize untrusted URLs before use.",
    severity: "high",
    failed: suspiciousUrlAttributes.length > 0,
    element: "href, src, action, formaction",
    documentationUrl:
      "https://owasp.org/www-community/attacks/xss/",
  });

  addCheck({
    id: "security-forms-without-action",
    title: "Forms without an explicit action",
    description:
      `${formsWithoutAction.length} forms do not declare a non-empty action attribute. Browsers generally submit such forms to the current document URL.`,
    recommendation:
      "Verify that each form submits to the intended endpoint and that server-side validation, authorization, and CSRF protections are implemented where applicable.",
    severity: "info",
    failed: formsWithoutAction.length > 0,
    element: "<form>",
  });

  addCheck({
    id: "security-inline-scripts-review",
    title: "Inline scripts require review",
    description:
      `${inlineScripts.length} script elements do not declare a src attribute. Inline scripts can be legitimate but may affect Content Security Policy configuration.`,
    recommendation:
      "Review inline scripts and establish a suitable Content Security Policy. Avoid unsafe-eval and broad unsafe-inline allowances when possible.",
    severity: "info",
    failed: inlineScripts.length > 0,
    element: "<script>",
    documentationUrl:
      "https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP",
  });

  const penaltyBySeverity: Record<AnalysisSeverity, number> = {
    critical: 25,
    high: 15,
    medium: 8,
    low: 3,
    info: 0,
  };

  const totalPenalty = issues.reduce(
    (total, issue) => total + penaltyBySeverity[issue.severity],
    0,
  );

  return {
    score: Math.max(0, 100 - totalPenalty),
    issues,
    checksPerformed: checks.length,
    metrics: {
      scriptCount: scripts.length,
      inlineScriptCount: inlineScripts.length,
      insecureResourceCount: insecureResources.length,
      formsWithoutAction: formsWithoutAction.length,
      inlineEventHandlerCount: inlineEventHandlers.length,
      suspiciousUrlCount: suspiciousUrlAttributes.length,
    },
  };
}

/**
 * Convenience helper returning only security findings.
 */
export function getSecurityIssues(
  input: SecurityAnalysisInput,
): AnalysisIssue[] {
  return analyzeSecurity(input).issues;
}

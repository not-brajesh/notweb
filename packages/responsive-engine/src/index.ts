/**
 * NOTWEB — Responsive Engine
 *
 * Analyzes supplied HTML for common responsive-design issues.
 *
 * Scope:
 * - Static HTML inspection.
 * - Detects viewport configuration, fixed dimensions,
 *   responsive image hints, and mobile compatibility issues.
 * - Produces actionable recommendations.
 *
 * Limitations:
 * - Does not render pages in a browser.
 * - Does not measure actual element dimensions.
 * - Does not execute JavaScript or fetch external resources.
 * - Findings are heuristic and should be verified in a browser.
 */

export type ResponsiveSeverity = "critical" | "high" | "medium" | "low" | "info";

export type ResponsiveIssueCategory =
  | "viewport"
  | "layout"
  | "images"
  | "typography"
  | "media"
  | "touch"
  | "overflow"
  | "best-practices";

export type DeviceClass = "mobile" | "tablet" | "desktop";

export interface ResponsiveIssue {
  id: string;
  category: ResponsiveIssueCategory;
  severity: ResponsiveSeverity;
  title: string;
  description: string;
  recommendation: string;
  element?: string;
  documentationUrl?: string;
}

export interface ResponsiveAnalysisInput {
  html: string;
  url?: string;
}

export interface ResponsiveMetrics {
  hasViewportMeta: boolean;
  hasResponsiveViewport: boolean;
  imageCount: number;
  imagesWithoutDimensions: number;
  imagesWithoutAlt: number;
  fixedWidthCount: number;
  fixedHeightCount: number;
  mediaQueryCount: number;
  iframeCount: number;
  tablesWithoutResponsiveWrapper: number;
  inlineStyleCount: number;
  touchTargetHints: number;
  horizontalOverflowRisks: number;
}

export interface ResponsiveScore {
  score: number;
  grade: "A" | "B" | "C" | "D" | "F";
  label: string;
}

export interface ResponsiveAnalysisResult {
  version: string;
  url: string | null;
  analyzedAt: string;
  status: "completed";
  score: ResponsiveScore;
  issues: ResponsiveIssue[];
  metrics: ResponsiveMetrics;
  summary: {
    totalIssues: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
  deviceRecommendations: DeviceRecommendation[];
  limitations: string[];
}

export interface DeviceRecommendation {
  device: DeviceClass;
  viewportWidth: number;
  viewportHeight: number;
  recommendations: string[];
}

export interface ResponsiveAnalysisOptions {
  includeInformational?: boolean;
  maxIssues?: number;
}

export const RESPONSIVE_ENGINE_VERSION = "0.1.0";

export const DEFAULT_DEVICE_VIEWPORTS: Readonly<
  Record<DeviceClass, { width: number; height: number }>
> = Object.freeze({
  mobile: { width: 390, height: 844 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1440, height: 900 },
});

const SEVERITY_PENALTIES: Record<ResponsiveSeverity, number> = {
  critical: 25,
  high: 15,
  medium: 8,
  low: 3,
  info: 0,
};

const SEVERITY_ORDER: Record<ResponsiveSeverity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  info: 4,
};

const LIMITATIONS = [
  "Analysis is based on supplied HTML and does not render the page.",
  "CSS files, stylesheets, and computed styles are not inspected.",
  "Actual horizontal overflow cannot be confirmed without browser rendering.",
  "Touch-target dimensions and readability cannot be measured statically.",
  "Recommendations should be verified at mobile, tablet, and desktop widths.",
] as const;

/* -------------------------------------------------------------------------- */
/*                                  Utilities                                 */
/* -------------------------------------------------------------------------- */

function countMatches(html: string, pattern: RegExp): number {
  return [...html.matchAll(pattern)].length;
}

function hasAttribute(tag: string, attribute: string): boolean {
  const escaped = attribute.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  return new RegExp(
    `\\s${escaped}(?:\\s*=|\\s|\\/?>)`,
    "i",
  ).test(tag);
}

function getAttribute(tag: string, attribute: string): string | null {
  const escaped = attribute.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const match = tag.match(
    new RegExp(
      `\\s${escaped}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`,
      "i",
    ),
  );

  return match?.[1] ?? match?.[2] ?? match?.[3] ?? null;
}

function extractTags(html: string, tagName: string): string[] {
  const escaped = tagName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`<${escaped}\\b[^>]*>`, "gi");

  return [...html.matchAll(pattern)].map((match) => match[0]);
}

function createIssue(
  id: string,
  category: ResponsiveIssueCategory,
  severity: ResponsiveSeverity,
  title: string,
  description: string,
  recommendation: string,
  element?: string,
  documentationUrl?: string,
): ResponsiveIssue {
  return {
    id,
    category,
    severity,
    title,
    description,
    recommendation,
    ...(element !== undefined ? { element } : {}),
    ...(documentationUrl !== undefined ? { documentationUrl } : {}),
  };
}

/**
 * Generates a responsive score from detected issues.
 *
 * This is a heuristic score, not a measured browser compatibility score.
 */
export function calculateResponsiveScore(
  issues: readonly ResponsiveIssue[],
): ResponsiveScore {
  const penalty = issues.reduce(
    (total, issue) => total + SEVERITY_PENALTIES[issue.severity],
    0,
  );

  const score = Math.max(0, Math.min(100, 100 - penalty));

  if (score >= 90) {
    return { score, grade: "A", label: "Excellent foundation" };
  }

  if (score >= 80) {
    return { score, grade: "B", label: "Good foundation" };
  }

  if (score >= 65) {
    return { score, grade: "C", label: "Needs improvement" };
  }

  if (score >= 50) {
    return { score, grade: "D", label: "Poor responsive signals" };
  }

  return { score, grade: "F", label: "Significant issues detected" };
}

function createSummary(issues: readonly ResponsiveIssue[]) {
  return {
    totalIssues: issues.length,
    critical: issues.filter((issue) => issue.severity === "critical").length,
    high: issues.filter((issue) => issue.severity === "high").length,
    medium: issues.filter((issue) => issue.severity === "medium").length,
    low: issues.filter((issue) => issue.severity === "low").length,
    info: issues.filter((issue) => issue.severity === "info").length,
  };
}

function createDeviceRecommendations(): DeviceRecommendation[] {
  return [
    {
      device: "mobile",
      viewportWidth: DEFAULT_DEVICE_VIEWPORTS.mobile.width,
      viewportHeight: DEFAULT_DEVICE_VIEWPORTS.mobile.height,
      recommendations: [
        "Verify that the main content fits within a narrow viewport.",
        "Check navigation, forms, buttons, and text readability.",
        "Confirm that images and embedded content scale correctly.",
      ],
    },
    {
      device: "tablet",
      viewportWidth: DEFAULT_DEVICE_VIEWPORTS.tablet.width,
      viewportHeight: DEFAULT_DEVICE_VIEWPORTS.tablet.height,
      recommendations: [
        "Check intermediate layouts and navigation transitions.",
        "Verify that columns do not become excessively narrow.",
        "Review image sizing and spacing at medium widths.",
      ],
    },
    {
      device: "desktop",
      viewportWidth: DEFAULT_DEVICE_VIEWPORTS.desktop.width,
      viewportHeight: DEFAULT_DEVICE_VIEWPORTS.desktop.height,
      recommendations: [
        "Check content width and spacing on wide screens.",
        "Ensure navigation and multi-column layouts remain usable.",
        "Verify that content does not stretch excessively.",
      ],
    },
  ];
}

/* -------------------------------------------------------------------------- */
/*                               Main Analysis                                */
/* -------------------------------------------------------------------------- */

export function analyzeResponsiveDesign(
  input: ResponsiveAnalysisInput,
  options: ResponsiveAnalysisOptions = {},
): ResponsiveAnalysisResult {
  if (typeof input.html !== "string") {
    throw new TypeError("Responsive analysis requires an HTML string.");
  }

  const html = input.html;
  const issues: ResponsiveIssue[] = [];

  const viewportTags = extractTags(html, "meta").filter((tag) => {
    return getAttribute(tag, "name")?.toLowerCase() === "viewport";
  });

  const hasViewportMeta = viewportTags.length > 0;

  const viewportContent = viewportTags
    .map((tag) => getAttribute(tag, "content") ?? "")
    .join(",");

  const hasResponsiveViewport =
    /(?:^|,)\s*width\s*=\s*device-width\b/i.test(viewportContent) &&
    /(?:^|,)\s*initial-scale\s*=\s*(?:1(?:\.0*)?|0?\.?[1-9]\d*)\b/i.test(
      viewportContent,
    );

  const imageTags = extractTags(html, "img");
  const imagesWithoutDimensions = imageTags.filter((tag) => {
    return !hasAttribute(tag, "width") || !hasAttribute(tag, "height");
  }).length;

  const imagesWithoutAlt = imageTags.filter((tag) => {
    return !hasAttribute(tag, "alt");
  }).length;

  const fixedWidthCount = countMatches(
    html,
    /\bwidth\s*=\s*["']?\s*\d{3,}(?:px)?["']?/gi,
  );

  const fixedHeightCount = countMatches(
    html,
    /\bheight\s*=\s*["']?\s*\d{3,}(?:px)?["']?/gi,
  );

  const mediaQueryCount = countMatches(
    html,
    /@media\b/gi,
  );

  const iframeTags = extractTags(html, "iframe");

  const tablesWithoutResponsiveWrapper = countMatches(
    html,
    /<table\b/gi,
  );

  const inlineStyleCount = countMatches(
    html,
    /\sstyle\s*=\s*(?:"[^"]*"|'[^']*')/gi,
  );

  const touchTargetHints = countMatches(
    html,
    /<(?:button|input|select|textarea)\b/gi,
  );

  const horizontalOverflowRisks = countMatches(
    html,
    /(?:width|min-width)\s*:\s*\d{3,}(?:px)?\b/gi,
  );

  const metrics: ResponsiveMetrics = {
    hasViewportMeta,
    hasResponsiveViewport,
    imageCount: imageTags.length,
    imagesWithoutDimensions,
    imagesWithoutAlt,
    fixedWidthCount,
    fixedHeightCount,
    mediaQueryCount,
    iframeCount: iframeTags.length,
    tablesWithoutResponsiveWrapper,
    inlineStyleCount,
    touchTargetHints,
    horizontalOverflowRisks,
  };

  /* Viewport configuration */

  if (!hasViewportMeta) {
    issues.push(
      createIssue(
        "responsive-missing-viewport",
        "viewport",
        "high",
        "Viewport meta tag is missing",
        "The supplied HTML does not declare a viewport meta tag.",
        'Add <meta name="viewport" content="width=device-width, initial-scale=1"> to the document head.',
        "<meta>",
        "https://developer.mozilla.org/en-US/docs/Web/HTML/Viewport_meta_tag",
      ),
    );
  } else if (!hasResponsiveViewport) {
    issues.push(
      createIssue(
        "responsive-viewport-configuration",
        "viewport",
        "Viewport configuration may be incomplete",
        "The viewport declaration does not clearly include both device-width and a supported initial-scale value.",
        'Review the viewport declaration and normally use content="width=device-width, initial-scale=1".',
        "<meta name=\"viewport\">",
      ),
    );
  }

  /* Image sizing */

  if (imagesWithoutDimensions > 0) {
    issues.push(
      createIssue(
        "responsive-image-dimensions",
        "images",
        "Images missing intrinsic dimensions",
        `${imagesWithoutDimensions} image element(s) lack an explicit width or height attribute.`,
        "Where practical, provide intrinsic width and height attributes and use CSS such as max-width: 100%; height: auto.",
        "<img>",
        "https://web.dev/articles/optimize-cls",
      ),
    );
  }

  if (imagesWithoutAlt > 0) {
    issues.push(
      createIssue(
        "responsive-image-alt",
        "images",
        "Images missing alt attributes",
        `${imagesWithoutAlt} image element(s) do not declare an alt attribute. This is an accessibility concern rather than a direct measurement of responsiveness.`,
        'Provide descriptive alt text for meaningful images and alt="" for decorative images.',
        "<img>",
        "https://www.w3.org/WAI/tutorials/images/",
      ),
    );
  }

  /* Fixed dimensions */

  if (fixedWidthCount > 0) {
    issues.push(
      createIssue(
        "responsive-fixed-width",
        "overflow",
        "Potentially fixed-width elements detected",
        `Found ${fixedWidthCount} width attribute(s) with large numeric values. These may cause overflow on narrow screens.`,
        "Inspect these elements and consider max-width: 100%, flexible sizing, CSS Grid, or Flexbox.",
      ),
    );
  }

  if (fixedHeightCount > 0) {
    issues.push(
      createIssue(
        "responsive-fixed-height",
        "layout",
        "Potentially fixed-height elements detected",
        `Found ${fixedHeightCount} height attribute(s) with large numeric values. Fixed heights can clip content when text wraps.`,
        "Review fixed heights and prefer min-height or content-driven sizing when appropriate.",
      ),
    );
  }

  if (horizontalOverflowRisks > 0) {
    issues.push(
      createIssue(
        "responsive-css-fixed-dimensions",
        "overflow",
        "Potential CSS overflow risks detected",
        `Found ${horizontalOverflowRisks} inline style declaration(s) with potentially large fixed dimensions.`,
        "Inspect fixed width and min-width declarations at narrow viewport sizes. Static inspection cannot confirm actual overflow.",
      ),
    );
  }

  /* Media and embedded content */

  if (iframeTags.length > 0) {
    issues.push(
      createIssue(
        "responsive-iframe",
        "media",
        "Embedded frames need responsive verification",
        `Found ${iframeTags.length} iframe element(s). Their dimensions and embedded content were not rendered or measured.`,
        "Use a responsive container, set suitable width constraints, and verify the embedded content on mobile.",
        "<iframe>",
      ),
    );
  }

  if (tablesWithoutResponsiveWrapper > 0) {
    issues.push(
      createIssue(
        "responsive-tables",
        "layout",
        "Tables need narrow-screen verification",
        `Found ${tablesWithoutResponsiveWrapper} table element(s). Static HTML cannot determine whether their containers allow horizontal scrolling.`,
        "Check wide tables on mobile. Consider a dedicated overflow-x container or a more suitable small-screen presentation.",
        "<table>",
      ),
    );
  }

  /* Responsive CSS hints */

  if (mediaQueryCount === 0) {
    issues.push(
      createIssue(
        "responsive-no-inline-media-queries",
        "best-practices",
        "No CSS media queries found in supplied HTML",
        "No @media rule was detected in the HTML text. Stylesheets may be external or use other responsive techniques.",
        "Inspect the actual stylesheets before concluding that breakpoints are missing. Add media queries only where the layout requires them.",
      ),
    );
  }

  if (inlineStyleCount > 0) {
    issues.push(
      createIssue(
        "responsive-inline-styles",
        "best-practices",
        "Inline styles may limit layout flexibility",
        `Found ${inlineStyleCount} inline style attribute(s). Some inline styles can make responsive adjustments harder to maintain.`,
        "Prefer reusable CSS classes for layout rules and use responsive CSS declarations in stylesheets.",
      ),
    );
  }

  /* Optional informational findings */

  if (options.includeInformational) {
    issues.push(
      createIssue(
        "responsive-static-analysis-limitation",
        "best-practices",
        "Static analysis cannot verify the rendered layout",
        "The engine inspected HTML markup only; actual layout, overflow, breakpoints, and touch-target dimensions were not measured.",
        "Use browser-based tests at mobile, tablet, and desktop viewport sizes to validate the layout.",
      ),
    );
  }

  issues.sort((a, b) => {
    return SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
  });

  const maxIssues = options.maxIssues;

  const finalIssues =
    maxIssues !== undefined && Number.isInteger(maxIssues) && maxIssues >= 0
      ? issues.slice(0, maxIssues)
      : issues;

  return {
    version: RESPONSIVE_ENGINE_VERSION,
    url: input.url ?? null,
    analyzedAt: new Date().toISOString(),
    status: "completed",
    score: calculateResponsiveScore(finalIssues),
    issues: finalIssues,
    metrics,
    summary: createSummary(finalIssues),
    deviceRecommendations: createDeviceRecommendations(),
    limitations: [...LIMITATIONS],
  };
}

/* -------------------------------------------------------------------------- */
/*                              Public Helpers                                */
/* -------------------------------------------------------------------------- */

export function getResponsiveIssues(
  input: ResponsiveAnalysisInput,
  options: ResponsiveAnalysisOptions = {},
): ResponsiveIssue[] {
  return analyzeResponsiveDesign(input, options).issues;
}

export function hasResponsiveIssues(
  input: ResponsiveAnalysisInput,
): boolean {
  return analyzeResponsiveDesign(input).issues.length > 0;
}

export function getResponsiveScore(
  input: ResponsiveAnalysisInput,
): ResponsiveScore {
  return analyzeResponsiveDesign(input).score;
}

export function getResponsiveMetrics(
  input: ResponsiveAnalysisInput,
): ResponsiveMetrics {
  return analyzeResponsiveDesign(input).metrics;
}
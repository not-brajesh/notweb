
/**
 * NOTWEB — Website Metadata Extractor
 *
 * Extracts SEO and social-sharing metadata from HTML.
 *
 * This module only parses HTML. It does not make network requests.
 */

import type { WebsiteMetadata } from "./index.js";

/* -------------------------------------------------------------------------- */
/*                                    Types                                   */
/* -------------------------------------------------------------------------- */

export interface MetadataExtractionOptions {
  /** URL of the page that produced this HTML. */
  pageUrl: string;

  /** Optional final URL after redirects. */
  finalUrl?: string;

  /** Maximum HTML size accepted by this parser. */
  maxHtmlLength?: number;
}

export interface MetadataExtractionResult {
  success: boolean;
  metadata: WebsiteMetadata | null;
  errors: string[];
}

const DEFAULT_MAX_HTML_LENGTH = 5 * 1024 * 1024;

/* -------------------------------------------------------------------------- */
/*                               Helper Functions                             */
/* -------------------------------------------------------------------------- */

/**
 * Decodes common HTML entities without relying on browser-only APIs.
 * This is intentionally lightweight, not a complete HTML parser.
 */
function decodeHtmlEntities(value: string): string {
  const namedEntities: Record<string, string> = {
    amp: "&",
    apos: "'",
    quot: '"',
    lt: "<",
    gt: ">",
    nbsp: "\u00a0",
    copy: "\u00a9",
    reg: "\u00ae",
    trade: "\u2122",
  };

  return value.replace(
    /&(#x[\da-f]+|#\d+|[a-z]+);/gi,
    (match: string, entity: string): string => {
      if (entity.startsWith("#x") || entity.startsWith("#X")) {
        const codePoint = Number.parseInt(entity.slice(2), 16);

        return isValidCodePoint(codePoint)
          ? String.fromCodePoint(codePoint)
          : match;
      }

      if (entity.startsWith("#")) {
        const codePoint = Number.parseInt(entity.slice(1), 10);

        return isValidCodePoint(codePoint)
          ? String.fromCodePoint(codePoint)
          : match;
      }

      return namedEntities[entity.toLowerCase()] ?? match;
    },
  );
}

function isValidCodePoint(value: number): boolean {
  return (
    Number.isInteger(value) &&
    value >= 0 &&
    value <= 0x10ffff &&
    !(value >= 0xd800 && value <= 0xdfff)
  );
}

function normalizeText(value: string): string {
  return decodeHtmlEntities(value)
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);

    return (
      (url.protocol === "http:" || url.protocol === "https:") &&
      url.hostname.length > 0 &&
      url.username.length === 0 &&
      url.password.length === 0
    );
  } catch {
    return false;
  }
}

/**
 * Resolves a relative metadata URL against the page URL.
 * Unsafe protocols and URLs containing credentials are rejected.
 */
function resolveMetadataUrl(
  value: string | null,
  baseUrl: string,
): string | null {
  if (!value) {
    return null;
  }

  try {
    const resolved = new URL(value, baseUrl);

    if (
      (resolved.protocol !== "http:" && resolved.protocol !== "https:") ||
      !resolved.hostname ||
      resolved.username ||
      resolved.password
    ) {
      return null;
    }

    return resolved.href;
  } catch {
    return null;
  }
}

/**
 * Extracts the first matching attribute from an HTML tag.
 * Handles quoted and unquoted attribute values.
 */
function getAttribute(
  tag: string,
  attributeName: string,
): string | null {
  const escapedName = attributeName.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&",
  );

  const pattern = new RegExp(
    `(?:^|\\s)${escapedName}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'=<>\\x60]+))`,
    "i",
  );

  const match = pattern.exec(tag);

  if (!match) {
    return null;
  }

  return normalizeText(match[1] ?? match[2] ?? match[3] ?? "");
}

/**
 * Returns all opening tags of a given name.
 *
 * Note: regex-based parsing is suitable for common metadata extraction,
 * but it is not a substitute for a standards-compliant HTML parser.
 */
function findOpeningTags(html: string, tagName: string): string[] {
  const escapedTagName = tagName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(
    `<${escapedTagName}(?=[\\s/>])[^>]*>`,
    "gi",
  );

  return html.match(pattern) ?? [];
}

function findMetaContent(
  html: string,
  attributeName: "name" | "property",
  key: string,
): string | null {
  for (const tag of findOpeningTags(html, "meta")) {
    const attribute = getAttribute(tag, attributeName);

    if (attribute?.toLowerCase() === key.toLowerCase()) {
      const content = getAttribute(tag, "content");

      if (content) {
        return content;
      }
    }
  }

  return null;
}

function collectSocialMetadata(
  html: string,
  prefix: "og:" | "twitter:",
): Record<string, string> {
  const result: Record<string, string> = {};

  for (const tag of findOpeningTags(html, "meta")) {
    const property =
      getAttribute(tag, "property") ?? getAttribute(tag, "name");

    if (!property?.toLowerCase().startsWith(prefix)) {
      continue;
    }

    const content = getAttribute(tag, "content");

    if (!content) {
      continue;
    }

    const key = property.slice(prefix.length).toLowerCase();

    // Avoid prototype-sensitive property names.
    if (
      key.length > 0 &&
      key !== "__proto__" &&
      key !== "constructor" &&
      key !== "prototype" &&
      result[key] === undefined
    ) {
      result[key] = content;
    }
  }

  return result;
}

/* -------------------------------------------------------------------------- */
/*                            Main Extraction API                            */
/* -------------------------------------------------------------------------- */

export function extractWebsiteMetadata(
  html: string,
  options: MetadataExtractionOptions,
): MetadataExtractionResult {
  const errors: string[] = [];

  if (typeof html !== "string") {
    return {
      success: false,
      metadata: null,
      errors: ["HTML input must be a string."],
    };
  }

  if (typeof options.pageUrl !== "string" || !isValidHttpUrl(options.pageUrl)) {
    return {
      success: false,
      metadata: null,
      errors: ["pageUrl must be a valid HTTP or HTTPS URL."],
    };
  }

  const maxHtmlLength = options.maxHtmlLength ?? DEFAULT_MAX_HTML_LENGTH;

  if (
    !Number.isSafeInteger(maxHtmlLength) ||
    maxHtmlLength <= 0
  ) {
    return {
      success: false,
      metadata: null,
      errors: ["maxHtmlLength must be a positive safe integer."],
    };
  }

  if (html.length > maxHtmlLength) {
    return {
      success: false,
      metadata: null,
      errors: [
        `HTML exceeds the configured limit of ${maxHtmlLength} characters.`,
      ],
    };
  }

  const finalUrl = options.finalUrl ?? options.pageUrl;

  if (!isValidHttpUrl(finalUrl)) {
    return {
      success: false,
      metadata: null,
      errors: ["finalUrl must be a valid HTTP or HTTPS URL."],
    };
  }

  const baseUrl = finalUrl;

  // Remove comments before looking for metadata tags.
  const cleanHtml = html.replace(/<!--[\s\S]*?-->/g, "");

  const titleMatch = /<title(?:\s[^>]*)?>([\s\S]*?)<\/title\s*>/i.exec(
    cleanHtml,
  );

  const title = titleMatch
    ? normalizeText(titleMatch[1] ?? "")
    : null;

  const description = findMetaContent(
    cleanHtml,
    "name",
    "description",
  );

  const languageMatch = /<html\b([^>]*)>/i.exec(cleanHtml);
  const language = languageMatch
    ? getAttribute(languageMatch[1] ?? "", "lang")
    : null;

  const charsetMatch =
    /<meta\b[^>]*\bcharset\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>]+))/i.exec(
      cleanHtml,
    );

  const charset = charsetMatch
    ? normalizeText(
        charsetMatch[1] ?? charsetMatch[2] ?? charsetMatch[3] ?? "",
      )
    : null;

  const viewport = findMetaContent(
    cleanHtml,
    "name",
    "viewport",
  );

  const robots = findMetaContent(cleanHtml, "name", "robots");

  let canonicalUrl: string | null = null;

  for (const tag of findOpeningTags(cleanHtml, "link")) {
    const rel = getAttribute(tag, "rel");

    if (
      rel
        ?.toLowerCase()
        .split(/\s+/)
        .includes("canonical")
    ) {
      canonicalUrl = resolveMetadataUrl(
        getAttribute(tag, "href"),
        baseUrl,
      );

      if (canonicalUrl) {
        break;
      }
    }
  }

  let faviconUrl: string | null = null;

  for (const tag of findOpeningTags(cleanHtml, "link")) {
    const rel = getAttribute(tag, "rel")?.toLowerCase().split(/\s+/);

    if (
      rel?.some(
        (value) =>
          value === "icon" ||
          value === "shortcut" ||
          value === "apple-touch-icon",
      )
    ) {
      faviconUrl = resolveMetadataUrl(
        getAttribute(tag, "href"),
        baseUrl,
      );

      if (faviconUrl) {
        break;
      }
    }
  }

  if (!faviconUrl) {
    faviconUrl = resolveMetadataUrl("/favicon.ico", baseUrl);
  }

  const metadata: WebsiteMetadata = {
    url: options.pageUrl,
    ...(options.finalUrl ? { finalUrl: options.finalUrl } : {}),
    title,
    description,
    language,
    charset,
    viewport,
    canonicalUrl,
    faviconUrl,
    robots,
    openGraph: collectSocialMetadata(cleanHtml, "og:"),
    twitterCard: collectSocialMetadata(cleanHtml, "twitter:"),
  };

  if (title === null) {
    errors.push("The HTML document does not contain a title element.");
  }

  if (!description) {
    errors.push("The HTML document does not contain a meta description.");
  }

  return {
    success: true,
    metadata,
    errors,
  };
}

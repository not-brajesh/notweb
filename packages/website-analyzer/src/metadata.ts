
/**
 * NOTWEB — Website Metadata Extractor
 *
 * Extracts SEO, document, and social-sharing metadata from HTML.
 *
 * This module parses HTML only. It does not make network requests.
 * URL validation here does not guarantee that a URL is safe to fetch.
 */

import type { WebsiteMetadata } from "./index.js";

export interface MetadataExtractionOptions {
  /** Base URL used to resolve relative URLs. */
  baseUrl?: string;

  /** Maximum accepted HTML length. Defaults to 5 MiB in characters. */
  maxHtmlLength?: number;
}

export interface MetadataExtractionResult {
  metadata: WebsiteMetadata;
  warnings: string[];
}

const DEFAULT_MAX_HTML_LENGTH = 5 * 1024 * 1024;

function normalizeWhitespace(value: string | undefined): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function decodeBasicEntities(value: string): string {
  const namedEntities: Record<string, string> = {
    amp: "&",
    quot: '"',
    apos: "'",
    "#39": "'",
    lt: "<",
    gt: ">",
    nbsp: " ",
  };

  return value.replace(
    /&(#x[0-9a-f]+|#\d+|amp|quot|apos|#39|lt|gt|nbsp);/gi,
    (entity, name: string) => {
      if (/^#x/i.test(name)) {
        const codePoint = Number.parseInt(name.slice(2), 16);

        return Number.isFinite(codePoint) &&
          codePoint >= 0 &&
          codePoint <= 0x10ffff
          ? String.fromCodePoint(codePoint)
          : entity;
      }

      if (name.startsWith("#")) {
        const codePoint = Number.parseInt(name.slice(1), 10);

        return Number.isFinite(codePoint) &&
          codePoint >= 0 &&
          codePoint <= 0x10ffff
          ? String.fromCodePoint(codePoint)
          : entity;
      }

      return namedEntities[name.toLowerCase()] ?? entity;
    },
  );
}

function getAttribute(
  tag: string,
  attributeName: string,
): string | undefined {
  const escapedName = attributeName.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&",
  );

  const pattern = new RegExp(
    `(?:^|\\s)${escapedName}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`,
    "i",
  );

  const match = tag.match(pattern);
  const rawValue = match?.[1] ?? match?.[2] ?? match?.[3];

  if (rawValue === undefined) {
    return undefined;
  }

  return normalizeWhitespace(decodeBasicEntities(rawValue));
}

function getMetaContent(
  html: string,
  attributeName: "name" | "property",
  expectedValue: string,
): string | undefined {
  const metaTags = html.match(/<meta\b[^>]*>/gi) ?? [];

  for (const tag of metaTags) {
    const actualValue = getAttribute(tag, attributeName);

    if (actualValue?.toLowerCase() !== expectedValue.toLowerCase()) {
      continue;
    }

    const content = getAttribute(tag, "content");

    if (content) {
      return content;
    }
  }

  return undefined;
}

function getMetaByName(
  html: string,
  name: string,
): string | undefined {
  return getMetaContent(html, "name", name);
}

function getOpenGraph(
  html: string,
  property: string,
): string | undefined {
  return getMetaContent(html, "property", property);
}

function getTwitterMeta(
  html: string,
  name: string,
): string | undefined {
  return getMetaByName(html, `twitter:${name}`);
}

function getTitle(html: string): string | undefined {
  const match = html.match(/<title\b[^>]*>([\s\S]*?)<\/title\s*>/i);

  if (!match?.[1]) {
    return undefined;
  }

  const title = normalizeWhitespace(
    decodeBasicEntities(match[1].replace(/<[^>]*>/g, "")),
  );

  return title || undefined;
}

function getLinkHrefByRel(
  html: string,
  acceptedRelValues: readonly string[],
): string | undefined {
  const linkTags = html.match(/<link\b[^>]*>/gi) ?? [];

  for (const tag of linkTags) {
    const rel = getAttribute(tag, "rel")
      ?.toLowerCase()
      .split(/\s+/);

    if (!rel?.some((value) => acceptedRelValues.includes(value))) {
      continue;
    }

    const href = getAttribute(tag, "href");

    if (href) {
      return href;
    }
  }

  return undefined;
}

/**
 * Resolve a URL without making a network request.
 *
 * Only HTTP and HTTPS URLs are accepted.
 * This does not perform SSRF protection for future network requests.
 */
function resolveHttpUrl(
  value: string | undefined,
  baseUrl: string | undefined,
  warnings: string[],
  fieldName: string,
): string | undefined {
  if (!value) {
    return undefined;
  }

  try {
    const resolved = baseUrl
      ? new URL(value, baseUrl)
      : new URL(value);

    if (resolved.protocol !== "http:" && resolved.protocol !== "https:") {
      warnings.push(`${fieldName} uses an unsupported URL protocol.`);
      return undefined;
    }

    if (resolved.username || resolved.password) {
      warnings.push(`${fieldName} must not contain URL credentials.`);
      return undefined;
    }

    return resolved.href;
  } catch {
    warnings.push(
      `${fieldName} could not be resolved. Provide a valid absolute URL or baseUrl.`,
    );

    return undefined;
  }
}

function getHtmlAttribute(
  html: string,
  attributeName: string,
): string | undefined {
  const htmlTag = html.match(/<html\b[^>]*>/i)?.[0];

  if (!htmlTag) {
    return undefined;
  }

  return getAttribute(htmlTag, attributeName);
}

/**
 * Extract website metadata from an HTML document.
 *
 * This is a lightweight metadata extractor, not a complete HTML5 parser.
 */
export function extractWebsiteMetadata(
  html: string,
  options: MetadataExtractionOptions = {},
): MetadataExtractionResult {
  const warnings: string[] = [];

  const maxHtmlLength =
    options.maxHtmlLength ?? DEFAULT_MAX_HTML_LENGTH;

  if (!Number.isSafeInteger(maxHtmlLength) || maxHtmlLength < 1) {
    throw new RangeError(
      "maxHtmlLength must be a positive safe integer.",
    );
  }

  if (html.length > maxHtmlLength) {
    throw new RangeError(
      `HTML exceeds the maximum allowed length of ${maxHtmlLength} characters.`,
    );
  }

  const rawCanonicalUrl = getLinkHrefByRel(html, ["canonical"]);
  const rawFaviconUrl = getLinkHrefByRel(html, [
    "icon",
    "shortcut",
    "apple-touch-icon",
  ]);

  const canonicalUrl = resolveHttpUrl(
    rawCanonicalUrl,
    options.baseUrl,
    warnings,
    "Canonical URL",
  );

  const faviconUrl = resolveHttpUrl(
    rawFaviconUrl,
    options.baseUrl,
    warnings,
    "Favicon URL",
  );

  const rawDocumentUrl = options.baseUrl;

  const documentUrl = resolveHttpUrl(
    rawDocumentUrl,
    undefined,
    warnings,
    "Document URL",
  );

  const title =
    getOpenGraph(html, "og:title") ??
    getTwitterMeta(html, "title") ??
    getTitle(html);

  const description =
    getMetaByName(html, "description") ??
    getOpenGraph(html, "og:description") ??
    getTwitterMeta(html, "description");

  const charset =
    html.match(/<meta\b[^>]*\bcharset\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s/>]+))/i)
      ?.[1] ??
    html.match(/<meta\b[^>]*\bcharset\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s/>]+))/i)
      ?.[2] ??
    html.match(/<meta\b[^>]*\bcharset\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s/>]+))/i)
      ?.[3];

  const viewport = getMetaByName(html, "viewport");

  const twitterCard =
    getTwitterMeta(html, "card") ??
    getOpenGraph(html, "type");

  const openGraph = {
    title: getOpenGraph(html, "og:title"),
    description: getOpenGraph(html, "og:description"),
    image: resolveHttpUrl(
      getOpenGraph(html, "og:image"),
      options.baseUrl,
      warnings,
      "Open Graph image URL",
    ),
    url: resolveHttpUrl(
      getOpenGraph(html, "og:url"),
      options.baseUrl,
      warnings,
      "Open Graph URL",
    ),
    type: getOpenGraph(html, "og:type"),
    siteName: getOpenGraph(html, "og:site_name"),
  };

  const twitter = {
    card: getTwitterMeta(html, "card"),
    title: getTwitterMeta(html, "title"),
    description: getTwitterMeta(html, "description"),
    image: resolveHttpUrl(
      getTwitterMeta(html, "image"),
      options.baseUrl,
      warnings,
      "Twitter image URL",
    ),
    site: getTwitterMeta(html, "site"),
  };

  /*
   * Keep the metadata contract aligned with the existing WebsiteMetadata
   * interface. Required string fields receive safe defaults.
   */
  const metadata = {
    url: documentUrl ?? "",
    title: title ?? "",
    description: description ?? "",
    canonicalUrl: canonicalUrl ?? "",
    language: getHtmlAttribute(html, "lang") ?? "",
    charset: charset?.trim() ?? "",
    viewport: viewport ?? "",
    robots: getMetaByName(html, "robots") ?? "",
    author: getMetaByName(html, "author") ?? "",
    keywords: getMetaByName(html, "keywords") ?? "",
    faviconUrl: faviconUrl ?? "",
    twitterCard: twitterCard ?? "",
    openGraph,
    twitter,
  } satisfies WebsiteMetadata;

  if (!metadata.url) {
    warnings.push(
      "Document URL was not provided. Pass baseUrl to populate it.",
    );
  }

  if (!metadata.title) {
    warnings.push("Page title was not found.");
  }

  if (!metadata.description) {
    warnings.push("Meta description was not found.");
  }

  if (!metadata.canonicalUrl) {
    warnings.push("Canonical URL was not found or could not be resolved.");
  }

  return {
    metadata,
    warnings,
  };
}

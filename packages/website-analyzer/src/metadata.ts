
/**
 * NOTWEB — Website Metadata Extractor
 *
 * Extracts SEO and social-sharing metadata from HTML.
 * This module only parses HTML. It does not make network requests.
 */

import type { WebsiteMetadata } from "./index.js";

export interface MetadataExtractionOptions {
  /** Base URL used to resolve relative canonical URLs. */
  baseUrl?: string;
  /** Maximum HTML length accepted by the extractor. */
  maxHtmlLength?: number;
}

export interface MetadataExtractionResult {
  metadata: WebsiteMetadata;
  warnings: string[];
}

const DEFAULT_MAX_HTML_LENGTH = 5 * 1024 * 1024;

function normalizeWhitespace(value: string | null | undefined): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function getAttribute(
  tag: string,
  attributeName: string,
): string | undefined {
  const escapedName = attributeName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(
    `\\b${escapedName}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`,
    "i",
  );

  const match = tag.match(pattern);
  const value = match?.[1] ?? match?.[2] ?? match?.[3];

  return value === undefined ? undefined : normalizeWhitespace(value);
}

function decodeBasicEntities(value: string): string {
  const entities: Record<string, string> = {
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
      if (name.startsWith("#x") || name.startsWith("#X")) {
        const codePoint = Number.parseInt(name.slice(2), 16);
        return Number.isFinite(codePoint) && codePoint <= 0x10ffff
          ? String.fromCodePoint(codePoint)
          : entity;
      }

      if (name.startsWith("#")) {
        const codePoint = Number.parseInt(name.slice(1), 10);
        return Number.isFinite(codePoint) && codePoint <= 0x10ffff
          ? String.fromCodePoint(codePoint)
          : entity;
      }

      return entities[name.toLowerCase()] ?? entity;
    },
  );
}

function findMetaContent(
  html: string,
  predicate: (tag: string) => boolean,
): string | undefined {
  const tags = html.match(/<meta\b[^>]*>/gi) ?? [];

  for (const tag of tags) {
    if (!predicate(tag)) continue;

    const content = getAttribute(tag, "content");
    if (content) return decodeBasicEntities(content);
  }

  return undefined;
}

function findMetaByName(
  html: string,
  name: string,
): string | undefined {
  return findMetaContent(html, (tag) => {
    const tagName = getAttribute(tag, "name");
    return tagName?.toLowerCase() === name.toLowerCase();
  });
}

function findOpenGraph(
  html: string,
  property: string,
): string | undefined {
  return findMetaContent(html, (tag) => {
    const tagProperty = getAttribute(tag, "property");
    return tagProperty?.toLowerCase() === property.toLowerCase();
  });
}

function findTwitterMeta(
  html: string,
  name: string,
): string | undefined {
  return findMetaContent(html, (tag) => {
    const tagName = getAttribute(tag, "name");
    return tagName?.toLowerCase() === `twitter:${name}`.toLowerCase();
  });
}

function findTitle(html: string): string | undefined {
  const match = html.match(/<title\b[^>]*>([\s\S]*?)<\/title\s*>/i);

  if (!match?.[1]) return undefined;

  const title = normalizeWhitespace(
    decodeBasicEntities(match[1].replace(/<[^>]*>/g, "")),
  );

  return title || undefined;
}

function findCanonicalUrl(html: string): string | undefined {
  const links = html.match(/<link\b[^>]*>/gi) ?? [];

  for (const link of links) {
    const rel = getAttribute(link, "rel")
      ?.toLowerCase()
      .split(/\s+/);

    if (!rel?.includes("canonical")) continue;

    const href = getAttribute(link, "href");
    if (href) return href;
  }

  return undefined;
}

function resolveCanonicalUrl(
  canonical: string | undefined,
  baseUrl: string | undefined,
  warnings: string[],
): string | undefined {
  if (!canonical) return undefined;

  try {
    const resolved = baseUrl
      ? new URL(canonical, baseUrl)
      : new URL(canonical);

    if (resolved.protocol !== "http:" && resolved.protocol !== "https:") {
      warnings.push("Canonical URL uses an unsupported protocol.");
      return undefined;
    }

    if (resolved.username || resolved.password) {
      warnings.push("Canonical URL must not contain credentials.");
      return undefined;
    }

    return resolved.href;
  } catch {
    warnings.push(
      "Canonical URL could not be resolved; provide a valid absolute URL or baseUrl.",
    );
    return undefined;
  }
}

/**
 * Extract SEO and social metadata from an HTML document.
 *
 * Note: this is a lightweight parser, not a full HTML5 parser.
 * For production crawling, consider a dedicated HTML parser.
 */
export function extractWebsiteMetadata(
  html: string,
  options: MetadataExtractionOptions = {},
): MetadataExtractionResult {
  const warnings: string[] = [];
  const maxHtmlLength =
    options.maxHtmlLength ?? DEFAULT_MAX_HTML_LENGTH;

  if (!Number.isSafeInteger(maxHtmlLength) || maxHtmlLength < 1) {
    throw new RangeError("maxHtmlLength must be a positive safe integer.");
  }

  if (html.length > maxHtmlLength) {
    throw new RangeError(
      `HTML exceeds the maximum allowed length of ${maxHtmlLength} characters.`,
    );
  }

  const title =
    findOpenGraph(html, "og:title") ??
    findTwitterMeta(html, "title") ??
    findTitle(html);

  const description =
    findMetaByName(html, "description") ??
    findOpenGraph(html, "og:description") ??
    findTwitterMeta(html, "description");

  const canonicalUrl = resolveCanonicalUrl(
    findCanonicalUrl(html),
    options.baseUrl,
    warnings,
  );

  const metadata = {
    title,
    description,
    canonicalUrl,
    language:
      html.match(/<html\b[^>]*>/i)?.[0] &&
      getAttribute(html.match(/<html\b[^>]*>/i)?.[0] ?? "", "lang"),
    robots: findMetaByName(html, "robots"),
    author: findMetaByName(html, "author"),
    keywords: findMetaByName(html, "keywords"),
    faviconUrl: (() => {
      const links = html.match(/<link\b[^>]*>/gi) ?? [];

      for (const link of links) {
        const rel = getAttribute(link, "rel")?.toLowerCase().split(/\s+/);

        if (rel?.some((value) => value === "icon" || value === "shortcut")) {
          const href = getAttribute(link, "href");

          if (href) {
            try {
              return options.baseUrl
                ? new URL(href, options.baseUrl).href
                : new URL(href).href;
            } catch {
              warnings.push("Favicon URL could not be resolved.");
              return undefined;
            }
          }
        }
      }

      return undefined;
    })(),
    openGraph: {
      title: findOpenGraph(html, "og:title"),
      description: findOpenGraph(html, "og:description"),
      image: findOpenGraph(html, "og:image"),
      url: findOpenGraph(html, "og:url"),
      type: findOpenGraph(html, "og:type"),
      siteName: findOpenGraph(html, "og:site_name"),
    },
    twitter: {
      card: findTwitterMeta(html, "card"),
      title: findTwitterMeta(html, "title"),
      description: findTwitterMeta(html, "description"),
      image: findTwitterMeta(html, "image"),
      site: findTwitterMeta(html, "site"),
    },
  } satisfies Partial<WebsiteMetadata>;

  if (!metadata.title) warnings.push("Page title was not found.");
  if (!metadata.description) warnings.push("Meta description was not found.");

  return {
    metadata: metadata as WebsiteMetadata,
    warnings,
  };
}

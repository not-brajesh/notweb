
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
  /** Optional URL used to resolve relative canonical and image URLs. */
  baseUrl?: string;
}

export interface MetadataExtractionResult {
  success: boolean;
  metadata: WebsiteMetadata;
  errors: string[];
}

interface OpenGraphMetadata {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
  siteName?: string;
}

interface TwitterMetadata {
  card?: string;
  title?: string;
  description?: string;
  image?: string;
  site?: string;
  creator?: string;
}

function decodeHtmlEntities(value: string): string {
  const namedEntities: Record<string, string> = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    nbsp: " ",
    quot: '"',
    copy: "©",
    reg: "®",
    trade: "™",
  };

  return value.replace(
    /&(#x[\da-f]+|#\d+|[a-z]+);/gi,
    (entity, encoded: string) => {
      if (encoded.startsWith("#x") || encoded.startsWith("#X")) {
        const codePoint = Number.parseInt(encoded.slice(2), 16);

        return Number.isFinite(codePoint) && codePoint >= 0 &&
          codePoint <= 0x10ffff
          ? String.fromCodePoint(codePoint)
          : entity;
      }

      if (encoded.startsWith("#")) {
        const codePoint = Number.parseInt(encoded.slice(1), 10);

        return Number.isFinite(codePoint) && codePoint >= 0 &&
          codePoint <= 0x10ffff
          ? String.fromCodePoint(codePoint)
          : entity;
      }

      return namedEntities[encoded.toLowerCase()] ?? entity;
    },
  );
}

function cleanText(value: string | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  const cleaned = decodeHtmlEntities(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned.length > 0 ? cleaned : undefined;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getAttribute(
  attributes: string,
  name: string,
): string | undefined {
  const escapedName = escapeRegExp(name);
  const expression = new RegExp(
    `(?:^|\\s)${escapedName}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'=<>\\x60]+))`,
    "i",
  );

  const match = expression.exec(attributes);
  const value = match?.[1] ?? match?.[2] ?? match?.[3];

  return cleanText(value);
}

function getMetaContent(
  html: string,
  keyNames: readonly string[],
): string | undefined {
  const metaTags = html.match(/<meta\b[^>]*>/gi) ?? [];

  for (const tag of metaTags) {
    const attributes = tag.replace(/^<meta\b/i, "").replace(/\/?>$/, "");
    const key =
      getAttribute(attributes, "property") ??
      getAttribute(attributes, "name") ??
      getAttribute(attributes, "itemprop");

    if (key && keyNames.some((name) => key.toLowerCase() === name.toLowerCase())) {
      const content = getAttribute(attributes, "content");

      if (content) {
        return content;
      }
    }
  }

  return undefined;
}

function getTitle(html: string): string | undefined {
  const match = /<title\b[^>]*>([\s\S]*?)<\/title\s*>/i.exec(html);
  return cleanText(match?.[1]);
}

function getHtmlLanguage(html: string): string | undefined {
  const match = /<html\b([^>]*)>/i.exec(html);

  if (!match?.[1]) {
    return undefined;
  }

  return getAttribute(match[1], "lang");
}

function getLinkHref(
  html: string,
  relValue: string,
): string | undefined {
  const linkTags = html.match(/<link\b[^>]*>/gi) ?? [];

  for (const tag of linkTags) {
    const attributes = tag.replace(/^<link\b/i, "").replace(/\/?>$/, "");
    const rel = getAttribute(attributes, "rel");

    if (
      rel
        ?.toLowerCase()
        .split(/\s+/)
        .includes(relValue.toLowerCase())
    ) {
      const href = getAttribute(attributes, "href");

      if (href) {
        return href;
      }
    }
  }

  return undefined;
}

function resolveMetadataUrl(
  value: string | undefined,
  baseUrl: string | undefined,
): string | undefined {
  if (!value) {
    return undefined;
  }

  try {
    const parsed = baseUrl ? new URL(value, baseUrl) : new URL(value);

    if (
      parsed.protocol !== "http:" &&
      parsed.protocol !== "https:"
    ) {
      return undefined;
    }

    if (parsed.username || parsed.password) {
      return undefined;
    }

    return parsed.href;
  } catch {
    // Relative URLs cannot be resolved without a valid base URL.
    return undefined;
  }
}

function extractOpenGraph(html: string): OpenGraphMetadata {
  const title = getMetaContent(html, ["og:title"]);
  const description = getMetaContent(html, ["og:description"]);
  const image = getMetaContent(html, ["og:image", "og:image:url"]);
  const url = getMetaContent(html, ["og:url"]);
  const type = getMetaContent(html, ["og:type"]);
  const siteName = getMetaContent(html, ["og:site_name"]);

  return {
    ...(title ? { title } : {}),
    ...(description ? { description } : {}),
    ...(image ? { image } : {}),
    ...(url ? { url } : {}),
    ...(type ? { type } : {}),
    ...(siteName ? { siteName } : {}),
  };
}

function extractTwitter(html: string): TwitterMetadata {
  const card = getMetaContent(html, ["twitter:card"]);
  const title = getMetaContent(html, ["twitter:title"]);
  const description = getMetaContent(html, ["twitter:description"]);
  const image = getMetaContent(html, ["twitter:image"]);
  const site = getMetaContent(html, ["twitter:site"]);
  const creator = getMetaContent(html, ["twitter:creator"]);

  return {
    ...(card ? { card } : {}),
    ...(title ? { title } : {}),
    ...(description ? { description } : {}),
    ...(image ? { image } : {}),
    ...(site ? { site } : {}),
    ...(creator ? { creator } : {}),
  };
}

/**
 * Extract metadata from an HTML document.
 *
 * The returned structure always contains the required WebsiteMetadata
 * fields. Missing optional HTML metadata is represented by empty strings
 * or empty objects, matching the existing package contract.
 */
export function extractWebsiteMetadata(
  html: string,
  options: MetadataExtractionOptions = {},
): MetadataExtractionResult {
  const errors: string[] = [];

  const openGraph = extractOpenGraph(html);
  const twitter = extractTwitter(html);

  const title =
    getMetaContent(html, ["og:title", "twitter:title"]) ??
    getTitle(html) ??
    "";

  const description =
    getMetaContent(html, ["description", "og:description"]) ??
    getMetaContent(html, ["twitter:description"]) ??
    "";

  const canonicalUrl = resolveMetadataUrl(
    getLinkHref(html, "canonical"),
    options.baseUrl,
  );

  const faviconUrl = resolveMetadataUrl(
    getLinkHref(html, "icon") ??
      getLinkHref(html, "shortcut icon"),
    options.baseUrl,
  );

  const imageUrl = resolveMetadataUrl(
    openGraph.image ?? twitter.image,
    options.baseUrl,
  );

  const ogUrl = resolveMetadataUrl(openGraph.url, options.baseUrl);

  const metadata = {
    url: options.baseUrl ?? "",
    title,
    description,
    canonicalUrl: canonicalUrl ?? "",
    language: getHtmlLanguage(html) ?? "",
    robots: getMetaContent(html, ["robots"]) ?? "",
    author: getMetaContent(html, ["author"]) ?? "",
    keywords: getMetaContent(html, ["keywords"]) ?? "",
    faviconUrl: faviconUrl ?? "",
    openGraph: {
      title: openGraph.title ?? "",
      description: openGraph.description ?? "",
      image: imageUrl ?? "",
      url: ogUrl ?? "",
      type: openGraph.type ?? "",
      siteName: openGraph.siteName ?? "",
    },
    twitter: {
      card: twitter.card ?? "",
      title: twitter.title ?? "",
      description: twitter.description ?? "",
      image: resolveMetadataUrl(twitter.image, options.baseUrl) ?? "",
      site: twitter.site ?? "",
      creator: twitter.creator ?? "",
    },
  } satisfies WebsiteMetadata;

  if (!title) {
    errors.push("The HTML document does not contain a title.");
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

/**
 * Convenience function for callers that only need the metadata object.
 */
export function extractMetadata(
  html: string,
  options: MetadataExtractionOptions = {},
): WebsiteMetadata {
  return extractWebsiteMetadata(html, options).metadata;
}

/**
 * Safely extracts a URL's origin for display purposes.
 *
 * This function does not fetch the URL or establish that it is safe
 * for server-side network access.
 */
export function getMetadataOrigin(value: string): string | undefined {
  try {
    const parsed = new URL(value);

    if (
      parsed.protocol !== "http:" &&
      parsed.protocol !== "https:"
    ) {
      return undefined;
    }

    if (parsed.username || parsed.password) {
      return undefined;
    }

    return parsed.origin;
  } catch {
    return undefined;
  }
}

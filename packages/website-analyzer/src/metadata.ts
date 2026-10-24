
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
  /** Optional URL used to resolve relative metadata URLs. */
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
      if (/^#x/i.test(encoded)) {
        const codePoint = Number.parseInt(encoded.slice(2), 16);

        return Number.isInteger(codePoint) &&
          codePoint >= 0 &&
          codePoint <= 0x10ffff &&
          !(codePoint >= 0xd800 && codePoint <= 0xdfff)
          ? String.fromCodePoint(codePoint)
          : entity;
      }

      if (encoded.startsWith("#")) {
        const codePoint = Number.parseInt(encoded.slice(1), 10);

        return Number.isInteger(codePoint) &&
          codePoint >= 0 &&
          codePoint <= 0x10ffff &&
          !(codePoint >= 0xd800 && codePoint <= 0xdfff)
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
    const attributes = tag
      .replace(/^<meta\b/i, "")
      .replace(/\/?>$/, "");

    const key =
      getAttribute(attributes, "property") ??
      getAttribute(attributes, "name") ??
      getAttribute(attributes, "itemprop");

    if (
      key &&
      keyNames.some(
        (name) => key.toLowerCase() === name.toLowerCase(),
      )
    ) {
      const content = getAttribute(attributes, "content");

      if (content !== undefined && content.length > 0) {
        return content;
      }
    }
  }

  return undefined;
}

function getCharset(html: string): string {
  const metaTags = html.match(/<meta\b[^>]*>/gi) ?? [];

  for (const tag of metaTags) {
    const attributes = tag
      .replace(/^<meta\b/i, "")
      .replace(/\/?>$/, "");

    const directCharset = getAttribute(attributes, "charset");

    if (directCharset) {
      return directCharset;
    }

    const contentType = getAttribute(attributes, "content");

    if (contentType) {
      const match = /charset\s*=\s*["']?([^;\s"']+)/i.exec(
        contentType,
      );

      if (match?.[1]) {
        return match[1];
      }
    }
  }

  return "UTF-8";
}

function getTitle(html: string): string | undefined {
  const match = /<title\b[^>]*>([\s\S]*?)<\/title\s*>/i.exec(html);

  return cleanText(match?.[1]);
}

function getHtmlLanguage(html: string): string | undefined {
  const match = /<html\b([^>]*)>/i.exec(html);

  return match?.[1] ? getAttribute(match[1], "lang") : undefined;
}

function getLinkHref(
  html: string,
  relValue: string,
): string | undefined {
  const linkTags = html.match(/<link\b[^>]*>/gi) ?? [];

  for (const tag of linkTags) {
    const attributes = tag
      .replace(/^<link\b/i, "")
      .replace(/\/?>$/, "");

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

/**
 * Resolve an extracted metadata URL.
 *
 * This function validates URL syntax and protocol only.
 * It does not establish that the URL is safe for server-side fetching.
 */
function resolveMetadataUrl(
  value: string | undefined,
  baseUrl: string | undefined,
): string | undefined {
  if (!value) {
    return undefined;
  }

  try {
    const parsed = baseUrl
      ? new URL(value, baseUrl)
      : new URL(value);

    if (
      parsed.protocol !== "http:" &&
      parsed.protocol !== "https:"
    ) {
      return undefined;
    }

    if (parsed.username || parsed.password || !parsed.hostname) {
      return undefined;
    }

    return parsed.href;
  } catch {
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
    ...(title !== undefined ? { title } : {}),
    ...(description !== undefined ? { description } : {}),
    ...(image !== undefined ? { image } : {}),
    ...(url !== undefined ? { url } : {}),
    ...(type !== undefined ? { type } : {}),
    ...(siteName !== undefined ? { siteName } : {}),
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
    ...(card !== undefined ? { card } : {}),
    ...(title !== undefined ? { title } : {}),
    ...(description !== undefined ? { description } : {}),
    ...(image !== undefined ? { image } : {}),
    ...(site !== undefined ? { site } : {}),
    ...(creator !== undefined ? { creator } : {}),
  };
}

/**
 * Extract metadata from an HTML document.
 *
 * Missing optional metadata is represented by empty strings.
 */
export function extractWebsiteMetadata(
  html: string,
  options: MetadataExtractionOptions = {},
): MetadataExtractionResult {
  const errors: string[] = [];

  const openGraph = extractOpenGraph(html);
  const twitter = extractTwitter(html);

  const title =
    getMetaContent(html, ["og:title"]) ??
    getMetaContent(html, ["twitter:title"]) ??
    getTitle(html) ??
    "";

  const description =
    getMetaContent(html, ["description"]) ??
    getMetaContent(html, ["og:description"]) ??
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

  const resolvedImage = resolveMetadataUrl(
    openGraph.image ?? twitter.image,
    options.baseUrl,
  );

  const resolvedTwitterImage = resolveMetadataUrl(
    twitter.image,
    options.baseUrl,
  );

  const resolvedOpenGraphUrl = resolveMetadataUrl(
    openGraph.url,
    options.baseUrl,
  );

  /*
   * WebsiteMetadata.twitterCard is Record<string, string>,
   * not a single string. Keep it as an object to match index.ts.
   */
  const twitterCard: Record<string, string> = {
    ...(twitter.card !== undefined ? { card: twitter.card } : {}),
    ...(twitter.title !== undefined ? { title: twitter.title } : {}),
    ...(twitter.description !== undefined
      ? { description: twitter.description }
      : {}),
    ...(resolvedTwitterImage !== undefined
      ? { image: resolvedTwitterImage }
      : {}),
    ...(twitter.site !== undefined ? { site: twitter.site } : {}),
    ...(twitter.creator !== undefined
      ? { creator: twitter.creator }
      : {}),
  };

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
    charset: getCharset(html),
    viewport: getMetaContent(html, ["viewport"]) ?? "",

    twitterCard,


openGraph: {
  ...(openGraph.title !== undefined
    ? { title: openGraph.title }
    : {}),
  ...(openGraph.description !== undefined
    ? { description: openGraph.description }
    : {}),
  ...(resolvedImage !== undefined
    ? { image: resolvedImage }
    : {}),
  ...(resolvedOpenGraphUrl !== undefined
    ? { url: resolvedOpenGraphUrl }
    : {}),
  ...(openGraph.type !== undefined
    ? { type: openGraph.type }
    : {}),
  ...(openGraph.siteName !== undefined
    ? { siteName: openGraph.siteName }
    : {}),
},


    twitter: {
      card: twitter.card ?? "",
      title: twitter.title ?? "",
      description: twitter.description ?? "",
      image: resolvedTwitterImage ?? "",
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
 * Returns a safe HTTP(S) origin for display purposes.
 * This function does not fetch the URL.
 */
export function getMetadataOrigin(
  value: string,
): string | undefined {
  try {
    const parsed = new URL(value);

    if (
      parsed.protocol !== "http:" &&
      parsed.protocol !== "https:"
    ) {
      return undefined;
    }

    if (parsed.username || parsed.password || !parsed.hostname) {
      return undefined;
    }

    return parsed.origin;
  } catch {
    return undefined;
  }
}

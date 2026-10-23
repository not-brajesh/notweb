
/**
 * NOTWEB URL Utilities
 *
 * Helpers for parsing, normalizing, and inspecting URLs.
 *
 * IMPORTANT:
 * URL validation does not make a URL safe to fetch.
 * Network requests require separate SSRF protection, DNS/IP validation,
 * redirect validation, and response-size limits.
 */

export interface UrlValidationResult {
  valid: boolean;
  normalizedUrl?: string;
  error?: string;
}

export interface UrlDetails {
  href: string;
  protocol: string;
  hostname: string;
  port: string;
  pathname: string;
  search: string;
  hash: string;
  origin: string;
}

/**
 * Parses a URL string.
 *
 * Returns null when the value is not a valid absolute URL.
 */
export function parseUrl(value: string): URL | null {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

/**
 * Validates an absolute HTTP or HTTPS URL.
 */
export function validateWebsiteUrlDetailed(value: string): UrlValidationResult {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return {
      valid: false,
      error: "URL cannot be empty.",
    };
  }

  if (trimmed.length > 2048) {
    return {
      valid: false,
      error: "URL exceeds the maximum allowed length.",
    };
  }

  const parsed = parseUrl(trimmed);

  if (parsed === null) {
    return {
      valid: false,
      error: "Enter a valid absolute URL, including its protocol.",
    };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return {
      valid: false,
      error: "Only HTTP and HTTPS URLs are supported.",
    };
  }

  if (!parsed.hostname) {
    return {
      valid: false,
      error: "URL must contain a hostname.",
    };
  }

  if (parsed.username || parsed.password) {
    return {
      valid: false,
      error: "URLs containing embedded credentials are not allowed.",
    };
  }

  return {
    valid: true,
    normalizedUrl: parsed.href,
  };
}

/**
 * Normalizes a website URL using the built-in URL parser.
 *
 * Does not remove query parameters or fragments because they may be meaningful.
 */
export function normalizeUrl(value: string): string {
  const result = validateWebsiteUrl(value);

  if (!result.valid || result.normalizedUrl === undefined) {
    throw new TypeError(result.error ?? "Invalid website URL.");
  }

  return result.normalizedUrl;
}

/**
 * Extracts useful components from a valid HTTP or HTTPS URL.
 */
export function getUrlDetails(value: string): UrlDetails {
  const normalized = normalizeUrl(value);
  const parsed = new URL(normalized);

  return {
    href: parsed.href,
    protocol: parsed.protocol,
    hostname: parsed.hostname,
    port: parsed.port,
    pathname: parsed.pathname,
    search: parsed.search,
    hash: parsed.hash,
    origin: parsed.origin,
  };
}

/**
 * Checks whether two valid URLs share the same origin.
 */
export function hasSameOrigin(first: string, second: string): boolean {
  const firstUrl = new URL(normalizeUrl(first));
  const secondUrl = new URL(normalizeUrl(second));

  return firstUrl.origin === secondUrl.origin;
}

/**
 * Resolves a relative URL against an HTTP or HTTPS base URL.
 */
export function resolveUrl(relative: string, base: string): string {
  const normalizedBase = normalizeUrl(base);
  const resolved = new URL(relative, normalizedBase);

  if (resolved.protocol !== "http:" && resolved.protocol !== "https:") {
    throw new TypeError("Resolved URL must use HTTP or HTTPS.");
  }

  if (resolved.username || resolved.password) {
    throw new TypeError("Resolved URLs must not contain embedded credentials.");
  }

  return resolved.href;
}

/**
 * Removes the fragment identifier from a valid website URL.
 */
export function removeUrlFragment(value: string): string {
  const parsed = new URL(normalizeUrl(value));
  parsed.hash = "";

  return parsed.href;
}

/**
 * Checks whether a URL belongs to a specified hostname.
 *
 * Subdomains are accepted only when includeSubdomains is true.
 */
export function isHostnameAllowed(
  value: string,
  allowedHostnames: readonly string[],
  includeSubdomains = false,
): boolean {
  const parsed = new URL(normalizeUrl(value));
  const hostname = parsed.hostname.toLowerCase();

  return allowedHostnames.some((allowed) => {
    const normalizedAllowed = allowed.trim().toLowerCase();

    if (!normalizedAllowed) {
      return false;
    }

    if (hostname === normalizedAllowed) {
      return true;
    }

    return (
      includeSubdomains &&
      hostname.endsWith(`.${normalizedAllowed}`)
    );
  });
}

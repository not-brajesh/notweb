
/**
 * NOTWEB HTTP Utilities
 *
 * Shared HTTP constants, types, and response helpers.
 * These helpers do not make network requests.
 */

/**
 * Common HTTP request methods.
 */
export const HTTP_METHODS = [
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "HEAD",
  "OPTIONS",
] as const;

export type HttpMethod = (typeof HTTP_METHODS)[number];

/**
 * Frequently used HTTP status codes.
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  MOVED_PERMANENTLY: 301,
  FOUND: 302,
  NOT_MODIFIED: 304,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  PAYLOAD_TOO_LARGE: 413,
  UNSUPPORTED_MEDIA_TYPE: 415,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

export type HttpStatusCode =
  (typeof HTTP_STATUS)[keyof typeof HTTP_STATUS];

/**
 * Common HTTP content types.
 */
export const CONTENT_TYPES = {
  JSON: "application/json",
  TEXT: "text/plain",
  HTML: "text/html",
  CSS: "text/css",
  JAVASCRIPT: "application/javascript",
  FORM_URLENCODED: "application/x-www-form-urlencoded",
  MULTIPART_FORM_DATA: "multipart/form-data",
  OCTET_STREAM: "application/octet-stream",
} as const;

/**
 * Checks whether a number is a valid HTTP status code.
 */
export function isHttpStatusCode(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 100 &&
    value <= 599
  );
}

/**
 * Checks whether a status code represents a successful response.
 */
export function isSuccessfulStatus(status: number): boolean {
  return isHttpStatusCode(status) && status >= 200 && status < 300;
}

/**
 * Checks whether a status code represents a client error.
 */
export function isClientErrorStatus(status: number): boolean {
  return isHttpStatusCode(status) && status >= 400 && status < 500;
}

/**
 * Checks whether a status code represents a server error.
 */
export function isServerErrorStatus(status: number): boolean {
  return isHttpStatusCode(status) && status >= 500 && status < 600;
}

/**
 * Checks whether a request method is supported by NOTWEB.
 */
export function isHttpMethod(value: unknown): value is HttpMethod {
  return (
    typeof value === "string" &&
    (HTTP_METHODS as readonly string[]).includes(value.toUpperCase())
  );
}

/**
 * Returns whether a request method is conventionally safe.
 *
 * Safe methods should not request a state-changing operation.
 */
export function isSafeHttpMethod(method: HttpMethod): boolean {
  return method === "GET" || method === "HEAD" || method === "OPTIONS";
}

/**
 * Returns whether a request method is idempotent according to HTTP semantics.
 */
export function isIdempotentHttpMethod(method: HttpMethod): boolean {
  return (
    method === "GET" ||
    method === "HEAD" ||
    method === "OPTIONS" ||
    method === "PUT" ||
    method === "DELETE"
  );
}

/**
 * Checks whether a response content type is JSON.
 *
 * Supports application/json and structured JSON types such as
 * application/problem+json.
 */
export function isJsonContentType(
  contentType: string | null | undefined,
): boolean {
  if (!contentType) {
    return false;
  }

  const mediaType = contentType
    .split(";", 1)[0]
    ?.trim()
    .toLowerCase();

  return (
    mediaType === "application/json" ||
    (mediaType !== undefined && /^application\/[a-z0-9!#$&^_.+-]+\+json$/.test(mediaType))
  );
}

/**
 * Creates a JSON content-type header.
 */
export function createJsonHeaders(): Record<string, string> {
  return {
    Accept: CONTENT_TYPES.JSON,
    "Content-Type": CONTENT_TYPES.JSON,
  };
}

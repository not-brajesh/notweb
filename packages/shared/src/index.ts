/**
 * NOTWEB Shared Package
 *
 * Central entry point for shared types, constants, utilities,
 * validation, error handling, and application infrastructure.
 */

export const NOTWEB_NAME = "NOTWEB";
export const NOTWEB_VERSION = "0.1.0";

// Core constants and application configuration
export * from "./constants.js";
export * from "./config.js";
export * from "./env.js";

// Core types and validation
export * from "./validation.js";
export * from "./guards.js";
export * from "./safe-json.js";

// Errors and results
export * from "./errors.js";

// Identifiers and dates
export * from "./ids.js";
export * from "./date.js";

// Logging and HTTP
export * from "./logger.js";
export * from "./http.js";
export * from "./api.js";
export * from "./url.js";

// Pagination and rate limiting
export * from "./pagination.js";
export * from "./rate-limiter.js";

// Asynchronous utilities
export * from "./async.js";
export * from "./retry.js";
export * from "./timeout.js";

// Object utilities
export * from "./deep-clone.js";
export * from "./memoize.js";

// Function utilities
export * from "./debounce.js";
export * from "./throttle.js";

// Caching and events
export * from "./lru-cache.js";
export * from "./event-emitter.js";
export * from "./observable.js";
export * from "./disposable.js";

// Shared application types

export interface AppError {
  code: string;
  message: string;
  details?: unknown;
}

export type Result<T, E = AppError> =
  | { success: true; data: T }
  | { success: false; error: E };

export type Brand<T, Name extends string> = T & {
  readonly __brand: Name;
};

export type ProjectId = Brand<string, "ProjectId">;
export type JobId = Brand<string, "JobId">;
export type UserId = Brand<string, "UserId">;

export type AppEnvironment = "development" | "test" | "production";

export type JsonPrimitive = string | number | boolean | null;

export type JsonValue =
  | JsonPrimitive
  | JsonValue[]
  | { [key: string]: JsonValue };

export type JsonRecord = Record<string, unknown>;

// General-purpose helpers

export function isNonEmptyString(
  value: unknown,
): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function toSafeString(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "bigint"
  ) {
    return String(value);
  }

  if (value === null) {
    return "null";
  }

  if (value === undefined) {
    return "undefined";
  }

  if (value instanceof Error) {
    return value.message;
  }

  try {
    const serialized = JSON.stringify(value);
    return serialized ?? Object.prototype.toString.call(value);
  } catch {
    return Object.prototype.toString.call(value);
  }
}

/**
 * NOTWEB Shared Package
 *
 * Central entry point for shared types, constants, errors,
 * validation helpers, ID utilities, and date utilities.
 */

// -----------------------------------------------------------------------------
// Package metadata
// -----------------------------------------------------------------------------

export const NOTWEB_NAME = "NOTWEB";
export const NOTWEB_VERSION = "0.1.0";

// -----------------------------------------------------------------------------
// Shared constants
// -----------------------------------------------------------------------------

export * from "./constants.js";
export * from "./logger.js";
// -----------------------------------------------------------------------------
// Shared error handling
// -----------------------------------------------------------------------------

export * from "./errors.js";
export * from "./config.js";
// -----------------------------------------------------------------------------
// Validation utilities
// -----------------------------------------------------------------------------

export * from "./validation.js";

// -----------------------------------------------------------------------------
// ID utilities
// -----------------------------------------------------------------------------

export * from "./ids.js";

// -----------------------------------------------------------------------------
// Date and time utilities
// -----------------------------------------------------------------------------

export * from "./date.js";

// -----------------------------------------------------------------------------
// Common application types
// -----------------------------------------------------------------------------

export interface AppError {
  code: string;
  message: string;
  details?: unknown;
}

export type Result<T, E = AppError> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: E;
    };

/**
 * Creates a nominally branded type to distinguish string identifiers.
 */
export type Brand<T, Name extends string> = T & {
  readonly __brand: Name;
};

/**
 * Shared identifier types.
 */
export type ProjectId = Brand<string, "ProjectId">;
export type JobId = Brand<string, "JobId">;
export type UserId = Brand<string, "UserId">;

/**
 * Represents the supported application environment.
 */
export type AppEnvironment =
  | "development"
  | "test"
  | "production";

/**
 * Represents a generic key-value object.
 */
export type JsonRecord = Record<string, unknown>;

/**
 * Checks whether a value is a non-empty string.
 */
export function isNonEmptyString(
  value: unknown,
): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Safely converts an unknown value into a readable string.
 */
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

  if (value instanceof Error) {
    return value.message;
  }

  return "";
}

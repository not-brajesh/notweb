/**
 * NOTWEB Shared Package
 *
 * Common types and utilities used across NOTWEB applications
 * and packages.
 */

// -----------------------------------------------------------------------------
// Application metadata
// -----------------------------------------------------------------------------

export const NOTWEB_NAME = "NOTWEB";

export const NOTWEB_VERSION = "0.1.0";

export const NOTWEB_TAGLINE = "Beyond Websites. Beyond Limits.";

// -----------------------------------------------------------------------------
// Result types
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

// -----------------------------------------------------------------------------
// Common identifiers
// -----------------------------------------------------------------------------

export type Brand<T, Name extends string> = T & {
  readonly __brand: Name;
};

export type ProjectId = Brand<string, "ProjectId">;

export type JobId = Brand<string, "JobId">;

export type UserId = Brand<string, "UserId">;

// -----------------------------------------------------------------------------
// Project types
// -----------------------------------------------------------------------------

export type ProjectStatus =
  | "draft"
  | "analyzing"
  | "ready"
  | "processing"
  | "completed"
  | "failed";

export type ProjectTarget =
  | "responsive-web"
  | "pwa"
  | "browser-extension"
  | "desktop-app"
  | "mobile-app";

export interface ProjectMetadata {
  id: ProjectId;
  name: string;
  sourceUrl: string;
  status: ProjectStatus;
  targets: ProjectTarget[];
  createdAt: string;
  updatedAt: string;
}

// -----------------------------------------------------------------------------
// Job types
// -----------------------------------------------------------------------------

export type JobStatus =
  | "queued"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";

export interface JobProgress {
  completed: number;
  total: number;
  percentage: number;
  message?: string;
}

export interface JobMetadata {
  id: JobId;
  status: JobStatus;
  progress: JobProgress;
  createdAt: string;
  updatedAt: string;
}

// -----------------------------------------------------------------------------
// Logging
// -----------------------------------------------------------------------------

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
}

// -----------------------------------------------------------------------------
// Utility functions
// -----------------------------------------------------------------------------

/**
 * Creates a consistent error object.
 */
export function createAppError(
  code: string,
  message: string,
  details?: unknown,
): AppError {
  return {
    code,
    message,
    ...(details === undefined ? {} : { details }),
  };
}

/**
 * Wraps successful data in a Result.
 */
export function success<T>(data: T): Result<T> {
  return {
    success: true,
    data,
  };
}

/**
 * Wraps an error in a Result.
 */
export function failure<E = AppError>(error: E): Result<never, E> {
  return {
    success: false,
    error,
  };
}

/**
 * Returns the current timestamp in ISO 8601 format.
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Clamps a number to an inclusive range.
 */
export function clamp(value: number, min: number, max: number): number {
  if (min > max) {
    throw new RangeError("Minimum value cannot be greater than maximum value.");
  }

  return Math.min(Math.max(value, min), max);
}

/**
 * Checks whether a value is a non-empty string.
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Calculates a safe progress percentage.
 */
export function calculateProgress(
  completed: number,
  total: number,
): number {
  if (
    !Number.isFinite(completed) ||
    !Number.isFinite(total) ||
    completed < 0 ||
    total < 0
  ) {
    return 0;
  }

  if (total === 0) {
    return 0;
  }

  return Math.round(clamp((completed / total) * 100, 0, 100));
}
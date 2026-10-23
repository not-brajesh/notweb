/**
 * NOTWEB Shared Package
 *
 * Public entry point for shared types, constants, errors,
 * validation utilities, and ID generation.
 */

// -----------------------------------------------------------------------------
// Application metadata
// -----------------------------------------------------------------------------

export const NOTWEB_NAME = "NOTWEB";

export const NOTWEB_VERSION = "0.1.0";

export const NOTWEB_TAGLINE = "Beyond Websites. Beyond Limits.";

// -----------------------------------------------------------------------------
// Common types
// -----------------------------------------------------------------------------

export interface AppError {
  code: string;
  message: string;
  details?: unknown;
}
export * from "./date.js";
export type Result<T, E = AppError> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: E;
    };

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
// Logging types
// -----------------------------------------------------------------------------

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
}

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

export {
  APP_NAME,
  APP_VERSION,
  APP_TAGLINE,
  DEFAULT_LOCALE,
  DEFAULT_TIMEZONE,
  PROJECT_NAME_MIN_LENGTH,
  PROJECT_NAME_MAX_LENGTH,
  MAX_WEBSITE_URL_LENGTH,
  SUPPORTED_URL_PROTOCOLS,
  PROJECT_STATUSES,
  JOB_STATUSES,
  PROJECT_TARGETS,
  LOG_LEVELS,
  DEFAULT_LOG_LEVEL,
  DEFAULT_REQUEST_TIMEOUT_MS,
  MAX_REQUEST_TIMEOUT_MS,
  DEFAULT_MAX_REDIRECTS,
  DEFAULT_MAX_RESPONSE_SIZE_BYTES,
} from "./constants.js";

export type {
  ProjectStatusValue,
  JobStatusValue,
  ProjectTargetValue,
  LogLevelValue,
} from "./constants.js";

// -----------------------------------------------------------------------------
// Error handling
// -----------------------------------------------------------------------------

export {
  NotwebError,
  ValidationError,
  NotFoundError,
  TimeoutError,
  normalizeError,
  tryCatch,
} from "./errors.js";

// -----------------------------------------------------------------------------
// Validation utilities
// -----------------------------------------------------------------------------

export {
  validateProjectName,
  validateWebsiteUrl,
  validateEmail,
  validatePositiveInteger,
} from "./validation.js";

export type { ValidationResult } from "./validation.js";

// -----------------------------------------------------------------------------
// ID utilities
// -----------------------------------------------------------------------------

export {
  createProjectId,
  createJobId,
  createUserId,
  isValidUuid,
} from "./ids.js";

// -----------------------------------------------------------------------------
// Utility functions
// -----------------------------------------------------------------------------

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

export function success<T>(data: T): Result<T> {
  return {
    success: true,
    data,
  };
}

export function failure<E = AppError>(error: E): Result<never, E> {
  return {
    success: false,
    error,
  };
}

export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

export function clamp(value: number, min: number, max: number): number {
  if (min > max) {
    throw new RangeError("Minimum value cannot be greater than maximum value.");
  }

  return Math.min(Math.max(value, min), max);
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

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
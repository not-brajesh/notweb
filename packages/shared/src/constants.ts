/**
 * NOTWEB application-wide constants.
 */

// -----------------------------------------------------------------------------
// Application metadata
// -----------------------------------------------------------------------------

export const APP_NAME = "NOTWEB";

export const APP_VERSION = "0.1.0";

export const APP_TAGLINE = "Beyond Websites. Beyond Limits.";

export const DEFAULT_LOCALE = "en";

export const DEFAULT_TIMEZONE = "UTC";

// -----------------------------------------------------------------------------
// Project configuration
// -----------------------------------------------------------------------------

export const PROJECT_NAME_MIN_LENGTH = 2;

export const PROJECT_NAME_MAX_LENGTH = 80;

export const MAX_WEBSITE_URL_LENGTH = 2048;

// -----------------------------------------------------------------------------
// Supported protocols
// -----------------------------------------------------------------------------

export const SUPPORTED_URL_PROTOCOLS = ["http:", "https:"] as const;

// -----------------------------------------------------------------------------
// Project statuses
// -----------------------------------------------------------------------------

export const PROJECT_STATUSES = [
  "draft",
  "analyzing",
  "ready",
  "processing",
  "completed",
  "failed",
] as const;

// -----------------------------------------------------------------------------
// Job statuses
// -----------------------------------------------------------------------------

export const JOB_STATUSES = [
  "queued",
  "running",
  "completed",
  "failed",
  "cancelled",
] as const;

// -----------------------------------------------------------------------------
// Supported project targets
// -----------------------------------------------------------------------------

export const PROJECT_TARGETS = [
  "responsive-web",
  "pwa",
  "browser-extension",
  "desktop-app",
  "mobile-app",
] as const;

// -----------------------------------------------------------------------------
// Logging
// -----------------------------------------------------------------------------

export const LOG_LEVELS = ["debug", "info", "warn", "error"] as const;

export const DEFAULT_LOG_LEVEL = "info";

// -----------------------------------------------------------------------------
// Resource limits
// -----------------------------------------------------------------------------

export const DEFAULT_REQUEST_TIMEOUT_MS = 15_000;

export const MAX_REQUEST_TIMEOUT_MS = 60_000;

export const DEFAULT_MAX_REDIRECTS = 5;

export const DEFAULT_MAX_RESPONSE_SIZE_BYTES = 5 * 1024 * 1024;

// -----------------------------------------------------------------------------
// Type-safe values derived from constants
// -----------------------------------------------------------------------------

export type ProjectStatusValue = (typeof PROJECT_STATUSES)[number];

export type JobStatusValue = (typeof JOB_STATUSES)[number];

export type ProjectTargetValue = (typeof PROJECT_TARGETS)[number];

export type LogLevelValue = (typeof LOG_LEVELS)[number];
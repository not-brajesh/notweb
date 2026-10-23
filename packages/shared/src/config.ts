
/**
 * NOTWEB Shared Configuration
 *
 * Centralized, typed defaults for application modules.
 * Runtime-specific secrets and environment loading belong in app packages.
 */

import {
  DEFAULT_LOG_LEVEL,
  DEFAULT_MAX_REDIRECTS,
  DEFAULT_REQUEST_TIMEOUT_MS,
  MAX_REQUEST_TIMEOUT_MS,
  DEFAULT_MAX_RESPONSE_SIZE_BYTES,
} from "./constants.js";

import type { LogLevelValue } from "./constants.js";

/**
 * Network request configuration.
 */
export interface NetworkConfig {
  timeoutMs: number;
  maxRedirects: number;
  maxResponseSizeBytes: number;
}

/**
 * Logging configuration.
 */
export interface LoggingConfig {
  level: LogLevelValue;
  includeTimestamps: boolean;
}

/**
 * General application configuration.
 */
export interface AppConfig {
  appName: string;
  environment: "development" | "test" | "production";
  network: NetworkConfig;
  logging: LoggingConfig;
}

/**
 * Default network settings.
 */
export const DEFAULT_NETWORK_CONFIG: Readonly<NetworkConfig> =
  Object.freeze({
    timeoutMs: DEFAULT_REQUEST_TIMEOUT_MS,
    maxRedirects: DEFAULT_MAX_REDIRECTS,
    maxResponseSizeBytes: DEFAULT_MAX_RESPONSE_SIZE_BYTES,
  });

/**
 * Default logging settings.
 */
export const DEFAULT_LOGGING_CONFIG: Readonly<LoggingConfig> =
  Object.freeze({
    level: DEFAULT_LOG_LEVEL,
    includeTimestamps: true,
  });

/**
 * Creates application configuration from validated overrides.
 */
export function createAppConfig(
  overrides: Partial<{
    appName: string;
    environment: AppConfig["environment"];
    network: Partial<NetworkConfig>;
    logging: Partial<LoggingConfig>;
  }> = {},
): AppConfig {
  const appName = overrides.appName ?? "NOTWEB";

  if (appName.trim().length === 0) {
    throw new TypeError("Application name cannot be empty.");
  }

  const network: NetworkConfig = {
    ...DEFAULT_NETWORK_CONFIG,
    ...overrides.network,
  };

  const logging: LoggingConfig = {
    ...DEFAULT_LOGGING_CONFIG,
    ...overrides.logging,
  };

  if (
    !Number.isInteger(network.timeoutMs) ||
    network.timeoutMs <= 0 ||
    network.timeoutMs > MAX_REQUEST_TIMEOUT_MS
  ) {
    throw new RangeError(
      `Request timeout must be between 1 and ${MAX_REQUEST_TIMEOUT_MS} milliseconds.`,
    );
  }

  if (
    !Number.isInteger(network.maxRedirects) ||
    network.maxRedirects < 0 ||
    network.maxRedirects > 10
  ) {
    throw new RangeError(
      "Maximum redirects must be an integer between 0 and 10.",
    );
  }

  if (
    !Number.isSafeInteger(network.maxResponseSizeBytes) ||
    network.maxResponseSizeBytes <= 0
  ) {
    throw new RangeError(
      "Maximum response size must be a positive safe integer.",
    );
  }

  const environment = overrides.environment ?? "development";

  if (
    environment !== "development" &&
    environment !== "test" &&
    environment !== "production"
  ) {
    throw new TypeError("Unsupported application environment.");
  }

  return {
    appName: appName.trim(),
    environment,
    network,
    logging,
  };
}

/**
 * Default configuration for local development.
 */
export const defaultAppConfig: Readonly<AppConfig> =
  Object.freeze(createAppConfig());

/**
 * Returns true when detailed development diagnostics are appropriate.
 */
export function isDevelopmentConfig(config: AppConfig): boolean {
  return config.environment === "development";
}

/**
 * Returns true when production settings are active.
 */
export function isProductionConfig(config: AppConfig): boolean {
  return config.environment === "production";
}

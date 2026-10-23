
/**
 * NOTWEB Logger
 *
 * Provides structured logging with configurable log levels.
 * Sensitive information should never be written to logs.
 */

import {
  DEFAULT_LOG_LEVEL,
  LOG_LEVELS,
} from "./constants.js";

import type { LogLevelValue } from "./constants.js";

export interface LoggerOptions {
  /** Name of the module generating the logs. */
  context?: string;

  /** Minimum severity level to display. */
  level?: LogLevelValue;

  /** Whether logs should include timestamps. */
  timestamps?: boolean;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevelValue;
  message: string;
  context?: string;
  details?: unknown;
}

const LOG_LEVEL_PRIORITY: Record<LogLevelValue, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function isLogLevel(value: unknown): value is LogLevelValue {
  return (
    typeof value === "string" &&
    (LOG_LEVELS as readonly string[]).includes(value)
  );
}

function serializeError(error: Error): Record<string, unknown> {
  return {
    name: error.name,
    message: error.message,
    ...(error.stack === undefined ? {} : { stack: error.stack }),
  };
}

function normalizeDetails(details: unknown): unknown {
  if (details instanceof Error) {
    return serializeError(details);
  }

  return details;
}

export class Logger {
  private readonly context?: string;
  private readonly timestamps: boolean;
  private currentLevel: LogLevelValue;


constructor(options: LoggerOptions = {}) {
  if (options.context !== undefined) {
    this.context = options.context;
  }

  this.timestamps = options.timestamps ?? true;

  this.currentLevel = isLogLevel(options.level)
    ? options.level
    : DEFAULT_LOG_LEVEL;
}


  /**
   * Changes the minimum log severity at runtime.
   */
  setLevel(level: LogLevelValue): void {
    if (!isLogLevel(level)) {
      throw new TypeError(`Invalid log level: ${String(level)}`);
    }

    this.currentLevel = level;
  }

  /**
   * Returns the active minimum log level.
   */
  getLevel(): LogLevelValue {
    return this.currentLevel;
  }

  debug(message: string, details?: unknown): void {
    this.write("debug", message, details);
  }

  info(message: string, details?: unknown): void {
    this.write("info", message, details);
  }

  warn(message: string, details?: unknown): void {
    this.write("warn", message, details);
  }

  error(message: string, details?: unknown): void {
    this.write("error", message, details);
  }

  /**
   * Creates a child logger with a more specific context.
   */
  child(context: string): Logger {
    const combinedContext = [this.context, context]
      .filter((part): part is string => Boolean(part))
      .join(":");

    return new Logger({
      context: combinedContext,
      level: this.currentLevel,
      timestamps: this.timestamps,
    });
  }

  private write(
    level: LogLevelValue,
    message: string,
    details?: unknown,
  ): void {
    if (
      LOG_LEVEL_PRIORITY[level] <
      LOG_LEVEL_PRIORITY[this.currentLevel]
    ) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(this.context === undefined
        ? {}
        : { context: this.context }),
      ...(details === undefined
        ? {}
        : { details: normalizeDetails(details) }),
    };

    const output = {
      ...(this.timestamps ? { timestamp: entry.timestamp } : {}),
      level: entry.level,
      ...(entry.context === undefined
        ? {}
        : { context: entry.context }),
      message: entry.message,
      ...(entry.details === undefined
        ? {}
        : { details: entry.details }),
    };

    const formattedMessage = JSON.stringify(output);

    switch (level) {
      case "debug":
        console.debug(formattedMessage);
        break;

      case "info":
        console.info(formattedMessage);
        break;

      case "warn":
        console.warn(formattedMessage);
        break;

      case "error":
        console.error(formattedMessage);
        break;
    }
  }
}

/**
 * Default logger for application-wide use.
 */
export const logger = new Logger({
  context: "NOTWEB",
});

/**
 * Creates a logger for a particular module.
 */
export function createLogger(
  context: string,
  options: Omit<LoggerOptions, "context"> = {},
): Logger {
  return new Logger({
    ...options,
    context,
  });
}

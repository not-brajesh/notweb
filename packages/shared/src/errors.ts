import type { AppError, Result } from "./index.js";

/**
 * Base error class for NOTWEB.
 */
export class NotwebError extends Error {
  public readonly code: string;
  public readonly details: unknown;

  constructor(
    code: string,
    message: string,
    details?: unknown,
  ) {
    super(message);

    this.name = "NotwebError";
    this.code = code;
    this.details = details;

    Object.setPrototypeOf(this, new.target.prototype);
  }

  /**
   * Converts the error into the shared AppError format.
   */
  toAppError(): AppError {
    return {
      code: this.code,
      message: this.message,
      ...(this.details === undefined ? {} : { details: this.details }),
    };
  }
}

/**
 * Error raised when an input is invalid.
 */
export class ValidationError extends NotwebError {
  constructor(message: string, details?: unknown) {
    super("VALIDATION_ERROR", message, details);
    this.name = "ValidationError";
  }
}

/**
 * Error raised when a requested resource cannot be found.
 */
export class NotFoundError extends NotwebError {
  constructor(resource: string, identifier?: string) {
    super(
      "NOT_FOUND",
      `${resource} was not found.`,
      identifier === undefined ? undefined : { identifier },
    );

    this.name = "NotFoundError";
  }
}

/**
 * Error raised when an operation exceeds its allowed time.
 */
export class TimeoutError extends NotwebError {
  constructor(operation: string) {
    super("TIMEOUT", `Operation timed out: ${operation}`);
    this.name = "TimeoutError";
  }
}

/**
 * Converts an unknown thrown value into a safe application error.
 */
export function normalizeError(error: unknown): AppError {
  if (error instanceof NotwebError) {
    return error.toAppError();
  }

  if (error instanceof Error) {
    return {
      code: "INTERNAL_ERROR",
      message: error.message,
    };
  }

  return {
    code: "UNKNOWN_ERROR",
    message: "An unexpected error occurred.",
  };
}

/**
 * Executes an asynchronous operation and returns a Result.
 */
export async function tryCatch<T>(
  operation: () => Promise<T>,
): Promise<Result<T, AppError>> {
  try {
    return {
      success: true,
      data: await operation(),
    };
  } catch (error: unknown) {
    return {
      success: false,
      error: normalizeError(error),
    };
  }
}
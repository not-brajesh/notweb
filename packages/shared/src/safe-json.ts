
/**
 * NOTWEB Safe JSON Utilities
 *
 * Safe parsing and serialization helpers for JSON data.
 * Parsing untrusted JSON does not make the resulting data trustworthy.
 */

import { isJsonValue } from "./guards.js";

export type SafeJsonParseResult<T = unknown> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: string;
    };

export interface SafeJsonOptions {
  maxLength?: number;
}

const DEFAULT_MAX_JSON_LENGTH = 5 * 1024 * 1024;

function isValidMaxLength(value: number): boolean {
  return Number.isSafeInteger(value) && value >= 0;
}

/**
 * Parse JSON without throwing an exception.
 *
 * The default size limit is 5 MiB.
 */
export function safeJsonParse(
  input: string,
  options: SafeJsonOptions = {},
): SafeJsonParseResult {
  const maxLength = options.maxLength ?? DEFAULT_MAX_JSON_LENGTH;

  if (!isValidMaxLength(maxLength)) {
    return {
      success: false,
      error: "maxLength must be a non-negative safe integer.",
    };
  }

  if (typeof input !== "string") {
    return {
      success: false,
      error: "JSON input must be a string.",
    };
  }

  if (input.length > maxLength) {
    return {
      success: false,
      error: `JSON input exceeds the maximum length of ${maxLength} characters.`,
    };
  }

  try {
    const data: unknown = JSON.parse(input);

    return {
      success: true,
      data,
    };
  } catch {
    return {
      success: false,
      error: "Invalid JSON input.",
    };
  }
}

/**
 * Parse JSON and validate the result with a caller-provided type guard.
 */
export function safeJsonParseAs<T>(
  input: string,
  guard: (value: unknown) => value is T,
  options: SafeJsonOptions = {},
): SafeJsonParseResult<T> {
  const result = safeJsonParse(input, options);

  if (!result.success) {
    return result;
  }

  try {
    if (!guard(result.data)) {
      return {
        success: false,
        error: "JSON data does not match the expected structure.",
      };
    }
  } catch {
    return {
      success: false,
      error: "JSON validation failed.",
    };
  }

  return {
    success: true,
    data: result.data,
  };
}

/**
 * Serialize a value to JSON without throwing.
 */
export function safeJsonStringify(
  value: unknown,
  space?: number,
): SafeJsonParseResult<string> {
  if (
    space !== undefined &&
    (!Number.isInteger(space) || space < 0 || space > 10)
  ) {
    return {
      success: false,
      error: "space must be an integer between 0 and 10.",
    };
  }

  try {
    const json =
      space === undefined
        ? JSON.stringify(value)
        : JSON.stringify(value, null, space);

    if (json === undefined) {
      return {
        success: false,
        error: "Value cannot be represented as JSON.",
      };
    }

    return {
      success: true,
      data: json,
    };
  } catch {
    return {
      success: false,
      error: "Value could not be serialized to JSON.",
    };
  }
}

/**
 * Check whether a value can be represented as a JSON-compatible value.
 */
export function isJsonCompatible(value: unknown): boolean {
  return isJsonValue(value);
}

/**
 * Parse a JSON object specifically.
 */
export function safeJsonParseObject(
  input: string,
  options: SafeJsonOptions = {},
): SafeJsonParseResult<Record<string, unknown>> {
  return safeJsonParseAs(
    input,
    (value): value is Record<string, unknown> =>
      value !== null &&
      typeof value === "object" &&
      !Array.isArray(value),
    options,
  );
}


/**
 * NOTWEB Type Guards
 *
 * Runtime checks for common JavaScript and TypeScript values.
 * These helpers check data shapes, not whether data is trustworthy.
 */

/**
 * Checks whether a value is a plain object.
 */
export function isPlainObject(
  value: unknown,
): value is Record<string, unknown> {
  if (value === null || typeof value !== "object") {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);

  return prototype === Object.prototype || prototype === null;
}

/**
 * Checks whether a value is an array containing only strings.
 */
export function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(
    (item: unknown) => typeof item === "string",
  );
}

/**
 * Checks whether a value is a finite number.
 */
export function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/**
 * Checks whether a value is a positive safe integer.
 */
export function isPositiveSafeInteger(value: unknown): value is number {
  return Number.isSafeInteger(value) && typeof value === "number" && value > 0;
}

/**
 * Checks whether a value is a non-negative safe integer.
 */
export function isNonNegativeSafeInteger(
  value: unknown,
): value is number {
  return (
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value >= 0
  );
}

/**
 * Checks whether a value is a boolean.
 */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

/**
 * Checks whether a value is a non-empty string.
 */
export function isNonEmptyStringValue(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Checks whether an object has a property of the specified name.
 */
export function hasOwnProperty<K extends string>(
  value: unknown,
  key: K,
): value is Record<K, unknown> {
  return (
    isPlainObject(value) &&
    Object.prototype.hasOwnProperty.call(value, key)
  );
}

/**
 * Checks whether a value is a valid Date instance.
 */
export function isDate(value: unknown): value is Date {
  return (
    value instanceof Date &&
    !Number.isNaN(value.getTime())
  );
}

/**
 * Checks whether a value is a valid JSON-compatible value.
 *
 * Rejects circular references, undefined values, functions, symbols,
 * bigint values, non-finite numbers, and non-plain objects.
 */
export function isJsonValue(
  value: unknown,
  ancestors: Set<object> = new Set(),
): boolean {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "boolean"
  ) {
    return true;
  }

  if (typeof value === "number") {
    return Number.isFinite(value);
  }

  if (typeof value !== "object") {
    return false;
  }

  if (ancestors.has(value)) {
    return false;
  }

  if (!Array.isArray(value) && !isPlainObject(value)) {
    return false;
  }

  ancestors.add(value);

  try {
    if (Array.isArray(value)) {
      return value.every((item: unknown) => isJsonValue(item, ancestors));
    }

    return Object.values(value).every(
      (item: unknown) => isJsonValue(item, ancestors),
    );
  } finally {
    ancestors.delete(value);
  }
}

/**
 * Checks whether an unknown value is a valid Error instance.
 */
export function isError(value: unknown): value is Error {
  return value instanceof Error;
}

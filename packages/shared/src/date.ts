
/**
 * NOTWEB Date Utilities
 *
 * Shared date and timestamp helpers used across the platform.
 * ISO timestamps are normalized to UTC.
 */

export type DateInput = Date | string | number;

/**
 * Checks whether a value represents a valid date input.
 */
export function isValidDate(value: unknown): value is DateInput {
  if (
    !(value instanceof Date) &&
    typeof value !== "string" &&
    typeof value !== "number"
  ) {
    return false;
  }

  const date = value instanceof Date ? value : new Date(value);

  return !Number.isNaN(date.getTime());
}

/**
 * Converts a valid date into a UTC ISO timestamp.
 *
 * Example: 2026-10-23T10:30:00.000Z
 */
export function toIsoTimestamp(value: DateInput = new Date()): string {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new RangeError("Cannot convert an invalid date to an ISO timestamp.");
  }

  return date.toISOString();
}

/**
 * Returns the current UTC timestamp.
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Converts a date into Unix time in milliseconds.
 */
export function toUnixMilliseconds(value: DateInput): number {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new RangeError("Cannot convert an invalid date to Unix milliseconds.");
  }

  return date.getTime();
}

/**
 * Compares two dates.
 *
 * Negative: first date is earlier.
 * Zero: both dates represent the same instant.
 * Positive: first date is later.
 */
export function compareDates(
  firstDate: DateInput,
  secondDate: DateInput,
): number {
  return (
    toUnixMilliseconds(firstDate) - toUnixMilliseconds(secondDate)
  );
}

/**
 * Checks whether a date falls between two dates, inclusive.
 */
export function isDateBetween(
  value: DateInput,
  startDate: DateInput,
  endDate: DateInput,
): boolean {
  const timestamp = toUnixMilliseconds(value);
  const start = toUnixMilliseconds(startDate);
  const end = toUnixMilliseconds(endDate);

  if (start > end) {
    throw new RangeError("The start date must not be after the end date.");
  }

  return timestamp >= start && timestamp <= end;
}

/**
 * Adds a duration in milliseconds to a date.
 */
export function addMilliseconds(
  value: DateInput,
  milliseconds: number,
): Date {
  if (!Number.isFinite(milliseconds)) {
    throw new RangeError("The duration must be a finite number.");
  }

  const result = toUnixMilliseconds(value) + milliseconds;

  if (!Number.isFinite(result) || Math.abs(result) > 8.64e15) {
    throw new RangeError("The resulting date is outside the supported range.");
  }

  return new Date(result);
}

/**
 * Formats a date for display.
 *
 * By default, the runtime's locale and timezone are used.
 * Supply explicit options for consistent formatting.
 */
export function formatDateTime(
  value: DateInput,
  options: {
    locale?: string;
    timeZone?: string;
    dateStyle?: "full" | "long" | "medium" | "short";
    timeStyle?: "full" | "long" | "medium" | "short";
  } = {},
): string {
  const {
    locale,
    timeZone,
    dateStyle = "medium",
    timeStyle = "short",
  } = options;

  const date = new Date(toUnixMilliseconds(value));

  return new Intl.DateTimeFormat(locale, {
    dateStyle,
    timeStyle,
    ...(timeZone === undefined ? {} : { timeZone }),
  }).format(date);
}

/**
 * Checks whether a date is in the past.
 */
export function isPastDate(value: DateInput): boolean {
  return toUnixMilliseconds(value) < Date.now();
}

/**
 * Checks whether a date is in the future.
 */
export function isFutureDate(value: DateInput): boolean {
  return toUnixMilliseconds(value) > Date.now();
}

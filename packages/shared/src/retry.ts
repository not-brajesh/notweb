
/**
 * NOTWEB Retry Utilities
 *
 * Retries asynchronous operations using bounded exponential backoff.
 * Use retries only for operations that are safe to repeat.
 */

export interface RetryOptions {
  /** Maximum number of attempts, including the first attempt. */
  maxAttempts?: number;

  /** Delay before the first retry, in milliseconds. */
  initialDelayMs?: number;

  /** Upper bound for the delay between retries, in milliseconds. */
  maxDelayMs?: number;

  /** Exponential backoff multiplier. */
  backoffFactor?: number;

  /** Add random jitter to retry delays. */
  jitter?: boolean;

  /** Optional predicate that determines whether an error is retryable. */
  shouldRetry?: (error: unknown, attempt: number) => boolean;

  /** Optional callback invoked before each retry. */
  onRetry?: (error: unknown, attempt: number, delayMs: number) => void;
}

export interface NormalizedRetryOptions {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffFactor: number;
  jitter: boolean;
  shouldRetry: (error: unknown, attempt: number) => boolean;
  onRetry?: (error: unknown, attempt: number, delayMs: number) => void;
}

const DEFAULT_MAX_ATTEMPTS = 3;
const DEFAULT_INITIAL_DELAY_MS = 250;
const DEFAULT_MAX_DELAY_MS = 5_000;
const DEFAULT_BACKOFF_FACTOR = 2;

/**
 * Validates retry settings and supplies defaults.
 */
export function normalizeRetryOptions(
  options: RetryOptions = {},
): NormalizedRetryOptions {
  const maxAttempts = options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
  const initialDelayMs = options.initialDelayMs ?? DEFAULT_INITIAL_DELAY_MS;
  const maxDelayMs = options.maxDelayMs ?? DEFAULT_MAX_DELAY_MS;
  const backoffFactor = options.backoffFactor ?? DEFAULT_BACKOFF_FACTOR;

  if (!Number.isSafeInteger(maxAttempts) || maxAttempts < 1 || maxAttempts > 10) {
    throw new RangeError("maxAttempts must be an integer between 1 and 10.");
  }

  if (!Number.isFinite(initialDelayMs) || initialDelayMs < 0) {
    throw new RangeError("initialDelayMs must be a non-negative finite number.");
  }

  if (!Number.isFinite(maxDelayMs) || maxDelayMs < 0) {
    throw new RangeError("maxDelayMs must be a non-negative finite number.");
  }

  if (!Number.isFinite(backoffFactor) || backoffFactor < 1) {
    throw new RangeError("backoffFactor must be a finite number greater than or equal to 1.");
  }

  if (initialDelayMs > maxDelayMs) {
    throw new RangeError("initialDelayMs cannot exceed maxDelayMs.");
  }

  return {
    maxAttempts,
    initialDelayMs,
    maxDelayMs,
    backoffFactor,
    jitter: options.jitter ?? true,
    shouldRetry: options.shouldRetry ?? (() => true),
    ...(options.onRetry === undefined ? {} : { onRetry: options.onRetry }),
  };
}

/**
 * Calculates the delay before a retry.
 */
export function calculateRetryDelay(
  retryNumber: number,
  options: Pick<
    NormalizedRetryOptions,
    "initialDelayMs" | "maxDelayMs" | "backoffFactor" | "jitter"
  >,
): number {
  if (!Number.isSafeInteger(retryNumber) || retryNumber < 1) {
    throw new RangeError("retryNumber must be a positive integer.");
  }

  const exponentialDelay = Math.min(
    options.maxDelayMs,
    options.initialDelayMs *
      options.backoffFactor ** Math.min(retryNumber - 1, 52),
  );

  if (!options.jitter || exponentialDelay === 0) {
    return exponentialDelay;
  }

  return Math.random() * exponentialDelay;
}

/**
 * Waits for the specified duration.
 */
export function sleep(delayMs: number): Promise<void> {
  if (!Number.isFinite(delayMs) || delayMs < 0) {
    return Promise.reject(
      new RangeError("delayMs must be a non-negative finite number."),
    );
  }

  return new Promise((resolve) => {
    setTimeout(resolve, delayMs);
  });
}

/**
 * Executes an asynchronous operation with bounded retries.
 *
 * maxAttempts includes the initial attempt.
 * The final error is rethrown when attempts are exhausted.
 */
export async function retry<T>(
  operation: (attempt: number) => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const normalized = normalizeRetryOptions(options);

  for (let attempt = 1; attempt <= normalized.maxAttempts; attempt += 1) {
    try {
      return await operation(attempt);
    } catch (error: unknown) {
      const attemptsExhausted = attempt >= normalized.maxAttempts;

      if (
        attemptsExhausted ||
        !normalized.shouldRetry(error, attempt)
      ) {
        throw error;
      }

      const delayMs = calculateRetryDelay(attempt, normalized);

      normalized.onRetry?.(error, attempt, delayMs);

      await sleep(delayMs);
    }
  }

  throw new Error("Retry operation ended unexpectedly.");
}

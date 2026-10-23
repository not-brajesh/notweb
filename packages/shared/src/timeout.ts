
/**
 * NOTWEB Timeout Utilities
 *
 * Provides timeout helpers for asynchronous operations.
 *
 * Important:
 * A timeout does not automatically stop the underlying operation.
 * Use an AbortSignal-aware API when the operation must be cancelled.
 */

export class OperationTimeoutError extends Error {
  public readonly timeoutMs: number;
  public readonly operation: string;

  constructor(timeoutMs: number, operation = "Operation") {
    super(`${operation} timed out after ${timeoutMs} ms.`);

    this.name = "OperationTimeoutError";
    this.timeoutMs = timeoutMs;
    this.operation = operation;

    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export interface TimeoutOptions {
  timeoutMs: number;
  operation?: string;
}

/**
 * Validates a timeout duration.
 */
export function validateTimeout(timeoutMs: number): void {
  if (
    !Number.isSafeInteger(timeoutMs) ||
    timeoutMs < 1 ||
    timeoutMs > 2_147_483_647
  ) {
    throw new RangeError(
      "timeoutMs must be a positive safe integer within the supported timer range.",
    );
  }
}

/**
 * Creates a promise that rejects when the timeout expires.
 */
export function createTimeout<T = never>(
  options: TimeoutOptions,
): Promise<T> {
  validateTimeout(options.timeoutMs);

  const operation = options.operation ?? "Operation";

  return new Promise<T>((_, reject) => {
    setTimeout(() => {
      reject(
        new OperationTimeoutError(options.timeoutMs, operation),
      );
    }, options.timeoutMs);
  });
}

/**
 * Runs an operation and rejects if it does not settle before the timeout.
 *
 * Note: The original operation continues running unless it supports
 * cancellation through a separate AbortSignal.
 */
export async function withTimeout<T>(
  operation: Promise<T> | (() => Promise<T>),
  options: TimeoutOptions,
): Promise<T> {
  validateTimeout(options.timeoutMs);

  const operationPromise =
    typeof operation === "function" ? operation() : operation;

  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(
        new OperationTimeoutError(
          options.timeoutMs,
          options.operation ?? "Operation",
        ),
      );
    }, options.timeoutMs);
  });

  try {
    return await Promise.race([
      operationPromise,
      timeoutPromise,
    ]);
  } finally {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
  }
}

/**
 * Combines a timeout with AbortController.
 *
 * The returned signal becomes aborted when the timeout expires.
 * Pass it to APIs that support AbortSignal, such as fetch().
 *
 * The caller must invoke dispose() when finished to clear the timer.
 */
export function createTimeoutSignal(
  timeoutMs: number,
): {
  signal: AbortSignal;
  dispose: () => void;
} {
  validateTimeout(timeoutMs);

  const controller = new AbortController();

  const timeoutId = setTimeout(() => {
    controller.abort(
      new OperationTimeoutError(timeoutMs),
    );
  }, timeoutMs);

  let disposed = false;

  return {
    signal: controller.signal,

    dispose: () => {
      if (disposed) {
        return;
      }

      disposed = true;
      clearTimeout(timeoutId);
    },
  };
}

/**
 * Executes an asynchronous operation with a timeout signal.
 *
 * The operation receives an AbortSignal and should respect it.
 */
export async function withAbortTimeout<T>(
  operation: (signal: AbortSignal) => Promise<T>,
  options: TimeoutOptions,
): Promise<T> {
  const { signal, dispose } = createTimeoutSignal(options.timeoutMs);

  try {
    const result = await operation(signal);

    if (signal.aborted) {
      throw signal.reason instanceof Error
        ? signal.reason
        : new OperationTimeoutError(
            options.timeoutMs,
            options.operation,
          );
    }

    return result;
  } catch (error: unknown) {
    if (signal.aborted) {
      throw signal.reason instanceof Error
        ? signal.reason
        : new OperationTimeoutError(
            options.timeoutMs,
            options.operation,
          );
    }

    throw error;
  } finally {
    dispose();
  }
}

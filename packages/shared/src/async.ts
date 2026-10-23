
/**
 * NOTWEB Async Utilities
 *
 * Helpers for controlling asynchronous work and concurrency.
 */

/**
 * Executes an asynchronous operation after yielding to the event loop.
 */
export function yieldToEventLoop(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

/**
 * Runs asynchronous tasks with a concurrency limit.
 *
 * Results preserve the original input order.
 * If a task rejects, the returned promise rejects.
 *
 * Note: Already-started tasks are not automatically cancelled.
 */
export async function mapConcurrent<T, R>(
  items: readonly T[],
  concurrency: number,
  mapper: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  if (!Number.isSafeInteger(concurrency) || concurrency < 1) {
    throw new RangeError(
      "Concurrency must be a positive safe integer.",
    );
  }

  const results = new Array<R>(items.length);
  let nextIndex = 0;
  let firstError: unknown;
  let hasError = false;

  async function worker(): Promise<void> {
    while (!hasError) {
      const index = nextIndex;

      if (index >= items.length) {
        return;
      }

      nextIndex += 1;

      try {
        results[index] = await mapper(items[index]!, index);
      } catch (error: unknown) {
        if (!hasError) {
          hasError = true;
          firstError = error;
        }

        return;
      }
    }
  }

  const workerCount = Math.min(concurrency, items.length);

  await Promise.all(
    Array.from({ length: workerCount }, () => worker()),
  );

  if (hasError) {
    throw firstError;
  }

  return results;
}

/**
 * Runs multiple operations concurrently and returns their settled results.
 *
 * Unlike Promise.all(), one rejection does not reject the overall result.
 */
export async function allSettled<T>(
  operations: readonly (() => Promise<T>)[],
): Promise<PromiseSettledResult<T>[]> {
  return Promise.allSettled(
    operations.map((operation) => Promise.resolve().then(operation)),
  );
}

/**
 * Creates a promise that resolves after the specified delay.
 */
export function delay(milliseconds: number): Promise<void> {
  if (!Number.isFinite(milliseconds) || milliseconds < 0) {
    return Promise.reject(
      new RangeError(
        "Delay must be a non-negative finite number.",
      ),
    );
  }

  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

/**
 * Executes an operation only once at a time.
 *
 * Concurrent callers share the same in-flight promise.
 * Once the promise settles, a later call starts a new operation.
 */
export function createSingleFlight<T>(
  operation: () => Promise<T>,
): () => Promise<T> {
  let inFlight: Promise<T> | undefined;

  return (): Promise<T> => {
    if (inFlight !== undefined) {
      return inFlight;
    }

    const current = Promise.resolve().then(operation);
    inFlight = current;

    void current.then(
      () => {
        if (inFlight === current) {
          inFlight = undefined;
        }
      },
      () => {
        if (inFlight === current) {
          inFlight = undefined;
        }
      },
    );

    return current;
  };
}

/**
 * Runs an operation repeatedly until it succeeds or the attempt limit is met.
 *
 * The operation receives a one-based attempt number.
 */
export async function retryOperation<T>(
  operation: (attempt: number) => Promise<T>,
  maxAttempts = 3,
): Promise<T> {
  if (
    !Number.isSafeInteger(maxAttempts) ||
    maxAttempts < 1 ||
    maxAttempts > 10
  ) {
    throw new RangeError(
      "maxAttempts must be an integer between 1 and 10.",
    );
  }

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await operation(attempt);
    } catch (error: unknown) {
      lastError = error;
    }
  }

  throw lastError;
}

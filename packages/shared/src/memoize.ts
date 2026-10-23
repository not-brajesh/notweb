

/**
 * NOTWEB Memoization Utilities
 *
 * Caches function results to avoid repeated calculations.
 *
 * Important:
 * - Cache keys are based on the supplied key function.
 * - The default key strategy supports primitive arguments only.
 * - Cached values are returned by reference.
 * - Use clear() when cached results become stale.
 */

export interface MemoizeOptions<TArguments extends unknown[]> {
  /**
   * Maximum number of cached entries.
   * Defaults to 100.
   */
  maxSize?: number;

  /**
   * Custom cache-key generator.
   * Return a stable string for equivalent arguments.
   */
  key?: (...args: TArguments) => string;
}

export interface MemoizedFunction<
  TArguments extends unknown[],
  TResult,
> {
  (...args: TArguments): TResult;

  /** Remove all cached entries. */
  clear(): void;

  /** Remove one entry using a serialized cache key. */
  delete(key: string): boolean;

  /** Current number of cached entries. */
  readonly size: number;
}

const DEFAULT_MAX_SIZE = 100;

function isPrimitive(value: unknown): boolean {
  return (
    value === null ||
    (typeof value !== "object" && typeof value !== "function")
  );
}

function createDefaultKey(args: unknown[]): string {
  if (!args.every(isPrimitive)) {
    throw new TypeError(
      "Memoize requires primitive arguments or a custom key function.",
    );
  }

  return JSON.stringify(
    args.map((value) => {
      if (typeof value === "bigint") {
        return { type: "bigint", value: value.toString() };
      }

      if (typeof value === "undefined") {
        return { type: "undefined" };
      }

      if (typeof value === "number" && Number.isNaN(value)) {
        return { type: "number", value: "NaN" };
      }

      if (Object.is(value, -0)) {
        return { type: "number", value: "-0" };
      }

      if (typeof value === "symbol") {
        return {
          type: "symbol",
          value: Symbol.keyFor(value) ?? value.description ?? "",
        };
      }

      return { type: typeof value, value };
    }),
  );
}

/**
 * Wrap a function with a bounded result cache.
 *
 * Cache eviction uses least-recently-used ordering.
 */
export function memoize<TArguments extends unknown[], TResult>(
  callback: (...args: TArguments) => TResult,
  options: MemoizeOptions<TArguments> = {},
): MemoizedFunction<TArguments, TResult> {
  const maxSize = options.maxSize ?? DEFAULT_MAX_SIZE;

  if (!Number.isSafeInteger(maxSize) || maxSize < 1) {
    throw new RangeError("maxSize must be a positive safe integer.");
  }

  const cache = new Map<string, TResult>();

  const getKey = options.key ?? createDefaultKey;

  const memoized = ((...args: TArguments): TResult => {
    const cacheKey = getKey(...args);

    if (cache.has(cacheKey)) {
      const cachedValue = cache.get(cacheKey) as TResult;

      // Move the entry to the end to mark it recently used.
      cache.delete(cacheKey);
      cache.set(cacheKey, cachedValue);

      return cachedValue;
    }

    const result = callback(...args);

    cache.set(cacheKey, result);

    if (cache.size > maxSize) {
      const oldestKey = cache.keys().next().value as string | undefined;

      if (oldestKey !== undefined) {
        cache.delete(oldestKey);
      }
    }

    return result;
  }) as MemoizedFunction<TArguments, TResult>;

  memoized.clear = (): void => {
    cache.clear();
  };

  memoized.delete = (key: string): boolean => cache.delete(key);

  Object.defineProperty(memoized, "size", {
    enumerable: true,
    configurable: false,
    get: () => cache.size,
  });

  return memoized;
}

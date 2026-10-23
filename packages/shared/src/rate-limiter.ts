
/**
 * NOTWEB Rate Limiter
 *
 * A bounded, in-memory fixed-window rate limiter.
 *
 * Features:
 * - Configurable request limits
 * - Configurable time windows
 * - Per-key tracking
 * - Automatic expiry of old windows when accessed
 * - Explicit cleanup and statistics
 *
 * This is a local utility, not a distributed security boundary.
 */

export interface RateLimiterOptions {
  /** Maximum allowed operations per key per window. */
  limit: number;

  /** Window duration in milliseconds. */
  windowMs: number;

  /** Maximum number of tracked keys. Defaults to 10,000. */
  maxKeys?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterMs: number;
}

export interface RateLimiterStats {
  trackedKeys: number;
  allowedOperations: number;
  rejectedOperations: number;
  expiredWindows: number;
  evictedKeys: number;
}

interface WindowEntry {
  count: number;
  resetAt: number;
}

const DEFAULT_MAX_KEYS = 10_000;

export class RateLimiter {
  private readonly windows = new Map<string, WindowEntry>();
  private readonly limit: number;
  private readonly windowMs: number;
  private readonly maxKeys: number;

  private allowedOperations = 0;
  private rejectedOperations = 0;
  private expiredWindows = 0;
  private evictedKeys = 0;

  constructor(options: RateLimiterOptions) {
    if (!Number.isSafeInteger(options.limit) || options.limit < 1) {
      throw new RangeError("limit must be a positive safe integer.");
    }

    if (!Number.isFinite(options.windowMs) || options.windowMs <= 0) {
      throw new RangeError("windowMs must be a positive finite number.");
    }

    const maxKeys = options.maxKeys ?? DEFAULT_MAX_KEYS;

    if (!Number.isSafeInteger(maxKeys) || maxKeys < 1) {
      throw new RangeError("maxKeys must be a positive safe integer.");
    }

    this.limit = options.limit;
    this.windowMs = options.windowMs;
    this.maxKeys = maxKeys;
  }

  /** Number of currently tracked keys. */
  get size(): number {
    return this.windows.size;
  }

  /**
   * Check and consume one operation for a key.
   *
   * Each call consumes capacity if the operation is allowed.
   */
  consume(key: string): RateLimitResult {
    if (key.trim().length === 0) {
      throw new TypeError("Rate-limit key must not be empty.");
    }

    const now = Date.now();
    let entry = this.windows.get(key);

    if (entry !== undefined && now >= entry.resetAt) {
      this.windows.delete(key);
      this.expiredWindows += 1;
      entry = undefined;
    }

    if (entry === undefined) {
      this.makeRoom();

      entry = {
        count: 0,
        resetAt: now + this.windowMs,
      };

      if (!Number.isFinite(entry.resetAt)) {
        throw new RangeError("Calculated reset timestamp is invalid.");
      }

      this.windows.set(key, entry);
    }

    if (entry.count >= this.limit) {
      this.rejectedOperations += 1;

      return {
        allowed: false,
        limit: this.limit,
        remaining: 0,
        resetAt: entry.resetAt,
        retryAfterMs: Math.max(0, entry.resetAt - now),
      };
    }

    entry.count += 1;
    this.allowedOperations += 1;

    return {
      allowed: true,
      limit: this.limit,
      remaining: Math.max(0, this.limit - entry.count),
      resetAt: entry.resetAt,
      retryAfterMs: 0,
    };
  }

  /** Inspect a key without consuming capacity. */
  inspect(key: string): RateLimitResult {
    const now = Date.now();
    const entry = this.windows.get(key);

    if (entry === undefined || now >= entry.resetAt) {
      return {
        allowed: true,
        limit: this.limit,
        remaining: this.limit,
        resetAt: now + this.windowMs,
        retryAfterMs: 0,
      };
    }

    const remaining = Math.max(0, this.limit - entry.count);

    return {
      allowed: remaining > 0,
      limit: this.limit,
      remaining,
      resetAt: entry.resetAt,
      retryAfterMs:
        remaining > 0 ? 0 : Math.max(0, entry.resetAt - now),
    };
  }

  /** Remove tracking for a specific key. */
  delete(key: string): boolean {
    return this.windows.delete(key);
  }

  /** Remove expired windows and return the number removed. */
  pruneExpired(): number {
    const now = Date.now();
    let removed = 0;

    for (const [key, entry] of this.windows) {
      if (now >= entry.resetAt) {
        this.windows.delete(key);
        removed += 1;
      }
    }

    this.expiredWindows += removed;

    return removed;
  }

  /** Clear all tracked windows and reset statistics. */
  clear(): void {
    this.windows.clear();
    this.allowedOperations = 0;
    this.rejectedOperations = 0;
    this.expiredWindows = 0;
    this.evictedKeys = 0;
  }

  /** Return a snapshot of operational statistics. */
  getStats(): RateLimiterStats {
    return {
      trackedKeys: this.windows.size,
      allowedOperations: this.allowedOperations,
      rejectedOperations: this.rejectedOperations,
      expiredWindows: this.expiredWindows,
      evictedKeys: this.evictedKeys,
    };
  }

  private makeRoom(): void {
    this.pruneExpired();

    if (this.windows.size < this.maxKeys) {
      return;
    }

    // Evict the entry with the earliest reset time to bound memory usage.
    let oldestKey: string | undefined;
    let earliestResetAt = Number.POSITIVE_INFINITY;

    for (const [key, entry] of this.windows) {
      if (entry.resetAt < earliestResetAt) {
        earliestResetAt = entry.resetAt;
        oldestKey = key;
      }
    }

    if (oldestKey !== undefined) {
      this.windows.delete(oldestKey);
      this.evictedKeys += 1;
    }
  }
}

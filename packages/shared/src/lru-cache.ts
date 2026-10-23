
/**
 * NOTWEB LRU Cache
 *
 * A bounded in-memory cache using least-recently-used eviction.
 *
 * Features:
 * - O(1) average lookup, insertion and deletion
 * - Maximum entry limit
 * - Optional time-to-live (TTL)
 * - Cache statistics
 * - Explicit cache invalidation
 *
 * This cache is in-memory only. It is not persistent or shared
 * between processes.
 */

export interface LruCacheOptions {
  /** Maximum number of entries. Defaults to 100. */
  maxSize?: number;

  /** Default entry lifetime in milliseconds. Omit for no expiration. */
  ttlMs?: number;
}

export interface LruCacheStats {
  hits: number;
  misses: number;
  evictions: number;
  expirations: number;
  size: number;
}

interface CacheEntry<V> {
  value: V;
  expiresAt: number | undefined;
}

const DEFAULT_MAX_SIZE = 100;

export class LruCache<K, V> {
  private readonly entries = new Map<K, CacheEntry<V>>();
  private readonly maxSize: number;
  private readonly ttlMs: number | undefined;

  private hits = 0;
  private misses = 0;
  private evictions = 0;
  private expirations = 0;

  constructor(options: LruCacheOptions = {}) {
    const maxSize = options.maxSize ?? DEFAULT_MAX_SIZE;
    const ttlMs = options.ttlMs;

    if (!Number.isSafeInteger(maxSize) || maxSize < 1) {
      throw new RangeError("maxSize must be a positive safe integer.");
    }

    if (
      ttlMs !== undefined &&
      (!Number.isFinite(ttlMs) || ttlMs < 0)
    ) {
      throw new RangeError("ttlMs must be a non-negative finite number.");
    }

    this.maxSize = maxSize;
    this.ttlMs = ttlMs;
  }

  /** Number of entries currently stored, including expired entries not yet accessed. */
  get size(): number {
    return this.entries.size;
  }

  /** Retrieve a value and mark it as recently used. */
  get(key: K): V | undefined {
    const entry = this.entries.get(key);

    if (entry === undefined) {
      this.misses += 1;
      return undefined;
    }

    if (this.isExpired(entry)) {
      this.entries.delete(key);
      this.expirations += 1;
      this.misses += 1;
      return undefined;
    }

    this.entries.delete(key);
    this.entries.set(key, entry);

    this.hits += 1;

    return entry.value;
  }

  /** Check whether a non-expired entry exists without changing LRU order. */
  has(key: K): boolean {
    const entry = this.entries.get(key);

    if (entry === undefined) {
      return false;
    }

    if (this.isExpired(entry)) {
      this.entries.delete(key);
      this.expirations += 1;
      return false;
    }

    return true;
  }

  /** Insert or replace an entry. */
  set(key: K, value: V, ttlMs = this.ttlMs): this {
    if (
      ttlMs !== undefined &&
      (!Number.isFinite(ttlMs) || ttlMs < 0)
    ) {
      throw new RangeError("ttlMs must be a non-negative finite number.");
    }

    const expiresAt =
      ttlMs === undefined ? undefined : Date.now() + ttlMs;

    if (expiresAt !== undefined && !Number.isFinite(expiresAt)) {
      throw new RangeError("Calculated expiration timestamp is invalid.");
    }

    // TTL zero means the entry expires immediately.
    this.entries.delete(key);

    this.entries.set(key, {
      value,
      expiresAt,
    });

    this.evictExpiredEntries();

    while (this.entries.size > this.maxSize) {
      const oldestKey = this.entries.keys().next().value as K | undefined;

      if (oldestKey === undefined) {
        break;
      }

      this.entries.delete(oldestKey);
      this.evictions += 1;
    }

    return this;
  }

  /** Delete an entry by key. */
  delete(key: K): boolean {
    return this.entries.delete(key);
  }

  /** Remove all cached entries and reset statistics. */
  clear(): void {
    this.entries.clear();
    this.resetStats();
  }

  /** Remove expired entries and return the number removed. */
  pruneExpired(): number {
    return this.evictExpiredEntries();
  }

  /** Return a snapshot of cache statistics. */
  getStats(): LruCacheStats {
    return {
      hits: this.hits,
      misses: this.misses,
      evictions: this.evictions,
      expirations: this.expirations,
      size: this.entries.size,
    };
  }

  /** Reset counters without clearing cached entries. */
  resetStats(): void {
    this.hits = 0;
    this.misses = 0;
    this.evictions = 0;
    this.expirations = 0;
  }

  private isExpired(entry: CacheEntry<V>): boolean {
    return (
      entry.expiresAt !== undefined &&
      Date.now() >= entry.expiresAt
    );
  }

  private evictExpiredEntries(): number {
    let removed = 0;

    for (const [key, entry] of this.entries) {
      if (this.isExpired(entry)) {
        this.entries.delete(key);
        this.expirations += 1;
        removed += 1;
      }
    }

    return removed;
  }
}

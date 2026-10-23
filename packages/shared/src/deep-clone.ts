
/**
 * NOTWEB Deep Clone Utilities
 *
 * Creates independent copies of supported data structures.
 *
 * Supported:
 * - Primitives
 * - Arrays
 * - Plain objects
 * - Date
 * - RegExp
 * - Map
 * - Set
 * - ArrayBuffer
 * - Typed arrays
 *
 * For general application data, prefer structuredClone when available.
 * This module intentionally rejects unsupported object types rather than
 * silently producing incomplete copies.
 */

export type DeepCloneable =
  | null
  | undefined
  | string
  | number
  | boolean
  | bigint
  | symbol
  | Date
  | RegExp
  | ArrayBuffer
  | DataView
  | ArrayBufferView
  | DeepCloneable[]
  | { [key: string]: DeepCloneable }
  | Map<DeepCloneable, DeepCloneable>
  | Set<DeepCloneable>;

export interface DeepCloneOptions {
  maxDepth?: number;
}

const DEFAULT_MAX_DEPTH = 100;

function isPlainObject(value: object): boolean {
  const prototype = Object.getPrototypeOf(value);

  return prototype === Object.prototype || prototype === null;
}

function validateMaxDepth(maxDepth: number): void {
  if (!Number.isSafeInteger(maxDepth) || maxDepth < 0) {
    throw new RangeError("maxDepth must be a non-negative safe integer.");
  }
}

function cloneValue<T>(
  value: T,
  seen: WeakMap<object, unknown>,
  depth: number,
  maxDepth: number,
): T {
  if (value === null || typeof value !== "object") {
    return value;
  }

  if (depth > maxDepth) {
    throw new RangeError("Maximum deep-clone depth exceeded.");
  }

  const existing = seen.get(value);

  if (existing !== undefined) {
    return existing as T;
  }

  if (value instanceof Date) {
    return new Date(value.getTime()) as T;
  }

  if (value instanceof RegExp) {
    const cloned = new RegExp(value.source, value.flags);
    cloned.lastIndex = value.lastIndex;

    return cloned as T;
  }

  if (value instanceof ArrayBuffer) {
    const cloned = value.slice(0);

    seen.set(value, cloned);

    return cloned as T;
  }

  if (ArrayBuffer.isView(value)) {
    if (value instanceof DataView) {
      const clonedBuffer = cloneValue(
        value.buffer,
        seen,
        depth + 1,
        maxDepth,
      );

      const cloned = new DataView(
        clonedBuffer,
        value.byteOffset,
        value.byteLength,
      );

      seen.set(value, cloned);

      return cloned as T;
    }

    const typedArray = value as unknown as {
      constructor: new (source: ArrayLike<number>) => ArrayBufferView;
      length: number;
      [index: number]: number;
    };

    const cloned = new typedArray.constructor(
      Array.from({ length: typedArray.length }, (_, index) =>
        typedArray[index]!,
      ),
    );

    seen.set(value, cloned);

    return cloned as T;
  }

  if (value instanceof Map) {
    const cloned = new Map();

    seen.set(value, cloned);

    for (const [key, entryValue] of value.entries()) {
      cloned.set(
        cloneValue(key, seen, depth + 1, maxDepth),
        cloneValue(entryValue, seen, depth + 1, maxDepth),
      );
    }

    return cloned as T;
  }

  if (value instanceof Set) {
    const cloned = new Set();

    seen.set(value, cloned);

    for (const entry of value.values()) {
      cloned.add(cloneValue(entry, seen, depth + 1, maxDepth));
    }

    return cloned as T;
  }

  if (Array.isArray(value)) {
    const cloned: unknown[] = [];

    seen.set(value, cloned);

    for (const entry of value) {
      cloned.push(cloneValue(entry, seen, depth + 1, maxDepth));
    }

    return cloned as T;
  }

  if (!isPlainObject(value)) {
    throw new TypeError(
      "Unsupported object type. Use structuredClone for supported built-in types.",
    );
  }

  const cloned: Record<string, unknown> = Object.create(
    Object.getPrototypeOf(value),
  ) as Record<string, unknown>;

  seen.set(value, cloned);

  for (const key of Reflect.ownKeys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);

    if (descriptor === undefined) {
      continue;
    }

    if ("value" in descriptor) {
      descriptor.value = cloneValue(
        descriptor.value,
        seen,
        depth + 1,
        maxDepth,
      );
    } else {
      throw new TypeError(
        "Objects with accessor properties are not supported.",
      );
    }

    Object.defineProperty(cloned, key, descriptor);
  }

  return cloned as T;
}

/**
 * Create a deep copy of supported data.
 *
 * Circular references are preserved.
 * Functions are returned unchanged because they are not cloneable objects.
 */
export function deepClone<T>(
  value: T,
  options: DeepCloneOptions = {},
): T {
  const maxDepth = options.maxDepth ?? DEFAULT_MAX_DEPTH;

  validateMaxDepth(maxDepth);

  return cloneValue(value, new WeakMap(), 0, maxDepth);
}

/**
 * Attempt to deep-clone a value without throwing.
 */
export function tryDeepClone<T>(
  value: T,
  options: DeepCloneOptions = {},
):
  | { success: true; data: T }
  | { success: false; error: string } {
  try {
    return {
      success: true,
      data: deepClone(value, options),
    };
  } catch (error: unknown) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Unable to clone the provided value.",
    };
  }
}

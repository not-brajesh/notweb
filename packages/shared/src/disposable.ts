
/**
 * NOTWEB Disposable Utilities
 *
 * Provides lifecycle management for resources that require cleanup.
 *
 * Features:
 * - Idempotent disposal
 * - Cleanup callbacks
 * - Cleanup registration
 * - Grouped resource management
 * - Aggregate reporting of cleanup failures
 */

export interface Disposable {
  dispose(): void | Promise<void>;
}

export type CleanupCallback = () => void | Promise<void>;

export interface DisposalResult {
  disposed: boolean;
  errors: unknown[];
}

/**
 * Manage cleanup callbacks for a group of resources.
 *
 * Cleanup callbacks execute in reverse registration order.
 * All callbacks are attempted even if some fail.
 */
export class DisposableStack implements Disposable {
  private callbacks: CleanupCallback[] = [];
  private disposed = false;
  private disposalPromise: Promise<void> | undefined;

  /** Whether this stack has started disposal. */
  get isDisposed(): boolean {
    return this.disposed;
  }

  /** Number of registered callbacks not yet executed. */
  get size(): number {
    return this.callbacks.length;
  }

  /**
   * Register a cleanup callback.
   *
   * If the stack has already been disposed, the callback is rejected.
   */
  defer(callback: CleanupCallback): () => void {
    if (this.disposed) {
      throw new Error("Cannot register cleanup after disposal.");
    }

    this.callbacks.push(callback);

    let active = true;

    return () => {
      if (!active || this.disposed) {
        return;
      }

      active = false;

      const index = this.callbacks.indexOf(callback);

      if (index !== -1) {
        this.callbacks.splice(index, 1);
      }
    };
  }

  /** Register an object that implements dispose(). */
  use<T extends Disposable>(resource: T): T {
    this.defer(() => resource.dispose());
    return resource;
  }

  /**
   * Dispose all resources.
   *
   * Repeated calls share the same in-progress disposal operation.
   */
  async dispose(): Promise<void> {
    if (this.disposalPromise !== undefined) {
      return this.disposalPromise;
    }

    if (this.disposed) {
      return;
    }

    this.disposed = true;

    const callbacks = this.callbacks.splice(0).reverse();

    this.disposalPromise = this.runCleanup(callbacks);

    return this.disposalPromise;
  }

  private async runCleanup(
    callbacks: CleanupCallback[],
  ): Promise<void> {
    const errors: unknown[] = [];

    for (const callback of callbacks) {
      try {
        await callback();
      } catch (error: unknown) {
        errors.push(error);
      }
    }

    if (errors.length > 0) {
      throw new AggregateError(
        errors,
        `${errors.length} cleanup operation(s) failed.`,
      );
    }
  }
}

/**
 * Convert a cleanup callback into an idempotent function.
 *
 * Repeated calls execute the underlying cleanup only once.
 */
export function onceCleanup(
  callback: CleanupCallback,
): CleanupCallback {
  let called = false;
  let result: Promise<void> | undefined;

  return (): Promise<void> => {
    if (called) {
      return result ?? Promise.resolve();
    }

    called = true;

    result = Promise.resolve().then(callback);

    return result;
  };
}

/**
 * Register an event listener and return a cleanup callback.
 */
export function createEventListenerCleanup<
  TEvent extends Event,
>(
  target: EventTarget,
  eventName: string,
  listener: (event: TEvent) => void,
  options?: boolean | AddEventListenerOptions,
): CleanupCallback {
  target.addEventListener(
    eventName,
    listener as EventListener,
    options,
  );

  return () => {
    target.removeEventListener(
      eventName,
      listener as EventListener,
      options,
    );
  };
}

/**
 * Register a timeout and return a callback that clears it.
 */
export function createTimeoutCleanup(
  callback: () => void,
  delayMs: number,
): CleanupCallback {
  if (!Number.isFinite(delayMs) || delayMs < 0) {
    throw new RangeError(
      "delayMs must be a non-negative finite number.",
    );
  }

  const timer = setTimeout(callback, delayMs);

  return () => {
    clearTimeout(timer);
  };
}

/**
 * Combine multiple cleanup callbacks into one.
 *
 * Callbacks execute in reverse order, and every callback is attempted.
 */
export function combineCleanups(
  ...callbacks: CleanupCallback[]
): CleanupCallback {
  const cleanup = onceCleanup(async () => {
    const errors: unknown[] = [];

    for (const callback of [...callbacks].reverse()) {
      try {
        await callback();
      } catch (error: unknown) {
        errors.push(error);
      }
    }

    if (errors.length > 0) {
      throw new AggregateError(
        errors,
        `${errors.length} cleanup operation(s) failed.`,
      );
    }
  });

  return cleanup;
}

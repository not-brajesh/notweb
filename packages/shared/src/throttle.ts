
/**
 * NOTWEB Throttle Utilities
 *
 * Limits how frequently a function can execute.
 *
 * Useful for:
 * - Window resize handlers
 * - Scroll events
 * - Pointer movement
 * - Responsive preview updates
 */

export interface ThrottleOptions {
  /**
   * Execute immediately on the first call.
   * Defaults to true.
   */
  leading?: boolean;

  /**
   * Execute with the latest arguments at the end of an interval.
   * Defaults to true.
   */
  trailing?: boolean;
}

export interface ThrottledFunction<
  TArguments extends unknown[],
  TResult,
> {
  (...args: TArguments): void;

  /** Cancel any pending trailing execution. */
  cancel(): void;

  /** Execute a pending trailing call immediately. */
  flush(): TResult | undefined;

  /** Whether a trailing execution is pending. */
  isPending(): boolean;
}

/**
 * Create a throttled function.
 *
 * Calls during the wait interval are limited to one trailing execution
 * using the most recent arguments.
 */
export function throttle<TArguments extends unknown[], TResult>(
  callback: (...args: TArguments) => TResult,
  waitMs: number,
  options: ThrottleOptions = {},
): ThrottledFunction<TArguments, TResult> {
  if (!Number.isFinite(waitMs) || waitMs < 0) {
    throw new RangeError("waitMs must be a non-negative finite number.");
  }

  const leading = options.leading ?? true;
  const trailing = options.trailing ?? true;

  let timer: ReturnType<typeof setTimeout> | undefined;
  let lastExecutionTime = 0;
  let latestArgs: TArguments | undefined;
  let latestThis: unknown;
  let lastResult: TResult | undefined;
  let hasExecuted = false;

  const invoke = (): TResult | undefined => {
    if (latestArgs === undefined) {
      return lastResult;
    }

    const args = latestArgs;
    const thisValue = latestThis;

    latestArgs = undefined;
    latestThis = undefined;

    lastResult = callback.apply(thisValue, args) as TResult;
    lastExecutionTime = Date.now();
    hasExecuted = true;

    return lastResult;
  };

  const clearTimer = (): void => {
    if (timer !== undefined) {
      clearTimeout(timer);
      timer = undefined;
    }
  };

  const scheduleTrailing = (delayMs: number): void => {
    if (timer !== undefined || !trailing) {
      return;
    }

    timer = setTimeout(() => {
      timer = undefined;

      if (latestArgs !== undefined) {
        invoke();
      }
    }, delayMs);
  };

  const throttled = function (
    this: unknown,
    ...args: TArguments
  ): void {
    const now = Date.now();
    const elapsed = hasExecuted ? now - lastExecutionTime : 0;

    latestArgs = args;
    latestThis = this;

    if (!hasExecuted && !leading) {
      scheduleTrailing(waitMs);
      return;
    }

    if (hasExecuted && elapsed >= waitMs) {
      clearTimer();
      invoke();
      return;
    }

    if (!hasExecuted || elapsed < waitMs) {
      scheduleTrailing(
        hasExecuted ? Math.max(0, waitMs - elapsed) : waitMs,
      );
    }
  } as ThrottledFunction<TArguments, TResult>;

  throttled.cancel = (): void => {
    clearTimer();
    latestArgs = undefined;
    latestThis = undefined;
    hasExecuted = false;
    lastExecutionTime = 0;
  };

  throttled.flush = (): TResult | undefined => {
    if (latestArgs === undefined) {
      return lastResult;
    }

    clearTimer();

    if (!trailing) {
      latestArgs = undefined;
      latestThis = undefined;
      return lastResult;
    }

    return invoke();
  };

  throttled.isPending = (): boolean => latestArgs !== undefined;

  return throttled;
}

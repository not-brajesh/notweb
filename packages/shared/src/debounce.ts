
/**
 * NOTWEB Debounce Utilities
 *
 * Controls frequently triggered function calls.
 *
 * Useful for:
 * - Search inputs
 * - Responsive preview updates
 * - Configuration changes
 * - Expensive UI calculations
 */

export interface DebounceOptions {
  /**
   * Invoke the function on the leading edge of the wait period.
   * Defaults to false.
   */
  leading?: boolean;
}

export interface DebouncedFunction<
  TArguments extends unknown[],
  TResult,
> {
  (...args: TArguments): void;

  /** Cancel a pending invocation. */
  cancel(): void;

  /** Execute a pending invocation immediately. */
  flush(): TResult | undefined;

  /** Whether an invocation is currently pending. */
  isPending(): boolean;
}

/**
 * Delay execution until calls stop occurring for the specified duration.
 *
 * The latest arguments are used when the function executes.
 */
export function debounce<TArguments extends unknown[], TResult>(
  callback: (...args: TArguments) => TResult,
  waitMs: number,
  options: DebounceOptions = {},
): DebouncedFunction<TArguments, TResult> {
  if (!Number.isFinite(waitMs) || waitMs < 0) {
    throw new RangeError("waitMs must be a non-negative finite number.");
  }

  let timer: ReturnType<typeof setTimeout> | undefined;
  let latestArgs: TArguments | undefined;
  let latestThis: unknown;
  let lastResult: TResult | undefined;
  let pending = false;
  let leadingInvoked = false;

  const invoke = (): TResult | undefined => {
    if (latestArgs === undefined) {
      return lastResult;
    }

    const args = latestArgs;
    const thisValue = latestThis;

    latestArgs = undefined;
    latestThis = undefined;

    lastResult = callback.apply(
      thisValue,
      args,
    ) as TResult;

    return lastResult;
  };

  const clearTimer = (): void => {
    if (timer !== undefined) {
      clearTimeout(timer);
      timer = undefined;
    }
  };

  const debounced = function (
    this: unknown,
    ...args: TArguments
  ): void {
    const shouldInvokeLeading =
      options.leading === true && !pending;

    latestArgs = args;
    latestThis = this;
    pending = true;

    clearTimer();

    if (shouldInvokeLeading) {
      leadingInvoked = true;
      invoke();
    }

    timer = setTimeout(() => {
      timer = undefined;
      pending = false;

      if (leadingInvoked) {
        leadingInvoked = false;
        latestArgs = undefined;
        latestThis = undefined;
        return;
      }

      invoke();
    }, waitMs);
  } as DebouncedFunction<TArguments, TResult>;

  debounced.cancel = (): void => {
    clearTimer();
    latestArgs = undefined;
    latestThis = undefined;
    pending = false;
    leadingInvoked = false;
  };

  debounced.flush = (): TResult | undefined => {
    if (!pending) {
      return lastResult;
    }

    clearTimer();
    pending = false;

    if (leadingInvoked) {
      leadingInvoked = false;
      latestArgs = undefined;
      latestThis = undefined;
      return lastResult;
    }

    return invoke();
  };

  debounced.isPending = (): boolean => pending;

  return debounced;
}

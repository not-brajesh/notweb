
/**
 * NOTWEB Observable State
 *
 * A small observable container for reactive state.
 *
 * Features:
 * - Typed state
 * - Subscribe and unsubscribe
 * - State updates
 * - Functional updates
 * - Optional equality comparison
 * - Safe listener notification
 */

export type StateListener<T> = (
  value: T,
  previousValue: T,
) => void;

export interface ObservableOptions<T> {
  /**
   * Compare the new and current state.
   * Defaults to Object.is.
   */
  equals?: (current: T, next: T) => boolean;
}

export interface ObservableUpdateResult {
  changed: boolean;
  listenerErrors: unknown[];
}

export class Observable<T> {
  private value: T;
  private readonly listeners = new Set<StateListener<T>>();
  private readonly equals: (current: T, next: T) => boolean;

  constructor(
    initialValue: T,
    options: ObservableOptions<T> = {},
  ) {
    this.value = initialValue;
    this.equals = options.equals ?? Object.is;
  }

  /** Read the current state. */
  get(): T {
    return this.value;
  }

  /**
   * Replace the state and notify listeners when it changes.
   *
   * Listener failures are collected so one listener cannot prevent
   * the remaining listeners from receiving the update.
   */
  set(nextValue: T): ObservableUpdateResult {
    if (this.equals(this.value, nextValue)) {
      return {
        changed: false,
        listenerErrors: [],
      };
    }

    const previousValue = this.value;
    this.value = nextValue;

    const listenerErrors: unknown[] = [];

    for (const listener of [...this.listeners]) {
      // A listener removed during notification should not run later
      // in the same notification cycle.
      if (!this.listeners.has(listener)) {
        continue;
      }

      try {
        listener(nextValue, previousValue);
      } catch (error: unknown) {
        listenerErrors.push(error);
      }
    }

    return {
      changed: true,
      listenerErrors,
    };
  }

  /** Update state using its current value. */
  update(updater: (currentValue: T) => T): ObservableUpdateResult {
    return this.set(updater(this.value));
  }

  /**
   * Subscribe to state changes.
   * Returns a function that removes the subscription.
   */
  subscribe(listener: StateListener<T>): () => void {
    this.listeners.add(listener);

    let subscribed = true;

    return () => {
      if (!subscribed) {
        return;
      }

      subscribed = false;
      this.listeners.delete(listener);
    };
  }

  /** Number of active subscriptions. */
  get subscriberCount(): number {
    return this.listeners.size;
  }

  /** Remove all subscriptions. */
  clearSubscribers(): void {
    this.listeners.clear();
  }
}

/**
 * Create an observable state container.
 */
export function createObservable<T>(
  initialValue: T,
  options: ObservableOptions<T> = {},
): Observable<T> {
  return new Observable(initialValue, options);
}

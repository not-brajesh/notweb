
/**
 * NOTWEB Event Emitter
 *
 * A lightweight, strongly typed event system.
 *
 * Features:
 * - Type-safe event names and payloads
 * - Multiple listeners per event
 * - One-time listeners
 * - Listener removal
 * - Safe listener iteration during emission
 * - Listener count inspection
 *
 * This implementation is synchronous.
 * Listener exceptions are collected so that one failing listener
 * does not prevent other listeners from running.
 */

export type EventMap = Record<string, unknown>;

export type EventListener<TPayload> = (
  payload: TPayload,
) => void;

export interface EventEmitterOptions {
  /** Maximum listeners allowed per event. Defaults to 100. */
  maxListeners?: number;
}

export interface EmitResult {
  /** Number of listeners invoked. */
  listenersInvoked: number;

  /** Exceptions thrown by listeners. */
  errors: unknown[];
}

interface ListenerEntry<TPayload> {
  listener: EventListener<TPayload>;
  once: boolean;
  active: boolean;
}

export class EventEmitter<
  TEvents extends { [K in keyof TEvents]: unknown },
> {
  private readonly listeners = new Map<
    keyof TEvents,
    Set<ListenerEntry<unknown>>
  >();

  private readonly maxListeners: number;

  constructor(options: EventEmitterOptions = {}) {
    const maxListeners = options.maxListeners ?? 100;

    if (
      !Number.isSafeInteger(maxListeners) ||
      maxListeners < 1
    ) {
      throw new RangeError(
        "maxListeners must be a positive safe integer.",
      );
    }

    this.maxListeners = maxListeners;
  }

  /**
   * Register a listener.
   * Returns an unsubscribe function.
   */
  on<K extends keyof TEvents>(
    event: K,
    listener: EventListener<TEvents[K]>,
  ): () => void {
    const entry: ListenerEntry<TEvents[K]> = {
      listener,
      once: false,
      active: true,
    };

    const entries = this.getEntries(event);

    if (entries.size >= this.maxListeners) {
      throw new RangeError(
        `Maximum listeners exceeded for event "${String(event)}".`,
      );
    }

    entries.add(entry as ListenerEntry<unknown>);

    return () => {
      this.removeEntry(event, entry);
    };
  }

  /**
   * Register a listener that runs at most once.
   */
  once<K extends keyof TEvents>(
    event: K,
    listener: EventListener<TEvents[K]>,
  ): () => void {
    const entry: ListenerEntry<TEvents[K]> = {
      listener,
      once: true,
      active: true,
    };

    const entries = this.getEntries(event);

    if (entries.size >= this.maxListeners) {
      throw new RangeError(
        `Maximum listeners exceeded for event "${String(event)}".`,
      );
    }

    entries.add(entry as ListenerEntry<unknown>);

    return () => {
      this.removeEntry(event, entry);
    };
  }

  /**
   * Remove listeners matching the provided function.
   */
  off<K extends keyof TEvents>(
    event: K,
    listener: EventListener<TEvents[K]>,
  ): boolean {
    const entries = this.listeners.get(event);

    if (entries === undefined) {
      return false;
    }

    let removed = false;

    for (const entry of entries) {
      if (entry.listener === listener) {
        entry.active = false;
        entries.delete(entry);
        removed = true;
      }
    }

    if (entries.size === 0) {
      this.listeners.delete(event);
    }

    return removed;
  }

  /**
   * Emit an event synchronously.
   *
   * A snapshot is used so listeners can safely subscribe or unsubscribe
   * while the event is being emitted.
   */
  emit<K extends keyof TEvents>(
    event: K,
    payload: TEvents[K],
  ): EmitResult {
    const entries = this.listeners.get(event);

    if (entries === undefined || entries.size === 0) {
      return {
        listenersInvoked: 0,
        errors: [],
      };
    }

    const snapshot = Array.from(entries);
    const errors: unknown[] = [];
    let listenersInvoked = 0;

    for (const rawEntry of snapshot) {
      const entry = rawEntry as ListenerEntry<TEvents[K]>;

      if (!entry.active) {
        continue;
      }

      // Remove once-listeners before invoking them, preventing
      // reentrant emissions from invoking the same listener twice.
      if (entry.once) {
        this.removeEntry(event, entry);
      }

      listenersInvoked += 1;

      try {
        entry.listener(payload);
      } catch (error: unknown) {
        errors.push(error);
      }
    }

    return {
      listenersInvoked,
      errors,
    };
  }

  /** Remove every listener for one event. */
  removeAllListeners<K extends keyof TEvents>(
    event?: K,
  ): void {
    if (event !== undefined) {
      const entries = this.listeners.get(event);

      if (entries !== undefined) {
        for (const entry of entries) {
          entry.active = false;
        }

        this.listeners.delete(event);
      }

      return;
    }

    for (const entries of this.listeners.values()) {
      for (const entry of entries) {
        entry.active = false;
      }
    }

    this.listeners.clear();
  }

  /** Return the listener count for one event. */
  listenerCount<K extends keyof TEvents>(
    event: K,
  ): number {
    return this.listeners.get(event)?.size ?? 0;
  }

  /** Return registered event names. */
  eventNames(): Array<keyof TEvents> {
    return Array.from(this.listeners.keys());
  }

  private getEntries<K extends keyof TEvents>(
    event: K,
  ): Set<ListenerEntry<unknown>> {
    let entries = this.listeners.get(event);

    if (entries === undefined) {
      entries = new Set<ListenerEntry<unknown>>();
      this.listeners.set(event, entries);
    }

    return entries;
  }

  private removeEntry<TPayload>(
    event: keyof TEvents,
    entry: ListenerEntry<TPayload>,
  ): void {
    entry.active = false;

    const entries = this.listeners.get(event);

    if (entries === undefined) {
      return;
    }

    entries.delete(entry as ListenerEntry<unknown>);

    if (entries.size === 0) {
      this.listeners.delete(event);
    }
  }
}

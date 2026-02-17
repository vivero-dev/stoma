/**
 * Circuit breaker policy - protect upstream services from cascading failures.
 *
 * Implements the three-state circuit breaker pattern (closed / open / half-open)
 * with pluggable state storage via {@link CircuitBreakerStore}.
 *
 * @module circuit-breaker
 */
import type { Context } from "hono";
import { GatewayError } from "../../core/errors";
import type { DebugLogger } from "../../utils/debug";
import {
  Priority,
  policyDebug,
  resolveConfig,
  safeCall,
  setDebugHeader,
  withSkip,
} from "../sdk";
import type { Policy, PolicyConfig } from "../types";

// --- Store interface ---

/** The three states of the circuit breaker state machine. */
export type CircuitState = "closed" | "open" | "half-open";

/** Point-in-time snapshot of a circuit's state and counters. */
export interface CircuitBreakerSnapshot {
  /** Current circuit state. */
  state: CircuitState;
  /** Number of consecutive failures since last reset. */
  failureCount: number;
  /** Number of successful probes in half-open state. */
  successCount: number;
  /** Epoch ms of the most recent failure. `0` if no failures recorded. */
  lastFailureTime: number;
  /** Epoch ms of the most recent state transition. */
  lastStateChange: number;
}

/**
 * Pluggable storage backend for circuit breaker state.
 *
 * Implement this interface to store circuit state in Durable Objects,
 * KV, or any shared datastore for multi-instance deployments.
 */
export interface CircuitBreakerStore {
  /** Read the current snapshot for a circuit key. */
  getState(key: string): Promise<CircuitBreakerSnapshot>;
  /** Record a successful request and return the updated snapshot. */
  recordSuccess(key: string): Promise<CircuitBreakerSnapshot>;
  /** Record a failed request and return the updated snapshot. */
  recordFailure(key: string): Promise<CircuitBreakerSnapshot>;
  /** Transition the circuit to a new state and return the updated snapshot. */
  transition(key: string, to: CircuitState): Promise<CircuitBreakerSnapshot>;
  /** Fully reset a circuit, removing all state. */
  reset(key: string): Promise<void>;
  /** Optional cleanup - release timers, close connections, etc. */
  destroy?(): void;
}

// --- In-memory default ---

function defaultSnapshot(): CircuitBreakerSnapshot {
  return {
    state: "closed",
    failureCount: 0,
    successCount: 0,
    lastFailureTime: 0,
    lastStateChange: Date.now(),
  };
}

export class InMemoryCircuitBreakerStore implements CircuitBreakerStore {
  private circuits = new Map<string, CircuitBreakerSnapshot>();

  private getOrCreate(key: string): CircuitBreakerSnapshot {
    let snap = this.circuits.get(key);
    if (!snap) {
      snap = defaultSnapshot();
      this.circuits.set(key, snap);
    }
    return snap;
  }

  async getState(key: string): Promise<CircuitBreakerSnapshot> {
    return { ...this.getOrCreate(key) };
  }

  async recordSuccess(key: string): Promise<CircuitBreakerSnapshot> {
    const snap = this.getOrCreate(key);
    snap.successCount++;
    return { ...snap };
  }

  async recordFailure(key: string): Promise<CircuitBreakerSnapshot> {
    const snap = this.getOrCreate(key);
    snap.failureCount++;
    snap.lastFailureTime = Date.now();
    return { ...snap };
  }

  async transition(
    key: string,
    to: CircuitState
  ): Promise<CircuitBreakerSnapshot> {
    const snap = this.getOrCreate(key);
    snap.state = to;
    snap.lastStateChange = Date.now();
    if (to === "closed") {
      snap.failureCount = 0;
      snap.successCount = 0;
    }
    if (to === "half-open") {
      snap.successCount = 0;
    }
    return { ...snap };
  }

  async reset(key: string): Promise<void> {
    this.circuits.delete(key);
  }

  /** Remove all circuits (for testing) */
  clear(): void {
    this.circuits.clear();
  }

  /** Release all state. */
  destroy(): void {
    this.circuits.clear();
  }
}

// --- Policy ---

export interface CircuitBreakerConfig extends PolicyConfig {
  /** Number of failures before opening the circuit. Default: 5. */
  failureThreshold?: number;
  /** Time in ms before transitioning from open → half-open. Default: 30000. */
  resetTimeoutMs?: number;
  /** Max concurrent probes allowed in half-open state. Default: 1. */
  halfOpenMax?: number;
  /** Status codes considered failures. Default: [500, 502, 503, 504]. */
  failureOn?: number[];
  /** Storage backend. Default: InMemoryCircuitBreakerStore. */
  store?: CircuitBreakerStore;
  /** Key extractor. Default: request URL pathname. */
  key?: (c: Context) => string;
  /** HTTP status code when the circuit is open. Default: 503. */
  openStatusCode?: number;
  /**
   * Callback invoked on every state transition.
   *
   * Called via `safeCall` so errors are swallowed - a failing callback
   * never blocks traffic. Useful for metrics, logging, or alerting.
   *
   * @param key - The circuit key that transitioned.
   * @param from - The previous circuit state.
   * @param to - The new circuit state.
   */
  onStateChange?: (
    key: string,
    from: CircuitState,
    to: CircuitState
  ) => void | Promise<void>;
}

/**
 * Transition the circuit and invoke the onStateChange callback (if configured).
 *
 * Both the store transition and the callback are wrapped in safeCall so
 * failures are swallowed - a broken store or callback never blocks traffic.
 */
async function transitionAndNotify(
  resolvedStore: CircuitBreakerStore,
  key: string,
  from: CircuitState,
  to: CircuitState,
  onStateChange: CircuitBreakerConfig["onStateChange"],
  debug: DebugLogger
): Promise<void> {
  await safeCall(
    () => resolvedStore.transition(key, to),
    undefined,
    debug,
    "store.transition()"
  );
  if (onStateChange) {
    await safeCall(
      () => Promise.resolve(onStateChange(key, from, to)),
      undefined,
      debug,
      "onStateChange()"
    );
  }
}

/**
 * Protect upstream services by breaking the circuit on repeated failures.
 *
 * Implements the three-state circuit breaker pattern:
 * - **Closed** - requests flow normally; failures are counted.
 * - **Open** - requests are immediately rejected with 503; a `Retry-After` header is set.
 * - **Half-open** - a limited number of probe requests are allowed through to test recovery.
 *
 * State transitions: `closed → open` when failures reach the threshold,
 * `open → half-open` after the reset timeout, `half-open → closed` on
 * probe success or `half-open → open` on probe failure.
 *
 * @param config - Failure threshold, reset timeout, and storage backend.
 * @returns A {@link Policy} at priority 30.
 *
 * @example
 * ```ts
 * // Open after 5 failures, retry after 30s
 * circuitBreaker();
 *
 * // Tighter threshold with custom store
 * circuitBreaker({
 *   failureThreshold: 3,
 *   resetTimeoutMs: 10_000,
 *   failureOn: [500, 502, 503],
 *   store: new InMemoryCircuitBreakerStore(),
 * });
 *
 * // With state change notifications
 * circuitBreaker({
 *   failureThreshold: 5,
 *   onStateChange: (key, from, to) => {
 *     console.log(`Circuit ${key}: ${from} -> ${to}`);
 *   },
 * });
 * ```
 */
export function circuitBreaker(config?: CircuitBreakerConfig): Policy {
  const resolved = resolveConfig<CircuitBreakerConfig>(
    {
      failureThreshold: 5,
      resetTimeoutMs: 30_000,
      halfOpenMax: 1,
      failureOn: [500, 502, 503, 504],
      openStatusCode: 503,
    },
    config
  );

  let store = config?.store;
  if (!store) {
    store = new InMemoryCircuitBreakerStore();
  }
  const resolvedStore = store;
  const onStateChange = config?.onStateChange;

  // Track half-open probes in flight (per key)
  const halfOpenProbes = new Map<string, number>();

  const handler: import("hono").MiddlewareHandler = async (c, next) => {
    const debug = policyDebug(c, "circuit-breaker");
    const key = config?.key ? config.key(c) : new URL(c.req.url).pathname;

    // Resilient to store failures - fail-open (assume closed) if the
    // store is unreachable, so a broken store never blocks traffic.
    const snap = await safeCall(
      () => resolvedStore.getState(key),
      defaultSnapshot(),
      debug,
      "store.getState()"
    );
    const now = Date.now();
    setDebugHeader(c, "x-stoma-circuit-key", key);
    setDebugHeader(c, "x-stoma-circuit-state", snap.state);
    setDebugHeader(c, "x-stoma-circuit-failures", snap.failureCount);

    // --- OPEN ---
    if (snap.state === "open") {
      if (now - snap.lastStateChange >= resolved.resetTimeoutMs!) {
        // Transition to half-open
        debug(`open -> half-open (key=${key})`);
        await transitionAndNotify(
          resolvedStore,
          key,
          "open",
          "half-open",
          onStateChange,
          debug
        );
        halfOpenProbes.set(key, 0);
      } else {
        const retryAfter = Math.ceil(
          (resolved.resetTimeoutMs! - (now - snap.lastStateChange)) / 1000
        );
        throw new GatewayError(
          resolved.openStatusCode!,
          "circuit_open",
          "Service temporarily unavailable",
          { "retry-after": String(retryAfter) }
        );
      }
    }

    // --- HALF-OPEN: limit concurrent probes ---
    if (
      snap.state === "half-open" ||
      (snap.state === "open" &&
        now - snap.lastStateChange >= resolved.resetTimeoutMs!)
    ) {
      const inFlight = halfOpenProbes.get(key) ?? 0;
      if (inFlight >= resolved.halfOpenMax!) {
        throw new GatewayError(
          resolved.openStatusCode!,
          "circuit_open",
          "Service temporarily unavailable",
          { "retry-after": String(Math.ceil(resolved.resetTimeoutMs! / 1000)) }
        );
      }
      halfOpenProbes.set(key, inFlight + 1);

      try {
        await next();

        const isFailure = resolved.failureOn!.includes(c.res.status);
        if (isFailure) {
          debug(
            `half-open probe failed (key=${key}, status=${c.res.status}) -> open`
          );
          await safeCall(
            () => resolvedStore.recordFailure(key),
            undefined,
            debug,
            "store.recordFailure()"
          );
          await transitionAndNotify(
            resolvedStore,
            key,
            "half-open",
            "open",
            onStateChange,
            debug
          );
        } else {
          debug(`half-open probe succeeded (key=${key}) -> closed`);
          await safeCall(
            () => resolvedStore.recordSuccess(key),
            undefined,
            debug,
            "store.recordSuccess()"
          );
          await transitionAndNotify(
            resolvedStore,
            key,
            "half-open",
            "closed",
            onStateChange,
            debug
          );
          halfOpenProbes.delete(key);
        }
      } catch (err) {
        debug(`half-open probe threw (key=${key}) -> open`);
        await safeCall(
          () => resolvedStore.recordFailure(key),
          undefined,
          debug,
          "store.recordFailure()"
        );
        await transitionAndNotify(
          resolvedStore,
          key,
          "half-open",
          "open",
          onStateChange,
          debug
        );
        throw err;
      } finally {
        const current = halfOpenProbes.get(key) ?? 1;
        if (current <= 1) {
          halfOpenProbes.delete(key);
        } else {
          halfOpenProbes.set(key, current - 1);
        }
      }
      return;
    }

    // --- CLOSED ---
    try {
      await next();
    } catch (err) {
      // If recordFailure fails, skip the threshold check entirely -
      // we have no snapshot to compare against.
      const updated = await safeCall(
        () => resolvedStore.recordFailure(key),
        null,
        debug,
        "store.recordFailure()"
      );
      if (updated && updated.failureCount >= resolved.failureThreshold!) {
        debug(
          `closed -> open (key=${key}, failures=${updated.failureCount}/${resolved.failureThreshold})`
        );
        await transitionAndNotify(
          resolvedStore,
          key,
          "closed",
          "open",
          onStateChange,
          debug
        );
      }
      throw err;
    }

    if (resolved.failureOn!.includes(c.res.status)) {
      const updated = await safeCall(
        () => resolvedStore.recordFailure(key),
        null,
        debug,
        "store.recordFailure()"
      );
      if (updated && updated.failureCount >= resolved.failureThreshold!) {
        debug(
          `closed -> open (key=${key}, failures=${updated.failureCount}/${resolved.failureThreshold})`
        );
        await transitionAndNotify(
          resolvedStore,
          key,
          "closed",
          "open",
          onStateChange,
          debug
        );
      }
    } else {
      await safeCall(
        () => resolvedStore.recordSuccess(key),
        undefined,
        debug,
        "store.recordSuccess()"
      );
    }
  };

  return {
    name: "circuit-breaker",
    priority: Priority.CIRCUIT_BREAKER,
    handler: withSkip(config?.skip, handler),
    httpOnly: true,
  };
}

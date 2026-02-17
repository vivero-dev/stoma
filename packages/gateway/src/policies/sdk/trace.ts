/**
 * Policy trace - structured per-policy trace entries for deep debugging.
 *
 * Provides a zero-overhead reporter API (`TraceReporter`) that policies
 * call to record what they did. When tracing is not active, the reporter
 * is a no-op constant - no allocations, no Map lookups.
 *
 * @module trace
 */
import type { Context } from "hono";

// ---------------------------------------------------------------------------
// Context key constants
// ---------------------------------------------------------------------------

/** Set by `parseDebugRequest()` when the client requests tracing. */
export const TRACE_REQUESTED_KEY = "_stomaTraceRequested";

/** Array of `PolicyTraceBaseline` entries pushed by `policiesToMiddleware()`. */
export const TRACE_ENTRIES_KEY = "_stomaTraceEntries";

/** Map of policy name → `PolicyTraceDetail` set by `policyTrace()`. */
export const TRACE_DETAILS_KEY = "_stomaTraceDetails";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Auto-captured by the pipeline for every policy when tracing is active. */
export interface PolicyTraceBaseline {
  name: string;
  priority: number;
  durationMs: number;
  calledNext: boolean;
  error: string | null;
}

/** Policy-reported detail (cooperative opt-in via `trace()`). */
export interface PolicyTraceDetail {
  action: string;
  data?: Record<string, unknown>;
}

/** Combined baseline + optional detail for a single policy. */
export interface PolicyTraceEntry extends PolicyTraceBaseline {
  detail?: PolicyTraceDetail;
}

/** Full trace payload emitted as the `x-stoma-trace` response header. */
export interface PolicyTrace {
  requestId: string;
  traceId: string;
  route: string;
  totalMs: number;
  entries: PolicyTraceEntry[];
}

// ---------------------------------------------------------------------------
// Reporter API
// ---------------------------------------------------------------------------

/**
 * A trace reporter function. Always callable - no-op when tracing is inactive.
 *
 * @param action - Human-readable action string (e.g. `"HIT"`, `"allowed"`).
 * @param data   - Optional structured context data.
 */
export type TraceReporter = (
  action: string,
  data?: Record<string, unknown>
) => void;

/** Shared no-op reporter instance - zero overhead when tracing is off. */
export const noopTraceReporter: TraceReporter = () => {};

/**
 * Get a trace reporter for a specific policy.
 *
 * When tracing is active (`_stomaTraceRequested` is truthy), returns a
 * function that stores the detail on the context. When inactive, returns
 * {@link noopTraceReporter} - a no-op with zero overhead.
 *
 * @param c          - Hono request context.
 * @param policyName - Policy name used as the Map key.
 * @returns A {@link TraceReporter} - always callable.
 */
export function policyTrace(c: Context, policyName: string): TraceReporter {
  if (!c.get(TRACE_REQUESTED_KEY)) return noopTraceReporter;

  return (action: string, data?: Record<string, unknown>) => {
    const details = (c.get(TRACE_DETAILS_KEY) ??
      new Map<string, PolicyTraceDetail>()) as Map<string, PolicyTraceDetail>;
    details.set(policyName, { action, data });
    c.set(TRACE_DETAILS_KEY, details);
  };
}

/**
 * Fast-path check: is tracing requested for this request?
 *
 * @param c - Hono request context.
 * @returns `true` when the client requested tracing via `x-stoma-debug: trace`.
 */
export function isTraceRequested(c: Context): boolean {
  return c.get(TRACE_REQUESTED_KEY) === true;
}

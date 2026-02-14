/**
 * W3C Trace Context propagation utilities.
 *
 * Parses and generates `traceparent` headers per the W3C Trace Context spec
 * (https://www.w3.org/TR/trace-context/). Used by the pipeline context
 * injector to propagate distributed tracing through the gateway.
 *
 * @module trace-context
 */

/** Parsed W3C traceparent header fields. */
export interface TraceContext {
  /** Version - always "00" for the current spec. */
  version: string;
  /** 32-character lowercase hex trace ID. */
  traceId: string;
  /** 16-character lowercase hex span/parent ID. */
  parentId: string;
  /** Trace flags as 2-character hex. "01" = sampled. */
  flags: string;
}

const TRACEPARENT_REGEX =
  /^([0-9a-f]{2})-([0-9a-f]{32})-([0-9a-f]{16})-([0-9a-f]{2})$/;

/**
 * Parse a `traceparent` header value into its components.
 *
 * Returns `null` for missing, malformed, or invalid-version headers.
 * Only version "00" is supported.
 *
 * @param header - The raw traceparent header value.
 * @returns Parsed trace context, or `null` if invalid.
 */
export function parseTraceparent(header: string | null): TraceContext | null {
  if (!header) return null;

  const match = header.trim().match(TRACEPARENT_REGEX);
  if (!match) return null;

  const [, version, traceId, parentId, flags] = match;

  // Reject version "ff" (reserved) and all-zero trace/parent IDs
  if (version === "ff") return null;
  if (traceId === "00000000000000000000000000000000") return null;
  if (parentId === "0000000000000000") return null;

  return { version, traceId, parentId, flags };
}

/**
 * Generate a new trace context with random trace and span IDs.
 *
 * @returns A new TraceContext with version "00", sampled flag "01".
 */
export function generateTraceContext(): TraceContext {
  return {
    version: "00",
    traceId: generateHexId(16),
    parentId: generateSpanId(),
    flags: "01",
  };
}

/**
 * Format a TraceContext back into a `traceparent` header value.
 *
 * @param ctx - The trace context to format.
 * @returns A W3C traceparent header string.
 */
export function formatTraceparent(ctx: TraceContext): string {
  return `${ctx.version}-${ctx.traceId}-${ctx.parentId}-${ctx.flags}`;
}

/**
 * Generate a random 16-character lowercase hex span ID.
 *
 * @returns A 16-char hex string suitable for use as a span/parent ID.
 */
export function generateSpanId(): string {
  return generateHexId(8);
}

/**
 * Generate a random lowercase hex string of the given byte length.
 * Uses `crypto.getRandomValues` (available in Workers runtime).
 */
function generateHexId(byteLength: number): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

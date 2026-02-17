/**
 * HTTP header utilities for Stoma policies.
 *
 * Consolidates common header manipulation patterns to avoid duplication
 * across policies (auth, proxy, transform, etc.).
 *
 * @module utils/headers
 */
import type { Context } from "hono";

/**
 * Sanitize a header value to prevent header injection attacks.
 *
 * Strips control characters (CR, LF, NUL) that could allow attackers
 * to inject or manipulate HTTP headers.
 *
 * @param value - The header value to sanitize
 * @returns The sanitized value
 */
export function sanitizeHeaderValue(value: string): string {
  return value.replace(/[\r\n\0]/g, "");
}

/**
 * Escape a string for safe inclusion in an HTTP header value.
 *
 * Adds backslash escaping for double quotes to prevent header injection.
 *
 * @param value - The value to escape
 * @returns The escaped value
 */
export function escapeHeaderValue(value: string): string {
  return value.replace(/"/g, '\\"');
}

/**
 * Create a mutable clone of the request headers from a Hono context.
 *
 * The Workers runtime has immutable Request.headers. This function creates
 * a mutable Headers object that can be modified and then applied back
 * to the request.
 *
 * @param c - The Hono context
 * @returns A new mutable Headers object cloned from the request
 */
export function cloneRequestHeaders(c: Context): Headers {
  return new Headers(c.req.raw.headers);
}

/**
 * Apply modified headers back to the request in a Hono context.
 *
 * @param c - The Hono context
 * @param headers - The modified headers to apply
 */
export function applyRequestHeaders(c: Context, headers: Headers): void {
  c.req.raw = new Request(c.req.raw, { headers });
}

/**
 * Modify request headers with a callback function.
 *
 * This is a convenience wrapper that combines cloneRequestHeaders and
 * applyRequestHeaders into a single operation.
 *
 * @example
 * ```ts
 * withModifiedHeaders(c, (headers) => {
 *   headers.set("X-Custom", "value");
 *   headers.delete("X-Removed");
 * });
 * ```
 *
 * @param c - The Hono context
 * @param mutator - Function to modify the headers
 */
export function withModifiedHeaders(
  c: Context,
  mutator: (headers: Headers) => void
): void {
  const headers = cloneRequestHeaders(c);
  mutator(headers);
  applyRequestHeaders(c, headers);
}

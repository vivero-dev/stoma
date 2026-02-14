/**
 * Retry policy - automatic retry with configurable backoff for failed upstream calls.
 *
 * Retries work by inspecting the response status after `next()` completes.
 * When a retryable status code is detected and a `_proxyRequest` exists on
 * the Hono context (set by the URL upstream handler in `gateway.ts`), the
 * policy clones the stored request and re-issues it via `fetch()` directly -
 * no `globalThis.fetch` patching, fully concurrency-safe.
 *
 * For handler-based or service-binding upstreams there is no `_proxyRequest`,
 * so the retry policy is effectively a no-op - which is the correct behavior
 * since those upstream types would require calling `next()` multiple times
 * (disallowed by Hono's compose model).
 *
 * @module retry
 */

import { Priority, policyDebug, resolveConfig, withSkip } from "../sdk";
import type { Policy, PolicyConfig } from "../types";

export interface RetryConfig extends PolicyConfig {
  /** Maximum number of retries. Default: 3. */
  maxRetries?: number;
  /** Status codes that trigger a retry. Default: [502, 503, 504]. */
  retryOn?: number[];
  /** Backoff strategy. Default: "exponential". */
  backoff?: "fixed" | "exponential";
  /** Base delay in ms for backoff. Default: 200. */
  baseDelayMs?: number;
  /** Maximum delay in ms. Default: 5000. */
  maxDelayMs?: number;
  /** HTTP methods eligible for retry. Default: idempotent methods. */
  retryMethods?: string[];
  /** Response header name for the retry count. Default: `"x-retry-count"`. */
  retryCountHeader?: string;
}

const DEFAULT_RETRY_METHODS = ["GET", "HEAD", "OPTIONS", "PUT", "DELETE"];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function computeDelay(
  attempt: number,
  strategy: "fixed" | "exponential",
  baseMs: number,
  maxMs: number
): number {
  const jitter = Math.random() * baseMs;
  return strategy === "fixed"
    ? baseMs + jitter
    : Math.min(baseMs * 2 ** attempt + jitter, maxMs);
}

/**
 * Retry failed upstream calls with configurable backoff.
 *
 * After `next()` completes, checks the response status against `retryOn`
 * codes. If a retry is warranted and a `_proxyRequest` is available on the
 * context (set by `createUrlUpstream()` in `gateway.ts`), the policy clones
 * the stored request and calls `fetch()` directly - fully concurrency-safe
 * with no `globalThis.fetch` patching.
 *
 * For handler-based or service-binding upstreams (no `_proxyRequest`), the
 * retry policy is a no-op since there is no stored request to re-issue.
 * Sets `X-Retry-Count` on the response when retries occur.
 *
 * @param config - Retry limits, backoff strategy, and retryable status codes.
 * @returns A {@link Policy} at priority 90 (runs late, wraps the upstream fetch).
 *
 * @example
 * ```ts
 * // Retry 502/503/504 up to 3 times with exponential backoff
 * retry();
 *
 * // Fixed 500ms delay, retry on 500 too
 * retry({
 *   maxRetries: 2,
 *   retryOn: [500, 502, 503, 504],
 *   backoff: "fixed",
 *   baseDelayMs: 500,
 * });
 * ```
 */
export function retry(config?: RetryConfig): Policy {
  const resolved = resolveConfig<RetryConfig>(
    {
      maxRetries: 3,
      retryOn: [502, 503, 504],
      backoff: "exponential" as const,
      baseDelayMs: 200,
      maxDelayMs: 5_000,
      retryMethods: DEFAULT_RETRY_METHODS,
      retryCountHeader: "x-retry-count",
    },
    config
  );

  const handler: import("hono").MiddlewareHandler = async (c, next) => {
    const debug = policyDebug(c, "retry");
    const method = c.req.method.toUpperCase();

    // Non-retryable methods pass through without retry logic
    if (!resolved.retryMethods!.includes(method)) {
      await next();
      return;
    }

    // Execute the downstream pipeline (policies + upstream)
    await next();

    // Retrieve the stored proxy request (set by createUrlUpstream in gateway.ts).
    // For handler/service-binding upstreams this is undefined - retry is a no-op.
    const proxyRequest = c.get("_proxyRequest") as Request | undefined;
    if (!proxyRequest) {
      return;
    }

    // Retry loop: check response status and re-issue if retryable
    let retryCount = 0;

    for (let attempt = 0; attempt < resolved.maxRetries!; attempt++) {
      if (!resolved.retryOn!.includes(c.res.status)) {
        break;
      }

      const delay = computeDelay(
        attempt,
        resolved.backoff!,
        resolved.baseDelayMs!,
        resolved.maxDelayMs!
      );
      debug(
        `attempt ${attempt + 1}/${resolved.maxRetries} failed (status=${c.res.status}), retrying in ${Math.round(delay)}ms`
      );

      // Cancel the body of the failed response to release resources
      await c.res.body?.cancel();

      await sleep(delay);

      // Clone the stored proxy request and re-issue via fetch directly
      let retryResponse: Response;
      try {
        retryResponse = await fetch(proxyRequest.clone());
      } catch {
        // Network error during retry - treat as a retryable 502 so
        // the loop continues to the next attempt.
        debug(`retry attempt ${attempt + 1} fetch error, synthesizing 502`);
        retryResponse = new Response(null, { status: 502 });
      }
      retryCount = attempt + 1;

      // Replace the response on the context
      c.res = new Response(retryResponse.body, {
        status: retryResponse.status,
        statusText: retryResponse.statusText,
        headers: new Headers(retryResponse.headers),
      });
    }

    if (retryCount > 0) {
      c.res.headers.set(resolved.retryCountHeader!, String(retryCount));
    }
  };

  return {
    name: "retry",
    priority: Priority.RETRY,
    handler: withSkip(config?.skip, handler),
    httpOnly: true,
  };
}

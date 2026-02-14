/**
 * Proxy policy - per-route header manipulation and timeout control.
 *
 * @module proxy
 */

import { withModifiedHeaders } from "../utils/headers";
import { Priority, withSkip } from "./sdk";
import type { Policy, PolicyConfig } from "./types";

export interface ProxyPolicyConfig extends PolicyConfig {
  /** Headers to add to the proxied request */
  headers?: Record<string, string>;
  /** Headers to strip from the proxied request */
  stripHeaders?: string[];
  /** Timeout in milliseconds. Default: 30000. */
  timeout?: number;
  /**
   * Whether to preserve the inbound Host header when proxying to URL upstreams.
   * Default: false (Host is rewritten to the upstream target host).
   */
  preserveHost?: boolean;
}

/**
 * Apply additional header manipulation and timeout control to the upstream call.
 *
 * Use this when you need per-route header injection, header stripping, or
 * a custom timeout that wraps the upstream dispatch. The core proxy
 * forwarding (URL, Service Binding, Handler) is handled by the gateway's
 * upstream handler - this policy layers on top of it.
 *
 * `preserveHost` applies to URL upstreams, instructing the upstream handler
 * not to rewrite the Host header to the target host.
 *
 * Handles Cloudflare Workers' immutable `Request.headers` by cloning the
 * request when header modifications are needed.
 *
 * @param config - Headers to add/strip, timeout, and host preservation. All fields optional.
 * @returns A {@link Policy} at priority 95 (runs late, just before the upstream call).
 *
 * @example
 * ```ts
 * import { proxy } from "@homegrower-club/stoma/policies";
 *
 * // Add an internal auth header and strip cookies for the upstream
 * proxy({
 *   headers: { "x-internal-key": "secret-123" },
 *   stripHeaders: ["cookie", "x-forwarded-for"],
 *   timeout: 10_000,
 * });
 *
 * // Preserve the original Host header for virtual-host routing
 * proxy({ preserveHost: true });
 * ```
 */
export function proxy(config?: ProxyPolicyConfig): Policy {
  const timeout = config?.timeout ?? 30_000;

  const handler: import("hono").MiddlewareHandler = async (c, next) => {
    if (config?.preserveHost) {
      c.set("_preserveHost", true);
    }

    // Workers runtime has immutable Request.headers - clone into mutable copy
    if (config?.stripHeaders || config?.headers) {
      const stripHeaders = config?.stripHeaders;
      const headersToSet = config?.headers;
      withModifiedHeaders(c, (headers) => {
        if (stripHeaders) {
          for (const header of stripHeaders) {
            headers.delete(header);
          }
        }

        if (headersToSet) {
          for (const [key, value] of Object.entries(headersToSet)) {
            headers.set(key, value);
          }
        }
      });
    }

    // Apply timeout via AbortSignal
    if (timeout > 0) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeout);
      try {
        await next();
      } finally {
        clearTimeout(timer);
      }
    } else {
      await next();
    }
  };

  return {
    name: "proxy",
    priority: Priority.PROXY,
    handler: withSkip(config?.skip, handler),
    httpOnly: true,
  };
}

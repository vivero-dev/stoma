/**
 * Traffic shadow (mirroring) policy.
 *
 * Mirrors a configurable percentage of traffic to a secondary upstream
 * without affecting the primary response. Shadow requests are fire-and-forget.
 *
 * @module traffic-shadow
 */
import { getGatewayContext } from "../../core/pipeline";
import { definePolicy, Priority } from "../sdk";
import type { PolicyConfig } from "../types";

/** Headers that must not be forwarded to the shadow upstream. */
const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

export interface TrafficShadowConfig extends PolicyConfig {
  /** URL of the shadow upstream (required). */
  target: string;
  /** Percentage of traffic to mirror, 0-100. Default: `100`. */
  percentage?: number;
  /** Only mirror these HTTP methods. Default: `["GET", "POST", "PUT", "PATCH", "DELETE"]`. */
  methods?: string[];
  /** Include request body in shadow request. Default: `true`. */
  mirrorBody?: boolean;
  /** Timeout for shadow request in ms. Default: `5000`. */
  timeout?: number;
  /** Optional error handler for shadow failures. Default: silent. */
  onError?: (error: unknown) => void;
}

/**
 * Traffic shadow policy.
 *
 * Mirrors traffic to a secondary upstream after the primary response
 * is ready. The shadow request is fire-and-forget and never affects
 * the primary response.
 *
 * @example
 * ```ts
 * import { trafficShadow } from "@homegrower-club/stoma";
 *
 * trafficShadow({
 *   target: "https://shadow.internal",
 *   percentage: 10,
 *   methods: ["POST", "PUT"],
 * });
 * ```
 */
export const trafficShadow = /*#__PURE__*/ definePolicy<TrafficShadowConfig>({
  name: "traffic-shadow",
  priority: Priority.RESPONSE_TRANSFORM,
  httpOnly: true,
  defaults: {
    target: "",
    percentage: 100,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    mirrorBody: true,
    timeout: 5000,
  },
  handler: async (c, next, { config, debug }) => {
    // Clone the request body before next() consumes it
    let shadowBody: ArrayBuffer | null = null;
    if (config.mirrorBody) {
      try {
        const cloned = c.req.raw.clone();
        shadowBody = await cloned.arrayBuffer();
        if (shadowBody.byteLength === 0) {
          shadowBody = null;
        }
      } catch {
        // No body or unreadable - proceed without body
        shadowBody = null;
      }
    }

    // Run the primary pipeline first
    await next();

    // Determine if this request should be shadowed
    const method = c.req.method.toUpperCase();
    const allowedMethods = new Set(
      (config.methods ?? []).map((m) => m.toUpperCase())
    );

    if (!allowedMethods.has(method)) {
      debug("method %s not in shadow methods - skipping", method);
      return;
    }

    const roll = Math.random() * 100;
    if (roll >= (config.percentage ?? 100)) {
      debug("rolled %.1f >= %d%% - skipping shadow", roll, config.percentage);
      return;
    }

    // Build the shadow URL: target base + original path + query
    const originalUrl = new URL(c.req.url);
    const targetBase = config.target.replace(/\/$/, "");
    const shadowUrl = `${targetBase}${originalUrl.pathname}${originalUrl.search}`;

    // Copy headers, stripping hop-by-hop
    const headers = new Headers();
    for (const [key, value] of c.req.raw.headers.entries()) {
      if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
        headers.set(key, value);
      }
    }

    debug("shadowing %s %s → %s", method, originalUrl.pathname, shadowUrl);

    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      config.timeout ?? 5000
    );

    const shadowPromise = fetch(shadowUrl, {
      method,
      headers,
      body: config.mirrorBody && shadowBody ? shadowBody : undefined,
      signal: controller.signal,
      redirect: "manual",
    })
      .catch((err) => {
        debug("shadow request failed: %s", String(err));
        config.onError?.(err);
      })
      .finally(() => {
        clearTimeout(timeoutId);
      });

    // Use adapter.waitUntil if available, otherwise fire-and-forget.
    const ctx = getGatewayContext(c);
    if (ctx?.adapter?.waitUntil) {
      ctx.adapter.waitUntil(shadowPromise);
    }
  },
});

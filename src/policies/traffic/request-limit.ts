/**
 * Request size limit policy - enforce maximum request body size via Content-Length.
 *
 * @module request-limit
 */

import { GatewayError } from "../../core/errors";
import { definePolicy, Priority } from "../sdk";
import type { PolicyConfig } from "../types";

export interface RequestLimitConfig extends PolicyConfig {
  /** Maximum allowed body size in bytes (based on Content-Length). */
  maxBytes: number;
  /** Custom error message. Default: "Request body too large". */
  message?: string;
}

/**
 * Reject requests whose declared Content-Length exceeds `maxBytes`.
 *
 * This policy checks only the `Content-Length` header. If the header is
 * absent or invalid, the request passes through. Notably, requests using
 * chunked transfer encoding (`Transfer-Encoding: chunked`) do not include
 * a `Content-Length` header and will bypass this check entirely. For strict
 * body size enforcement, combine this policy with a body-reading policy
 * that enforces limits on the actual stream length.
 *
 * @param config - Maximum byte limit and optional custom message.
 * @returns A {@link Policy} at priority 5 (EARLY).
 */
export const requestLimit = /*#__PURE__*/ definePolicy<RequestLimitConfig>({
  name: "request-limit",
  priority: Priority.EARLY,
  phases: ["request-headers"],
  defaults: {
    message: "Request body too large",
  },
  handler: async (c, next, { config }) => {
    const contentLength = c.req.header("content-length");
    if (contentLength !== undefined) {
      const length = Number.parseInt(contentLength, 10);
      if (!Number.isNaN(length) && length > config.maxBytes) {
        throw new GatewayError(413, "request_too_large", config.message!);
      }
    }
    await next();
  },
  evaluate: {
    onRequest: async (input, { config }) => {
      const contentLength = input.headers.get("content-length");
      if (contentLength) {
        const length = Number.parseInt(contentLength, 10);
        if (!Number.isNaN(length) && length > config.maxBytes) {
          return {
            action: "reject",
            status: 413,
            code: "request_too_large",
            message: config.message!,
          };
        }
      }
      return { action: "continue" };
    },
  },
});

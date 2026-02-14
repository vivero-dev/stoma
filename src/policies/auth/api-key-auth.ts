/**
 * API key authentication policy.
 *
 * **Security note:** When implementing `validate`, use
 * {@link timingSafeEqual} from `@homegrower-club/stoma` for constant-time
 * key comparison to prevent timing side-channel attacks.
 *
 * @module api-key-auth
 */
import { GatewayError } from "../../core/errors";
import { sanitizeHeaderValue, withModifiedHeaders } from "../../utils/headers";
import { definePolicy, Priority } from "../sdk";
import type { PolicyConfig } from "../types";

export interface ApiKeyAuthConfig extends PolicyConfig {
  /** Header name to read the API key from. Default: "X-API-Key" */
  headerName?: string;
  /** Query parameter name as fallback. Default: undefined (disabled) */
  queryParam?: string;
  /** Validator function - return true if the key is valid */
  validate: (key: string) => boolean | Promise<boolean>;
  /**
   * After successful validation, derive an identity string from the key
   * and set it as a request header for upstream consumption.
   *
   * @example
   * ```ts
   * apiKeyAuth({
   *   validate: (key) => keys.has(key),
   *   forwardKeyIdentity: {
   *     headerName: "x-api-client",
   *     identityFn: (key) => keyToClientMap.get(key) ?? "unknown",
   *   },
   * });
   * ```
   */
  forwardKeyIdentity?: {
    /** Header name to set on the request. */
    headerName: string;
    /** Derive an identity string from the validated key. Can be async. */
    identityFn: (key: string) => string | Promise<string>;
  };
}

/**
 * Validate API keys from headers or query parameters.
 *
 * Checks the `X-API-Key` header by default, with an optional query parameter
 * fallback. The `validate` function can be async to support remote key lookups.
 *
 * @param config - API key settings with a required `validate` function.
 * @returns A {@link Policy} at priority 10.
 *
 * @example
 * ```ts
 * // Static key validation
 * apiKeyAuth({
 *   validate: (key) => key === env.API_KEY,
 * });
 *
 * // Async validation with query parameter fallback
 * apiKeyAuth({
 *   headerName: "Authorization",
 *   queryParam: "api_key",
 *   validate: async (key) => {
 *     const result = await kv.get(`api-key:${key}`);
 *     return result !== null;
 *   },
 * });
 * ```
 */
export const apiKeyAuth = /*#__PURE__*/ definePolicy<ApiKeyAuthConfig>({
  name: "api-key-auth",
  priority: Priority.AUTH,
  defaults: { headerName: "x-api-key" },
  phases: ["request-headers"],
  handler: async (c, next, { config, debug, trace }) => {
    // Try header first
    let key = c.req.header(config.headerName!);
    let source = "header";

    // Fall back to query parameter if configured
    if (!key && config.queryParam) {
      const url = new URL(c.req.url);
      key = url.searchParams.get(config.queryParam) ?? undefined;
      source = "query";
    }

    if (!key) {
      trace("rejected", { reason: "missing" });
      throw new GatewayError(401, "unauthorized", "Missing API key");
    }

    const isValid = await config.validate(key);
    if (!isValid) {
      trace("rejected", { reason: "invalid" });
      throw new GatewayError(403, "forbidden", "Invalid API key");
    }

    trace("authenticated", { source });

    // Forward key identity as a request header if configured
    if (config.forwardKeyIdentity) {
      const fwd = config.forwardKeyIdentity;
      const identity = await fwd.identityFn(key);
      withModifiedHeaders(c, (headers) => {
        headers.set(fwd.headerName, sanitizeHeaderValue(identity));
      });
      debug(
        `forwarded key identity as ${config.forwardKeyIdentity.headerName}`
      );
    }

    await next();
  },
  evaluate: {
    onRequest: async (input, { config, debug, trace }) => {
      // Try header first
      let key = input.headers.get(config.headerName!) ?? undefined;
      let source = "header";

      // Fall back to query parameter if configured
      if (!key && config.queryParam) {
        const url = new URL(input.path, "http://localhost");
        key = url.searchParams.get(config.queryParam!) ?? undefined;
        source = "query";
      }

      if (!key) {
        trace("rejected", { reason: "missing" });
        return {
          action: "reject",
          status: 401,
          code: "unauthorized",
          message: "Missing API key",
        };
      }

      const isValid = await config.validate(key);
      if (!isValid) {
        trace("rejected", { reason: "invalid" });
        return {
          action: "reject",
          status: 403,
          code: "forbidden",
          message: "Invalid API key",
        };
      }

      trace("authenticated", { source });

      // Forward key identity as a header if configured
      if (config.forwardKeyIdentity) {
        const fwd = config.forwardKeyIdentity;
        const identity = await fwd.identityFn(key);
        debug(
          `forwarded key identity as ${config.forwardKeyIdentity.headerName}`
        );
        return {
          action: "continue",
          mutations: [
            {
              type: "header",
              op: "set",
              name: fwd.headerName,
              value: sanitizeHeaderValue(identity),
            },
          ],
        };
      }

      return { action: "continue" };
    },
  },
});

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
import type { PolicyConfig } from "../types";
import { definePolicy, Priority } from "../sdk";

export interface ApiKeyAuthConfig extends PolicyConfig {
  /** Header name to read the API key from. Default: "X-API-Key" */
  headerName?: string;
  /** Query parameter name as fallback. Default: undefined (disabled) */
  queryParam?: string;
  /** Validator function — return true if the key is valid */
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
export const apiKeyAuth = definePolicy<ApiKeyAuthConfig>({
  name: "api-key-auth",
  priority: Priority.AUTH,
  defaults: { headerName: "x-api-key" },
  handler: async (c, next, { config, debug }) => {
    // Try header first
    let key = c.req.header(config.headerName!);

    // Fall back to query parameter if configured
    if (!key && config.queryParam) {
      const url = new URL(c.req.url);
      key = url.searchParams.get(config.queryParam) ?? undefined;
    }

    if (!key) {
      throw new GatewayError(401, "unauthorized", "Missing API key");
    }

    const isValid = await config.validate(key);
    if (!isValid) {
      throw new GatewayError(403, "forbidden", "Invalid API key");
    }

    // Forward key identity as a request header if configured
    if (config.forwardKeyIdentity) {
      const identity = await config.forwardKeyIdentity.identityFn(key);
      const sanitized = identity.replace(/[\r\n\0]/g, "");
      const headers = new Headers(c.req.raw.headers);
      headers.set(config.forwardKeyIdentity.headerName, sanitized);
      c.req.raw = new Request(c.req.raw, { headers });
      debug(`forwarded key identity as ${config.forwardKeyIdentity.headerName}`);
    }

    await next();
  },
});

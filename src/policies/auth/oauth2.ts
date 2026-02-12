/**
 * OAuth2 token validation policy via introspection or local validation.
 *
 * Validates bearer tokens issued by an external authorization server.
 * This is NOT an OAuth2 server — it only validates tokens.
 *
 * @module oauth2
 */
import { definePolicy, Priority } from "../sdk";
import type { PolicyConfig } from "../types";
import { GatewayError } from "../../core/errors";

export interface OAuth2Config extends PolicyConfig {
  /** OAuth2 token introspection endpoint (RFC 7662). */
  introspectionUrl?: string;
  /** Client ID for authenticating with the introspection endpoint. */
  clientId?: string;
  /** Client secret for authenticating with the introspection endpoint. */
  clientSecret?: string;
  /** Local validation function as alternative to introspection. Takes precedence if both provided. */
  localValidate?: (token: string) => boolean | Promise<boolean>;
  /** Where to look for the token. Default: "header". */
  tokenLocation?: "header" | "query";
  /** Header name when tokenLocation is "header". Default: "authorization". */
  headerName?: string;
  /** Prefix to strip from header value. Default: "Bearer". */
  headerPrefix?: string;
  /** Query param name when tokenLocation is "query". Default: "access_token". */
  queryParam?: string;
  /** Map introspection response fields to request headers. Only applies with introspection. */
  forwardTokenInfo?: Record<string, string>;
  /** Cache introspection results for this many seconds. Default: 0 (no cache). */
  cacheTtlSeconds?: number;
  /** Required scopes — token must have ALL of these (space-separated scope string). */
  requiredScopes?: string[];
  /** Introspection endpoint fetch timeout in milliseconds. Default: 5000. */
  introspectionTimeoutMs?: number;
}

interface IntrospectionResult {
  active: boolean;
  scope?: string;
  [key: string]: unknown;
}

/** Module-level introspection cache. */
const introspectionCache = new Map<
  string,
  { result: IntrospectionResult; expiresAt: number }
>();

/** Clear the introspection cache. Exported for testing. */
export function clearOAuth2Cache(): void {
  introspectionCache.clear();
}

export const oauth2 = definePolicy<OAuth2Config>({
  name: "oauth2",
  priority: Priority.AUTH,
  defaults: {
    tokenLocation: "header",
    headerName: "authorization",
    headerPrefix: "Bearer",
    queryParam: "access_token",
    cacheTtlSeconds: 0,
  },
  validate: (config) => {
    if (!config.introspectionUrl && !config.localValidate) {
      throw new GatewayError(
        500,
        "config_error",
        "oauth2 requires either introspectionUrl or localValidate",
      );
    }
  },
  handler: async (c, next, { config, debug }) => {
    // 1. Extract token
    let token: string | undefined;

    if (config.tokenLocation === "query") {
      token = c.req.query(config.queryParam!) ?? undefined;
    } else {
      const headerValue = c.req.header(config.headerName!);
      if (headerValue && config.headerPrefix) {
        const prefix = `${config.headerPrefix} `;
        if (headerValue.startsWith(prefix)) {
          token = headerValue.slice(prefix.length);
        } else {
          token = undefined;
        }
      } else {
        token = headerValue ?? undefined;
      }
    }

    if (!token || !token.trim()) {
      throw new GatewayError(401, "unauthorized", "Missing access token");
    }

    // 2. Validate token
    if (config.localValidate) {
      debug("local validation");
      const valid = await config.localValidate(token);
      if (!valid) {
        throw new GatewayError(401, "unauthorized", "Token validation failed");
      }
    } else if (config.introspectionUrl) {
      debug("introspection validation");
      const introspectionResult = await introspect(
        token,
        config.introspectionUrl,
        config.clientId,
        config.clientSecret,
        config.cacheTtlSeconds ?? 0,
        config.introspectionTimeoutMs,
      );

      if (!introspectionResult.active) {
        throw new GatewayError(401, "unauthorized", "Token is not active");
      }

      // Check required scopes
      if (config.requiredScopes && config.requiredScopes.length > 0) {
        const tokenScopes = introspectionResult.scope
          ? introspectionResult.scope.split(" ")
          : [];
        const missing = config.requiredScopes.filter(
          (s) => !tokenScopes.includes(s),
        );
        if (missing.length > 0) {
          throw new GatewayError(403, "forbidden", "Insufficient scope");
        }
      }

      // Forward token info as headers
      if (config.forwardTokenInfo) {
        const headers = new Headers(c.req.raw.headers);
        let modified = false;
        for (const [field, headerKey] of Object.entries(
          config.forwardTokenInfo,
        )) {
          const value = introspectionResult[field];
          if (value !== undefined && value !== null) {
            const sanitized = String(value).replace(/[\r\n\0]/g, "");
            headers.set(headerKey, sanitized);
            modified = true;
          }
        }
        if (modified) {
          c.req.raw = new Request(c.req.raw, { headers });
        }
      }
    }

    await next();
  },
});

const DEFAULT_INTROSPECTION_TIMEOUT_MS = 5_000;

async function introspect(
  token: string,
  url: string,
  clientId?: string,
  clientSecret?: string,
  cacheTtlSeconds = 0,
  timeoutMs?: number,
): Promise<IntrospectionResult> {
  // Check cache
  if (cacheTtlSeconds > 0) {
    const cached = introspectionCache.get(token);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.result;
    }
  }

  const headers: Record<string, string> = {
    "content-type": "application/x-www-form-urlencoded",
  };

  if (clientId && clientSecret) {
    headers.authorization = `Basic ${btoa(`${clientId}:${clientSecret}`)}`;
  }

  const timeout = timeoutMs ?? DEFAULT_INTROSPECTION_TIMEOUT_MS;
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers,
      body: `token=${encodeURIComponent(token)}`,
      signal: AbortSignal.timeout(timeout),
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "TimeoutError") {
      throw new GatewayError(502, "introspection_error", `Introspection endpoint timed out after ${timeout}ms`);
    }
    throw new GatewayError(502, "introspection_error", `Introspection endpoint error: ${err instanceof Error ? err.message : String(err)}`);
  }

  if (!response.ok) {
    throw new GatewayError(
      502,
      "introspection_error",
      `Introspection endpoint returned ${response.status}`,
    );
  }

  const result = (await response.json()) as IntrospectionResult;

  // Cache result
  if (cacheTtlSeconds > 0) {
    introspectionCache.set(token, {
      result,
      expiresAt: Date.now() + cacheTtlSeconds * 1000,
    });
  }

  return result;
}

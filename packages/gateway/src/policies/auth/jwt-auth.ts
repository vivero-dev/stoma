/**
 * JWT authentication policy - HMAC and JWKS verification.
 *
 * @module jwt-auth
 */
import { GatewayError } from "../../core/errors";
import type { DebugLogger } from "../../utils/debug";
import { sanitizeHeaderValue, withModifiedHeaders } from "../../utils/headers";
import { definePolicy, Priority } from "../sdk";
import type { PolicyConfig } from "../types";
import {
  base64UrlDecode,
  base64UrlToBuffer,
  fetchJwks,
  hmacAlgorithm,
  rsaAlgorithm,
} from "./crypto";

export interface JwtAuthConfig extends PolicyConfig {
  /** JWT secret for HMAC verification */
  secret?: string;
  /** JWKS endpoint URL (e.g. Supabase, Auth0) */
  jwksUrl?: string;
  /** Expected JWT issuer */
  issuer?: string;
  /** Expected JWT audience */
  audience?: string;
  /** Header to read the token from. Default: "Authorization" */
  headerName?: string;
  /** Token prefix. Default: "Bearer" */
  tokenPrefix?: string;
  /** Claims to inject into request headers for upstream consumption */
  forwardClaims?: Record<string, string>;
  /** JWKS cache TTL in milliseconds. Default: 300000 (5 minutes). */
  jwksCacheTtlMs?: number;
  /** JWKS fetch timeout in milliseconds. Default: 10000 (10 seconds). */
  jwksTimeoutMs?: number;
  /** Clock skew tolerance in seconds for expiry checks. Default: 0. */
  clockSkewSeconds?: number;
  /** Require the `exp` claim to be present. Default: false. */
  requireExp?: boolean;
}

interface JwtHeader {
  alg: string;
  typ?: string;
  kid?: string;
}

interface JwtPayload {
  [key: string]: unknown;
  iss?: string;
  aud?: string | string[];
  exp?: number;
  iat?: number;
  sub?: string;
}

// ─── Shared JWT Validation ────────────────────────────────────────────

/** Result of JWT token extraction, decoding, verification, and claim validation. */
type JwtValidationResult =
  | { ok: true; payload: JwtPayload }
  | { ok: false; status: number; code: string; message: string };

/**
 * Core JWT validation shared between the HTTP handler and protocol-agnostic
 * evaluator.
 *
 * Extracts the token, decodes the JWT, verifies the signature (HMAC or
 * JWKS), and validates standard claims (exp, iss, aud). Returns a
 * discriminated result so callers can map to their runtime's error model.
 *
 * Signature verification errors from {@link verifyHmac}/{@link verifyJwks}
 * propagate as thrown `GatewayError` — both runtimes handle these at a
 * higher level.
 */
async function validateJwt(
  authHeader: string | null | undefined,
  config: JwtAuthConfig,
  debug: DebugLogger,
): Promise<JwtValidationResult> {
  if (!authHeader) {
    return {
      ok: false,
      status: 401,
      code: "unauthorized",
      message: "Missing authentication token",
    };
  }

  // Extract token
  let token: string;
  if (config.tokenPrefix) {
    if (!authHeader.startsWith(`${config.tokenPrefix} `)) {
      return {
        ok: false,
        status: 401,
        code: "unauthorized",
        message: `Expected ${config.tokenPrefix} token`,
      };
    }
    token = authHeader.slice(config.tokenPrefix.length + 1);
  } else {
    token = authHeader;
  }

  if (!token || !token.trim()) {
    return {
      ok: false,
      status: 401,
      code: "unauthorized",
      message: "Empty authentication token",
    };
  }

  // Decode (without verifying yet)
  const parts = token.split(".");
  if (parts.length !== 3) {
    return {
      ok: false,
      status: 401,
      code: "unauthorized",
      message: "Malformed JWT: expected 3 parts",
    };
  }

  let header: JwtHeader;
  let payload: JwtPayload;
  try {
    header = JSON.parse(base64UrlDecode(parts[0]));
    payload = JSON.parse(base64UrlDecode(parts[1]));
  } catch {
    return {
      ok: false,
      status: 401,
      code: "unauthorized",
      message: "Malformed JWT: invalid base64 encoding",
    };
  }

  // Block "none" algorithm (case-insensitive to prevent bypass)
  if (header.alg.toLowerCase() === "none") {
    return {
      ok: false,
      status: 401,
      code: "unauthorized",
      message: "JWT algorithm 'none' is not allowed",
    };
  }

  // Verify signature
  if (config.secret) {
    debug(`HMAC verification (alg=${header.alg})`);
    await verifyHmac(config.secret, parts[0], parts[1], parts[2], header.alg);
  } else if (config.jwksUrl) {
    debug(
      `JWKS verification (alg=${header.alg}, kid=${header.kid ?? "none"})`
    );
    await verifyJwks(
      config.jwksUrl,
      parts[0],
      parts[1],
      parts[2],
      header,
      config.jwksCacheTtlMs,
      config.jwksTimeoutMs
    );
  }

  // Validate claims
  const now = Math.floor(Date.now() / 1000);

  if (config.requireExp && payload.exp === undefined) {
    return {
      ok: false,
      status: 401,
      code: "unauthorized",
      message: "JWT must contain an 'exp' claim",
    };
  }

  if (
    payload.exp !== undefined &&
    payload.exp < now - config.clockSkewSeconds!
  ) {
    return {
      ok: false,
      status: 401,
      code: "unauthorized",
      message: "JWT has expired",
    };
  }

  if (config.issuer && payload.iss !== config.issuer) {
    return {
      ok: false,
      status: 401,
      code: "unauthorized",
      message: "JWT issuer mismatch",
    };
  }

  if (config.audience) {
    const aud = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
    if (!aud.includes(config.audience)) {
      return {
        ok: false,
        status: 401,
        code: "unauthorized",
        message: "JWT audience mismatch",
      };
    }
  }

  debug(`verified (sub=${payload.sub ?? "none"})`);
  return { ok: true, payload };
}

// ─── Policy Definition ────────────────────────────────────────────────

/**
 * Validate JWT tokens and optionally forward claims as upstream headers.
 *
 * Supports both HMAC (shared secret) and RSA (JWKS endpoint) verification.
 * JWKS responses are cached for 5 minutes. The `none` algorithm is always
 * rejected to prevent signature bypass attacks.
 *
 * @param config - JWT authentication settings. Requires either `secret` (HMAC) or `jwksUrl` (RSA).
 * @returns A {@link Policy} at priority 10 (runs early, before rate limiting).
 *
 * @example
 * ```ts
 * // HMAC verification with a shared secret
 * createGateway({
 *   routes: [{
 *     path: "/api/*",
 *     pipeline: {
 *       policies: [jwtAuth({ secret: env.JWT_SECRET })],
 *       upstream: { type: "url", target: "https://backend.internal" },
 *     },
 *   }],
 * });
 *
 * // JWKS verification (e.g. Supabase, Auth0) with claim forwarding
 * jwtAuth({
 *   jwksUrl: "https://your-project.supabase.co/auth/v1/.well-known/jwks.json",
 *   issuer: "https://your-project.supabase.co/auth/v1",
 *   forwardClaims: { sub: "x-user-id", email: "x-user-email" },
 * });
 * ```
 */
export const jwtAuth = /*#__PURE__*/ definePolicy<JwtAuthConfig>({
  name: "jwt-auth",
  priority: Priority.AUTH,
  phases: ["request-headers"],
  defaults: {
    headerName: "authorization",
    tokenPrefix: "Bearer",
    clockSkewSeconds: 0,
    requireExp: false,
  },
  validate: (config) => {
    if (!config.secret && !config.jwksUrl) {
      throw new GatewayError(
        500,
        "config_error",
        "jwtAuth requires either 'secret' or 'jwksUrl'"
      );
    }
  },
  handler: async (c, next, { config, debug }) => {
    const result = await validateJwt(
      c.req.header(config.headerName!),
      config,
      debug,
    );

    if (!result.ok) {
      throw new GatewayError(result.status, result.code, result.message);
    }

    // Forward claims as headers (sanitize to prevent header injection)
    if (config.forwardClaims) {
      const { payload } = result;
      const forwardClaims = config.forwardClaims;
      withModifiedHeaders(c, (headers) => {
        for (const [claim, headerKey] of Object.entries(forwardClaims)) {
          const value = payload[claim];
          if (value !== undefined && value !== null) {
            headers.set(headerKey, sanitizeHeaderValue(String(value)));
          }
        }
      });
    }

    await next();
  },
  evaluate: {
    onRequest: async (input, { config, debug }) => {
      const result = await validateJwt(
        input.headers.get(config.headerName!),
        config,
        debug,
      );

      if (!result.ok) {
        return {
          action: "reject",
          status: result.status,
          code: result.code,
          message: result.message,
        };
      }

      // Forward claims as header mutations
      if (config.forwardClaims) {
        const { payload } = result;
        const forwardClaims = config.forwardClaims;
        const mutations = [];
        for (const [claim, headerKey] of Object.entries(forwardClaims)) {
          const value = payload[claim];
          if (value !== undefined && value !== null) {
            mutations.push({
              type: "header" as const,
              op: "set" as const,
              name: headerKey,
              value: sanitizeHeaderValue(String(value)),
            });
          }
        }
        if (mutations.length > 0) {
          return { action: "continue", mutations };
        }
      }

      return { action: "continue" };
    },
  },
});

async function verifyHmac(
  secret: string,
  headerB64: string,
  payloadB64: string,
  signatureB64: string,
  alg: string
): Promise<void> {
  const algorithm = hmacAlgorithm(alg);
  if (!algorithm) {
    throw new GatewayError(
      401,
      "unauthorized",
      `Unsupported JWT algorithm: ${alg}`
    );
  }

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: algorithm },
    false,
    ["verify"]
  );

  const data = encoder.encode(`${headerB64}.${payloadB64}`);
  const signature = base64UrlToBuffer(signatureB64);

  const valid = await crypto.subtle.verify("HMAC", key, signature, data);
  if (!valid) {
    throw new GatewayError(401, "unauthorized", "Invalid JWT signature");
  }
}

async function verifyJwks(
  jwksUrl: string,
  headerB64: string,
  payloadB64: string,
  signatureB64: string,
  header: JwtHeader,
  cacheTtlMs?: number,
  timeoutMs?: number
): Promise<void> {
  const keys = await fetchJwks(jwksUrl, cacheTtlMs, timeoutMs);
  const matchingKey = header.kid
    ? keys.find(
        (k) => (k as unknown as Record<string, unknown>).kid === header.kid
      )
    : keys[0];

  if (!matchingKey) {
    throw new GatewayError(401, "unauthorized", "No matching JWKS key found");
  }

  const algorithm = rsaAlgorithm(header.alg);
  if (!algorithm) {
    throw new GatewayError(
      401,
      "unauthorized",
      `Unsupported JWT algorithm: ${header.alg}`
    );
  }

  const key = await crypto.subtle.importKey(
    "jwk",
    matchingKey,
    algorithm,
    false,
    ["verify"]
  );

  const encoder = new TextEncoder();
  const data = encoder.encode(`${headerB64}.${payloadB64}`);
  const signature = base64UrlToBuffer(signatureB64);

  const valid = await crypto.subtle.verify(algorithm, key, signature, data);

  if (!valid) {
    throw new GatewayError(401, "unauthorized", "Invalid JWT signature");
  }
}

/**
 * @deprecated Use `clearJwksCache` from `./crypto` instead. This re-export
 * exists for backwards compatibility with existing tests.
 */
export { clearJwksCache } from "./crypto";

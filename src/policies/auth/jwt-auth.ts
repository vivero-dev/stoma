/**
 * JWT authentication policy — HMAC and JWKS verification.
 *
 * @module jwt-auth
 */
import { GatewayError } from "../../core/errors";
import { Priority, policyDebug, withSkip } from "../sdk";
import type { Policy, PolicyConfig } from "../types";
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
export function jwtAuth(config: JwtAuthConfig): Policy {
  if (!config.secret && !config.jwksUrl) {
    throw new GatewayError(
      500,
      "config_error",
      "jwtAuth requires either 'secret' or 'jwksUrl'"
    );
  }

  const headerName = config.headerName ?? "authorization";
  const tokenPrefix = config.tokenPrefix ?? "Bearer";

  const handler: import("hono").MiddlewareHandler = async (c, next) => {
    const debug = policyDebug(c, "jwt-auth");
    const authHeader = c.req.header(headerName);

    if (!authHeader) {
      throw new GatewayError(
        401,
        "unauthorized",
        "Missing authentication token"
      );
    }

    // Extract token
    let token: string;
    if (tokenPrefix) {
      if (!authHeader.startsWith(`${tokenPrefix} `)) {
        throw new GatewayError(
          401,
          "unauthorized",
          `Expected ${tokenPrefix} token`
        );
      }
      token = authHeader.slice(tokenPrefix.length + 1);
    } else {
      token = authHeader;
    }

    if (!token || !token.trim()) {
      throw new GatewayError(401, "unauthorized", "Empty authentication token");
    }

    // Decode (without verifying yet)
    const parts = token.split(".");
    if (parts.length !== 3) {
      throw new GatewayError(
        401,
        "unauthorized",
        "Malformed JWT: expected 3 parts"
      );
    }

    let header: JwtHeader;
    let payload: JwtPayload;
    try {
      header = JSON.parse(base64UrlDecode(parts[0]));
      payload = JSON.parse(base64UrlDecode(parts[1]));
    } catch {
      throw new GatewayError(
        401,
        "unauthorized",
        "Malformed JWT: invalid base64 encoding"
      );
    }

    // Block "none" algorithm (case-insensitive to prevent bypass)
    if (header.alg.toLowerCase() === "none") {
      throw new GatewayError(
        401,
        "unauthorized",
        "JWT algorithm 'none' is not allowed"
      );
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
    const skew = config.clockSkewSeconds ?? 0;

    if (config.requireExp && payload.exp === undefined) {
      throw new GatewayError(
        401,
        "unauthorized",
        "JWT must contain an 'exp' claim"
      );
    }

    if (payload.exp !== undefined && payload.exp < now - skew) {
      throw new GatewayError(401, "unauthorized", "JWT has expired");
    }

    if (config.issuer && payload.iss !== config.issuer) {
      throw new GatewayError(401, "unauthorized", "JWT issuer mismatch");
    }

    if (config.audience) {
      const aud = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
      if (!aud.includes(config.audience)) {
        throw new GatewayError(401, "unauthorized", "JWT audience mismatch");
      }
    }

    // Forward claims as headers (sanitize to prevent header injection)
    debug(`verified (sub=${payload.sub ?? "none"})`);

    if (config.forwardClaims) {
      // Workers runtime has immutable Request.headers — clone into mutable copy
      const headers = new Headers(c.req.raw.headers);
      let modified = false;
      for (const [claim, headerKey] of Object.entries(config.forwardClaims)) {
        const value = payload[claim];
        if (value !== undefined && value !== null) {
          // Strip control characters (CR, LF, NUL) to prevent header injection
          const sanitized = String(value).replace(/[\r\n\0]/g, "");
          headers.set(headerKey, sanitized);
          modified = true;
        }
      }
      if (modified) {
        c.req.raw = new Request(c.req.raw, { headers });
      }
    }

    await next();
  };

  return {
    name: "jwt-auth",
    priority: Priority.AUTH,
    handler: withSkip(config.skip, handler),
  };
}

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

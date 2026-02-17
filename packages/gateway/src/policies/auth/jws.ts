/**
 * JWS verification policy - verifies JSON Web Signature compact serialization.
 *
 * Supports both embedded and detached payloads, HMAC (HS256/384/512) and
 * RSA (RS256/384/512) via JWKS endpoints.
 *
 * @module jws
 */

import { GatewayError } from "../../core/errors";
import { sanitizeHeaderValue, withModifiedHeaders } from "../../utils/headers";
import { definePolicy, Priority } from "../sdk";
import type { PolicyConfig } from "../types";
import {
  base64UrlDecode,
  base64UrlEncodeBytes,
  base64UrlToBuffer,
  fetchJwks,
  hmacAlgorithm,
  rsaAlgorithm,
} from "./crypto";

export interface JwsConfig extends PolicyConfig {
  /** HMAC secret for verification */
  secret?: string;
  /** JWKS endpoint for RSA verification */
  jwksUrl?: string;
  /** Header containing the JWS. Default: "X-JWS-Signature" */
  headerName?: string;
  /** Where the payload comes from for detached JWS. Default: "embedded" */
  payloadSource?: "embedded" | "body";
  /** Whether to forward the verified payload as a header. Default: false */
  forwardPayload?: boolean;
  /** Header name for forwarded payload. Default: "X-JWS-Payload" */
  forwardHeaderName?: string;
  /** JWKS cache TTL in ms. Default: 300000 */
  jwksCacheTtlMs?: number;
  /** JWKS fetch timeout in milliseconds. Default: 10000 (10 seconds). */
  jwksTimeoutMs?: number;
}

interface JwsHeader {
  alg: string;
  typ?: string;
  kid?: string;
}

/**
 * @deprecated Use `clearJwksCache` from `./crypto` instead. This re-export
 * exists for backwards compatibility with existing tests.
 */
export { clearJwksCache as clearJwsJwksCache } from "./crypto";

/**
 * Verify JWS compact serialization signatures on requests.
 *
 * The `none` algorithm is always rejected to prevent signature bypass attacks.
 * Config validation (`secret` or `jwksUrl` required) is performed at construction
 * time - a missing config throws immediately, not on first request.
 *
 * @example
 * ```ts
 * import { jws } from "@homegrower-club/stoma";
 *
 * // HMAC verification with embedded payload
 * jws({ secret: env.JWS_SECRET });
 *
 * // Detached JWS - payload comes from the request body
 * jws({ secret: env.JWS_SECRET, payloadSource: "body" });
 * ```
 */
export const jws = /*#__PURE__*/ definePolicy<JwsConfig>({
  name: "jws",
  priority: Priority.AUTH,
  defaults: {
    headerName: "X-JWS-Signature",
    payloadSource: "embedded",
    forwardPayload: false,
    forwardHeaderName: "X-JWS-Payload",
  },
  validate: (config) => {
    if (!config.secret && !config.jwksUrl) {
      throw new GatewayError(
        500,
        "config_error",
        "jws requires either 'secret' or 'jwksUrl'"
      );
    }
  },
  handler: async (c, next, { config, debug }) => {
    // Extract JWS from header
    const jwsCompact = c.req.header(config.headerName!);
    if (!jwsCompact) {
      throw new GatewayError(
        401,
        "jws_missing",
        `Missing JWS header: ${config.headerName}`
      );
    }

    // Parse JWS compact serialization: header.payload.signature
    const parts = jwsCompact.split(".");
    if (parts.length !== 3) {
      throw new GatewayError(
        401,
        "jws_invalid",
        "Malformed JWS: expected 3 parts"
      );
    }

    const [headerB64, payloadB64, signatureB64] = parts;

    // Decode header
    let header: JwsHeader;
    try {
      header = JSON.parse(base64UrlDecode(headerB64));
    } catch {
      throw new GatewayError(
        401,
        "jws_invalid",
        "Malformed JWS: invalid header encoding"
      );
    }

    // Block "none" algorithm (case-insensitive to prevent bypass)
    if (header.alg.toLowerCase() === "none") {
      throw new GatewayError(
        401,
        "jws_invalid",
        "JWS algorithm 'none' is not allowed"
      );
    }

    // Resolve the payload for verification
    let verifyPayloadB64: string;
    if (config.payloadSource === "body") {
      // Detached JWS: payload section should be empty, actual payload is request body
      const body = await c.req.raw.clone().text();
      const encoder = new TextEncoder();
      verifyPayloadB64 = base64UrlEncodeBytes(encoder.encode(body));
    } else {
      // Embedded: payload is in the JWS itself
      if (!payloadB64) {
        throw new GatewayError(
          401,
          "jws_invalid",
          "JWS has empty payload but payloadSource is 'embedded'"
        );
      }
      verifyPayloadB64 = payloadB64;
    }

    // Verify signature
    const encoder = new TextEncoder();
    const signingInput = encoder.encode(`${headerB64}.${verifyPayloadB64}`);
    const signature = base64UrlToBuffer(signatureB64);

    if (config.secret) {
      const hash = hmacAlgorithm(header.alg);
      if (!hash) {
        throw new GatewayError(
          401,
          "jws_invalid",
          `Unsupported JWS algorithm: ${header.alg}`
        );
      }

      debug(`HMAC verification (alg=${header.alg})`);
      const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(config.secret),
        { name: "HMAC", hash },
        false,
        ["verify"]
      );

      const valid = await crypto.subtle.verify(
        "HMAC",
        key,
        signature,
        signingInput
      );
      if (!valid) {
        throw new GatewayError(401, "jws_invalid", "Invalid JWS signature");
      }
    } else if (config.jwksUrl) {
      const algorithm = rsaAlgorithm(header.alg);
      if (!algorithm) {
        throw new GatewayError(
          401,
          "jws_invalid",
          `Unsupported JWS algorithm: ${header.alg}`
        );
      }

      const keys = await fetchJwks(
        config.jwksUrl,
        config.jwksCacheTtlMs,
        config.jwksTimeoutMs
      );
      const matchingKey = (header as JwsHeader).kid
        ? keys.find(
            (k) => (k as unknown as Record<string, unknown>).kid === header.kid
          )
        : keys[0];

      if (!matchingKey) {
        throw new GatewayError(
          401,
          "jws_invalid",
          "No matching JWKS key found"
        );
      }

      debug(
        `JWKS verification (alg=${header.alg}, kid=${header.kid ?? "none"})`
      );
      const key = await crypto.subtle.importKey(
        "jwk",
        matchingKey,
        algorithm,
        false,
        ["verify"]
      );

      const valid = await crypto.subtle.verify(
        algorithm,
        key,
        signature,
        signingInput
      );
      if (!valid) {
        throw new GatewayError(401, "jws_invalid", "Invalid JWS signature");
      }
    }

    // Forward verified payload if requested
    if (config.forwardPayload) {
      try {
        const decodedPayload = base64UrlDecode(verifyPayloadB64);
        withModifiedHeaders(c, (headers) => {
          headers.set(
            config.forwardHeaderName!,
            sanitizeHeaderValue(decodedPayload)
          );
        });
      } catch {
        // If payload isn't decodable, skip forwarding
      }
    }

    debug("JWS verified");
    await next();
  },
  evaluate: {
    onRequest: async (input, { config, debug }) => {
      // Extract JWS from header
      const jwsCompact = input.headers.get(config.headerName!);
      if (!jwsCompact) {
        return {
          action: "reject",
          status: 401,
          code: "jws_missing",
          message: `Missing JWS header: ${config.headerName}`,
        };
      }

      // Parse JWS compact serialization: header.payload.signature
      const parts = jwsCompact.split(".");
      if (parts.length !== 3) {
        return {
          action: "reject",
          status: 401,
          code: "jws_invalid",
          message: "Malformed JWS: expected 3 parts",
        };
      }

      const [headerB64, payloadB64, signatureB64] = parts;

      // Decode header
      let header: JwsHeader;
      try {
        header = JSON.parse(base64UrlDecode(headerB64));
      } catch {
        return {
          action: "reject",
          status: 401,
          code: "jws_invalid",
          message: "Malformed JWS header: invalid base64",
        };
      }

      // Block "none" algorithm
      if (header.alg.toLowerCase() === "none") {
        return {
          action: "reject",
          status: 401,
          code: "jws_invalid",
          message: "JWS algorithm 'none' is not allowed",
        };
      }

      // Get payload (embedded or from body)
      const verifyPayloadB64 =
        config.payloadSource === "body" && input.body
          ? typeof input.body === "string"
            ? base64UrlEncodeBytes(new TextEncoder().encode(input.body))
            : base64UrlEncodeBytes(new Uint8Array(input.body))
          : payloadB64;

      const signingInput = `${headerB64}.${verifyPayloadB64}`;

      // Verify signature
      const signature = base64UrlToBuffer(signatureB64);

      if (config.secret) {
        const algorithm = hmacAlgorithm(header.alg);
        if (!algorithm) {
          return {
            action: "reject",
            status: 401,
            code: "jws_invalid",
            message: `Unsupported JWS algorithm: ${header.alg}`,
          };
        }

        const key = await crypto.subtle.importKey(
          "raw",
          new TextEncoder().encode(config.secret),
          { name: "HMAC", hash: algorithm },
          false,
          ["verify"]
        );

        const valid = await crypto.subtle.verify(
          algorithm,
          key,
          signature,
          new TextEncoder().encode(signingInput)
        );
        if (!valid) {
          return {
            action: "reject",
            status: 401,
            code: "jws_invalid",
            message: "Invalid JWS signature",
          };
        }
      } else if (config.jwksUrl) {
        const algorithm = rsaAlgorithm(header.alg);
        if (!algorithm) {
          return {
            action: "reject",
            status: 401,
            code: "jws_invalid",
            message: `Unsupported JWS algorithm: ${header.alg}`,
          };
        }

        const keys = await fetchJwks(
          config.jwksUrl,
          config.jwksCacheTtlMs,
          config.jwksTimeoutMs
        );
        const matchingKey = header.kid
          ? keys.find(
              (k) =>
                (k as unknown as Record<string, unknown>).kid === header.kid
            )
          : keys[0];

        if (!matchingKey) {
          return {
            action: "reject",
            status: 401,
            code: "jws_invalid",
            message: "No matching JWKS key found",
          };
        }

        const key = await crypto.subtle.importKey(
          "jwk",
          matchingKey,
          algorithm,
          false,
          ["verify"]
        );

        const valid = await crypto.subtle.verify(
          algorithm,
          key,
          signature,
          new TextEncoder().encode(signingInput)
        );
        if (!valid) {
          return {
            action: "reject",
            status: 401,
            code: "jws_invalid",
            message: "Invalid JWS signature",
          };
        }
      }

      // Forward verified payload if requested
      if (config.forwardPayload) {
        try {
          const decodedPayload = base64UrlDecode(verifyPayloadB64);
          return {
            action: "continue",
            mutations: [
              {
                type: "header" as const,
                op: "set" as const,
                name: config.forwardHeaderName!,
                value: sanitizeHeaderValue(decodedPayload),
              },
            ],
          };
        } catch {
          // If payload isn't decodable, continue without forwarding
        }
      }

      debug("JWS verified");
      return { action: "continue" };
    },
  },
});

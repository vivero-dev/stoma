/**
 * JWT generation policy - mints JWTs for upstream consumption.
 *
 * Signs tokens using HMAC (HS256/384/512) or RSA (RS256/384/512) and
 * attaches them to the outgoing request as a header.
 *
 * @module generate-jwt
 */
import type { Context } from "hono";
import { GatewayError } from "../../core/errors";
import { withModifiedHeaders } from "../../utils/headers";
import { definePolicy, Priority } from "../sdk";
import type { PolicyConfig } from "../types";
import { base64UrlEncodeBytes, base64UrlEncodeString } from "./crypto";

export interface GenerateJwtConfig extends PolicyConfig {
  /** Signing algorithm */
  algorithm: "HS256" | "HS384" | "HS512" | "RS256" | "RS384" | "RS512";
  /** HMAC secret (for HS* algorithms) */
  secret?: string;
  /** RSA private key as JWK (for RS* algorithms) */
  privateKey?: JsonWebKey;
  /** Claims to include. Static record or dynamic function. */
  claims?:
    | Record<string, unknown>
    | ((
        c: Context
      ) => Record<string, unknown> | Promise<Record<string, unknown>>);
  /** Token lifetime in seconds. Default: 3600 (1 hour) */
  expiresIn?: number;
  /** Issuer claim */
  issuer?: string;
  /** Audience claim */
  audience?: string;
  /** Header name for the generated token. Default: "Authorization" */
  headerName?: string;
  /** Token prefix. Default: "Bearer" */
  tokenPrefix?: string;
}

function getHashAlgorithm(alg: GenerateJwtConfig["algorithm"]): string {
  switch (alg) {
    case "HS256":
    case "RS256":
      return "SHA-256";
    case "HS384":
    case "RS384":
      return "SHA-384";
    case "HS512":
    case "RS512":
      return "SHA-512";
  }
}

function isHmac(alg: string): boolean {
  return alg.startsWith("HS");
}

/**
 * Mint JWTs and attach them to the request for upstream consumption.
 *
 * @example
 * ```ts
 * import { generateJwt } from "@homegrower-club/stoma";
 *
 * generateJwt({
 *   algorithm: "HS256",
 *   secret: env.JWT_SIGNING_SECRET,
 *   claims: (c) => ({ sub: c.req.header("x-user-id") }),
 *   issuer: "my-gateway",
 *   expiresIn: 300,
 * });
 * ```
 */
export const generateJwt = /*#__PURE__*/ definePolicy<GenerateJwtConfig>({
  name: "generate-jwt",
  priority: Priority.REQUEST_TRANSFORM,
  defaults: {
    expiresIn: 3600,
    headerName: "Authorization",
    tokenPrefix: "Bearer",
  },
  handler: async (c, next, { config, debug }) => {
    // Validate config at request time (allows lazy secret resolution)
    if (isHmac(config.algorithm)) {
      if (!config.secret) {
        throw new GatewayError(
          500,
          "config_error",
          "generateJwt with HMAC algorithm requires 'secret'"
        );
      }
    } else {
      if (!config.privateKey) {
        throw new GatewayError(
          500,
          "config_error",
          "generateJwt with RSA algorithm requires 'privateKey'"
        );
      }
    }

    // Build header
    const jwtHeader = { alg: config.algorithm, typ: "JWT" };
    const encodedHeader = base64UrlEncodeString(JSON.stringify(jwtHeader));

    // Build payload
    const now = Math.floor(Date.now() / 1000);
    const baseClaims: Record<string, unknown> = {
      iat: now,
      exp: now + (config.expiresIn ?? 3600),
    };
    if (config.issuer) baseClaims.iss = config.issuer;
    if (config.audience) baseClaims.aud = config.audience;

    let userClaims: Record<string, unknown> = {};
    if (config.claims) {
      userClaims =
        typeof config.claims === "function"
          ? await config.claims(c)
          : config.claims;
    }

    const payload = { ...baseClaims, ...userClaims };
    const encodedPayload = base64UrlEncodeString(JSON.stringify(payload));

    // Sign
    const signingInput = `${encodedHeader}.${encodedPayload}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(signingInput);

    const hash = getHashAlgorithm(config.algorithm);
    let signature: ArrayBuffer;

    if (isHmac(config.algorithm)) {
      const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(config.secret!),
        { name: "HMAC", hash },
        false,
        ["sign"]
      );
      signature = await crypto.subtle.sign("HMAC", key, data);
    } else {
      const key = await crypto.subtle.importKey(
        "jwk",
        config.privateKey!,
        { name: "RSASSA-PKCS1-v1_5", hash },
        false,
        ["sign"]
      );
      signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, data);
    }

    const encodedSignature = base64UrlEncodeBytes(new Uint8Array(signature));
    const token = `${signingInput}.${encodedSignature}`;

    debug(`generated JWT (alg=${config.algorithm})`);

    // Attach to request
    const headerValue = config.tokenPrefix
      ? `${config.tokenPrefix} ${token}`
      : token;

    withModifiedHeaders(c, (headers) => {
      headers.set(config.headerName!, headerValue);
    });

    await next();
  },
});

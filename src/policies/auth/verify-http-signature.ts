/**
 * Verify HTTP Message Signatures per RFC 9421.
 *
 * Validates inbound requests by parsing `Signature` + `Signature-Input` headers,
 * reconstructing the signature base, and verifying the cryptographic signature.
 *
 * @module verify-http-signature
 */

import { GatewayError } from "../../core/errors";
import { definePolicy, Priority } from "../sdk";
import type { PolicyConfig } from "../types";
import {
  algorithmToCrypto,
  buildSignatureBase,
  fromBase64,
  importVerifyKey,
  parseSignatureParams,
} from "./http-signature-base";

export interface HttpSignatureKey {
  /** HMAC secret. */
  secret?: string;
  /** RSA public key as JWK. */
  publicKey?: JsonWebKey;
  /** Algorithm identifier. */
  algorithm: string;
}

export interface VerifyHttpSignatureConfig extends PolicyConfig {
  /** Map of keyId to key material. */
  keys: Record<string, HttpSignatureKey>;
  /** Components that MUST be in the signature. Default: ["@method"]. */
  requiredComponents?: string[];
  /** Max signature age in seconds. Default: 300 (5 min). */
  maxAge?: number;
  /** Signature header name. Default: "Signature". */
  signatureHeaderName?: string;
  /** Signature-Input header name. Default: "Signature-Input". */
  signatureInputHeaderName?: string;
  /** Expected signature label. Default: "sig1". */
  label?: string;
}

export const verifyHttpSignature =
  /*#__PURE__*/ definePolicy<VerifyHttpSignatureConfig>({
    name: "verify-http-signature",
    priority: Priority.AUTH,
    defaults: {
      requiredComponents: ["@method"],
      maxAge: 300,
      signatureHeaderName: "Signature",
      signatureInputHeaderName: "Signature-Input",
      label: "sig1",
    },
    handler: async (c, next, { config, debug }) => {
      // Validate keys at request time
      if (!config.keys || Object.keys(config.keys).length === 0) {
        throw new GatewayError(
          500,
          "config_error",
          "verifyHttpSignature requires at least one key in 'keys'"
        );
      }

      const label = config.label!;

      // 1. Extract Signature-Input header
      const signatureInputHeader = c.req.header(
        config.signatureInputHeaderName!
      );
      if (!signatureInputHeader) {
        throw new GatewayError(
          401,
          "signature_invalid",
          "Missing Signature-Input header"
        );
      }

      // 2. Extract Signature header
      const signatureHeader = c.req.header(config.signatureHeaderName!);
      if (!signatureHeader) {
        throw new GatewayError(
          401,
          "signature_invalid",
          "Missing Signature header"
        );
      }

      // 3. Parse the labelled Signature-Input: label=(...);params
      const inputPrefix = `${label}=`;
      if (!signatureInputHeader.startsWith(inputPrefix)) {
        throw new GatewayError(
          401,
          "signature_invalid",
          `Missing signature label "${label}" in Signature-Input header`
        );
      }
      const inputValue = signatureInputHeader.slice(inputPrefix.length);
      const { components, params } = parseSignatureParams(inputValue);

      debug(`verifying label=${label}, components=${components.join(",")}`);

      // 4. Parse the labelled Signature: label=:<base64>:
      const sigPrefix = `${label}=:`;
      if (
        !signatureHeader.startsWith(sigPrefix) ||
        !signatureHeader.endsWith(":")
      ) {
        throw new GatewayError(
          401,
          "signature_invalid",
          `Invalid Signature header format for label "${label}"`
        );
      }
      const signatureB64 = signatureHeader.slice(sigPrefix.length, -1);

      // 5. Validate created + maxAge (signature freshness)
      const now = Math.floor(Date.now() / 1000);
      if (params.created) {
        const created = Number.parseInt(params.created, 10);
        if (created + config.maxAge! < now) {
          throw new GatewayError(
            401,
            "signature_invalid",
            "Signature has expired (maxAge exceeded)"
          );
        }
      }

      // 6. Validate expires if present
      if (params.expires) {
        const expires = Number.parseInt(params.expires, 10);
        if (expires < now) {
          throw new GatewayError(
            401,
            "signature_invalid",
            "Signature has expired (expires parameter)"
          );
        }
      }

      // 7. Check required components are present
      for (const required of config.requiredComponents!) {
        if (!components.includes(required)) {
          throw new GatewayError(
            401,
            "signature_invalid",
            `Required component "${required}" not found in signature`
          );
        }
      }

      // 8. Look up key by keyid parameter
      const keyId = params.keyid;
      if (!keyId) {
        throw new GatewayError(
          401,
          "signature_invalid",
          "Missing keyid in signature parameters"
        );
      }

      const keyEntry = config.keys[keyId];
      if (!keyEntry) {
        throw new GatewayError(
          401,
          "signature_invalid",
          "Unknown key identifier"
        );
      }

      // 9. Reconstruct the signature base
      const signatureParamsStr = inputValue;
      const signatureBase = buildSignatureBase(
        components,
        signatureParamsStr,
        c.req.raw
      );

      // 10. Verify the signature
      const key = await importVerifyKey(
        keyEntry.algorithm,
        keyEntry.secret,
        keyEntry.publicKey
      );
      const { signAlg } = algorithmToCrypto(keyEntry.algorithm);
      const encoder = new TextEncoder();
      const signatureBytes = fromBase64(signatureB64);

      const valid = await crypto.subtle.verify(
        signAlg,
        key,
        signatureBytes,
        encoder.encode(signatureBase)
      );

      if (!valid) {
        throw new GatewayError(
          401,
          "signature_invalid",
          "Signature verification failed"
        );
      }

      debug("signature verified successfully");
      await next();
    },
  });

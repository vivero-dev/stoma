/**
 * Generate HTTP Message Signatures per RFC 9421.
 *
 * Signs outbound requests by computing a signature over selected
 * request components and attaching `Signature` + `Signature-Input` headers.
 *
 * @module generate-http-signature
 */

import { GatewayError } from "../../core/errors";
import { withModifiedHeaders } from "../../utils/headers";
import { definePolicy, Priority } from "../sdk";
import type { PolicyConfig } from "../types";
import {
  algorithmToCrypto,
  buildSignatureBase,
  buildSignatureParams,
  importSigningKey,
  toBase64,
} from "./http-signature-base";

export interface GenerateHttpSignatureConfig extends PolicyConfig {
  /** Key identifier included in signature parameters. */
  keyId: string;
  /** HMAC secret for signing. */
  secret?: string;
  /** RSA private key as JWK. */
  privateKey?: JsonWebKey;
  /** Signing algorithm identifier (e.g. "hmac-sha256", "rsa-pss-sha512", "rsa-v1_5-sha256"). */
  algorithm: string;
  /** Components to include in signature. Default: ["@method", "@path", "@authority"]. */
  components?: string[];
  /** Signature header name. Default: "Signature". */
  signatureHeaderName?: string;
  /** Signature-Input header name. Default: "Signature-Input". */
  signatureInputHeaderName?: string;
  /** Signature label. Default: "sig1". */
  label?: string;
  /** Signature expiry in seconds from creation. Optional. */
  expires?: number;
  /** Include a nonce parameter. Default: false. */
  nonce?: boolean;
}

export const generateHttpSignature =
  /*#__PURE__*/ definePolicy<GenerateHttpSignatureConfig>({
    name: "generate-http-signature",
    priority: Priority.PROXY,
    defaults: {
      components: ["@method", "@path", "@authority"],
      signatureHeaderName: "Signature",
      signatureInputHeaderName: "Signature-Input",
      label: "sig1",
      nonce: false,
    },
    handler: async (c, _next, { config, debug }) => {
      // Validate key material at request time
      if (!config.secret && !config.privateKey) {
        throw new GatewayError(
          500,
          "config_error",
          "generateHttpSignature requires either 'secret' or 'privateKey'"
        );
      }

      const components = config.components!;
      const label = config.label!;
      const created = Math.floor(Date.now() / 1000);

      // Build signature params
      const paramsObj: {
        created: number;
        keyId: string;
        expires?: number;
        nonce?: string;
        algorithm?: string;
      } = {
        created,
        keyId: config.keyId,
        algorithm: config.algorithm,
      };

      if (config.expires !== undefined) {
        paramsObj.expires = created + config.expires;
      }

      if (config.nonce) {
        paramsObj.nonce = crypto.randomUUID().replace(/-/g, "");
      }

      const signatureParamsStr = buildSignatureParams(components, paramsObj);

      // Build signature base
      const signatureBase = buildSignatureBase(
        components,
        signatureParamsStr,
        c.req.raw
      );

      debug(
        `signing with ${config.algorithm}, components: ${components.join(", ")}`
      );

      // Import key and sign
      const key = await importSigningKey(
        config.algorithm,
        config.secret,
        config.privateKey
      );
      const { signAlg } = algorithmToCrypto(config.algorithm);
      const encoder = new TextEncoder();
      const signatureBytes = await crypto.subtle.sign(
        signAlg,
        key,
        encoder.encode(signatureBase)
      );

      const signatureB64 = toBase64(signatureBytes);

      withModifiedHeaders(c, (headers) => {
        headers.set(
          config.signatureInputHeaderName!,
          `${label}=${signatureParamsStr}`
        );
        headers.set(config.signatureHeaderName!, `${label}=:${signatureB64}:`);
      });

      debug("signature headers attached");

      await _next();
    },
  });

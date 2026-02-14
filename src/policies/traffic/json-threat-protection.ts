/**
 * JSON threat protection policy - structural limits on request bodies.
 *
 * Protects against JSON-based attacks by enforcing maximum depth, key count,
 * string length, array size, and raw body size. Zero external dependencies -
 * uses a recursive JSON walker.
 *
 * @module json-threat-protection
 */

import { GatewayError } from "../../core/errors";
import { definePolicy, Priority } from "../sdk";
import type { PolicyConfig } from "../types";

export interface JsonThreatProtectionConfig extends PolicyConfig {
  /** Maximum nesting depth. Default: `20`. */
  maxDepth?: number;
  /** Maximum number of keys per object. Default: `100`. */
  maxKeys?: number;
  /** Maximum string value length (also applies to object keys). Default: `10000`. */
  maxStringLength?: number;
  /** Maximum array length. Default: `100`. */
  maxArraySize?: number;
  /** Maximum raw body size in bytes. Checked BEFORE parsing. Default: `1048576` (1 MB). */
  maxBodySize?: number;
  /**
   * Content types to inspect.
   * Requests with other content types pass through without inspection.
   * Default: `["application/json"]`.
   */
  contentTypes?: string[];
}

/**
 * Recursively validate the structural constraints of a parsed JSON value.
 *
 * Throws a `GatewayError` with code `"json_threat"` if any limit is exceeded.
 */
function validateJsonStructure(
  value: unknown,
  config: {
    maxDepth: number;
    maxKeys: number;
    maxStringLength: number;
    maxArraySize: number;
  },
  currentDepth = 0
): void {
  if (currentDepth > config.maxDepth) {
    throw new GatewayError(400, "json_threat", "JSON exceeds maximum depth");
  }

  if (typeof value === "string" && value.length > config.maxStringLength) {
    throw new GatewayError(
      400,
      "json_threat",
      "String value exceeds maximum length"
    );
  }

  if (Array.isArray(value)) {
    if (value.length > config.maxArraySize) {
      throw new GatewayError(400, "json_threat", "Array exceeds maximum size");
    }
    for (const item of value) {
      validateJsonStructure(item, config, currentDepth + 1);
    }
  } else if (value !== null && typeof value === "object") {
    const keys = Object.keys(value as Record<string, unknown>);
    if (keys.length > config.maxKeys) {
      throw new GatewayError(
        400,
        "json_threat",
        "Object exceeds maximum key count"
      );
    }
    for (const key of keys) {
      if (key.length > config.maxStringLength) {
        throw new GatewayError(
          400,
          "json_threat",
          "String value exceeds maximum length"
        );
      }
      validateJsonStructure(
        (value as Record<string, unknown>)[key],
        config,
        currentDepth + 1
      );
    }
  }
}

/**
 * JSON threat protection policy.
 *
 * Enforces structural limits on JSON request bodies to prevent abuse
 * from deeply nested objects, excessively large arrays, long strings,
 * or oversized payloads. Runs at EARLY priority to reject malicious
 * payloads before they reach business logic.
 *
 * @example
 * ```ts
 * import { jsonThreatProtection } from "@homegrower-club/stoma";
 *
 * // Default limits (20 depth, 100 keys, 10K string, 100 array, 1MB body)
 * jsonThreatProtection();
 *
 * // Strict limits for a public API
 * jsonThreatProtection({
 *   maxDepth: 5,
 *   maxKeys: 20,
 *   maxStringLength: 1000,
 *   maxArraySize: 50,
 *   maxBodySize: 102400, // 100KB
 * });
 * ```
 */
export const jsonThreatProtection =
  /*#__PURE__*/ definePolicy<JsonThreatProtectionConfig>({
    name: "json-threat-protection",
    priority: Priority.EARLY,
    phases: ["request-body"],
    defaults: {
      maxDepth: 20,
      maxKeys: 100,
      maxStringLength: 10000,
      maxArraySize: 100,
      maxBodySize: 1048576,
      contentTypes: ["application/json"],
    },
    handler: async (c, next, { config, debug }) => {
      const contentType = c.req.header("content-type") ?? "";
      const matchedType = config.contentTypes!.some((ct) =>
        contentType.includes(ct)
      );

      if (!matchedType) {
        debug("skipping - content type %s not inspected", contentType);
        await next();
        return;
      }

      // Check Content-Length against maxBodySize BEFORE parsing
      const contentLength = c.req.header("content-length");
      if (contentLength !== undefined) {
        const length = Number.parseInt(contentLength, 10);
        if (!Number.isNaN(length) && length > config.maxBodySize!) {
          debug("body size %d exceeds max %d", length, config.maxBodySize);
          throw new GatewayError(
            413,
            "body_too_large",
            "Request body exceeds maximum size"
          );
        }
      }

      // Clone the request so downstream handlers can still read the body
      const cloned = c.req.raw.clone();
      const text = await cloned.text();

      if (!text) {
        debug("empty body - passing through");
        await next();
        return;
      }

      // Parse JSON
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        debug("invalid JSON");
        throw new GatewayError(
          400,
          "invalid_json",
          "Invalid JSON in request body"
        );
      }

      // Walk the parsed JSON and validate structural limits
      validateJsonStructure(parsed, {
        maxDepth: config.maxDepth!,
        maxKeys: config.maxKeys!,
        maxStringLength: config.maxStringLength!,
        maxArraySize: config.maxArraySize!,
      });

      debug("JSON structure validated");
      await next();
    },
    evaluate: {
      onRequest: async (input, { config, debug }) => {
        const contentType = input.headers.get("content-type") ?? "";
        const matchedType = config.contentTypes!.some((ct) =>
          contentType.includes(ct)
        );

        if (!matchedType) {
          debug("skipping - content type %s not inspected", contentType);
          return { action: "continue" };
        }

        // Check Content-Length against maxBodySize BEFORE parsing
        const contentLength = input.headers.get("content-length");
        if (contentLength) {
          const length = Number.parseInt(contentLength, 10);
          if (!Number.isNaN(length) && length > config.maxBodySize!) {
            debug("body size %d exceeds max %d", length, config.maxBodySize);
            return {
              action: "reject",
              status: 413,
              code: "body_too_large",
              message: "Request body exceeds maximum size",
            };
          }
        }

        // Parse JSON
        let parsed: unknown;
        try {
          if (!input.body) {
            debug("empty body - passing through");
            return { action: "continue" };
          }
          const bodyStr =
            typeof input.body === "string"
              ? input.body
              : new TextDecoder().decode(input.body);
          parsed = JSON.parse(bodyStr);
        } catch {
          debug("invalid JSON");
          return {
            action: "reject",
            status: 400,
            code: "invalid_json",
            message: "Invalid JSON in request body",
          };
        }

        // Walk the parsed JSON and validate structural limits
        try {
          validateJsonStructure(parsed, {
            maxDepth: config.maxDepth!,
            maxKeys: config.maxKeys!,
            maxStringLength: config.maxStringLength!,
            maxArraySize: config.maxArraySize!,
          });
        } catch (err) {
          if (err instanceof GatewayError) {
            return {
              action: "reject",
              status: err.statusCode,
              code: err.code,
              message: err.message,
            };
          }
          throw err;
        }

        debug("JSON structure validated");
        return { action: "continue" };
      },
    },
  });

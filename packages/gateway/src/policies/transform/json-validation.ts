/**
 * JSON body validation policy - pluggable validation with zero dependencies.
 *
 * Accepts a user-provided `validate` function that can wrap any validation
 * library (Zod, AJV, Valibot, TypeBox, etc.). When no validator is provided,
 * the policy simply checks that the request body is valid JSON.
 *
 * @module json-validation
 */

import { GatewayError } from "../../core/errors";
import { definePolicy, Priority } from "../sdk";
import type { PolicyConfig } from "../types";

/** Result shape returned by the user-provided validation function. */
export interface JsonValidationResult {
  valid: boolean;
  errors?: string[];
}

export interface JsonValidationConfig extends PolicyConfig {
  /** Custom validation function. Takes parsed body, returns validation result. */
  validate?: (
    body: unknown
  ) => JsonValidationResult | Promise<JsonValidationResult>;
  /** Content types to validate. Default: ["application/json"] */
  contentTypes?: string[];
  /** HTTP status code on validation failure. Default: 422 */
  rejectStatus?: number;
  /** Include validation errors in response. Default: true */
  errorDetail?: boolean;
}

/**
 * Pluggable JSON body validation policy.
 *
 * Validates the request body using a user-provided function. When no
 * `validate` function is configured, checks that the body is parseable JSON.
 * Requests with content types not in the configured list pass through
 * without validation.
 *
 * @example
 * ```ts
 * import { jsonValidation } from "@homegrower-club/stoma";
 *
 * // With Zod
 * jsonValidation({
 *   validate: (body) => {
 *     const result = myZodSchema.safeParse(body);
 *     return {
 *       valid: result.success,
 *       errors: result.success ? undefined : result.error.issues.map(i => i.message),
 *     };
 *   },
 * });
 *
 * // Just validate JSON is parseable (no validate function)
 * jsonValidation();
 * ```
 */
export const jsonValidation = /*#__PURE__*/ definePolicy<JsonValidationConfig>({
  name: "json-validation",
  priority: Priority.AUTH,
  phases: ["request-body"],
  defaults: {
    contentTypes: ["application/json"],
    rejectStatus: 422,
    errorDetail: true,
  },
  handler: async (c, next, { config, debug }) => {
    const contentType = c.req.header("content-type") ?? "";
    const matchedType = config.contentTypes!.some((ct) =>
      contentType.includes(ct)
    );

    if (!matchedType) {
      debug(
        "skipping - content type %s not in %o",
        contentType,
        config.contentTypes
      );
      await next();
      return;
    }

    // Clone the request to avoid consuming the body stream for downstream handlers
    let parsed: unknown;
    try {
      const cloned = c.req.raw.clone();
      const text = await cloned.text();
      if (!text) {
        // Empty body with JSON content-type - treat as parse failure
        debug("empty body with JSON content type");
        throw new GatewayError(
          config.rejectStatus!,
          "validation_failed",
          "Request body is empty"
        );
      }
      parsed = JSON.parse(text);
    } catch (err) {
      if (err instanceof GatewayError) throw err;
      debug("body parse failed");
      throw new GatewayError(
        config.rejectStatus!,
        "validation_failed",
        "Request body is not valid JSON"
      );
    }

    // If no validate function provided, valid JSON parse is sufficient
    if (!config.validate) {
      debug("no validator configured - JSON parsed successfully");
      await next();
      return;
    }

    const result = await config.validate(parsed);

    if (!result.valid) {
      const message =
        config.errorDetail && result.errors && result.errors.length > 0
          ? `Validation failed: ${result.errors.join("; ")}`
          : "Validation failed";
      debug("validation failed: %s", message);
      throw new GatewayError(
        config.rejectStatus!,
        "validation_failed",
        message
      );
    }

    debug("validation passed");
    await next();
  },
  evaluate: {
    onRequest: async (input, { config, debug }) => {
      const contentType = input.headers.get("content-type") ?? "";
      const matchedType = config.contentTypes!.some((ct) =>
        contentType.includes(ct)
      );

      if (!matchedType) {
        debug(
          "skipping - content type %s not in %o",
          contentType,
          config.contentTypes
        );
        return { action: "continue" };
      }

      // Parse body
      let parsed: unknown;
      try {
        if (!input.body) {
          debug("empty body with JSON content type");
          return {
            action: "reject",
            status: config.rejectStatus!,
            code: "validation_failed",
            message: "Request body is empty",
          };
        }
        const bodyStr =
          typeof input.body === "string"
            ? input.body
            : new TextDecoder().decode(input.body);
        parsed = JSON.parse(bodyStr);
      } catch {
        debug("body parse failed");
        return {
          action: "reject",
          status: config.rejectStatus!,
          code: "validation_failed",
          message: "Request body is not valid JSON",
        };
      }

      // If no validate function provided, valid JSON parse is sufficient
      if (!config.validate) {
        debug("no validator configured - JSON parsed successfully");
        return { action: "continue" };
      }

      const result = await config.validate(parsed);

      if (!result.valid) {
        const message =
          config.errorDetail && result.errors && result.errors.length > 0
            ? `Validation failed: ${result.errors.join("; ")}`
            : "Validation failed";
        debug("validation failed: %s", message);
        return {
          action: "reject",
          status: config.rejectStatus!,
          code: "validation_failed",
          message,
        };
      }

      debug("validation passed");
      return { action: "continue" };
    },
  },
});

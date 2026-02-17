/**
 * Request validation policy - pluggable body validation with zero dependencies.
 *
 * The gateway library has no validation dependencies (no ajv, no zod at runtime).
 * The user provides their own `validate` or `validateAsync` function. This keeps
 * the library dependency-free while supporting any schema validation approach.
 *
 * @module request-validation
 */

import { GatewayError } from "../../core/errors";
import { definePolicy, Priority } from "../sdk";
import type { PolicyConfig } from "../types";

/** Result shape returned by validation functions that provide error details. */
interface ValidationResult {
  valid: boolean;
  errors?: string[];
}

export interface RequestValidationConfig extends PolicyConfig {
  /**
   * Synchronous validation function.
   * Return `true`/`false` or an object with optional error details.
   */
  validate?: (body: unknown) => boolean | ValidationResult;
  /**
   * Async validation function (e.g., for remote schema validation).
   * If both `validate` and `validateAsync` are provided, `validateAsync` takes precedence.
   */
  validateAsync?: (body: unknown) => Promise<boolean | ValidationResult>;
  /**
   * Only validate these content types.
   * Requests with other content types pass through without validation.
   * Default: `["application/json"]`.
   */
  contentTypes?: string[];
  /** Custom error message prefix. Default: `"Request validation failed"`. */
  errorMessage?: string;
}

/**
 * Normalize a validation return value into a `{ valid, errors? }` shape.
 */
function normalizeResult(result: boolean | ValidationResult): ValidationResult {
  if (typeof result === "boolean") {
    return { valid: result };
  }
  return result;
}

/**
 * Pluggable request body validation policy.
 *
 * Validates the request body using a user-provided sync or async function.
 * Requests with content types not in the configured list pass through
 * without validation.
 *
 * @example
 * ```ts
 * import { requestValidation } from "@homegrower-club/stoma";
 *
 * // Simple boolean validator
 * requestValidation({
 *   validate: (body) => body != null && typeof body === "object",
 * });
 *
 * // Detailed validation with error messages
 * requestValidation({
 *   validate: (body) => {
 *     const errors: string[] = [];
 *     if (!body || typeof body !== "object") errors.push("Body must be an object");
 *     return { valid: errors.length === 0, errors };
 *   },
 * });
 * ```
 */
export const requestValidation =
  /*#__PURE__*/ definePolicy<RequestValidationConfig>({
    name: "request-validation",
    priority: Priority.AUTH,
    phases: ["request-body"],
    defaults: {
      contentTypes: ["application/json"],
      errorMessage: "Request validation failed",
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
        parsed = JSON.parse(text);
      } catch {
        debug("body parse failed");
        throw new GatewayError(
          400,
          "validation_failed",
          `${config.errorMessage!}: invalid JSON`
        );
      }

      // Run async validator if provided, otherwise sync
      const validatorFn = config.validateAsync ?? config.validate;
      if (!validatorFn) {
        debug("no validator configured - passing through");
        await next();
        return;
      }

      const rawResult = await validatorFn(parsed);
      const result = normalizeResult(rawResult);

      if (!result.valid) {
        const details =
          result.errors && result.errors.length > 0
            ? `${config.errorMessage!}: ${result.errors.join("; ")}`
            : config.errorMessage!;
        debug("validation failed: %s", details);
        throw new GatewayError(400, "validation_failed", details);
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
            debug("body parse failed");
            return {
              action: "reject",
              status: 400,
              code: "validation_failed",
              message: `${config.errorMessage!}: invalid JSON`,
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
            status: 400,
            code: "validation_failed",
            message: `${config.errorMessage!}: invalid JSON`,
          };
        }

        // Run async validator if provided, otherwise sync
        const validatorFn = config.validateAsync ?? config.validate;
        if (!validatorFn) {
          debug("no validator configured - passing through");
          return { action: "continue" };
        }

        const rawResult = await validatorFn(parsed);
        const result = normalizeResult(rawResult);

        if (!result.valid) {
          const details =
            result.errors && result.errors.length > 0
              ? `${config.errorMessage!}: ${result.errors.join("; ")}`
              : config.errorMessage!;
          debug("validation failed: %s", details);
          return {
            action: "reject",
            status: 400,
            code: "validation_failed",
            message: details,
          };
        }

        debug("validation passed");
        return { action: "continue" };
      },
    },
  });

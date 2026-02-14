/**
 * Request and response header transformation policies.
 *
 * @module transform
 */

import type { Mutation } from "../../core/protocol";
import { withModifiedHeaders } from "../../utils/headers";
import { definePolicy, Priority } from "../sdk";
import type { PolicyConfig } from "../types";

export interface RequestTransformConfig extends PolicyConfig {
  /** Headers to add or overwrite on the outgoing request. */
  setHeaders?: Record<string, string>;
  /** Header names to remove from the outgoing request. */
  removeHeaders?: string[];
  /** Rename headers: keys are old names, values are new names. */
  renameHeaders?: Record<string, string>;
}

export interface ResponseTransformConfig extends PolicyConfig {
  /** Headers to add or overwrite on the response. */
  setHeaders?: Record<string, string>;
  /** Header names to remove from the response. */
  removeHeaders?: string[];
  /** Rename headers: keys are old names, values are new names. */
  renameHeaders?: Record<string, string>;
}

/**
 * Modify request headers before they reach the upstream service.
 *
 * Applies header transformations in order: rename → set → remove. Handles
 * Cloudflare Workers' immutable `Request.headers` by cloning the request
 * with modified headers.
 *
 * @param config - Header set/remove/rename operations. At least one should be provided.
 * @returns A {@link Policy} at priority 50 (mid-pipeline, after auth, before upstream).
 *
 * @example
 * ```ts
 * import { requestTransform } from "@homegrower-club/stoma/policies";
 *
 * // Add API version header and strip cookies
 * requestTransform({
 *   setHeaders: { "x-api-version": "2024-01-01" },
 *   removeHeaders: ["cookie"],
 * });
 *
 * // Rename a legacy header to the new convention
 * requestTransform({
 *   renameHeaders: { "x-old-auth": "authorization" },
 * });
 * ```
 */
export const requestTransform =
  /*#__PURE__*/ definePolicy<RequestTransformConfig>({
    name: "request-transform",
    priority: Priority.REQUEST_TRANSFORM,
    phases: ["request-headers"],
    handler: async (c, next, { config }) => {
      const setHeaders = config.setHeaders;
      const removeHeaders = config.removeHeaders;
      const renameHeaders = config.renameHeaders;

      withModifiedHeaders(c, (headers) => {
        // Rename before set/remove so renames don't collide
        if (renameHeaders) {
          for (const [oldName, newName] of Object.entries(renameHeaders)) {
            const value = headers.get(oldName);
            if (value !== null) {
              headers.set(newName, value);
              headers.delete(oldName);
            }
          }
        }

        if (setHeaders) {
          for (const [name, value] of Object.entries(setHeaders)) {
            headers.set(name, value);
          }
        }

        if (removeHeaders) {
          for (const name of removeHeaders) {
            headers.delete(name);
          }
        }
      });

      await next();
    },
    evaluate: {
      onRequest: async (_input, { config }) => {
        const mutations: Mutation[] = [];

        // Set headers
        if (config.setHeaders) {
          for (const [name, value] of Object.entries(config.setHeaders)) {
            mutations.push({
              type: "header",
              op: "set" as const,
              name,
              value,
            });
          }
        }

        // Remove headers
        if (config.removeHeaders) {
          for (const name of config.removeHeaders) {
            mutations.push({
              type: "header",
              op: "remove" as const,
              name,
            });
          }
        }

        return mutations.length > 0
          ? { action: "continue", mutations }
          : { action: "continue" };
      },
    },
  });

/**
 * Modify response headers after the upstream service returns.
 *
 * Applies header transformations in order: rename → set → remove. Runs at
 * priority 92 (late in the pipeline) so it can modify headers set by the
 * upstream or earlier policies.
 *
 * @param config - Header set/remove/rename operations. At least one should be provided.
 * @returns A {@link Policy} at priority 92 (runs late, after upstream responds).
 *
 * @example
 * ```ts
 * import { responseTransform } from "@homegrower-club/stoma/policies";
 *
 * // Add security headers and strip server info
 * responseTransform({
 *   setHeaders: {
 *     "strict-transport-security": "max-age=31536000; includeSubDomains",
 *     "x-content-type-options": "nosniff",
 *   },
 *   removeHeaders: ["server", "x-powered-by"],
 * });
 * ```
 */
export const responseTransform =
  /*#__PURE__*/ definePolicy<ResponseTransformConfig>({
    name: "response-transform",
    priority: Priority.RESPONSE_TRANSFORM,
    phases: ["response-headers"],
    handler: async (c, next, { config }) => {
      await next();

      // Response headers are mutable (we create the Response ourselves
      // in the upstream handler), so direct mutation is safe here.
      // Note: Request headers need cloning because Workers makes them immutable.

      // Rename before set/remove
      if (config.renameHeaders) {
        for (const [oldName, newName] of Object.entries(config.renameHeaders)) {
          const value = c.res.headers.get(oldName);
          if (value !== null) {
            c.res.headers.set(newName, value);
            c.res.headers.delete(oldName);
          }
        }
      }

      if (config.setHeaders) {
        for (const [name, value] of Object.entries(config.setHeaders)) {
          c.res.headers.set(name, value);
        }
      }

      if (config.removeHeaders) {
        for (const name of config.removeHeaders) {
          c.res.headers.delete(name);
        }
      }
    },
    evaluate: {
      onResponse: async (_input, { config }) => {
        const mutations: Mutation[] = [];

        // Set headers
        if (config.setHeaders) {
          for (const [name, value] of Object.entries(config.setHeaders)) {
            mutations.push({
              type: "header",
              op: "set" as const,
              name,
              value,
            });
          }
        }

        // Remove headers
        if (config.removeHeaders) {
          for (const name of config.removeHeaders) {
            mutations.push({
              type: "header",
              op: "remove" as const,
              name,
            });
          }
        }

        return mutations.length > 0
          ? { action: "continue", mutations }
          : { action: "continue" };
      },
    },
  });

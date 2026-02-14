/**
 * Resource filter policy - strip or allow fields from JSON responses.
 *
 * Runs after the upstream response and modifies the JSON body by either
 * removing specified fields (deny mode) or keeping only specified fields
 * (allow mode). Supports dot-notation for nested field paths.
 *
 * @module resource-filter
 */

import type { Mutation } from "../../core/protocol";
import { definePolicy, Priority } from "../sdk";
import type { PolicyConfig } from "../types";

export interface ResourceFilterConfig extends PolicyConfig {
  /** Filter mode: "deny" removes listed fields, "allow" keeps only listed fields */
  mode: "allow" | "deny";
  /** Field paths to filter. Supports dot-notation (e.g. "user.password") */
  fields: string[];
  /** Content types to filter. Default: ["application/json"] */
  contentTypes?: string[];
  /** Apply filtering to array items. Default: true */
  applyToArrayItems?: boolean;
}

/**
 * Delete a nested field from an object using dot-notation path.
 */
function deleteField(obj: Record<string, unknown>, path: string): void {
  const parts = path.split(".");
  let current: Record<string, unknown> = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (current == null || typeof current !== "object") return;
    current = current[parts[i]] as Record<string, unknown>;
  }
  if (current != null && typeof current === "object") {
    delete current[parts[parts.length - 1]];
  }
}

/**
 * Build a new object containing only the specified field paths.
 */
function allowFields(
  obj: Record<string, unknown>,
  paths: string[]
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const path of paths) {
    const parts = path.split(".");
    let source: Record<string, unknown> = obj;
    let target: Record<string, unknown> = result;
    for (let i = 0; i < parts.length; i++) {
      if (source == null || typeof source !== "object") break;
      if (i === parts.length - 1) {
        if (parts[i] in source) {
          target[parts[i]] = source[parts[i]];
        }
      } else {
        if (!(parts[i] in target)) {
          target[parts[i]] = {};
        }
        target = target[parts[i]] as Record<string, unknown>;
        source = source[parts[i]] as Record<string, unknown>;
      }
    }
  }
  return result;
}

/**
 * Apply field filtering to a single object based on mode.
 */
function filterObject(
  obj: Record<string, unknown>,
  mode: "allow" | "deny",
  fields: string[]
): Record<string, unknown> {
  if (mode === "allow") {
    return allowFields(obj, fields);
  }
  // deny mode - clone shallowly and delete fields
  const clone = structuredClone(obj);
  for (const field of fields) {
    deleteField(clone, field);
  }
  return clone;
}

/**
 * Strip or allow fields from JSON responses.
 *
 * @example
 * ```ts
 * import { resourceFilter } from "@homegrower-club/stoma";
 *
 * // Remove sensitive fields
 * resourceFilter({
 *   mode: "deny",
 *   fields: ["password", "user.ssn"],
 * });
 *
 * // Keep only specific fields
 * resourceFilter({
 *   mode: "allow",
 *   fields: ["id", "name", "email"],
 * });
 * ```
 */
export const resourceFilter = /*#__PURE__*/ definePolicy<ResourceFilterConfig>({
  name: "resource-filter",
  priority: Priority.RESPONSE_TRANSFORM,
  phases: ["response-body"],
  defaults: {
    contentTypes: ["application/json"],
    applyToArrayItems: true,
  },
  handler: async (c, next, { config, debug }) => {
    await next();

    if (config.fields.length === 0) {
      debug("no fields configured - passing through");
      return;
    }

    const contentType = c.res.headers.get("content-type") ?? "";
    const matchedType = config.contentTypes!.some((ct) =>
      contentType.includes(ct)
    );

    if (!matchedType) {
      debug(
        "skipping - response content type %s not in %o",
        contentType,
        config.contentTypes
      );
      return;
    }

    let body: unknown;
    try {
      const text = await c.res.text();
      body = JSON.parse(text);
    } catch {
      debug("response body is not valid JSON - passing through");
      return;
    }

    let filtered: unknown;
    if (Array.isArray(body)) {
      if (config.applyToArrayItems) {
        filtered = body.map((item) =>
          item != null && typeof item === "object"
            ? filterObject(
                item as Record<string, unknown>,
                config.mode,
                config.fields
              )
            : item
        );
      } else {
        // applyToArrayItems: false - don't filter array items
        filtered = body;
      }
    } else if (body != null && typeof body === "object") {
      filtered = filterObject(
        body as Record<string, unknown>,
        config.mode,
        config.fields
      );
    } else {
      // Primitive JSON value - nothing to filter
      filtered = body;
    }

    debug(
      "filtered response with mode=%s fields=%o",
      config.mode,
      config.fields
    );

    c.res = new Response(JSON.stringify(filtered), {
      status: c.res.status,
      headers: c.res.headers,
    });
  },
  evaluate: {
    onResponse: async (input, { config, debug }) => {
      if (config.fields.length === 0) {
        debug("no fields configured - passing through");
        return { action: "continue" };
      }

      const contentType = input.headers.get("content-type") ?? "";
      const matchedType = config.contentTypes!.some((ct) =>
        contentType.includes(ct)
      );

      if (!matchedType) {
        debug(
          "skipping - response content type %s not in %o",
          contentType,
          config.contentTypes
        );
        return { action: "continue" };
      }

      // Parse body
      let body: unknown;
      try {
        if (!input.body) {
          return { action: "continue" };
        }
        const bodyStr =
          typeof input.body === "string"
            ? input.body
            : new TextDecoder().decode(input.body);
        body = JSON.parse(bodyStr);
      } catch {
        debug("response body is not valid JSON - passing through");
        return { action: "continue" };
      }

      let filtered: unknown;
      if (Array.isArray(body)) {
        if (config.applyToArrayItems) {
          filtered = body.map((item) =>
            item != null && typeof item === "object"
              ? filterObject(
                  item as Record<string, unknown>,
                  config.mode,
                  config.fields
                )
              : item
          );
        } else {
          filtered = body;
        }
      } else if (body != null && typeof body === "object") {
        filtered = filterObject(
          body as Record<string, unknown>,
          config.mode,
          config.fields
        );
      } else {
        filtered = body;
      }

      debug(
        "filtered response with mode=%s fields=%o",
        config.mode,
        config.fields
      );

      return {
        action: "continue",
        mutations: [
          {
            type: "body",
            op: "replace",
            content: JSON.stringify(filtered),
          } as Mutation,
        ],
      };
    },
  },
});

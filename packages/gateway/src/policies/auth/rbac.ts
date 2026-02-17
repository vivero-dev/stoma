/**
 * Role-based access control policy.
 *
 * Uses claims forwarded as request headers by upstream auth policies
 * (jwt-auth's `forwardClaims` or oauth2's `forwardTokenInfo`).
 *
 * @module rbac
 */

import { GatewayError } from "../../core/errors";
import { withModifiedHeaders } from "../../utils/headers";
import { definePolicy, Priority } from "../sdk";
import type { PolicyConfig } from "../types";

export interface RbacConfig extends PolicyConfig {
  /** Header name containing the user's role(s). Default: "x-user-role". */
  roleHeader?: string;
  /** Allowed roles - pass if user has ANY of these. */
  roles?: string[];
  /** Required permissions - pass if user has ALL of these. */
  permissions?: string[];
  /** Header containing permissions. Default: "x-user-permissions". */
  permissionHeader?: string;
  /** Delimiter for permission string. Default: ",". */
  permissionDelimiter?: string;
  /** Delimiter for role string. Default: ",". */
  roleDelimiter?: string;
  /** Custom deny message. Default: "Access denied: insufficient permissions". */
  denyMessage?: string;
  /**
   * Strip role/permission headers from incoming requests for security.
   * These headers should only be set by trusted upstream auth policies,
   * not by external clients. Default: true.
   */
  stripHeaders?: boolean;
}

export const rbac = /*#__PURE__*/ definePolicy<RbacConfig>({
  name: "rbac",
  priority: Priority.AUTH,
  defaults: {
    roleHeader: "x-user-role",
    permissionHeader: "x-user-permissions",
    permissionDelimiter: ",",
    roleDelimiter: ",",
    denyMessage: "Access denied: insufficient permissions",
    stripHeaders: true,
  },
  phases: ["request-headers"],
  handler: async (c, next, { config, debug }) => {
    if (config.stripHeaders) {
      withModifiedHeaders(c, (headers) => {
        if (config.roleHeader && headers.has(config.roleHeader)) {
          headers.delete(config.roleHeader);
          debug("stripped role header from incoming request");
        }
        if (config.permissionHeader && headers.has(config.permissionHeader)) {
          headers.delete(config.permissionHeader);
          debug("stripped permission header from incoming request");
        }
      });
    }

    const hasRoleCheck = config.roles && config.roles.length > 0;
    const hasPermCheck = config.permissions && config.permissions.length > 0;

    // If neither is configured, pass through
    if (!hasRoleCheck && !hasPermCheck) {
      debug("no roles or permissions configured, passing through");
      await next();
      return;
    }

    // Read roles from header
    if (hasRoleCheck) {
      const roleHeaderValue = c.req.header(config.roleHeader!) ?? "";
      const userRoles = roleHeaderValue
        ? roleHeaderValue.split(config.roleDelimiter!).map((r) => r.trim())
        : [];

      debug(
        `checking roles: user=${userRoles.join(",")} required=${config.roles!.join(",")}`
      );

      const hasMatchingRole = config.roles!.some((role) =>
        userRoles.includes(role)
      );
      if (!hasMatchingRole) {
        throw new GatewayError(403, "forbidden", config.denyMessage!);
      }
    }

    // Read permissions from header
    if (hasPermCheck) {
      const permHeaderValue = c.req.header(config.permissionHeader!) ?? "";
      const userPermissions = permHeaderValue
        ? permHeaderValue
            .split(config.permissionDelimiter!)
            .map((p) => p.trim())
        : [];

      debug(
        `checking permissions: user=${userPermissions.join(",")} required=${config.permissions!.join(",")}`
      );

      const hasAllPermissions = config.permissions!.every((perm) =>
        userPermissions.includes(perm)
      );
      if (!hasAllPermissions) {
        throw new GatewayError(403, "forbidden", config.denyMessage!);
      }
    }

    await next();
  },
  evaluate: {
    onRequest: async (input, { config, debug }) => {
      const hasRoleCheck = config.roles && config.roles.length > 0;
      const hasPermCheck = config.permissions && config.permissions.length > 0;

      if (!hasRoleCheck && !hasPermCheck) {
        debug("no roles or permissions configured, passing through");
        return { action: "continue" };
      }

      if (hasRoleCheck) {
        const roleHeaderValue = input.headers.get(config.roleHeader!) ?? "";
        const userRoles = roleHeaderValue
          ? roleHeaderValue.split(config.roleDelimiter!).map((r) => r.trim())
          : [];

        debug(
          `checking roles: user=${userRoles.join(",")} required=${config.roles!.join(",")}`
        );

        const hasMatchingRole = config.roles!.some((role) =>
          userRoles.includes(role)
        );
        if (!hasMatchingRole) {
          return {
            action: "reject",
            status: 403,
            code: "forbidden",
            message: config.denyMessage!,
          };
        }
      }

      if (hasPermCheck) {
        const permHeaderValue =
          input.headers.get(config.permissionHeader!) ?? "";
        const userPermissions = permHeaderValue
          ? permHeaderValue
              .split(config.permissionDelimiter!)
              .map((p) => p.trim())
          : [];

        debug(
          `checking permissions: user=${userPermissions.join(",")} required=${config.permissions!.join(",")}`
        );

        const hasAllPermissions = config.permissions!.every((perm) =>
          userPermissions.includes(perm)
        );
        if (!hasAllPermissions) {
          return {
            action: "reject",
            status: 403,
            code: "forbidden",
            message: config.denyMessage!,
          };
        }
      }

      return { action: "continue" };
    },
  },
});

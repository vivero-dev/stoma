import { describe, it, expect } from "vitest";
import { createPolicyTestHarness } from "../../sdk";
import { rbac } from "../rbac";

interface ErrorBody {
  error: string;
  message: string;
  statusCode: number;
}

describe("rbac", () => {
  // --- Role checks ---

  it("should pass when user has a matching role", async () => {
    const { request } = createPolicyTestHarness(
      rbac({ roles: ["admin", "editor"] }),
    );
    const res = await request("/test", {
      headers: { "x-user-role": "admin" },
    });
    expect(res.status).toBe(200);
  });

  it("should reject when user has no matching role", async () => {
    const { request } = createPolicyTestHarness(
      rbac({ roles: ["admin", "editor"] }),
    );
    const res = await request("/test", {
      headers: { "x-user-role": "viewer" },
    });
    expect(res.status).toBe(403);
    const body = (await res.json()) as ErrorBody;
    expect(body.error).toBe("forbidden");
  });

  it("should handle multiple roles in header (comma-separated)", async () => {
    const { request } = createPolicyTestHarness(
      rbac({ roles: ["editor"] }),
    );
    const res = await request("/test", {
      headers: { "x-user-role": "viewer,editor,user" },
    });
    expect(res.status).toBe(200);
  });

  // --- Permission checks ---

  it("should pass when user has all required permissions", async () => {
    const { request } = createPolicyTestHarness(
      rbac({ permissions: ["read", "write"] }),
    );
    const res = await request("/test", {
      headers: { "x-user-permissions": "read,write,delete" },
    });
    expect(res.status).toBe(200);
  });

  it("should reject when user is missing a permission", async () => {
    const { request } = createPolicyTestHarness(
      rbac({ permissions: ["read", "write", "delete"] }),
    );
    const res = await request("/test", {
      headers: { "x-user-permissions": "read,write" },
    });
    expect(res.status).toBe(403);
  });

  // --- Both roles and permissions ---

  it("should pass when both roles and permissions are satisfied", async () => {
    const { request } = createPolicyTestHarness(
      rbac({
        roles: ["admin"],
        permissions: ["write"],
      }),
    );
    const res = await request("/test", {
      headers: {
        "x-user-role": "admin",
        "x-user-permissions": "read,write",
      },
    });
    expect(res.status).toBe(200);
  });

  it("should reject when role matches but permissions do not", async () => {
    const { request } = createPolicyTestHarness(
      rbac({
        roles: ["admin"],
        permissions: ["write", "delete"],
      }),
    );
    const res = await request("/test", {
      headers: {
        "x-user-role": "admin",
        "x-user-permissions": "read,write",
      },
    });
    expect(res.status).toBe(403);
  });

  it("should reject when permissions match but role does not", async () => {
    const { request } = createPolicyTestHarness(
      rbac({
        roles: ["admin"],
        permissions: ["read"],
      }),
    );
    const res = await request("/test", {
      headers: {
        "x-user-role": "viewer",
        "x-user-permissions": "read,write",
      },
    });
    expect(res.status).toBe(403);
  });

  // --- Custom headers and delimiters ---

  it("should support custom role and permission headers", async () => {
    const { request } = createPolicyTestHarness(
      rbac({
        roleHeader: "x-custom-role",
        permissionHeader: "x-custom-perms",
        roles: ["superuser"],
        permissions: ["manage"],
      }),
    );
    const res = await request("/test", {
      headers: {
        "x-custom-role": "superuser",
        "x-custom-perms": "manage,view",
      },
    });
    expect(res.status).toBe(200);
  });

  it("should support custom delimiters", async () => {
    const { request } = createPolicyTestHarness(
      rbac({
        roles: ["admin"],
        roleDelimiter: "|",
        permissions: ["write"],
        permissionDelimiter: ";",
      }),
    );
    const res = await request("/test", {
      headers: {
        "x-user-role": "viewer|admin",
        "x-user-permissions": "read;write",
      },
    });
    expect(res.status).toBe(200);
  });

  // --- No restrictions ---

  it("should pass through when no roles or permissions are configured", async () => {
    const { request } = createPolicyTestHarness(rbac({}));
    const res = await request("/test");
    expect(res.status).toBe(200);
  });

  // --- Missing header ---

  it("should return 403 when role header is missing and roles are required", async () => {
    const { request } = createPolicyTestHarness(
      rbac({ roles: ["admin"] }),
    );
    const res = await request("/test");
    expect(res.status).toBe(403);
  });

  // --- Custom deny message ---

  it("should use custom deny message", async () => {
    const { request } = createPolicyTestHarness(
      rbac({
        roles: ["admin"],
        denyMessage: "You shall not pass!",
      }),
    );
    const res = await request("/test", {
      headers: { "x-user-role": "viewer" },
    });
    expect(res.status).toBe(403);
    const body = (await res.json()) as ErrorBody;
    expect(body.message).toBe("You shall not pass!");
  });

  // --- Skip logic ---

  it("should skip when skip function returns true", async () => {
    const { request } = createPolicyTestHarness(
      rbac({
        roles: ["admin"],
        skip: () => true,
      }),
    );
    // No role header — would normally 403, but skip bypasses
    const res = await request("/test");
    expect(res.status).toBe(200);
  });
});

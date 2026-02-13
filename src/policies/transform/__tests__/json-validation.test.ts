import { describe, expect, it } from "vitest";
import { createPolicyTestHarness } from "../../sdk";
import { jsonValidation } from "../json-validation";

describe("jsonValidation", () => {
  it("should pass valid JSON body through", async () => {
    const { request } = createPolicyTestHarness(
      jsonValidation({
        validate: (body) => {
          const obj = body as Record<string, unknown>;
          return { valid: obj.name !== undefined };
        },
      })
    );
    const res = await request("/test", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Alice" }),
    });
    expect(res.status).toBe(200);
  });

  it("should reject invalid body with 422 by default", async () => {
    const { request } = createPolicyTestHarness(
      jsonValidation({
        validate: () => ({ valid: false, errors: ["name is required"] }),
      })
    );
    const res = await request("/test", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ bad: true }),
    });
    expect(res.status).toBe(422);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.error).toBe("validation_failed");
  });

  it("should include validation errors when errorDetail is true (default)", async () => {
    const { request } = createPolicyTestHarness(
      jsonValidation({
        validate: () => ({
          valid: false,
          errors: ["name is required", "age must be a number"],
        }),
      })
    );
    const res = await request("/test", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(422);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.message).toContain("name is required");
    expect(body.message).toContain("age must be a number");
  });

  it("should hide validation errors when errorDetail is false", async () => {
    const { request } = createPolicyTestHarness(
      jsonValidation({
        validate: () => ({
          valid: false,
          errors: ["secret internal detail"],
        }),
        errorDetail: false,
      })
    );
    const res = await request("/test", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(422);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.message).toBe("Validation failed");
    expect(body.message).not.toContain("secret internal detail");
  });

  it("should support async validate function", async () => {
    const { request } = createPolicyTestHarness(
      jsonValidation({
        validate: async (body) => {
          const obj = body as Record<string, unknown>;
          return { valid: typeof obj.email === "string" };
        },
      })
    );

    const passing = await request("/test", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "a@b.com" }),
    });
    expect(passing.status).toBe(200);

    const failing = await request("/test", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: 123 }),
    });
    expect(failing.status).toBe(422);
  });

  it("should use custom rejectStatus", async () => {
    const { request } = createPolicyTestHarness(
      jsonValidation({
        validate: () => ({ valid: false }),
        rejectStatus: 400,
      })
    );
    const res = await request("/test", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ bad: true }),
    });
    expect(res.status).toBe(400);
  });

  it("should pass through non-JSON content types without validation", async () => {
    const { request } = createPolicyTestHarness(
      jsonValidation({
        validate: () => ({ valid: false }), // would fail if called
      })
    );
    const res = await request("/test", {
      method: "POST",
      headers: { "content-type": "text/plain" },
      body: "plain text body",
    });
    expect(res.status).toBe(200);
  });

  it("should handle missing body with JSON content-type", async () => {
    const { request } = createPolicyTestHarness(
      jsonValidation({
        validate: () => ({ valid: true }),
      })
    );
    const res = await request("/test", {
      method: "GET",
      headers: { "content-type": "application/json" },
    });
    // GET with no body should be handled gracefully
    expect([200, 422].includes(res.status)).toBe(true);
  });

  it("should reject invalid JSON when no validate function is provided", async () => {
    const { request } = createPolicyTestHarness(jsonValidation());
    const res = await request("/test", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "not valid json {{{",
    });
    expect(res.status).toBe(422);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.error).toBe("validation_failed");
    expect(body.message).toContain("not valid JSON");
  });

  it("should pass valid JSON through when no validate function is provided", async () => {
    const { request } = createPolicyTestHarness(jsonValidation());
    const res = await request("/test", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ any: "data" }),
    });
    expect(res.status).toBe(200);
  });

  it("should support custom contentTypes", async () => {
    const { request } = createPolicyTestHarness(
      jsonValidation({
        contentTypes: ["application/vnd.api+json"],
        validate: () => ({ valid: false }),
      })
    );

    // Custom content type should be validated (and fail)
    const customRes = await request("/test", {
      method: "POST",
      headers: { "content-type": "application/vnd.api+json" },
      body: JSON.stringify({ data: true }),
    });
    expect(customRes.status).toBe(422);

    // Standard JSON should pass through (not in contentTypes list)
    const jsonRes = await request("/test", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ data: true }),
    });
    expect(jsonRes.status).toBe(200);
  });

  it("should support skip logic", async () => {
    const { request } = createPolicyTestHarness(
      jsonValidation({
        validate: () => ({ valid: false }), // would fail if not skipped
        skip: () => true,
      })
    );
    const res = await request("/test", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ data: true }),
    });
    expect(res.status).toBe(200);
  });

  it("should have priority AUTH (10)", () => {
    const policy = jsonValidation();
    expect(policy.priority).toBe(10);
    expect(policy.name).toBe("json-validation");
  });

  it("should return generic message when validation fails with no errors array", async () => {
    const { request } = createPolicyTestHarness(
      jsonValidation({
        validate: () => ({ valid: false }),
      })
    );
    const res = await request("/test", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(422);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.message).toBe("Validation failed");
  });
});

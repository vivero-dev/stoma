import { describe, expect, it } from "vitest";
import { createPolicyTestHarness } from "../../sdk";
import { requestValidation } from "../request-validation";

describe("requestValidation", () => {
  it("should pass valid body through", async () => {
    const { request } = createPolicyTestHarness(
      requestValidation({
        validate: (body) => {
          const obj = body as Record<string, unknown>;
          return obj.name !== undefined;
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

  it("should return 400 with validation_failed code for invalid body", async () => {
    const { request } = createPolicyTestHarness(
      requestValidation({
        validate: () => false,
      })
    );
    const res = await request("/test", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ bad: true }),
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.error).toBe("validation_failed");
  });

  it("should include validation errors array in error message", async () => {
    const { request } = createPolicyTestHarness(
      requestValidation({
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
    expect(res.status).toBe(400);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.error).toBe("validation_failed");
    expect(body.message).toContain("name is required");
    expect(body.message).toContain("age must be a number");
  });

  it("should support async validator", async () => {
    const { request } = createPolicyTestHarness(
      requestValidation({
        validateAsync: async (body) => {
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
    expect(failing.status).toBe(400);
  });

  it("should prefer validateAsync over validate when both are provided", async () => {
    const { request } = createPolicyTestHarness(
      requestValidation({
        validate: () => false, // sync always fails
        validateAsync: async () => true, // async always passes
      })
    );
    const res = await request("/test", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ data: true }),
    });
    expect(res.status).toBe(200);
  });

  it("should skip validation for non-JSON content types", async () => {
    const { request } = createPolicyTestHarness(
      requestValidation({
        validate: () => false, // would fail if called
      })
    );
    const res = await request("/test", {
      method: "POST",
      headers: { "content-type": "text/plain" },
      body: "plain text body",
    });
    expect(res.status).toBe(200);
  });

  it("should validate custom content types", async () => {
    const { request } = createPolicyTestHarness(
      requestValidation({
        contentTypes: ["application/xml"],
        validate: () => false,
      })
    );

    // XML content type should be validated (and fail)
    const xmlRes = await request("/test", {
      method: "POST",
      headers: { "content-type": "application/xml" },
      body: "<root/>",
    });
    expect(xmlRes.status).toBe(400);

    // JSON content type should pass through (not in contentTypes)
    const jsonRes = await request("/test", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ data: true }),
    });
    expect(jsonRes.status).toBe(200);
  });

  it("should return 400 for invalid JSON body", async () => {
    const { request } = createPolicyTestHarness(
      requestValidation({
        validate: () => true,
      })
    );
    const res = await request("/test", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "not valid json {{{",
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.error).toBe("validation_failed");
    expect(body.message).toContain("invalid JSON");
  });

  it("should use custom error message", async () => {
    const { request } = createPolicyTestHarness(
      requestValidation({
        validate: () => false,
        errorMessage: "Schema mismatch",
      })
    );
    const res = await request("/test", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ bad: true }),
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.message).toBe("Schema mismatch");
  });

  it("should work with boolean-returning validator", async () => {
    const { request } = createPolicyTestHarness(
      requestValidation({
        validate: () => true,
      })
    );
    const res = await request("/test", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ any: "data" }),
    });
    expect(res.status).toBe(200);
  });

  it("should work with object-returning validator that includes errors", async () => {
    const { request } = createPolicyTestHarness(
      requestValidation({
        validate: () => ({
          valid: false,
          errors: ["field 'x' is invalid"],
        }),
      })
    );
    const res = await request("/test", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ x: "bad" }),
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.message).toContain("field 'x' is invalid");
  });

  it("should support skip logic", async () => {
    const { request } = createPolicyTestHarness(
      requestValidation({
        validate: () => false, // would fail if not skipped
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

  it("should pass through when no validator is configured", async () => {
    const { request } = createPolicyTestHarness(requestValidation({}));
    const res = await request("/test", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ data: true }),
    });
    expect(res.status).toBe(200);
  });

  it("should have priority AUTH (10)", () => {
    const policy = requestValidation({ validate: () => true });
    expect(policy.priority).toBe(10);
    expect(policy.name).toBe("request-validation");
  });
});

import { describe, expect, it } from "vitest";
import { ZodError } from "zod";
import {
  GatewayConfigSchema,
  safeValidateConfig,
  validateConfig,
} from "../schema";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function validConfig(overrides?: Record<string, unknown>) {
  return {
    routes: [
      {
        path: "/test",
        pipeline: {
          upstream: { type: "url" as const, target: "https://example.com" },
        },
      },
    ],
    ...overrides,
  };
}

function validPolicy(name = "test-policy") {
  return {
    name,
    handler: async () => {},
  };
}

// ---------------------------------------------------------------------------
// validateConfig - valid configs
// ---------------------------------------------------------------------------

describe("validateConfig", () => {
  it("should accept a minimal valid config", () => {
    const config = validConfig();
    const result = validateConfig(config);

    expect(result).toBeDefined();
    expect(result.routes).toHaveLength(1);
    expect(result.routes[0].path).toBe("/test");
  });

  it("should accept config with name and basePath", () => {
    const config = validConfig({ name: "my-gateway", basePath: "/api" });
    const result = validateConfig(config);

    expect(result.name).toBe("my-gateway");
    expect(result.basePath).toBe("/api");
  });

  it("should accept config with global policies", () => {
    const config = validConfig({
      policies: [validPolicy("global-cors"), validPolicy("global-log")],
    });
    const result = validateConfig(config);

    expect(result.policies).toHaveLength(2);
  });

  it("should accept config with route-level policies", () => {
    const config = {
      routes: [
        {
          path: "/protected",
          pipeline: {
            policies: [validPolicy("jwt-auth")],
            upstream: {
              type: "url" as const,
              target: "https://api.example.com",
            },
          },
        },
      ],
    };
    const result = validateConfig(config);

    expect(result.routes[0].pipeline.policies).toHaveLength(1);
  });

  it("should accept config with service-binding upstream", () => {
    const config = {
      routes: [
        {
          path: "/internal",
          pipeline: {
            upstream: {
              type: "service-binding" as const,
              service: "AUTH_SERVICE",
            },
          },
        },
      ],
    };
    const result = validateConfig(config);

    expect(result.routes[0].pipeline.upstream.type).toBe("service-binding");
  });

  it("should accept config with handler upstream", () => {
    const config = {
      routes: [
        {
          path: "/health",
          pipeline: {
            upstream: {
              type: "handler" as const,
              handler: () => new Response("ok"),
            },
          },
        },
      ],
    };
    const result = validateConfig(config);

    expect(result.routes[0].pipeline.upstream.type).toBe("handler");
  });

  it("should accept config with methods array", () => {
    const config = {
      routes: [
        {
          path: "/users",
          methods: ["GET" as const, "POST" as const],
          pipeline: {
            upstream: {
              type: "url" as const,
              target: "https://users.internal",
            },
          },
        },
      ],
    };
    const result = validateConfig(config);

    expect(result.routes[0].methods).toEqual(["GET", "POST"]);
  });

  it("should accept config with all optional fields", () => {
    const config = validConfig({
      name: "full-gateway",
      basePath: "/v1",
      policies: [validPolicy()],
      onError: () => new Response("error", { status: 500 }),
      debug: "stoma:*",
      requestIdHeader: "x-trace-id",
      defaultMethods: ["GET", "POST"],
      defaultErrorMessage: "Something went wrong",
      defaultPolicyPriority: 50,
    });
    const result = validateConfig(config);

    expect(result.name).toBe("full-gateway");
    expect(result.debug).toBe("stoma:*");
    expect(result.requestIdHeader).toBe("x-trace-id");
    expect(result.defaultPolicyPriority).toBe(50);
  });

  it("should accept config with policy priority", () => {
    const config = {
      routes: [
        {
          path: "/test",
          pipeline: {
            policies: [{ name: "early", handler: async () => {}, priority: 5 }],
            upstream: { type: "url" as const, target: "https://example.com" },
          },
        },
      ],
    };
    const result = validateConfig(config);

    expect(result.routes[0].pipeline.policies![0].priority).toBe(5);
  });

  it("should accept config with route metadata", () => {
    const config = {
      routes: [
        {
          path: "/test",
          metadata: { team: "platform", version: 2 },
          pipeline: {
            upstream: { type: "url" as const, target: "https://example.com" },
          },
        },
      ],
    };
    const result = validateConfig(config);

    expect(result.routes[0].metadata).toEqual({ team: "platform", version: 2 });
  });

  // ---------------------------------------------------------------------------
  // validateConfig - invalid configs
  // ---------------------------------------------------------------------------

  it("should reject config with no routes", () => {
    expect(() => validateConfig({})).toThrow(ZodError);
  });

  it("should reject config with empty routes array", () => {
    expect(() => validateConfig({ routes: [] })).toThrow(ZodError);
  });

  it("should reject route path not starting with /", () => {
    const config = {
      routes: [
        {
          path: "no-slash",
          pipeline: {
            upstream: { type: "url", target: "https://example.com" },
          },
        },
      ],
    };
    expect(() => validateConfig(config)).toThrow(ZodError);
  });

  it("should reject url upstream with invalid URL", () => {
    const config = {
      routes: [
        {
          path: "/test",
          pipeline: {
            upstream: { type: "url", target: "not-a-url" },
          },
        },
      ],
    };
    expect(() => validateConfig(config)).toThrow(ZodError);
  });

  it("should reject service-binding with empty service name", () => {
    const config = {
      routes: [
        {
          path: "/test",
          pipeline: {
            upstream: { type: "service-binding", service: "" },
          },
        },
      ],
    };
    expect(() => validateConfig(config)).toThrow(ZodError);
  });

  it("should reject policy with empty name", () => {
    const config = {
      routes: [
        {
          path: "/test",
          pipeline: {
            policies: [{ name: "", handler: async () => {} }],
            upstream: { type: "url", target: "https://example.com" },
          },
        },
      ],
    };
    expect(() => validateConfig(config)).toThrow(ZodError);
  });

  it("should reject invalid upstream type", () => {
    const config = {
      routes: [
        {
          path: "/test",
          pipeline: {
            upstream: { type: "websocket", target: "ws://example.com" },
          },
        },
      ],
    };
    expect(() => validateConfig(config)).toThrow(ZodError);
  });

  it("should reject invalid HTTP method", () => {
    const config = {
      routes: [
        {
          path: "/test",
          methods: ["GET", "PURGE"],
          pipeline: {
            upstream: { type: "url", target: "https://example.com" },
          },
        },
      ],
    };
    expect(() => validateConfig(config)).toThrow(ZodError);
  });

  // ---------------------------------------------------------------------------
  // Error messages
  // ---------------------------------------------------------------------------

  it("should produce readable error messages", () => {
    try {
      validateConfig({ routes: [] });
      expect.unreachable("Should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(ZodError);
      const zodErr = err as ZodError;
      const formatted = zodErr.format();
      expect(formatted).toBeDefined();

      // The issues array should contain at least the "min 1" error on routes
      const routesIssue = zodErr.issues.find((i) => i.path.includes("routes"));
      expect(routesIssue).toBeDefined();
      expect(routesIssue!.message).toContain("At least one route is required");
    }
  });

  it("should report the correct path for nested errors", () => {
    const config = {
      routes: [
        {
          path: "/test",
          pipeline: {
            upstream: { type: "url", target: "bad" },
          },
        },
      ],
    };

    try {
      validateConfig(config);
      expect.unreachable("Should have thrown");
    } catch (err) {
      const zodErr = err as ZodError;
      const issue = zodErr.issues[0];
      // Path should include routes, index, pipeline, upstream, target
      expect(issue.path).toContain("target");
    }
  });
});

// ---------------------------------------------------------------------------
// safeValidateConfig
// ---------------------------------------------------------------------------

describe("safeValidateConfig", () => {
  it("should return success:true for valid config", () => {
    const result = safeValidateConfig(validConfig());

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.routes).toHaveLength(1);
    }
  });

  it("should return success:false with ZodError for invalid config", () => {
    const result = safeValidateConfig({ routes: [] });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeInstanceOf(ZodError);
      expect(result.error.issues.length).toBeGreaterThan(0);
    }
  });

  it("should not throw for invalid config", () => {
    expect(() => safeValidateConfig({})).not.toThrow();
    expect(() => safeValidateConfig(null)).not.toThrow();
    expect(() => safeValidateConfig("garbage")).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// GatewayConfigSchema - direct usage
// ---------------------------------------------------------------------------

describe("GatewayConfigSchema", () => {
  it("should be usable directly for custom validation flows", () => {
    const result = GatewayConfigSchema.safeParse(validConfig());
    expect(result.success).toBe(true);
  });
});

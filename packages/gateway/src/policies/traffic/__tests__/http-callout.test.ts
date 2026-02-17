import { afterEach, describe, expect, it, vi } from "vitest";
import { createPolicyTestHarness } from "../../sdk";
import { httpCallout } from "../http-callout";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("httpCallout", () => {
  it("should make GET callout and call onResponse", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ userId: "123" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    );

    const { request } = createPolicyTestHarness(
      httpCallout({
        url: "https://auth.example.com/check",
        onResponse: async (res, c) => {
          const data = (await res.json()) as { userId: string };
          c.set("userId", data.userId);
        },
      }),
      {
        upstream: async (c) => c.json({ userId: c.get("userId") }),
      }
    );

    const res = await request("/test");
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.userId).toBe("123");
    expect(globalThis.fetch).toHaveBeenCalledOnce();
  });

  it("should make POST callout with JSON body", async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ ok: true }), { status: 200 })
      );

    const { request } = createPolicyTestHarness(
      httpCallout({
        url: "https://webhook.example.com",
        method: "POST",
        body: { event: "request", path: "/test" },
        onResponse: async (_res, c) => {
          c.set("notified", true);
        },
      }),
      {
        upstream: async (c) => c.json({ notified: c.get("notified") }),
      }
    );

    const res = await request("/test");
    expect(res.status).toBe(200);

    const fetchCall = (globalThis.fetch as ReturnType<typeof vi.fn>).mock
      .calls[0];
    expect(fetchCall[1].method).toBe("POST");
    expect(fetchCall[1].body).toBe(
      JSON.stringify({ event: "request", path: "/test" })
    );
  });

  it("should resolve dynamic URL", async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(new Response("ok", { status: 200 }));

    const { request } = createPolicyTestHarness(
      httpCallout({
        url: (c) => `https://auth.example.com/check?path=${c.req.path}`,
        onResponse: async () => {},
      })
    );

    await request("/my-path");
    const fetchCall = (globalThis.fetch as ReturnType<typeof vi.fn>).mock
      .calls[0];
    expect(fetchCall[0]).toBe("https://auth.example.com/check?path=/my-path");
  });

  it("should resolve dynamic headers", async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(new Response("ok", { status: 200 }));

    const { request } = createPolicyTestHarness(
      httpCallout({
        url: "https://auth.example.com/check",
        headers: {
          "x-static": "value",
          authorization: (c) => c.req.header("authorization") ?? "",
        },
        onResponse: async () => {},
      })
    );

    await request("/test", {
      headers: { authorization: "Bearer token123" },
    });

    const fetchCall = (globalThis.fetch as ReturnType<typeof vi.fn>).mock
      .calls[0];
    expect(fetchCall[1].headers).toEqual({
      "x-static": "value",
      authorization: "Bearer token123",
    });
  });

  it("should allow onResponse to set context variables readable by downstream", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ role: "admin", tier: "premium" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    );

    const { request } = createPolicyTestHarness(
      httpCallout({
        url: "https://auth.example.com/enrich",
        onResponse: async (res, c) => {
          const data = (await res.json()) as {
            role: string;
            tier: string;
          };
          c.set("userRole", data.role);
          c.set("userTier", data.tier);
        },
      }),
      {
        upstream: async (c) =>
          c.json({
            role: c.get("userRole"),
            tier: c.get("userTier"),
          }),
      }
    );

    const res = await request("/test");
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.role).toBe("admin");
    expect(body.tier).toBe("premium");
  });

  it("should throw 502 on non-2xx response with abortOnFailure=true", async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(new Response("Forbidden", { status: 403 }));

    const { request } = createPolicyTestHarness(
      httpCallout({
        url: "https://auth.example.com/check",
        abortOnFailure: true,
        onResponse: async () => {},
      })
    );

    const res = await request("/test");
    expect(res.status).toBe(502);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.error).toBe("callout_failed");
    expect(body.message).toBe("External callout returned 403");
  });

  it("should call onResponse on non-2xx when abortOnFailure=false", async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ denied: true }), { status: 403 })
      );

    const { request } = createPolicyTestHarness(
      httpCallout({
        url: "https://auth.example.com/check",
        abortOnFailure: false,
        onResponse: async (res, c) => {
          c.set("calloutStatus", res.status);
        },
      }),
      {
        upstream: async (c) =>
          c.json({ calloutStatus: c.get("calloutStatus") }),
      }
    );

    const res = await request("/test");
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.calloutStatus).toBe(403);
  });

  it("should call custom onError handler on failure", async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(new Response("Server Error", { status: 500 }));

    const { request } = createPolicyTestHarness(
      httpCallout({
        url: "https://auth.example.com/check",
        abortOnFailure: true,
        onResponse: async () => {},
        onError: async (_error, c) => {
          c.set("fallbackUsed", true);
        },
      }),
      {
        upstream: async (c) => c.json({ fallbackUsed: c.get("fallbackUsed") }),
      }
    );

    const res = await request("/test");
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.fallbackUsed).toBe(true);
  });

  it("should handle fetch network error", async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

    const onErrorSpy = vi.fn();

    const { request } = createPolicyTestHarness(
      httpCallout({
        url: "https://auth.example.com/check",
        onResponse: async () => {},
        onError: async (error, c) => {
          onErrorSpy(error);
          c.set("errorHandled", true);
        },
      }),
      {
        upstream: async (c) => c.json({ errorHandled: c.get("errorHandled") }),
      }
    );

    const res = await request("/test");
    expect(res.status).toBe(200);
    expect(onErrorSpy).toHaveBeenCalledOnce();
    expect(onErrorSpy.mock.calls[0][0]).toBeInstanceOf(Error);
  });

  it("should throw 502 on fetch network error without onError", async () => {
    globalThis.fetch = vi
      .fn()
      .mockRejectedValue(new Error("DNS lookup failed"));

    const { request } = createPolicyTestHarness(
      httpCallout({
        url: "https://auth.example.com/check",
        onResponse: async () => {},
      })
    );

    const res = await request("/test");
    expect(res.status).toBe(502);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.error).toBe("callout_failed");
    expect(body.message).toContain("DNS lookup failed");
  });

  it("should support skip logic", async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(new Response("ok", { status: 200 }));

    const { request } = createPolicyTestHarness(
      httpCallout({
        url: "https://auth.example.com/check",
        skip: () => true,
        onResponse: async () => {},
      })
    );

    const res = await request("/test");
    expect(res.status).toBe(200);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("should default method to GET", async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(new Response("ok", { status: 200 }));

    const { request } = createPolicyTestHarness(
      httpCallout({
        url: "https://auth.example.com/check",
        onResponse: async () => {},
      })
    );

    await request("/test");
    const fetchCall = (globalThis.fetch as ReturnType<typeof vi.fn>).mock
      .calls[0];
    expect(fetchCall[1].method).toBe("GET");
  });

  it("should have priority REQUEST_TRANSFORM (50)", () => {
    const policy = httpCallout({
      url: "https://example.com",
      onResponse: async () => {},
    });
    expect(policy.priority).toBe(50);
    expect(policy.name).toBe("http-callout");
  });
});

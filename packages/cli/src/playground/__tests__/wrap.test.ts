import { describe, expect, it } from "vitest";
import type { GatewayRegistry } from "../../gateway/types.js";
import { wrapWithPlayground } from "../wrap.js";

function mockRegistry(
  overrides: Partial<GatewayRegistry> = {}
): GatewayRegistry {
  return {
    gatewayName: "test",
    routes: [
      { path: "/api/hello", methods: ["GET"], policies: [] },
      { path: "/api/data", methods: ["POST"], policies: ["jwt-auth"] },
    ],
    policies: [{ name: "jwt-auth", priority: 10 }],
    ...overrides,
  };
}

function mockGatewayFetch(): (req: Request) => Response | Promise<Response> {
  return (req: Request) =>
    new Response(`gateway:${new URL(req.url).pathname}`, {
      status: 200,
      headers: { "x-gateway": "true" },
    });
}

function req(path: string, init?: RequestInit): Request {
  return new Request(`http://localhost:8787${path}`, init);
}

describe("wrapWithPlayground", () => {
  // ── Routing invariants ──────────────────────────────────────────

  describe("playground route interception", () => {
    it("/__playground returns HTML", async () => {
      const wrapped = wrapWithPlayground(mockGatewayFetch(), mockRegistry());
      const res = await wrapped(req("/__playground"));

      expect(res.headers.get("content-type")).toBe("text/html; charset=utf-8");
      const body = await res.text();
      expect(body).toContain("<!DOCTYPE html");
      expect(body).toContain("playground");
    });

    it("/__playground/registry returns the exact registry as JSON", async () => {
      const registry = mockRegistry();
      const wrapped = wrapWithPlayground(mockGatewayFetch(), registry);
      const res = await wrapped(req("/__playground/registry"));

      expect(res.headers.get("content-type")).toContain("application/json");
      const data = await res.json();
      expect(data).toEqual(registry);
    });
  });

  // ── Passthrough invariant ───────────────────────────────────────

  describe("non-playground paths always pass through to the gateway", () => {
    it("passes through normal API routes", async () => {
      const wrapped = wrapWithPlayground(mockGatewayFetch(), mockRegistry());
      const res = await wrapped(req("/api/hello"));

      expect(await res.text()).toBe("gateway:/api/hello");
      expect(res.headers.get("x-gateway")).toBe("true");
    });

    it("passes through unknown paths", async () => {
      const wrapped = wrapWithPlayground(mockGatewayFetch(), mockRegistry());
      const res = await wrapped(req("/totally/unknown"));

      expect(await res.text()).toBe("gateway:/totally/unknown");
    });

    it("passes through /__playground subpaths that are not send or registry", async () => {
      const wrapped = wrapWithPlayground(mockGatewayFetch(), mockRegistry());
      const res = await wrapped(req("/__playground/unknown"));

      expect(await res.text()).toBe("gateway:/__playground/unknown");
    });
  });

  // ── Send proxy contract ─────────────────────────────────────────

  describe("/__playground/send proxy", () => {
    it("returns response shape with status, statusText, headers, body, elapsed", async () => {
      const wrapped = wrapWithPlayground(mockGatewayFetch(), mockRegistry());
      const res = await wrapped(
        req("/__playground/send", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ method: "GET", path: "/api/hello" }),
        })
      );

      const data = (await res.json()) as Record<string, unknown>;
      expect(data).toHaveProperty("status");
      expect(data).toHaveProperty("statusText");
      expect(data).toHaveProperty("headers");
      expect(data).toHaveProperty("body");
      expect(data).toHaveProperty("elapsed");
      expect(typeof data.status).toBe("number");
      expect(typeof data.elapsed).toBe("number");
      expect(data.elapsed).toBeGreaterThanOrEqual(0);
    });

    it("proxies the request method and path to the gateway", async () => {
      const wrapped = wrapWithPlayground(mockGatewayFetch(), mockRegistry());
      const res = await wrapped(
        req("/__playground/send", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ method: "GET", path: "/api/data" }),
        })
      );

      const data = (await res.json()) as Record<string, unknown>;
      expect(data.status).toBe(200);
      expect(data.body).toBe("gateway:/api/data");
    });

    it("forwards custom headers to the gateway", async () => {
      let capturedHeaders: Headers | undefined;
      const gatewayFetch = (r: Request) => {
        capturedHeaders = r.headers;
        return new Response("ok");
      };

      const wrapped = wrapWithPlayground(gatewayFetch, mockRegistry());
      await wrapped(
        req("/__playground/send", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            method: "GET",
            path: "/api/hello",
            headers: { authorization: "Bearer test-token" },
          }),
        })
      );

      expect(capturedHeaders?.get("authorization")).toBe("Bearer test-token");
    });

    it("returns 500 with error message when gateway throws", async () => {
      const failingFetch = () => {
        throw new Error("gateway exploded");
      };

      const wrapped = wrapWithPlayground(failingFetch, mockRegistry());
      const res = await wrapped(
        req("/__playground/send", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ method: "GET", path: "/boom" }),
        })
      );

      expect(res.status).toBe(500);
      const data = (await res.json()) as { error: string };
      expect(data.error).toBe("gateway exploded");
    });

    it("non-POST to /__playground/send falls through to gateway", async () => {
      const wrapped = wrapWithPlayground(mockGatewayFetch(), mockRegistry());
      const res = await wrapped(req("/__playground/send", { method: "GET" }));

      expect(await res.text()).toBe("gateway:/__playground/send");
    });

    it("does not send body for GET requests even if payload includes one", async () => {
      let capturedBody: string | null = null;
      const gatewayFetch = async (r: Request) => {
        capturedBody = await r.text();
        return new Response("ok");
      };

      const wrapped = wrapWithPlayground(gatewayFetch, mockRegistry());
      await wrapped(
        req("/__playground/send", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            method: "GET",
            path: "/api/hello",
            body: "should-be-ignored",
          }),
        })
      );

      expect(capturedBody).toBe("");
    });
  });

  // ── Encoding header hygiene ────────────────────────────────────
  //
  // After fetch() transparently decompresses an upstream response the
  // content-encoding and content-length headers are stale. The proxy
  // must strip them so the playground UI never sees misleading headers
  // or (worse) tries to re-interpret already-decoded bytes.

  describe("/__playground/send strips stale encoding headers", () => {
    it("strips content-encoding from the response headers", async () => {
      const gatewayFetch = () =>
        new Response('{"ok":true}', {
          status: 200,
          headers: {
            "content-type": "application/json",
            "content-encoding": "gzip", // stale — body is already decoded
            "x-custom": "keep-me",
          },
        });

      const wrapped = wrapWithPlayground(gatewayFetch, mockRegistry());
      const res = await wrapped(
        req("/__playground/send", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ method: "GET", path: "/api/hello" }),
        })
      );

      const data = (await res.json()) as {
        headers: Record<string, string>;
        body: string;
      };

      // The stale content-encoding MUST NOT leak to the playground UI
      expect(data.headers).not.toHaveProperty("content-encoding");
      // Other headers pass through normally
      expect(data.headers["x-custom"]).toBe("keep-me");
      // Body should be the readable decoded text
      expect(data.body).toBe('{"ok":true}');
    });

    it("strips content-length from the response headers", async () => {
      const body = '{"users":[1,2,3]}';
      const gatewayFetch = () =>
        new Response(body, {
          status: 200,
          headers: {
            "content-type": "application/json",
            // Stale content-length from the compressed body — does not
            // match the decompressed body length shown to the user.
            "content-length": "9999",
          },
        });

      const wrapped = wrapWithPlayground(gatewayFetch, mockRegistry());
      const res = await wrapped(
        req("/__playground/send", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ method: "GET", path: "/api/hello" }),
        })
      );

      const data = (await res.json()) as {
        headers: Record<string, string>;
        body: string;
      };

      // Stale content-length MUST NOT leak — it doesn't match the
      // decoded body and confuses response display
      expect(data.headers).not.toHaveProperty("content-length");
      expect(data.body).toBe(body);
    });

    it("strips transfer-encoding from the response headers", async () => {
      const gatewayFetch = () =>
        new Response("chunk1chunk2", {
          status: 200,
          headers: {
            "content-type": "text/plain",
            "transfer-encoding": "chunked",
          },
        });

      const wrapped = wrapWithPlayground(gatewayFetch, mockRegistry());
      const res = await wrapped(
        req("/__playground/send", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ method: "GET", path: "/api/hello" }),
        })
      );

      const data = (await res.json()) as {
        headers: Record<string, string>;
      };

      expect(data.headers).not.toHaveProperty("transfer-encoding");
    });
  });

  // ── OAuth relay invariants ──────────────────────────────────────

  describe("OAuth relay interception", () => {
    it("intercepts navigation to callback route with query params", async () => {
      const registry = mockRegistry({
        routes: [
          { path: "/oauth/callback", methods: ["GET"], policies: [] },
          { path: "/api/hello", methods: ["GET"], policies: [] },
        ],
      });
      const wrapped = wrapWithPlayground(mockGatewayFetch(), registry);

      const res = await wrapped(
        req("/oauth/callback?code=abc&state=xyz", {
          headers: { accept: "text/html,application/xhtml+xml" },
        })
      );

      const body = await res.text();
      expect(res.headers.get("content-type")).toBe("text/html; charset=utf-8");
      expect(body).toContain("stoma-oauth-callback");
      expect(body).toContain('"code":"abc"');
      expect(body).toContain('"state":"xyz"');
    });

    it("does NOT intercept non-navigation requests to callback routes", async () => {
      const registry = mockRegistry({
        routes: [{ path: "/oauth/callback", methods: ["GET"], policies: [] }],
      });
      const wrapped = wrapWithPlayground(mockGatewayFetch(), registry);

      // API request (no accept: text/html)
      const res = await wrapped(
        req("/oauth/callback?code=abc", {
          headers: { accept: "application/json" },
        })
      );

      expect(await res.text()).toBe("gateway:/oauth/callback");
    });

    it("does NOT intercept callback route without query params", async () => {
      const registry = mockRegistry({
        routes: [{ path: "/oauth/callback", methods: ["GET"], policies: [] }],
      });
      const wrapped = wrapWithPlayground(mockGatewayFetch(), registry);

      const res = await wrapped(
        req("/oauth/callback", {
          headers: { accept: "text/html" },
        })
      );

      expect(await res.text()).toBe("gateway:/oauth/callback");
    });

    it("does NOT intercept navigation to non-callback routes", async () => {
      const wrapped = wrapWithPlayground(mockGatewayFetch(), mockRegistry());

      const res = await wrapped(
        req("/api/hello?code=abc", {
          headers: { accept: "text/html" },
        })
      );

      expect(await res.text()).toBe("gateway:/api/hello");
    });
  });
});

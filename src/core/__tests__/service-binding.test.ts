import { describe, expect, it, vi } from "vitest";
import type { GatewayAdapter } from "../../adapters/types";
import { createGateway } from "../gateway";

/**
 * Creates a mock dispatchBinding that routes to a handler by service name.
 */
function mockAdapter(
  bindings: Record<string, (req: Request) => Response | Promise<Response>>
): GatewayAdapter {
  const spies = Object.fromEntries(
    Object.entries(bindings).map(([name, handler]) => [name, vi.fn(handler)])
  );

  return {
    dispatchBinding: async (service, request) => {
      const handler = spies[service];
      if (!handler) {
        throw new Error(
          `Service binding "${service}" is not available in the Worker environment`
        );
      }
      return handler(request);
    },
    /** Expose spies for assertions. */
    _spies: spies,
  } as GatewayAdapter & { _spies: Record<string, ReturnType<typeof vi.fn>> };
}

/** Shortcut for a single-service adapter returning a fixed response. */
function singleServiceAdapter(
  service: string,
  handler: (req: Request) => Response | Promise<Response> = () =>
    new Response(JSON.stringify({ from: "binding" }), {
      headers: { "content-type": "application/json" },
    })
) {
  return mockAdapter({ [service]: handler });
}

describe("Service Binding upstream", () => {
  it("should forward requests to the service binding", async () => {
    const adapter = singleServiceAdapter("MY_SERVICE");

    const gw = createGateway({
      adapter,
      routes: [
        {
          path: "/svc/*",
          methods: ["GET"],
          pipeline: {
            upstream: { type: "service-binding", service: "MY_SERVICE" },
          },
        },
      ],
    });

    const res = await gw.app.request("/svc/hello", { method: "GET" });

    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.from).toBe("binding");
    const spies = (
      adapter as GatewayAdapter & {
        _spies: Record<string, ReturnType<typeof vi.fn>>;
      }
    )._spies;
    expect(spies.MY_SERVICE).toHaveBeenCalledOnce();
  });

  it("should forward the correct method and path", async () => {
    const adapter = singleServiceAdapter("BACKEND", (req) => {
      const url = new URL(req.url);
      return Response.json({
        method: req.method,
        pathname: url.pathname,
        search: url.search,
      });
    });

    const gw = createGateway({
      adapter,
      routes: [
        {
          path: "/api/*",
          methods: ["POST"],
          pipeline: {
            upstream: { type: "service-binding", service: "BACKEND" },
          },
        },
      ],
    });

    const res = await gw.app.request("/api/users?active=true", {
      method: "POST",
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, string>;
    expect(body.method).toBe("POST");
    expect(body.pathname).toBe("/api/users");
    expect(body.search).toBe("?active=true");
  });

  it("should apply rewritePath before forwarding", async () => {
    const adapter = singleServiceAdapter("BACKEND", (req) => {
      const url = new URL(req.url);
      return Response.json({ pathname: url.pathname });
    });

    const gw = createGateway({
      adapter,
      basePath: "/gateway",
      routes: [
        {
          path: "/api/*",
          methods: ["GET"],
          pipeline: {
            upstream: {
              type: "service-binding",
              service: "BACKEND",
              rewritePath: (path) => path.replace(/^\/gateway\/api/, "/v2"),
            },
          },
        },
      ],
    });

    const res = await gw.app.request("/gateway/api/items", { method: "GET" });

    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, string>;
    expect(body.pathname).toBe("/v2/items");
  });

  it("should forward request headers (minus hop-by-hop)", async () => {
    const adapter = singleServiceAdapter("SVC", (req) => {
      return Response.json({
        customHeader: req.headers.get("x-custom"),
        // hop-by-hop headers should be stripped
        connection: req.headers.get("connection"),
      });
    });

    const gw = createGateway({
      adapter,
      routes: [
        {
          path: "/svc/*",
          methods: ["GET"],
          pipeline: {
            upstream: { type: "service-binding", service: "SVC" },
          },
        },
      ],
    });

    const res = await gw.app.request("/svc/test", {
      method: "GET",
      headers: {
        "x-custom": "hello",
        connection: "keep-alive",
      },
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, string | null>;
    expect(body.customHeader).toBe("hello");
    expect(body.connection).toBeNull();
  });

  it("should forward response status and headers from the binding", async () => {
    const adapter = singleServiceAdapter("SVC", () => {
      return new Response("created", {
        status: 201,
        headers: {
          "x-trace-id": "abc-123",
          "content-type": "text/plain",
        },
      });
    });

    const gw = createGateway({
      adapter,
      routes: [
        {
          path: "/svc/*",
          methods: ["POST"],
          pipeline: {
            upstream: { type: "service-binding", service: "SVC" },
          },
        },
      ],
    });

    const res = await gw.app.request("/svc/items", { method: "POST" });

    expect(res.status).toBe(201);
    expect(res.headers.get("x-trace-id")).toBe("abc-123");
    expect(await res.text()).toBe("created");
  });

  it("should return 502 when no adapter is provided", async () => {
    const gw = createGateway({
      routes: [
        {
          path: "/svc/*",
          methods: ["GET"],
          pipeline: {
            upstream: { type: "service-binding", service: "MISSING" },
          },
        },
      ],
    });

    const res = await gw.app.request("/svc/test");
    expect(res.status).toBe(502);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.error).toBe("config_error");
    expect(body.message).toContain("MISSING");
    expect(body.message).toContain("dispatchBinding");
  });

  it("should return 502 when adapter has no dispatchBinding", async () => {
    const gw = createGateway({
      adapter: {},
      routes: [
        {
          path: "/svc/*",
          methods: ["GET"],
          pipeline: {
            upstream: { type: "service-binding", service: "MY_SVC" },
          },
        },
      ],
    });

    const res = await gw.app.request("/svc/test");
    expect(res.status).toBe(502);
  });

  it("should forward POST body to the binding", async () => {
    const adapter = singleServiceAdapter("SVC", async (req) => {
      const body = await req.json();
      return Response.json({ received: body });
    });

    const gw = createGateway({
      adapter,
      routes: [
        {
          path: "/svc/*",
          methods: ["POST"],
          pipeline: {
            upstream: { type: "service-binding", service: "SVC" },
          },
        },
      ],
    });

    const res = await gw.app.request("/svc/data", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "test" }),
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as { received: { name: string } };
    expect(body.received.name).toBe("test");
  });

  it("should work with policies in the pipeline", async () => {
    const adapter = singleServiceAdapter("SVC", () =>
      Response.json({ ok: true })
    );

    const policyOrder: string[] = [];

    const gw = createGateway({
      adapter,
      routes: [
        {
          path: "/svc/*",
          methods: ["GET"],
          pipeline: {
            policies: [
              {
                name: "tracker",
                priority: 0,
                handler: async (_c, next) => {
                  policyOrder.push("before");
                  await next();
                  policyOrder.push("after");
                },
              },
            ],
            upstream: { type: "service-binding", service: "SVC" },
          },
        },
      ],
    });

    const res = await gw.app.request("/svc/test", { method: "GET" });

    expect(res.status).toBe(200);
    expect(policyOrder).toEqual(["before", "after"]);
    const spies = (
      adapter as GatewayAdapter & {
        _spies: Record<string, ReturnType<typeof vi.fn>>;
      }
    )._spies;
    expect(spies.SVC).toHaveBeenCalledOnce();
  });
});

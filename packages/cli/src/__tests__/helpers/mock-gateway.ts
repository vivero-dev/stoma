import type { GatewayInstance, GatewayRegistry } from "../../gateway/types.js";

export function mockGateway(
  overrides: Partial<GatewayInstance> = {}
): GatewayInstance {
  return {
    app: { fetch: () => new Response("ok") },
    name: "test-gateway",
    routeCount: 2,
    _registry: {
      routes: [
        { path: "/api/hello", methods: ["GET"], policies: [] },
        { path: "/api/data", methods: ["POST"], policies: ["jwt-auth"] },
      ],
      policies: [{ name: "jwt-auth", priority: 10 }],
      gatewayName: "test-gateway",
    },
    ...overrides,
  };
}

export function mockRegistry(
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

export function req(path: string, init?: RequestInit): Request {
  return new Request(`http://localhost:8787${path}`, init);
}

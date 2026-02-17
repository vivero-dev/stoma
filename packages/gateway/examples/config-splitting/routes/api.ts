// API routes module — owned by the platform team.
// Defines user-facing endpoints with JWT auth and caching.

import { jwtAuth, cache, InMemoryCacheStore } from "@homegrower-club/stoma";
import type { GatewayConfig } from "@homegrower-club/stoma";

const cacheStore = new InMemoryCacheStore({ maxEntries: 100 });

export const apiRoutes: Partial<GatewayConfig> = {
  routes: [
    {
      path: "/users/*",
      pipeline: {
        policies: [jwtAuth({ secret: "my-jwt-secret" })],
        upstream: { type: "url", target: "https://users.internal" },
      },
    },
    {
      path: "/users/:id/profile",
      methods: ["GET"],
      pipeline: {
        policies: [
          jwtAuth({ secret: "my-jwt-secret" }),
          cache({ ttlSeconds: 60, store: cacheStore }),
        ],
        upstream: { type: "url", target: "https://users.internal" },
      },
    },
  ],
};

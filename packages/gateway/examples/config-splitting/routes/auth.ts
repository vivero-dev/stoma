// Auth routes module — owned by the auth team.
// Defines login and token refresh endpoints.

import { jwtAuth } from "@homegrower-club/stoma";
import type { GatewayConfig } from "@homegrower-club/stoma";

export const authRoutes: Partial<GatewayConfig> = {
  routes: [
    {
      path: "/auth/login",
      methods: ["POST"],
      pipeline: {
        upstream: { type: "url", target: "https://auth.internal" },
      },
    },
    {
      path: "/auth/refresh",
      methods: ["POST"],
      pipeline: {
        policies: [jwtAuth({ secret: "my-jwt-secret" })],
        upstream: { type: "url", target: "https://auth.internal" },
      },
    },
  ],
};

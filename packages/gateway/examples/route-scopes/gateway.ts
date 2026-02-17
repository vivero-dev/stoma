// Route scopes: group routes under shared path prefixes and policies
// using scope(). Eliminates repetition when multiple routes share
// the same base path or middleware stack.
// Demo API: https://stoma.opensource.homegrower.club/demo-api

import { createGateway, scope, health, jwtAuth, cors } from "@homegrower-club/stoma";

// Scoped routes share a prefix and JWT auth policy
const apiRoutes = scope({
  prefix: "/api/v1",
  policies: [jwtAuth({ secret: "my-jwt-secret" })],
  routes: [
    {
      path: "/users/*",
      pipeline: {
        upstream: { type: "url", target: "https://stoma.opensource.homegrower.club/demo-api" },
      },
    },
    {
      path: "/projects/*",
      pipeline: {
        upstream: { type: "url", target: "https://stoma.opensource.homegrower.club/demo-api" },
      },
    },
  ],
});

const gateway = createGateway({
  name: "my-api",
  policies: [cors()],
  routes: [
    // Health check lives outside any scope
    health({ path: "/health" }),
    // Scoped routes at /api/v1/users/* and /api/v1/projects/*
    ...apiRoutes,
  ],
});

export default gateway;

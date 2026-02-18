// Minimal gateway example — the simplest possible Stoma configuration.
// Creates a gateway that proxies requests to an upstream API with
// request logging and CORS enabled globally.
// Demo API: https://stoma.vivero.dev/demo-api

import { createGateway, cors, requestLog } from "@vivero/stoma";

const gateway = createGateway({
  // Friendly identifier shown in logs, admin UI, and metrics
  name: "my-gateway",

  // Prefix added to all route paths — requests to /api/users/*
  // will match route path /users/*
  basePath: "/api",

  // Global policies run on every request before route-specific policies
  policies: [requestLog(), cors()],

  routes: [
    {
      // URL pattern with wildcard support
      // * matches one segment: /users/123 but not /users/123/posts
      path: "/users/*",

      pipeline: {
        // Route-specific policies (in addition to global)
        policies: [],

        // Upstream: where to send the request after policies pass
        upstream: {
          type: "url",
          target: "https://stoma.vivero.dev/demo-api",
          rewritePath: (path) => path.replace("/api", ""),
        },
      },
    },
  ],
});

export default gateway;

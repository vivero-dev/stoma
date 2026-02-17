// Node.js deployment example using @hono/node-server.
// Run with: npx tsx src/index.ts

import { serve } from "@hono/node-server";
import { createGateway, cors, requestLog, health } from "@homegrower-club/stoma";
import { memoryAdapter } from "@homegrower-club/stoma/adapters";

const gateway = createGateway({
  name: "node-gateway",
  basePath: "/api",
  adapter: memoryAdapter(),
  policies: [requestLog(), cors()],
  routes: [
    health({ path: "/health" }),
    {
      path: "/users/*",
      pipeline: {
        upstream: {
          type: "url",
          target: "https://jsonplaceholder.typicode.com",
        },
      },
    },
  ],
});

serve({ fetch: gateway.app.fetch, port: 3000 }, (info) => {
  console.log(`Gateway listening on http://localhost:${info.port}`);
});

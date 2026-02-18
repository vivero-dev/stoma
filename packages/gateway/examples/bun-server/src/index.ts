// Bun deployment example using Bun.serve().
// Run with: bun run src/index.ts

import { createGateway, cors, requestLog, health } from "@vivero/stoma";
import { memoryAdapter } from "@vivero/stoma/adapters";

const gateway = createGateway({
  name: "bun-gateway",
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

export default gateway.app;

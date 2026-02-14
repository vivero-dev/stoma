// PostgreSQL adapter example — production-ready stores for Node.js, Bun, and Deno.
// Uses a mock PostgresClient for validation; in production, pass a pg Pool or
// postgres.js client instance.

import {
  cache,
  circuitBreaker,
  createGateway,
  rateLimit,
  requestLog,
} from "@homegrower-club/stoma";
import {
  type PostgresClient,
  postgresAdapter,
} from "@homegrower-club/stoma/adapters/postgres";

// In production: import { Pool } from "pg"; const pool = new Pool({ connectionString: "..." });
const mockPg: PostgresClient = {
  async query() {
    return { rows: [{ count: 1, reset_at: Date.now() + 60_000 }] };
  },
};

const adapter = postgresAdapter({
  client: mockPg,
  tablePrefix: "myapp_",
});

const gateway = createGateway({
  name: "postgres-example",
  adapter,
  policies: [requestLog()],

  routes: [
    {
      path: "/api/*",
      pipeline: {
        policies: [
          rateLimit({ max: 100, windowSeconds: 60 }),
          circuitBreaker({ failureThreshold: 5 }),
          cache({ ttlSeconds: 300 }),
        ],
        upstream: {
          type: "handler",
          handler: () =>
            new Response(JSON.stringify({ status: "ok" }), {
              headers: { "content-type": "application/json" },
            }),
        },
      },
    },
  ],
});

export default gateway;

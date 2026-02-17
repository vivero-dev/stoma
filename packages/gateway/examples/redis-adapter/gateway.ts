// Redis adapter example — production-ready stores for Node.js, Bun, and Deno.
// Uses a mock RedisClient for validation; in production, pass an ioredis or
// node-redis client instance.

import { createGateway, rateLimit, requestLog } from "@homegrower-club/stoma";
import {
  type RedisClient,
  RedisRateLimitStore,
  redisAdapter,
} from "@homegrower-club/stoma/adapters/redis";

// In production: import Redis from "ioredis"; const redis = new Redis();
const mockRedis: RedisClient = {
  async get() {
    return null;
  },
  async set() {
    return "OK";
  },
  async del() {
    return 0;
  },
  async eval() {
    return [1, Date.now() + 60_000];
  },
};

const adapter = redisAdapter({
  client: mockRedis,
  prefix: "myapp:",
});

const gateway = createGateway({
  name: "redis-example",
  adapter,
  policies: [requestLog()],

  routes: [
    {
      path: "/api/*",
      pipeline: {
        policies: [
          rateLimit({
            max: 100,
            windowSeconds: 60,
            store: new RedisRateLimitStore(mockRedis, "myapp:"),
          }),
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

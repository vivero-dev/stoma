// Public read API with caching and resilience: serve high-volume
// GET endpoints with fast cached responses and graceful degradation
// when upstreams fail.
// Demo API: https://stoma.opensource.homegrower.club/demo-api

import {
  createGateway,
  rateLimit,
  cache,
  circuitBreaker,
  retry,
  timeout,
  responseTransform,
} from "@homegrower-club/stoma";
import { memoryAdapter } from "@homegrower-club/stoma/adapters";

const adapter = memoryAdapter();

const gateway = createGateway({
  name: "public-catalog",
  adapter,
  routes: [
    {
      path: "/v1/catalog/*",
      methods: ["GET"],
      pipeline: {
        policies: [
          rateLimit({ max: 1000, store: adapter.rateLimitStore }),
          cache({ ttlSeconds: 120, store: adapter.cacheStore }),
          circuitBreaker({ store: adapter.circuitBreakerStore }),
          retry({ maxRetries: 2 }),
          timeout({ timeoutMs: 5000 }),
          responseTransform({
            setHeaders: {
              "cache-control": "public, max-age=60",
            },
          }),
        ],
        upstream: {
          type: "url",
          target: "https://stoma.opensource.homegrower.club/demo-api",
        },
      },
    },
  ],
});

export default gateway;

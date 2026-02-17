// Advanced caching example: e-commerce product catalog with tiered TTLs.
// Demonstrates different cache durations for listings vs. details,
// rate limiting, and language-aware cache keys via varyHeaders.
// Demo API: https://stoma.opensource.homegrower.club/demo-api

import { createGateway, cache, rateLimit, cors, InMemoryCacheStore } from "@homegrower-club/stoma";

const cacheStore = new InMemoryCacheStore({ maxEntries: 500 });

const gateway = createGateway({
  name: "catalog-api",
  basePath: "/api",
  policies: [
    cors({ origins: ["https://shop.example.com"] }),
  ],
  routes: [
    // Product listings — short TTL, rate limited
    {
      path: "/products",
      methods: ["GET"],
      pipeline: {
        policies: [
          rateLimit({ max: 100, windowSeconds: 60 }),
          cache({
            store: cacheStore,
            ttlSeconds: 60, // Short TTL for listings
            varyHeaders: ["accept-language"],
          }),
        ],
        upstream: { type: "url", target: "https://stoma.opensource.homegrower.club/demo-api" },
      },
    },
    // Product details — cached longer
    {
      path: "/products/:id",
      methods: ["GET"],
      pipeline: {
        policies: [
          rateLimit({ max: 200, windowSeconds: 60 }),
          cache({
            store: cacheStore,
            ttlSeconds: 3600, // 1 hour for product details
            varyHeaders: ["accept-language"],
          }),
        ],
        upstream: { type: "url", target: "https://stoma.opensource.homegrower.club/demo-api" },
      },
    },
    // Admin mutations — never cached
    {
      path: "/products/*",
      methods: ["POST", "PUT", "PATCH", "DELETE"],
      pipeline: {
        policies: [
          rateLimit({ max: 20, windowSeconds: 60 }),
        ],
        upstream: { type: "url", target: "https://stoma.opensource.homegrower.club/demo-api" },
      },
    },
  ],
});

export default gateway;

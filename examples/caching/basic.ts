// Basic response caching with an in-memory store.
// The cache policy stores upstream responses and serves them
// directly on subsequent requests, reducing upstream load.
// Demo API: https://stoma.opensource.homegrower.club/demo-api

import { createGateway, cache, cors, InMemoryCacheStore } from "@homegrower-club/stoma";

// Create a cache store — InMemoryCacheStore works on all runtimes
const cacheStore = new InMemoryCacheStore({
  maxEntries: 100, // Max number of cached responses (LRU eviction)
});

const gateway = createGateway({
  name: "cached-api",
  basePath: "/api",
  policies: [cors()],
  routes: [
    {
      path: "/products/*",
      pipeline: {
        policies: [
          cache({
            store: cacheStore,
            ttlSeconds: 120, // Cache for 2 minutes
            methods: ["GET"], // Only cache GET requests
            cacheStatusHeader: "x-cache", // Response header shows HIT/MISS
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

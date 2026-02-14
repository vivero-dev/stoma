/**
 * Default gateway configuration code shown in the Monaco editor.
 *
 * New to Stoma? Start with the Policy Authoring tutorial series at
 * /policy-authoring/your-first-policy/ - each page has "Open in Editor"
 * buttons that pre-load the tutorial code here.
 */
export const DEFAULT_CODE = `import {
  createGateway,
  health,
  requestLog,
  cors,
  rateLimit,
  cache,
  apiKeyAuth,
  timeout,
  serverTiming,
  InMemoryCircuitBreakerStore,
} from "@homegrower-club/stoma";
import type { GatewayAdapter } from "@homegrower-club/stoma";
import { IDBRateLimitStore } from "@homegrower-club/stoma";
import { CacheApiCacheStore } from "@homegrower-club/stoma";

const PLAYGROUND_CACHE_NAME = "stoma-editor";

/**
 * Creates the gateway instance.
 * This function is called by the editor worker to set up the gateway.
 * It MUST be exported with this exact name.
 */
export async function createPlaygroundGateway() {
  const cacheInstance = await caches.open(PLAYGROUND_CACHE_NAME);

  const adapter: GatewayAdapter = {
    rateLimitStore: new IDBRateLimitStore(),
    cacheStore: new CacheApiCacheStore(cacheInstance),
    circuitBreakerStore: new InMemoryCircuitBreakerStore(),
  };

  return createGateway({
    name: "editor",
    basePath: "/api",
    adapter,
    debug: true,
    debugHeaders: true,

    policies: [requestLog(), cors(), serverTiming({ visibility: "always" })],

    routes: [
      // Health check
      health(),

      // Echo - with rate limiting + caching
      {
        path: "/echo",
        methods: ["GET", "POST"],
        pipeline: {
          policies: [
            rateLimit({ max: 5, windowSeconds: 30 }),
            cache({ ttlSeconds: 10 }),
          ],
          upstream: {
            type: "handler",
            handler: async (c) => {
              const body = ["POST", "PUT", "PATCH"].includes(c.req.method)
                ? await c.req.text().catch(() => null)
                : null;

              return c.json({
                method: c.req.method,
                path: c.req.path,
                headers: Object.fromEntries(c.req.raw.headers.entries()),
                body,
                timestamp: new Date().toISOString(),
              });
            },
          },
        },
      },

      // Protected - API key auth
      {
        path: "/protected",
        methods: ["GET"],
        pipeline: {
          policies: [
            apiKeyAuth({
              validate: (key) => key === "demo-key",
            }),
          ],
          upstream: {
            type: "handler",
            handler: (c) =>
              c.json({
                message: "Access granted",
                user: "demo",
                timestamp: new Date().toISOString(),
              }),
          },
        },
      },

      // Slow - timeout policy (2s handler, 1s timeout)
      {
        path: "/slow",
        methods: ["GET"],
        pipeline: {
          policies: [timeout({ timeoutMs: 1000 })],
          upstream: {
            type: "handler",
            handler: async (c) => {
              await new Promise((resolve) => setTimeout(resolve, 2000));
              return c.json({ message: "This should never be seen" });
            },
          },
        },
      },
    ],
  });
}
`;

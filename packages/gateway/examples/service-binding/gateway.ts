/**
 * Service Binding Example
 *
 * This example demonstrates type-safe service bindings using TypeScript generics.
 * The gateway forwards requests to other Cloudflare Workers via service bindings.
 *
 * ## Type Safety
 *
 * By passing your `Env` interface to `createGateway<Env>()`, the `service` field
 * becomes type-safe. TypeScript will:
 * - Autocomplete valid binding names from your Env
 * - Error if you use a binding that doesn't exist in Env
 *
 * ## Setup
 *
 * 1. Define your Env interface with your service bindings:
 *    ```typescript
 *    interface Env {
 *      AUTH_WORKER: Fetcher;
 *      API_WORKER: Fetcher;
 *    }
 *    ```
 *
 * 2. Add service bindings in wrangler.jsonc:
 *    ```jsonc
 *    [[unsafe.bindings]]
 *    name = "AUTH_WORKER"
 *    type = "service"
 *    service = "auth-worker"
 *    ```
 *
 * 3. Pass Env to createGateway:
 *    ```typescript
 *    createGateway<Env>({ ... })
 *    ```
 *
 * @module service-binding
 */
import { cors, createGateway, jwtAuth } from "@homegrower-club/stoma";

/**
 * Your Cloudflare Workers bindings type.
 * This must match what's defined in your wrangler.jsonc.
 */
interface Env {
  /** Auth worker service binding */
  AUTH_WORKER: Fetcher;
  /** API worker service binding */
  API_WORKER: Fetcher;
  /** Optional rate limiting KV namespace */
  RATE_LIMIT_KV: KVNamespace;
}

/**
 * Example: Typed service binding usage
 *
 * Try changing "API_WORKER" to "INVALID_SERVICE" -
 * TypeScript will show an error because it's not in Env!
 */
const gateway = createGateway<Env>({
  name: "service-binding-gateway",
  basePath: "/api",
  debug: true,

  // Global policies
  policies: [
    cors({
      origins: ["https://example.com"],
      credentials: true,
    }),
  ],

  routes: [
    {
      // Route to auth worker
      path: "/auth/*",
      methods: ["GET", "POST"],
      pipeline: {
        policies: [
          // Add rate limiting with KV store in production:
          // rateLimit({ max: 10, windowSeconds: 60, store: env.RATE_LIMIT_KV }),
        ],
        upstream: {
          type: "service-binding",
          service: "AUTH_WORKER",
          // Optional: rewrite path before forwarding
          rewritePath: (path) => path.replace(/^\/api\/auth/, "/v1/auth"),
        },
      },
    },

    {
      // Route to API worker with JWT validation
      path: "/data/*",
      methods: ["GET", "POST", "PUT", "DELETE"],
      pipeline: {
        policies: [
          jwtAuth({
            jwksUrl: "https://auth.example.com/.well-known/jwks.json",
            issuer: "https://auth.example.com",
            audience: "api",
            forwardClaims: {
              sub: "x-user-sub",
              email: "x-user-email",
              roles: "x-user-roles",
            },
          }),
        ],
        upstream: {
          type: "service-binding",
          service: "API_WORKER",
          rewritePath: (path) => path.replace(/^\/api\/data/, "/v1/data"),
        },
      },
    },

    {
      // Health check route (no upstream, local handler)
      path: "/health",
      methods: ["GET"],
      pipeline: {
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

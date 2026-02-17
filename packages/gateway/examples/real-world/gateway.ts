// Production SaaS API gateway demonstrating the full breadth of Stoma's
// policy system: JWT + RBAC, OAuth2, API key auth, rate limiting, caching,
// circuit breaking, retry, timeout, traffic shadowing, geo-IP filtering,
// SSL enforcement, metrics, and the admin introspection API.

import {
  createGateway,
  cors,
  sslEnforce,
  geoIpFilter,
  jwtAuth,
  oauth2,
  rbac,
  apiKeyAuth,
  rateLimit,
  requestLog,
  metricsReporter,
  requestValidation,
  cache,
  circuitBreaker,
  retry,
  timeout,
  trafficShadow,
  health,
  InMemoryMetricsCollector,
} from "@homegrower-club/stoma";
import { memoryAdapter } from "@homegrower-club/stoma/adapters";

const adapter = memoryAdapter();
const metrics = new InMemoryMetricsCollector();

const gateway = createGateway({
  name: "saas-api",
  basePath: "/v1",

  // Admin introspection API at ___gateway/*
  admin: {
    enabled: true,
    metrics,
    auth: (c) => c.req.header("x-admin-key") === "admin-secret",
  },

  adapter,

  // Global policies — apply to every route
  policies: [
    requestLog(),
    metricsReporter({ collector: metrics }),
    sslEnforce({ hstsMaxAge: 31536000, includeSubDomains: true }),
    cors({
      origins: ["https://app.example.com"],
      methods: ["GET", "POST", "PUT", "DELETE"],
      credentials: true,
    }),
    geoIpFilter({ deny: ["KP", "IR"] }),
  ],

  routes: [
    // Health check
    health({ path: "/health" }),

    // Private API — JWT + RBAC
    {
      path: "/projects/*",
      pipeline: {
        policies: [
          jwtAuth({
            jwksUrl: "https://auth.example.com/.well-known/jwks.json",
            issuer: "https://auth.example.com",
            audience: "https://api.example.com",
            forwardClaims: {
              sub: "x-user-id",
              email: "x-user-email",
              role: "x-user-role",
            },
          }),
          rbac({ roles: ["admin", "member"] }),
          rateLimit({
            max: 200,
            windowSeconds: 60,
            store: adapter.rateLimitStore,
          }),
        ],
        upstream: {
          type: "url",
          target: "https://projects.internal.example.com",
        },
      },
    },

    // Admin-only route — RBAC with specific role
    {
      path: "/admin/*",
      pipeline: {
        policies: [
          jwtAuth({
            jwksUrl: "https://auth.example.com/.well-known/jwks.json",
            issuer: "https://auth.example.com",
            forwardClaims: { sub: "x-user-id", role: "x-user-role" },
          }),
          rbac({ roles: ["admin"] }),
        ],
        upstream: {
          type: "url",
          target: "https://admin.internal.example.com",
        },
      },
    },

    // OAuth2-protected partner API
    {
      path: "/partner/*",
      pipeline: {
        policies: [
          oauth2({
            introspectionUrl: "https://auth.example.com/oauth2/introspect",
            clientId: "oauth-client-id",
            clientSecret: "oauth-client-secret",
            requiredScopes: ["read:data", "write:data"],
            cacheTtlSeconds: 300,
            forwardTokenInfo: {
              sub: "x-partner-id",
              client_id: "x-client-id",
            },
          }),
          rateLimit({ max: 500, windowSeconds: 60 }),
          requestValidation({
            validate: (body) => {
              const errors: string[] = [];
              if (!body || typeof body !== "object") {
                errors.push("Body must be a JSON object");
              }
              return { valid: errors.length === 0, errors };
            },
          }),
        ],
        upstream: {
          type: "url",
          target: "https://partner-api.internal.example.com",
          rewritePath: (path) => path.replace("/v1/partner", ""),
        },
      },
    },

    // Webhook receiver — API key auth
    {
      path: "/webhooks/stripe",
      methods: ["POST"],
      pipeline: {
        policies: [
          apiKeyAuth({
            headerName: "Stripe-Signature",
            validate: async (key) => key.length > 0,
          }),
        ],
        upstream: {
          type: "url",
          target: "https://webhooks.internal.example.com",
        },
      },
    },

    // Public catalog — cached with resilience + traffic shadow
    {
      path: "/catalog/*",
      methods: ["GET"],
      pipeline: {
        policies: [
          rateLimit({ max: 1000, windowSeconds: 60 }),
          cache({ ttlSeconds: 120, store: adapter.cacheStore }),
          circuitBreaker({
            failureThreshold: 5,
            resetTimeoutMs: 30000,
            store: adapter.circuitBreakerStore,
          }),
          retry({ maxRetries: 2, retryOn: [502, 503] }),
          timeout({ timeoutMs: 5000 }),
          trafficShadow({
            target: "https://catalog-v2.internal.example.com",
            percentage: 10,
            methods: ["GET"],
          }),
        ],
        upstream: {
          type: "url",
          target: "https://catalog.internal.example.com",
          rewritePath: (path) => path.replace("/v1/catalog", ""),
        },
      },
    },
  ],
});

export default gateway;

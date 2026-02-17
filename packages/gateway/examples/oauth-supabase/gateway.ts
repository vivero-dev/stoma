// OAuth2 token introspection with Supabase (or any OIDC provider).
// Validates bearer tokens via the introspection endpoint, caches
// valid tokens, and forwards user info to upstream services.

import { createGateway, oauth2, cors, requestLog } from "@homegrower-club/stoma";
import { memoryAdapter } from "@homegrower-club/stoma/adapters";

const adapter = memoryAdapter();

const gateway = createGateway({
  name: "protected-api",
  basePath: "/api",
  adapter,

  // Global policies apply to all routes
  policies: [
    requestLog(),
    cors({ origins: ["https://your-app.com"] }),
  ],

  routes: [
    {
      path: "/protected/*",
      pipeline: {
        policies: [
          oauth2({
            // Supabase introspection endpoint — works with any RFC 7662 provider
            introspectionUrl: "https://xyzcompany.supabase.co/auth/v1/introspect",
            clientId: "your-anon-key",
            clientSecret: "your-service-role-key",
            tokenLocation: "header",
            headerName: "Authorization",
            headerPrefix: "Bearer",

            // Forward user info to upstream as headers
            forwardTokenInfo: {
              sub: "x-user-id",
              email: "x-user-email",
              role: "x-user-role",
            },

            // Cache valid tokens for 5 minutes to reduce introspection calls
            cacheTtlSeconds: 300,

            // Require specific scopes
            requiredScopes: ["authenticated"],
          }),
        ],
        upstream: {
          type: "url",
          target: "https://your-backend.internal",
        },
      },
    },
  ],
});

export default gateway;

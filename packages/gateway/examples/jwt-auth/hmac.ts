// JWT authentication using an HMAC shared secret.
// Use this approach when you control both token signing and validation
// (e.g., internal services sharing a secret).
// Demo API: https://stoma.opensource.homegrower.club/demo-api

import { createGateway, jwtAuth, cors, requestLog } from "@homegrower-club/stoma";

const gateway = createGateway({
  name: "secure-api",
  basePath: "/api",
  policies: [requestLog(), cors()],
  routes: [
    {
      path: "/users/*",
      pipeline: {
        policies: [
          jwtAuth({
            // HMAC shared secret — in production, read from env:
            // secret: process.env.JWT_SECRET
            secret: "my-shared-secret-key",
            headerName: "Authorization",
            tokenPrefix: "Bearer",
            // Forward JWT claims as upstream headers
            forwardClaims: {
              sub: "x-user-id",
              email: "x-user-email",
              role: "x-user-role",
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

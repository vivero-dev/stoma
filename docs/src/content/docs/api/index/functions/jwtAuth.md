---
editUrl: false
next: false
prev: false
title: "jwtAuth"
---

> **jwtAuth**(`config`): [`Policy`](/api/index/interfaces/policy/)

Defined in: [packages/stoma/src/policies/auth/jwt-auth.ts:82](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/auth/jwt-auth.ts#L82)

Validate JWT tokens and optionally forward claims as upstream headers.

Supports both HMAC (shared secret) and RSA (JWKS endpoint) verification.
JWKS responses are cached for 5 minutes. The `none` algorithm is always
rejected to prevent signature bypass attacks.

## Parameters

### config

[`JwtAuthConfig`](/api/policies/interfaces/jwtauthconfig/)

JWT authentication settings. Requires either `secret` (HMAC) or `jwksUrl` (RSA).

## Returns

[`Policy`](/api/index/interfaces/policy/)

A [Policy](/api/index/interfaces/policy/) at priority 10 (runs early, before rate limiting).

## Example

```ts
// HMAC verification with a shared secret
createGateway({
  routes: [{
    path: "/api/*",
    pipeline: {
      policies: [jwtAuth({ secret: env.JWT_SECRET })],
      upstream: { type: "url", target: "https://backend.internal" },
    },
  }],
});

// JWKS verification (e.g. Supabase, Auth0) with claim forwarding
jwtAuth({
  jwksUrl: "https://your-project.supabase.co/auth/v1/.well-known/jwks.json",
  issuer: "https://your-project.supabase.co/auth/v1",
  forwardClaims: { sub: "x-user-id", email: "x-user-email" },
});
```

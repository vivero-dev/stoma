---
editUrl: false
next: false
prev: false
title: "cors"
---

> **cors**(`config?`): [`Policy`](/api/index/interfaces/policy/)

Defined in: [packages/gateway/src/policies/transform/cors.ts:60](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/transform/cors.ts#L60)

Add Cross-Origin Resource Sharing headers to gateway responses.

Wraps Hono's built-in CORS middleware as a composable policy. Handles both
simple and preflight (OPTIONS) requests. Runs at priority 5 so CORS headers
are applied before auth or other policies reject the request.

## Parameters

### config?

`CorsConfig`

Origin rules, allowed methods/headers, and credentials. All fields optional.

## Returns

[`Policy`](/api/index/interfaces/policy/)

A [Policy](/api/index/interfaces/policy/) at priority 5 (runs very early).

## Example

```ts
import { createGateway } from "@homegrower-club/stoma";
import { cors } from "@homegrower-club/stoma/policies";

// Allow any origin (default)
createGateway({
  policies: [cors()],
  routes: [{ path: "/api/*", pipeline: { upstream: { type: "url", target: "https://api.example.com" } } }],
});

// Restrict to specific origins with credentials
cors({
  origins: ["https://app.example.com", "https://staging.example.com"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
  maxAge: 3600,
});

// Dynamic origin validation
cors({
  origins: (origin) => origin.endsWith(".example.com"),
});
```

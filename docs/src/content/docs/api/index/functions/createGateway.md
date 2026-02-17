---
editUrl: false
next: false
prev: false
title: "createGateway"
---

> **createGateway**\<`TBindings`\>(`config`): [`GatewayInstance`](/api/index/interfaces/gatewayinstance/)

Defined in: [packages/gateway/src/core/gateway.ts:100](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/core/gateway.ts#L100)

Create a gateway instance from a declarative configuration.

Registers all routes on a Hono app, builds per-route policy pipelines
(merging global + route-level policies), and wires up upstream dispatch.
Returns a [GatewayInstance](/api/index/interfaces/gatewayinstance/) whose `.app` property is the Hono app
ready to be exported as a Cloudflare Worker default export.

## Type Parameters

### TBindings

`TBindings` = `Record`\<`string`, `unknown`\>

## Parameters

### config

[`GatewayConfig`](/api/index/interfaces/gatewayconfig/)\<`TBindings`\>

Full gateway configuration including routes, policies, and options.

## Returns

[`GatewayInstance`](/api/index/interfaces/gatewayinstance/)

A [GatewayInstance](/api/index/interfaces/gatewayinstance/) with the configured Hono app.

## Throws

If no routes are provided.

## Example

```ts
import { createGateway, jwtAuth, rateLimit } from "@homegrower-club/stoma";

const gateway = createGateway({
  name: "my-api",
  basePath: "/api",
  routes: [
    {
      path: "/users/*",
      pipeline: {
        policies: [jwtAuth({ secret: env.JWT_SECRET }), rateLimit({ max: 100 })],
        upstream: { type: "url", target: "https://users-service.internal" },
      },
    },
  ],
});

export default gateway.app;
```

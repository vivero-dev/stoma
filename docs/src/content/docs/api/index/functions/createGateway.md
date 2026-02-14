---
editUrl: false
next: false
prev: false
title: "createGateway"
---

> **createGateway**\<`TBindings`\>(`config`): [`GatewayInstance`](/api/index/interfaces/gatewayinstance/)

Defined in: [src/core/gateway.ts:99](https://github.com/HomeGrower-club/stoma/blob/8ff27bd832ace97bceae4b05831dd71d1ac6ed6a/src/core/gateway.ts#L99)

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

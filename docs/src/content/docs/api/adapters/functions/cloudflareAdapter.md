---
editUrl: false
next: false
prev: false
title: "cloudflareAdapter"
---

> **cloudflareAdapter**(`bindings`): [`GatewayAdapter`](/api/index/interfaces/gatewayadapter/)

Defined in: [src/adapters/cloudflare.ts:114](https://github.com/HomeGrower-club/stoma/blob/7a6bc5c6595d42b4d2edc385006b88a77065ce23/src/adapters/cloudflare.ts#L114)

Create a GatewayAdapter using Cloudflare-native stores.

Rate limiting priority: Durable Objects (strongly consistent) > KV (eventually consistent) > none.

Pass `executionCtx` to enable `waitUntil` (for traffic shadow and other background work).
Pass `env` to enable `dispatchBinding` (for service binding dispatch via the adapter).

## Parameters

### bindings

[`CloudflareAdapterBindings`](/api/adapters/interfaces/cloudflareadapterbindings/)

## Returns

[`GatewayAdapter`](/api/index/interfaces/gatewayadapter/)

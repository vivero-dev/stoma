---
editUrl: false
next: false
prev: false
title: "CloudflareAdapterBindings"
---

Defined in: [src/adapters/cloudflare.ts:94](https://github.com/HomeGrower-club/stoma/blob/48ef00d6c13071f9fc03cba04228926dc2dd542c/src/adapters/cloudflare.ts#L94)

Bindings accepted by `cloudflareAdapter()` — KV, DO, Cache, ExecutionContext, and env.

## Properties

### cache?

> `optional` **cache**: `Cache`

Defined in: [src/adapters/cloudflare.ts:97](https://github.com/HomeGrower-club/stoma/blob/48ef00d6c13071f9fc03cba04228926dc2dd542c/src/adapters/cloudflare.ts#L97)

***

### cacheOrigin?

> `optional` **cacheOrigin**: `string`

Defined in: [src/adapters/cloudflare.ts:99](https://github.com/HomeGrower-club/stoma/blob/48ef00d6c13071f9fc03cba04228926dc2dd542c/src/adapters/cloudflare.ts#L99)

Synthetic origin used for Cache API cache keys. Default: `"https://edge-gateway.internal"`.

***

### env?

> `optional` **env**: `Record`\<`string`, `unknown`\>

Defined in: [src/adapters/cloudflare.ts:103](https://github.com/HomeGrower-club/stoma/blob/48ef00d6c13071f9fc03cba04228926dc2dd542c/src/adapters/cloudflare.ts#L103)

Workers `env` object — enables `dispatchBinding` for service binding dispatch via the adapter.

***

### executionCtx?

> `optional` **executionCtx**: `ExecutionContext`\<`unknown`\>

Defined in: [src/adapters/cloudflare.ts:101](https://github.com/HomeGrower-club/stoma/blob/48ef00d6c13071f9fc03cba04228926dc2dd542c/src/adapters/cloudflare.ts#L101)

Workers `ExecutionContext` — enables `waitUntil` for background work (e.g. traffic shadow).

***

### rateLimitDo?

> `optional` **rateLimitDo**: `DurableObjectNamespace`\<`undefined`\>

Defined in: [src/adapters/cloudflare.ts:96](https://github.com/HomeGrower-club/stoma/blob/48ef00d6c13071f9fc03cba04228926dc2dd542c/src/adapters/cloudflare.ts#L96)

***

### rateLimitKv?

> `optional` **rateLimitKv**: `KVNamespace`\<`string`\>

Defined in: [src/adapters/cloudflare.ts:95](https://github.com/HomeGrower-club/stoma/blob/48ef00d6c13071f9fc03cba04228926dc2dd542c/src/adapters/cloudflare.ts#L95)

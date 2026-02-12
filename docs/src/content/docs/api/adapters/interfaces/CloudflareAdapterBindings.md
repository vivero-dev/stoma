---
editUrl: false
next: false
prev: false
title: "CloudflareAdapterBindings"
---

Defined in: src/adapters/cloudflare.ts:94

Bindings accepted by `cloudflareAdapter()` — KV, DO, Cache, ExecutionContext, and env.

## Properties

### cache?

> `optional` **cache**: `Cache`

Defined in: src/adapters/cloudflare.ts:97

***

### cacheOrigin?

> `optional` **cacheOrigin**: `string`

Defined in: src/adapters/cloudflare.ts:99

Synthetic origin used for Cache API cache keys. Default: `"https://edge-gateway.internal"`.

***

### env?

> `optional` **env**: `Record`\<`string`, `unknown`\>

Defined in: src/adapters/cloudflare.ts:103

Workers `env` object — enables `dispatchBinding` for service binding dispatch via the adapter.

***

### executionCtx?

> `optional` **executionCtx**: `ExecutionContext`\<`unknown`\>

Defined in: src/adapters/cloudflare.ts:101

Workers `ExecutionContext` — enables `waitUntil` for background work (e.g. traffic shadow).

***

### rateLimitDo?

> `optional` **rateLimitDo**: `DurableObjectNamespace`\<`undefined`\>

Defined in: src/adapters/cloudflare.ts:96

***

### rateLimitKv?

> `optional` **rateLimitKv**: `KVNamespace`\<`string`\>

Defined in: src/adapters/cloudflare.ts:95

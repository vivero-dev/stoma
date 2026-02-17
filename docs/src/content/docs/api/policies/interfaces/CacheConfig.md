---
editUrl: false
next: false
prev: false
title: "CacheConfig"
---

Defined in: [packages/gateway/src/policies/traffic/cache.ts:155](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/traffic/cache.ts#L155)

Configuration for the cache policy.

## Extends

- [`PolicyConfig`](/api/index/interfaces/policyconfig/)

## Properties

### bypassDirectives?

> `optional` **bypassDirectives**: `string`[]

Defined in: [packages/gateway/src/policies/traffic/cache.ts:173](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/traffic/cache.ts#L173)

Cache-Control directives that trigger a bypass. Matched at the directive level, not substring. Default: `["no-store", "no-cache"]`.

***

### cacheableStatuses?

> `optional` **cacheableStatuses**: `number`[]

Defined in: [packages/gateway/src/policies/traffic/cache.ts:163](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/traffic/cache.ts#L163)

Only cache responses with these status codes. When set, responses with other statuses are not cached (5xx is always excluded regardless).

***

### cacheKeyFn()?

> `optional` **cacheKeyFn**: (`c`) => `string` \| `Promise`\<`string`\>

Defined in: [packages/gateway/src/policies/traffic/cache.ts:161](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/traffic/cache.ts#L161)

Custom cache key builder. Supports async for body-based keys. Default: method + url (+ body hash for POST/PUT/PATCH).

#### Parameters

##### c

`Context`

#### Returns

`string` \| `Promise`\<`string`\>

***

### cacheStatusHeader?

> `optional` **cacheStatusHeader**: `string`

Defined in: [packages/gateway/src/policies/traffic/cache.ts:171](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/traffic/cache.ts#L171)

Response header name for cache status (HIT/MISS/BYPASS/SKIP). Default: `"x-cache"`.

***

### methods?

> `optional` **methods**: `string`[]

Defined in: [packages/gateway/src/policies/traffic/cache.ts:159](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/traffic/cache.ts#L159)

HTTP methods to cache. Default: ["GET"]. Case-insensitive.

***

### respectCacheControl?

> `optional` **respectCacheControl**: `boolean`

Defined in: [packages/gateway/src/policies/traffic/cache.ts:169](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/traffic/cache.ts#L169)

Respect upstream Cache-Control directives. Default: true.

***

### skip()?

> `optional` **skip**: (`c`) => `boolean` \| `Promise`\<`boolean`\>

Defined in: [packages/gateway/src/policies/types.ts:90](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/types.ts#L90)

Skip this policy when condition returns true

#### Parameters

##### c

`unknown`

#### Returns

`boolean` \| `Promise`\<`boolean`\>

#### Inherited from

[`PolicyConfig`](/api/index/interfaces/policyconfig/).[`skip`](/api/index/interfaces/policyconfig/#skip)

***

### store?

> `optional` **store**: [`CacheStore`](/api/index/interfaces/cachestore/)

Defined in: [packages/gateway/src/policies/traffic/cache.ts:167](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/traffic/cache.ts#L167)

Storage backend. Default: InMemoryCacheStore.

***

### ttlSeconds?

> `optional` **ttlSeconds**: `number`

Defined in: [packages/gateway/src/policies/traffic/cache.ts:157](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/traffic/cache.ts#L157)

Cache TTL in seconds. Default: 300.

***

### varyHeaders?

> `optional` **varyHeaders**: `string`[]

Defined in: [packages/gateway/src/policies/traffic/cache.ts:165](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/traffic/cache.ts#L165)

Vary cache key on these request headers.

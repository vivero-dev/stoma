---
editUrl: false
next: false
prev: false
title: "CacheConfig"
---

Defined in: [packages/stoma/src/policies/traffic/cache.ts:121](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/traffic/cache.ts#L121)

Configuration for the cache policy.

## Extends

- [`PolicyConfig`](/api/index/interfaces/policyconfig/)

## Properties

### bypassDirectives?

> `optional` **bypassDirectives**: `string`[]

Defined in: [packages/stoma/src/policies/traffic/cache.ts:139](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/traffic/cache.ts#L139)

Cache-Control directives that trigger a bypass. Matched at the directive level, not substring. Default: `["no-store", "no-cache"]`.

***

### cacheableStatuses?

> `optional` **cacheableStatuses**: `number`[]

Defined in: [packages/stoma/src/policies/traffic/cache.ts:129](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/traffic/cache.ts#L129)

Only cache responses with these status codes. When set, responses with other statuses are not cached (5xx is always excluded regardless).

***

### cacheKeyFn()?

> `optional` **cacheKeyFn**: (`c`) => `string` \| `Promise`\<`string`\>

Defined in: [packages/stoma/src/policies/traffic/cache.ts:127](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/traffic/cache.ts#L127)

Custom cache key builder. Supports async for body-based keys. Default: method + url (+ body hash for POST/PUT/PATCH).

#### Parameters

##### c

`Context`

#### Returns

`string` \| `Promise`\<`string`\>

***

### cacheStatusHeader?

> `optional` **cacheStatusHeader**: `string`

Defined in: [packages/stoma/src/policies/traffic/cache.ts:137](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/traffic/cache.ts#L137)

Response header name for cache status (HIT/MISS/BYPASS/SKIP). Default: `"x-cache"`.

***

### methods?

> `optional` **methods**: `string`[]

Defined in: [packages/stoma/src/policies/traffic/cache.ts:125](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/traffic/cache.ts#L125)

HTTP methods to cache. Default: ["GET"]. Case-insensitive.

***

### respectCacheControl?

> `optional` **respectCacheControl**: `boolean`

Defined in: [packages/stoma/src/policies/traffic/cache.ts:135](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/traffic/cache.ts#L135)

Respect upstream Cache-Control directives. Default: true.

***

### skip()?

> `optional` **skip**: (`c`) => `boolean` \| `Promise`\<`boolean`\>

Defined in: [packages/stoma/src/policies/types.ts:33](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/types.ts#L33)

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

Defined in: [packages/stoma/src/policies/traffic/cache.ts:133](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/traffic/cache.ts#L133)

Storage backend. Default: InMemoryCacheStore.

***

### ttlSeconds?

> `optional` **ttlSeconds**: `number`

Defined in: [packages/stoma/src/policies/traffic/cache.ts:123](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/traffic/cache.ts#L123)

Cache TTL in seconds. Default: 300.

***

### varyHeaders?

> `optional` **varyHeaders**: `string`[]

Defined in: [packages/stoma/src/policies/traffic/cache.ts:131](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/traffic/cache.ts#L131)

Vary cache key on these request headers.

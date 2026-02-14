---
editUrl: false
next: false
prev: false
title: "CacheConfig"
---

Defined in: [src/policies/traffic/cache.ts:137](https://github.com/HomeGrower-club/stoma/blob/8b84574bca28149f020bbd910337511015437508/src/policies/traffic/cache.ts#L137)

Configuration for the cache policy.

## Extends

- [`PolicyConfig`](/api/index/interfaces/policyconfig/)

## Properties

### bypassDirectives?

> `optional` **bypassDirectives**: `string`[]

Defined in: [src/policies/traffic/cache.ts:155](https://github.com/HomeGrower-club/stoma/blob/8b84574bca28149f020bbd910337511015437508/src/policies/traffic/cache.ts#L155)

Cache-Control directives that trigger a bypass. Matched at the directive level, not substring. Default: `["no-store", "no-cache"]`.

***

### cacheableStatuses?

> `optional` **cacheableStatuses**: `number`[]

Defined in: [src/policies/traffic/cache.ts:145](https://github.com/HomeGrower-club/stoma/blob/8b84574bca28149f020bbd910337511015437508/src/policies/traffic/cache.ts#L145)

Only cache responses with these status codes. When set, responses with other statuses are not cached (5xx is always excluded regardless).

***

### cacheKeyFn()?

> `optional` **cacheKeyFn**: (`c`) => `string` \| `Promise`\<`string`\>

Defined in: [src/policies/traffic/cache.ts:143](https://github.com/HomeGrower-club/stoma/blob/8b84574bca28149f020bbd910337511015437508/src/policies/traffic/cache.ts#L143)

Custom cache key builder. Supports async for body-based keys. Default: method + url (+ body hash for POST/PUT/PATCH).

#### Parameters

##### c

`Context`

#### Returns

`string` \| `Promise`\<`string`\>

***

### cacheStatusHeader?

> `optional` **cacheStatusHeader**: `string`

Defined in: [src/policies/traffic/cache.ts:153](https://github.com/HomeGrower-club/stoma/blob/8b84574bca28149f020bbd910337511015437508/src/policies/traffic/cache.ts#L153)

Response header name for cache status (HIT/MISS/BYPASS/SKIP). Default: `"x-cache"`.

***

### methods?

> `optional` **methods**: `string`[]

Defined in: [src/policies/traffic/cache.ts:141](https://github.com/HomeGrower-club/stoma/blob/8b84574bca28149f020bbd910337511015437508/src/policies/traffic/cache.ts#L141)

HTTP methods to cache. Default: ["GET"]. Case-insensitive.

***

### respectCacheControl?

> `optional` **respectCacheControl**: `boolean`

Defined in: [src/policies/traffic/cache.ts:151](https://github.com/HomeGrower-club/stoma/blob/8b84574bca28149f020bbd910337511015437508/src/policies/traffic/cache.ts#L151)

Respect upstream Cache-Control directives. Default: true.

***

### skip()?

> `optional` **skip**: (`c`) => `boolean` \| `Promise`\<`boolean`\>

Defined in: [src/policies/types.ts:69](https://github.com/HomeGrower-club/stoma/blob/8b84574bca28149f020bbd910337511015437508/src/policies/types.ts#L69)

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

Defined in: [src/policies/traffic/cache.ts:149](https://github.com/HomeGrower-club/stoma/blob/8b84574bca28149f020bbd910337511015437508/src/policies/traffic/cache.ts#L149)

Storage backend. Default: InMemoryCacheStore.

***

### ttlSeconds?

> `optional` **ttlSeconds**: `number`

Defined in: [src/policies/traffic/cache.ts:139](https://github.com/HomeGrower-club/stoma/blob/8b84574bca28149f020bbd910337511015437508/src/policies/traffic/cache.ts#L139)

Cache TTL in seconds. Default: 300.

***

### varyHeaders?

> `optional` **varyHeaders**: `string`[]

Defined in: [src/policies/traffic/cache.ts:147](https://github.com/HomeGrower-club/stoma/blob/8b84574bca28149f020bbd910337511015437508/src/policies/traffic/cache.ts#L147)

Vary cache key on these request headers.

---
editUrl: false
next: false
prev: false
title: "CacheConfig"
---

Defined in: [src/policies/traffic/cache.ts:148](https://github.com/HomeGrower-club/stoma/blob/512cbe1c3920cd195327e7c8f58f5202130d56a5/src/policies/traffic/cache.ts#L148)

Configuration for the cache policy.

## Extends

- [`PolicyConfig`](/api/index/interfaces/policyconfig/)

## Properties

### bypassDirectives?

> `optional` **bypassDirectives**: `string`[]

Defined in: [src/policies/traffic/cache.ts:166](https://github.com/HomeGrower-club/stoma/blob/512cbe1c3920cd195327e7c8f58f5202130d56a5/src/policies/traffic/cache.ts#L166)

Cache-Control directives that trigger a bypass. Matched at the directive level, not substring. Default: `["no-store", "no-cache"]`.

***

### cacheableStatuses?

> `optional` **cacheableStatuses**: `number`[]

Defined in: [src/policies/traffic/cache.ts:156](https://github.com/HomeGrower-club/stoma/blob/512cbe1c3920cd195327e7c8f58f5202130d56a5/src/policies/traffic/cache.ts#L156)

Only cache responses with these status codes. When set, responses with other statuses are not cached (5xx is always excluded regardless).

***

### cacheKeyFn()?

> `optional` **cacheKeyFn**: (`c`) => `string` \| `Promise`\<`string`\>

Defined in: [src/policies/traffic/cache.ts:154](https://github.com/HomeGrower-club/stoma/blob/512cbe1c3920cd195327e7c8f58f5202130d56a5/src/policies/traffic/cache.ts#L154)

Custom cache key builder. Supports async for body-based keys. Default: method + url (+ body hash for POST/PUT/PATCH).

#### Parameters

##### c

`Context`

#### Returns

`string` \| `Promise`\<`string`\>

***

### cacheStatusHeader?

> `optional` **cacheStatusHeader**: `string`

Defined in: [src/policies/traffic/cache.ts:164](https://github.com/HomeGrower-club/stoma/blob/512cbe1c3920cd195327e7c8f58f5202130d56a5/src/policies/traffic/cache.ts#L164)

Response header name for cache status (HIT/MISS/BYPASS/SKIP). Default: `"x-cache"`.

***

### methods?

> `optional` **methods**: `string`[]

Defined in: [src/policies/traffic/cache.ts:152](https://github.com/HomeGrower-club/stoma/blob/512cbe1c3920cd195327e7c8f58f5202130d56a5/src/policies/traffic/cache.ts#L152)

HTTP methods to cache. Default: ["GET"]. Case-insensitive.

***

### respectCacheControl?

> `optional` **respectCacheControl**: `boolean`

Defined in: [src/policies/traffic/cache.ts:162](https://github.com/HomeGrower-club/stoma/blob/512cbe1c3920cd195327e7c8f58f5202130d56a5/src/policies/traffic/cache.ts#L162)

Respect upstream Cache-Control directives. Default: true.

***

### skip()?

> `optional` **skip**: (`c`) => `boolean` \| `Promise`\<`boolean`\>

Defined in: [src/policies/types.ts:90](https://github.com/HomeGrower-club/stoma/blob/512cbe1c3920cd195327e7c8f58f5202130d56a5/src/policies/types.ts#L90)

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

Defined in: [src/policies/traffic/cache.ts:160](https://github.com/HomeGrower-club/stoma/blob/512cbe1c3920cd195327e7c8f58f5202130d56a5/src/policies/traffic/cache.ts#L160)

Storage backend. Default: InMemoryCacheStore.

***

### ttlSeconds?

> `optional` **ttlSeconds**: `number`

Defined in: [src/policies/traffic/cache.ts:150](https://github.com/HomeGrower-club/stoma/blob/512cbe1c3920cd195327e7c8f58f5202130d56a5/src/policies/traffic/cache.ts#L150)

Cache TTL in seconds. Default: 300.

***

### varyHeaders?

> `optional` **varyHeaders**: `string`[]

Defined in: [src/policies/traffic/cache.ts:158](https://github.com/HomeGrower-club/stoma/blob/512cbe1c3920cd195327e7c8f58f5202130d56a5/src/policies/traffic/cache.ts#L158)

Vary cache key on these request headers.

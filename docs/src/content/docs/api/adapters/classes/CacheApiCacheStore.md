---
editUrl: false
next: false
prev: false
title: "CacheApiCacheStore"
---

Defined in: [packages/gateway/src/adapters/cloudflare.ts:48](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/adapters/cloudflare.ts#L48)

Response cache backed by the Cloudflare Cache API.

## Implements

- [`CacheStore`](/api/index/interfaces/cachestore/)

## Constructors

### Constructor

> **new CacheApiCacheStore**(`cache?`, `origin?`): `CacheApiCacheStore`

Defined in: [packages/gateway/src/adapters/cloudflare.ts:56](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/adapters/cloudflare.ts#L56)

#### Parameters

##### cache?

`Cache`

A `Cache` instance (e.g. `caches.default`). Falls back to `caches.default` when omitted.

##### origin?

`string`

Synthetic origin used to construct cache keys. Default: `"https://edge-gateway.internal"`.

#### Returns

`CacheApiCacheStore`

## Methods

### delete()

> **delete**(`key`): `Promise`\<`boolean`\>

Defined in: [packages/gateway/src/adapters/cloudflare.ts:84](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/adapters/cloudflare.ts#L84)

Delete a cached entry. Returns true if something was removed.

#### Parameters

##### key

`string`

#### Returns

`Promise`\<`boolean`\>

#### Implementation of

[`CacheStore`](/api/index/interfaces/cachestore/).[`delete`](/api/index/interfaces/cachestore/#delete)

***

### get()

> **get**(`key`): `Promise`\<`Response` \| `null`\>

Defined in: [packages/gateway/src/adapters/cloudflare.ts:62](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/adapters/cloudflare.ts#L62)

Retrieve a cached response by key. Returns null on miss.

#### Parameters

##### key

`string`

#### Returns

`Promise`\<`Response` \| `null`\>

#### Implementation of

[`CacheStore`](/api/index/interfaces/cachestore/).[`get`](/api/index/interfaces/cachestore/#get)

***

### put()

> **put**(`key`, `response`, `ttlSeconds`): `Promise`\<`void`\>

Defined in: [packages/gateway/src/adapters/cloudflare.ts:68](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/adapters/cloudflare.ts#L68)

Store a response under key with a TTL in seconds.

#### Parameters

##### key

`string`

##### response

`Response`

##### ttlSeconds

`number`

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`CacheStore`](/api/index/interfaces/cachestore/).[`put`](/api/index/interfaces/cachestore/#put)

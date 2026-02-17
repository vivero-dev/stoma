---
editUrl: false
next: false
prev: false
title: "InMemoryCacheStore"
---

Defined in: [packages/gateway/src/policies/traffic/cache.ts:58](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/traffic/cache.ts#L58)

Response caching with pluggable storage, TTL, and automatic cache-control headers (priority 40).

## Implements

- [`CacheStore`](/api/index/interfaces/cachestore/)

## Constructors

### Constructor

> **new InMemoryCacheStore**(`options?`): `InMemoryCacheStore`

Defined in: [packages/gateway/src/policies/traffic/cache.ts:62](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/traffic/cache.ts#L62)

#### Parameters

##### options?

[`InMemoryCacheStoreOptions`](/api/index/interfaces/inmemorycachestoreoptions/)

#### Returns

`InMemoryCacheStore`

## Accessors

### size

#### Get Signature

> **get** **size**(): `number`

Defined in: [packages/gateway/src/policies/traffic/cache.ts:123](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/traffic/cache.ts#L123)

Current number of entries (for testing/inspection)

##### Returns

`number`

## Methods

### clear()

> **clear**(): `void`

Defined in: [packages/gateway/src/policies/traffic/cache.ts:118](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/traffic/cache.ts#L118)

Remove all entries (for testing)

#### Returns

`void`

***

### delete()

> **delete**(`key`): `Promise`\<`boolean`\>

Defined in: [packages/gateway/src/policies/traffic/cache.ts:113](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/traffic/cache.ts#L113)

Delete a cached entry. Returns true if something was removed.

#### Parameters

##### key

`string`

#### Returns

`Promise`\<`boolean`\>

#### Implementation of

[`CacheStore`](/api/index/interfaces/cachestore/).[`delete`](/api/index/interfaces/cachestore/#delete)

***

### destroy()

> **destroy**(): `void`

Defined in: [packages/gateway/src/policies/traffic/cache.ts:128](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/traffic/cache.ts#L128)

Release all cached entries.

#### Returns

`void`

#### Implementation of

[`CacheStore`](/api/index/interfaces/cachestore/).[`destroy`](/api/index/interfaces/cachestore/#destroy)

***

### get()

> **get**(`key`): `Promise`\<`Response` \| `null`\>

Defined in: [packages/gateway/src/policies/traffic/cache.ts:66](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/traffic/cache.ts#L66)

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

Defined in: [packages/gateway/src/policies/traffic/cache.ts:82](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/traffic/cache.ts#L82)

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

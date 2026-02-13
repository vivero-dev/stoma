---
editUrl: false
next: false
prev: false
title: "InMemoryCacheStore"
---

Defined in: [src/policies/traffic/cache.ts:45](https://github.com/HomeGrower-club/stoma/blob/4764d83fea90804e5e2c02d8c0ed4153d64e412b/src/policies/traffic/cache.ts#L45)

Response caching with pluggable storage, TTL, and automatic cache-control headers (priority 40).

## Implements

- [`CacheStore`](/api/index/interfaces/cachestore/)

## Constructors

### Constructor

> **new InMemoryCacheStore**(`options?`): `InMemoryCacheStore`

Defined in: [src/policies/traffic/cache.ts:49](https://github.com/HomeGrower-club/stoma/blob/4764d83fea90804e5e2c02d8c0ed4153d64e412b/src/policies/traffic/cache.ts#L49)

#### Parameters

##### options?

[`InMemoryCacheStoreOptions`](/api/index/interfaces/inmemorycachestoreoptions/)

#### Returns

`InMemoryCacheStore`

## Accessors

### size

#### Get Signature

> **get** **size**(): `number`

Defined in: [src/policies/traffic/cache.ts:110](https://github.com/HomeGrower-club/stoma/blob/4764d83fea90804e5e2c02d8c0ed4153d64e412b/src/policies/traffic/cache.ts#L110)

Current number of entries (for testing/inspection)

##### Returns

`number`

## Methods

### clear()

> **clear**(): `void`

Defined in: [src/policies/traffic/cache.ts:105](https://github.com/HomeGrower-club/stoma/blob/4764d83fea90804e5e2c02d8c0ed4153d64e412b/src/policies/traffic/cache.ts#L105)

Remove all entries (for testing)

#### Returns

`void`

***

### delete()

> **delete**(`key`): `Promise`\<`boolean`\>

Defined in: [src/policies/traffic/cache.ts:100](https://github.com/HomeGrower-club/stoma/blob/4764d83fea90804e5e2c02d8c0ed4153d64e412b/src/policies/traffic/cache.ts#L100)

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

Defined in: [src/policies/traffic/cache.ts:53](https://github.com/HomeGrower-club/stoma/blob/4764d83fea90804e5e2c02d8c0ed4153d64e412b/src/policies/traffic/cache.ts#L53)

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

Defined in: [src/policies/traffic/cache.ts:69](https://github.com/HomeGrower-club/stoma/blob/4764d83fea90804e5e2c02d8c0ed4153d64e412b/src/policies/traffic/cache.ts#L69)

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

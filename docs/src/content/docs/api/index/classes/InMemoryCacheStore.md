---
editUrl: false
next: false
prev: false
title: "InMemoryCacheStore"
---

Defined in: [packages/stoma/src/policies/traffic/cache.ts:37](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/traffic/cache.ts#L37)

Response caching with pluggable storage, TTL, and automatic cache-control headers (priority 40).

## Implements

- [`CacheStore`](/api/index/interfaces/cachestore/)

## Constructors

### Constructor

> **new InMemoryCacheStore**(`options?`): `InMemoryCacheStore`

Defined in: [packages/stoma/src/policies/traffic/cache.ts:41](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/traffic/cache.ts#L41)

#### Parameters

##### options?

[`InMemoryCacheStoreOptions`](/api/index/interfaces/inmemorycachestoreoptions/)

#### Returns

`InMemoryCacheStore`

## Accessors

### size

#### Get Signature

> **get** **size**(): `number`

Defined in: [packages/stoma/src/policies/traffic/cache.ts:94](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/traffic/cache.ts#L94)

Current number of entries (for testing/inspection)

##### Returns

`number`

## Methods

### clear()

> **clear**(): `void`

Defined in: [packages/stoma/src/policies/traffic/cache.ts:89](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/traffic/cache.ts#L89)

Remove all entries (for testing)

#### Returns

`void`

***

### delete()

> **delete**(`key`): `Promise`\<`boolean`\>

Defined in: [packages/stoma/src/policies/traffic/cache.ts:84](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/traffic/cache.ts#L84)

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

Defined in: [packages/stoma/src/policies/traffic/cache.ts:45](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/traffic/cache.ts#L45)

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

Defined in: [packages/stoma/src/policies/traffic/cache.ts:61](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/traffic/cache.ts#L61)

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

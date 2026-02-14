---
editUrl: false
next: false
prev: false
title: "InMemoryCacheStore"
---

Defined in: [src/policies/traffic/cache.ts:56](https://github.com/HomeGrower-club/stoma/blob/512cbe1c3920cd195327e7c8f58f5202130d56a5/src/policies/traffic/cache.ts#L56)

Response caching with pluggable storage, TTL, and automatic cache-control headers (priority 40).

## Implements

- [`CacheStore`](/api/index/interfaces/cachestore/)

## Constructors

### Constructor

> **new InMemoryCacheStore**(`options?`): `InMemoryCacheStore`

Defined in: [src/policies/traffic/cache.ts:60](https://github.com/HomeGrower-club/stoma/blob/512cbe1c3920cd195327e7c8f58f5202130d56a5/src/policies/traffic/cache.ts#L60)

#### Parameters

##### options?

[`InMemoryCacheStoreOptions`](/api/index/interfaces/inmemorycachestoreoptions/)

#### Returns

`InMemoryCacheStore`

## Accessors

### size

#### Get Signature

> **get** **size**(): `number`

Defined in: [src/policies/traffic/cache.ts:121](https://github.com/HomeGrower-club/stoma/blob/512cbe1c3920cd195327e7c8f58f5202130d56a5/src/policies/traffic/cache.ts#L121)

Current number of entries (for testing/inspection)

##### Returns

`number`

## Methods

### clear()

> **clear**(): `void`

Defined in: [src/policies/traffic/cache.ts:116](https://github.com/HomeGrower-club/stoma/blob/512cbe1c3920cd195327e7c8f58f5202130d56a5/src/policies/traffic/cache.ts#L116)

Remove all entries (for testing)

#### Returns

`void`

***

### delete()

> **delete**(`key`): `Promise`\<`boolean`\>

Defined in: [src/policies/traffic/cache.ts:111](https://github.com/HomeGrower-club/stoma/blob/512cbe1c3920cd195327e7c8f58f5202130d56a5/src/policies/traffic/cache.ts#L111)

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

Defined in: [src/policies/traffic/cache.ts:64](https://github.com/HomeGrower-club/stoma/blob/512cbe1c3920cd195327e7c8f58f5202130d56a5/src/policies/traffic/cache.ts#L64)

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

Defined in: [src/policies/traffic/cache.ts:80](https://github.com/HomeGrower-club/stoma/blob/512cbe1c3920cd195327e7c8f58f5202130d56a5/src/policies/traffic/cache.ts#L80)

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

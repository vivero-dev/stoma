---
editUrl: false
next: false
prev: false
title: "RedisCacheStore"
---

Defined in: [packages/gateway/src/adapters/redis.ts:275](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/adapters/redis.ts#L275)

Response cache backed by Redis with base64-encoded body and TTL-based expiry.

## Implements

- [`CacheStore`](/api/index/interfaces/cachestore/)

## Constructors

### Constructor

> **new RedisCacheStore**(`client`, `prefix`, `setWithTTL`): `RedisCacheStore`

Defined in: [packages/gateway/src/adapters/redis.ts:276](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/adapters/redis.ts#L276)

#### Parameters

##### client

[`RedisClient`](/api/adapters/interfaces/redisclient/)

##### prefix

`string`

##### setWithTTL

(`client`, `key`, `value`, `ttlSeconds`) => `Promise`\<`unknown`\> | `undefined`

#### Returns

`RedisCacheStore`

## Methods

### delete()

> **delete**(`key`): `Promise`\<`boolean`\>

Defined in: [packages/gateway/src/adapters/redis.ts:330](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/adapters/redis.ts#L330)

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

Defined in: [packages/gateway/src/adapters/redis.ts:286](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/adapters/redis.ts#L286)

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

Defined in: [packages/gateway/src/adapters/redis.ts:304](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/adapters/redis.ts#L304)

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

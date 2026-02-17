---
editUrl: false
next: false
prev: false
title: "PostgresCacheStore"
---

Defined in: [packages/gateway/src/adapters/postgres.ts:291](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/adapters/postgres.ts#L291)

Response cache backed by PostgreSQL with base64-encoded body and expiry timestamp.

## Implements

- [`CacheStore`](/api/index/interfaces/cachestore/)

## Constructors

### Constructor

> **new PostgresCacheStore**(`client`, `table`): `PostgresCacheStore`

Defined in: [packages/gateway/src/adapters/postgres.ts:292](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/adapters/postgres.ts#L292)

#### Parameters

##### client

[`PostgresClient`](/api/adapters/interfaces/postgresclient/)

##### table

`string`

#### Returns

`PostgresCacheStore`

## Methods

### cleanup()

> **cleanup**(): `Promise`\<`void`\>

Defined in: [packages/gateway/src/adapters/postgres.ts:357](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/adapters/postgres.ts#L357)

Remove expired entries. Call periodically (e.g. via cron or waitUntil).

#### Returns

`Promise`\<`void`\>

***

### delete()

> **delete**(`key`): `Promise`\<`boolean`\>

Defined in: [packages/gateway/src/adapters/postgres.ts:348](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/adapters/postgres.ts#L348)

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

Defined in: [packages/gateway/src/adapters/postgres.ts:297](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/adapters/postgres.ts#L297)

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

Defined in: [packages/gateway/src/adapters/postgres.ts:321](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/adapters/postgres.ts#L321)

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

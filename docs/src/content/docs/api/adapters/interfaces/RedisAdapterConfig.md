---
editUrl: false
next: false
prev: false
title: "RedisAdapterConfig"
---

Defined in: [packages/gateway/src/adapters/redis.ts:41](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/adapters/redis.ts#L41)

Config accepted by `redisAdapter()` - client, prefix, setWithTTL override, store toggles.

## Properties

### client

> **client**: [`RedisClient`](/api/adapters/interfaces/redisclient/)

Defined in: [packages/gateway/src/adapters/redis.ts:43](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/adapters/redis.ts#L43)

Redis client instance (ioredis, node-redis, etc.).

***

### prefix?

> `optional` **prefix**: `string`

Defined in: [packages/gateway/src/adapters/redis.ts:45](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/adapters/redis.ts#L45)

Key prefix for all Redis keys. Default: `"stoma:"`.

***

### setWithTTL()?

> `optional` **setWithTTL**: (`client`, `key`, `value`, `ttlSeconds`) => `Promise`\<`unknown`\>

Defined in: [packages/gateway/src/adapters/redis.ts:54](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/adapters/redis.ts#L54)

Override for SET-with-TTL. Default uses ioredis-style `client.set(key, value, "EX", ttl)`.

For node-redis v4:
```ts
(c, k, v, ttl) => c.set(k, v, { EX: ttl } as any)
```

#### Parameters

##### client

[`RedisClient`](/api/adapters/interfaces/redisclient/)

##### key

`string`

##### value

`string`

##### ttlSeconds

`number`

#### Returns

`Promise`\<`unknown`\>

***

### stores?

> `optional` **stores**: `object`

Defined in: [packages/gateway/src/adapters/redis.ts:61](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/adapters/redis.ts#L61)

Selectively enable/disable individual stores. All enabled by default.

#### cache?

> `optional` **cache**: `boolean`

#### circuitBreaker?

> `optional` **circuitBreaker**: `boolean`

#### rateLimit?

> `optional` **rateLimit**: `boolean`

***

### waitUntil()?

> `optional` **waitUntil**: (`promise`) => `void`

Defined in: [packages/gateway/src/adapters/redis.ts:67](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/adapters/redis.ts#L67)

Schedule background work that outlives the response.

#### Parameters

##### promise

`Promise`\<`unknown`\>

#### Returns

`void`

---
editUrl: false
next: false
prev: false
title: "RedisRateLimitStore"
---

Defined in: [src/adapters/redis.ts:139](https://github.com/HomeGrower-club/stoma/blob/48ef00d6c13071f9fc03cba04228926dc2dd542c/src/adapters/redis.ts#L139)

Rate limit store backed by Redis with atomic Lua script.

## Implements

- [`RateLimitStore`](/api/index/interfaces/ratelimitstore/)

## Constructors

### Constructor

> **new RedisRateLimitStore**(`client`, `prefix`): `RedisRateLimitStore`

Defined in: [src/adapters/redis.ts:140](https://github.com/HomeGrower-club/stoma/blob/48ef00d6c13071f9fc03cba04228926dc2dd542c/src/adapters/redis.ts#L140)

#### Parameters

##### client

[`RedisClient`](/api/adapters/interfaces/redisclient/)

##### prefix

`string`

#### Returns

`RedisRateLimitStore`

## Methods

### increment()

> **increment**(`key`, `windowSeconds`): `Promise`\<\{ `count`: `number`; `resetAt`: `number`; \}\>

Defined in: [src/adapters/redis.ts:145](https://github.com/HomeGrower-club/stoma/blob/48ef00d6c13071f9fc03cba04228926dc2dd542c/src/adapters/redis.ts#L145)

Increment the counter for a key, returning the new count and TTL

#### Parameters

##### key

`string`

##### windowSeconds

`number`

#### Returns

`Promise`\<\{ `count`: `number`; `resetAt`: `number`; \}\>

#### Implementation of

[`RateLimitStore`](/api/index/interfaces/ratelimitstore/).[`increment`](/api/index/interfaces/ratelimitstore/#increment)

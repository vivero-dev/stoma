---
editUrl: false
next: false
prev: false
title: "PostgresRateLimitStore"
---

Defined in: [packages/gateway/src/adapters/postgres.ts:136](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/adapters/postgres.ts#L136)

Rate limit store backed by PostgreSQL using atomic upsert.

Uses `INSERT ... ON CONFLICT DO UPDATE` with a `CASE` expression to
atomically reset or increment the counter in a single query.

## Implements

- [`RateLimitStore`](/api/index/interfaces/ratelimitstore/)

## Constructors

### Constructor

> **new PostgresRateLimitStore**(`client`, `table`): `PostgresRateLimitStore`

Defined in: [packages/gateway/src/adapters/postgres.ts:137](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/adapters/postgres.ts#L137)

#### Parameters

##### client

[`PostgresClient`](/api/adapters/interfaces/postgresclient/)

##### table

`string`

#### Returns

`PostgresRateLimitStore`

## Methods

### cleanup()

> **cleanup**(): `Promise`\<`void`\>

Defined in: [packages/gateway/src/adapters/postgres.ts:176](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/adapters/postgres.ts#L176)

Remove expired entries. Call periodically (e.g. via cron or waitUntil).

#### Returns

`Promise`\<`void`\>

***

### increment()

> **increment**(`key`, `windowSeconds`): `Promise`\<\{ `count`: `number`; `resetAt`: `number`; \}\>

Defined in: [packages/gateway/src/adapters/postgres.ts:142](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/adapters/postgres.ts#L142)

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

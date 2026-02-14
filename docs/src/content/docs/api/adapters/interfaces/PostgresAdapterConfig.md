---
editUrl: false
next: false
prev: false
title: "PostgresAdapterConfig"
---

Defined in: [src/adapters/postgres.ts:37](https://github.com/HomeGrower-club/stoma/blob/64d47b2a9c6564c1291a5dd9d515f24b13c13c53/src/adapters/postgres.ts#L37)

Config accepted by `postgresAdapter()` - client, table prefix, store toggles.

## Properties

### client

> **client**: [`PostgresClient`](/api/adapters/interfaces/postgresclient/)

Defined in: [src/adapters/postgres.ts:39](https://github.com/HomeGrower-club/stoma/blob/64d47b2a9c6564c1291a5dd9d515f24b13c13c53/src/adapters/postgres.ts#L39)

PostgreSQL client instance (pg Pool, postgres.js, etc.).

***

### stores?

> `optional` **stores**: `object`

Defined in: [src/adapters/postgres.ts:43](https://github.com/HomeGrower-club/stoma/blob/64d47b2a9c6564c1291a5dd9d515f24b13c13c53/src/adapters/postgres.ts#L43)

Selectively enable/disable individual stores. All enabled by default.

#### cache?

> `optional` **cache**: `boolean`

#### circuitBreaker?

> `optional` **circuitBreaker**: `boolean`

#### rateLimit?

> `optional` **rateLimit**: `boolean`

***

### tablePrefix?

> `optional` **tablePrefix**: `string`

Defined in: [src/adapters/postgres.ts:41](https://github.com/HomeGrower-club/stoma/blob/64d47b2a9c6564c1291a5dd9d515f24b13c13c53/src/adapters/postgres.ts#L41)

Table name prefix. Default: `"stoma_"`.

***

### waitUntil()?

> `optional` **waitUntil**: (`promise`) => `void`

Defined in: [src/adapters/postgres.ts:49](https://github.com/HomeGrower-club/stoma/blob/64d47b2a9c6564c1291a5dd9d515f24b13c13c53/src/adapters/postgres.ts#L49)

Schedule background work that outlives the response.

#### Parameters

##### promise

`Promise`\<`unknown`\>

#### Returns

`void`

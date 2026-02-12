---
editUrl: false
next: false
prev: false
title: "CacheStore"
---

Defined in: src/policies/traffic/cache.ts:13

Pluggable cache storage backend

## Methods

### delete()

> **delete**(`key`): `Promise`\<`boolean`\>

Defined in: src/policies/traffic/cache.ts:19

Delete a cached entry. Returns true if something was removed.

#### Parameters

##### key

`string`

#### Returns

`Promise`\<`boolean`\>

***

### get()

> **get**(`key`): `Promise`\<`Response` \| `null`\>

Defined in: src/policies/traffic/cache.ts:15

Retrieve a cached response by key. Returns null on miss.

#### Parameters

##### key

`string`

#### Returns

`Promise`\<`Response` \| `null`\>

***

### put()

> **put**(`key`, `response`, `ttlSeconds`): `Promise`\<`void`\>

Defined in: src/policies/traffic/cache.ts:17

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

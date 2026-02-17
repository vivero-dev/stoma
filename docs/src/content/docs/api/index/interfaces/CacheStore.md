---
editUrl: false
next: false
prev: false
title: "CacheStore"
---

Defined in: [packages/gateway/src/policies/traffic/cache.ts:32](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/traffic/cache.ts#L32)

Pluggable cache storage backend

## Methods

### delete()

> **delete**(`key`): `Promise`\<`boolean`\>

Defined in: [packages/gateway/src/policies/traffic/cache.ts:38](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/traffic/cache.ts#L38)

Delete a cached entry. Returns true if something was removed.

#### Parameters

##### key

`string`

#### Returns

`Promise`\<`boolean`\>

***

### destroy()?

> `optional` **destroy**(): `void`

Defined in: [packages/gateway/src/policies/traffic/cache.ts:40](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/traffic/cache.ts#L40)

Optional cleanup - clear expired entries, release resources.

#### Returns

`void`

***

### get()

> **get**(`key`): `Promise`\<`Response` \| `null`\>

Defined in: [packages/gateway/src/policies/traffic/cache.ts:34](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/traffic/cache.ts#L34)

Retrieve a cached response by key. Returns null on miss.

#### Parameters

##### key

`string`

#### Returns

`Promise`\<`Response` \| `null`\>

***

### put()

> **put**(`key`, `response`, `ttlSeconds`): `Promise`\<`void`\>

Defined in: [packages/gateway/src/policies/traffic/cache.ts:36](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/traffic/cache.ts#L36)

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

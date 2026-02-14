---
editUrl: false
next: false
prev: false
title: "CacheStore"
---

Defined in: [src/policies/traffic/cache.ts:32](https://github.com/HomeGrower-club/stoma/blob/d1b9da31b27a718636c280386dadc9788d6e0044/src/policies/traffic/cache.ts#L32)

Pluggable cache storage backend

## Methods

### delete()

> **delete**(`key`): `Promise`\<`boolean`\>

Defined in: [src/policies/traffic/cache.ts:38](https://github.com/HomeGrower-club/stoma/blob/d1b9da31b27a718636c280386dadc9788d6e0044/src/policies/traffic/cache.ts#L38)

Delete a cached entry. Returns true if something was removed.

#### Parameters

##### key

`string`

#### Returns

`Promise`\<`boolean`\>

***

### get()

> **get**(`key`): `Promise`\<`Response` \| `null`\>

Defined in: [src/policies/traffic/cache.ts:34](https://github.com/HomeGrower-club/stoma/blob/d1b9da31b27a718636c280386dadc9788d6e0044/src/policies/traffic/cache.ts#L34)

Retrieve a cached response by key. Returns null on miss.

#### Parameters

##### key

`string`

#### Returns

`Promise`\<`Response` \| `null`\>

***

### put()

> **put**(`key`, `response`, `ttlSeconds`): `Promise`\<`void`\>

Defined in: [src/policies/traffic/cache.ts:36](https://github.com/HomeGrower-club/stoma/blob/d1b9da31b27a718636c280386dadc9788d6e0044/src/policies/traffic/cache.ts#L36)

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

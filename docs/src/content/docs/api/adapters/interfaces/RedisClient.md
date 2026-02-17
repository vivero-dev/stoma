---
editUrl: false
next: false
prev: false
title: "RedisClient"
---

Defined in: [packages/gateway/src/adapters/redis.ts:26](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/adapters/redis.ts#L26)

Minimal Redis client interface - satisfied by ioredis, node-redis v4, and most
Redis libraries. Only the methods stoma actually calls are required.

## Methods

### del()

> **del**(...`keys`): `Promise`\<`number`\>

Defined in: [packages/gateway/src/adapters/redis.ts:29](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/adapters/redis.ts#L29)

#### Parameters

##### keys

...`string`[]

#### Returns

`Promise`\<`number`\>

***

### eval()

> **eval**(`script`, `numkeys`, ...`args`): `Promise`\<`unknown`\>

Defined in: [packages/gateway/src/adapters/redis.ts:30](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/adapters/redis.ts#L30)

#### Parameters

##### script

`string`

##### numkeys

`number`

##### args

...(`string` \| `number`)[]

#### Returns

`Promise`\<`unknown`\>

***

### get()

> **get**(`key`): `Promise`\<`string` \| `null`\>

Defined in: [packages/gateway/src/adapters/redis.ts:27](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/adapters/redis.ts#L27)

#### Parameters

##### key

`string`

#### Returns

`Promise`\<`string` \| `null`\>

***

### set()

> **set**(`key`, `value`, ...`args`): `Promise`\<`unknown`\>

Defined in: [packages/gateway/src/adapters/redis.ts:28](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/adapters/redis.ts#L28)

#### Parameters

##### key

`string`

##### value

`string`

##### args

...`unknown`[]

#### Returns

`Promise`\<`unknown`\>

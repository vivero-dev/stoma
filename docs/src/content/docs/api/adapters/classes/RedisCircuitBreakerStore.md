---
editUrl: false
next: false
prev: false
title: "RedisCircuitBreakerStore"
---

Defined in: [packages/gateway/src/adapters/redis.ts:187](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/adapters/redis.ts#L187)

Circuit breaker state store backed by Redis JSON strings.

## Implements

- [`CircuitBreakerStore`](/api/index/interfaces/circuitbreakerstore/)

## Constructors

### Constructor

> **new RedisCircuitBreakerStore**(`client`, `prefix`, `setWithTTL`): `RedisCircuitBreakerStore`

Defined in: [packages/gateway/src/adapters/redis.ts:188](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/adapters/redis.ts#L188)

#### Parameters

##### client

[`RedisClient`](/api/adapters/interfaces/redisclient/)

##### prefix

`string`

##### setWithTTL

(`client`, `key`, `value`, `ttlSeconds`) => `Promise`\<`unknown`\> | `undefined`

#### Returns

`RedisCircuitBreakerStore`

## Methods

### getState()

> **getState**(`key`): `Promise`\<[`CircuitBreakerSnapshot`](/api/index/interfaces/circuitbreakersnapshot/)\>

Defined in: [packages/gateway/src/adapters/redis.ts:222](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/adapters/redis.ts#L222)

Read the current snapshot for a circuit key.

#### Parameters

##### key

`string`

#### Returns

`Promise`\<[`CircuitBreakerSnapshot`](/api/index/interfaces/circuitbreakersnapshot/)\>

#### Implementation of

[`CircuitBreakerStore`](/api/index/interfaces/circuitbreakerstore/).[`getState`](/api/index/interfaces/circuitbreakerstore/#getstate)

***

### recordFailure()

> **recordFailure**(`key`): `Promise`\<[`CircuitBreakerSnapshot`](/api/index/interfaces/circuitbreakersnapshot/)\>

Defined in: [packages/gateway/src/adapters/redis.ts:233](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/adapters/redis.ts#L233)

Record a failed request and return the updated snapshot.

#### Parameters

##### key

`string`

#### Returns

`Promise`\<[`CircuitBreakerSnapshot`](/api/index/interfaces/circuitbreakersnapshot/)\>

#### Implementation of

[`CircuitBreakerStore`](/api/index/interfaces/circuitbreakerstore/).[`recordFailure`](/api/index/interfaces/circuitbreakerstore/#recordfailure)

***

### recordSuccess()

> **recordSuccess**(`key`): `Promise`\<[`CircuitBreakerSnapshot`](/api/index/interfaces/circuitbreakersnapshot/)\>

Defined in: [packages/gateway/src/adapters/redis.ts:226](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/adapters/redis.ts#L226)

Record a successful request and return the updated snapshot.

#### Parameters

##### key

`string`

#### Returns

`Promise`\<[`CircuitBreakerSnapshot`](/api/index/interfaces/circuitbreakersnapshot/)\>

#### Implementation of

[`CircuitBreakerStore`](/api/index/interfaces/circuitbreakerstore/).[`recordSuccess`](/api/index/interfaces/circuitbreakerstore/#recordsuccess)

***

### reset()

> **reset**(`key`): `Promise`\<`void`\>

Defined in: [packages/gateway/src/adapters/redis.ts:259](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/adapters/redis.ts#L259)

Fully reset a circuit, removing all state.

#### Parameters

##### key

`string`

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`CircuitBreakerStore`](/api/index/interfaces/circuitbreakerstore/).[`reset`](/api/index/interfaces/circuitbreakerstore/#reset)

***

### transition()

> **transition**(`key`, `to`): `Promise`\<[`CircuitBreakerSnapshot`](/api/index/interfaces/circuitbreakersnapshot/)\>

Defined in: [packages/gateway/src/adapters/redis.ts:241](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/adapters/redis.ts#L241)

Transition the circuit to a new state and return the updated snapshot.

#### Parameters

##### key

`string`

##### to

[`CircuitState`](/api/index/type-aliases/circuitstate/)

#### Returns

`Promise`\<[`CircuitBreakerSnapshot`](/api/index/interfaces/circuitbreakersnapshot/)\>

#### Implementation of

[`CircuitBreakerStore`](/api/index/interfaces/circuitbreakerstore/).[`transition`](/api/index/interfaces/circuitbreakerstore/#transition)

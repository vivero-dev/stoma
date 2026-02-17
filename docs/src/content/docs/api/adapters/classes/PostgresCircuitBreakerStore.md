---
editUrl: false
next: false
prev: false
title: "PostgresCircuitBreakerStore"
---

Defined in: [packages/gateway/src/adapters/postgres.ts:208](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/adapters/postgres.ts#L208)

Circuit breaker state store backed by PostgreSQL.

## Implements

- [`CircuitBreakerStore`](/api/index/interfaces/circuitbreakerstore/)

## Constructors

### Constructor

> **new PostgresCircuitBreakerStore**(`client`, `table`): `PostgresCircuitBreakerStore`

Defined in: [packages/gateway/src/adapters/postgres.ts:209](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/adapters/postgres.ts#L209)

#### Parameters

##### client

[`PostgresClient`](/api/adapters/interfaces/postgresclient/)

##### table

`string`

#### Returns

`PostgresCircuitBreakerStore`

## Methods

### getState()

> **getState**(`key`): `Promise`\<[`CircuitBreakerSnapshot`](/api/index/interfaces/circuitbreakersnapshot/)\>

Defined in: [packages/gateway/src/adapters/postgres.ts:214](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/adapters/postgres.ts#L214)

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

Defined in: [packages/gateway/src/adapters/postgres.ts:237](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/adapters/postgres.ts#L237)

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

Defined in: [packages/gateway/src/adapters/postgres.ts:224](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/adapters/postgres.ts#L224)

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

Defined in: [packages/gateway/src/adapters/postgres.ts:281](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/adapters/postgres.ts#L281)

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

Defined in: [packages/gateway/src/adapters/postgres.ts:251](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/adapters/postgres.ts#L251)

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

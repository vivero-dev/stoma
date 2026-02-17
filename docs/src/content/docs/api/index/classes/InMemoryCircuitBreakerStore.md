---
editUrl: false
next: false
prev: false
title: "InMemoryCircuitBreakerStore"
---

Defined in: [packages/gateway/src/policies/resilience/circuit-breaker.ts:74](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/resilience/circuit-breaker.ts#L74)

Three-state circuit breaker (closed/open/half-open) with pluggable state storage (priority 30).

## Implements

- [`CircuitBreakerStore`](/api/index/interfaces/circuitbreakerstore/)

## Constructors

### Constructor

> **new InMemoryCircuitBreakerStore**(): `InMemoryCircuitBreakerStore`

#### Returns

`InMemoryCircuitBreakerStore`

## Methods

### clear()

> **clear**(): `void`

Defined in: [packages/gateway/src/policies/resilience/circuit-breaker.ts:125](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/resilience/circuit-breaker.ts#L125)

Remove all circuits (for testing)

#### Returns

`void`

***

### destroy()

> **destroy**(): `void`

Defined in: [packages/gateway/src/policies/resilience/circuit-breaker.ts:130](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/resilience/circuit-breaker.ts#L130)

Release all state.

#### Returns

`void`

#### Implementation of

[`CircuitBreakerStore`](/api/index/interfaces/circuitbreakerstore/).[`destroy`](/api/index/interfaces/circuitbreakerstore/#destroy)

***

### getState()

> **getState**(`key`): `Promise`\<[`CircuitBreakerSnapshot`](/api/index/interfaces/circuitbreakersnapshot/)\>

Defined in: [packages/gateway/src/policies/resilience/circuit-breaker.ts:86](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/resilience/circuit-breaker.ts#L86)

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

Defined in: [packages/gateway/src/policies/resilience/circuit-breaker.ts:96](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/resilience/circuit-breaker.ts#L96)

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

Defined in: [packages/gateway/src/policies/resilience/circuit-breaker.ts:90](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/resilience/circuit-breaker.ts#L90)

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

Defined in: [packages/gateway/src/policies/resilience/circuit-breaker.ts:120](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/resilience/circuit-breaker.ts#L120)

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

Defined in: [packages/gateway/src/policies/resilience/circuit-breaker.ts:103](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/resilience/circuit-breaker.ts#L103)

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

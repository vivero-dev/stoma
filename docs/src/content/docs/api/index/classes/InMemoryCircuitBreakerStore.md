---
editUrl: false
next: false
prev: false
title: "InMemoryCircuitBreakerStore"
---

Defined in: [src/policies/resilience/circuit-breaker.ts:65](https://github.com/HomeGrower-club/stoma/blob/645ca3bfe48534ea194e7433b35f97ff805392a9/src/policies/resilience/circuit-breaker.ts#L65)

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

Defined in: [src/policies/resilience/circuit-breaker.ts:113](https://github.com/HomeGrower-club/stoma/blob/645ca3bfe48534ea194e7433b35f97ff805392a9/src/policies/resilience/circuit-breaker.ts#L113)

Remove all circuits (for testing)

#### Returns

`void`

***

### getState()

> **getState**(`key`): `Promise`\<[`CircuitBreakerSnapshot`](/api/index/interfaces/circuitbreakersnapshot/)\>

Defined in: [src/policies/resilience/circuit-breaker.ts:77](https://github.com/HomeGrower-club/stoma/blob/645ca3bfe48534ea194e7433b35f97ff805392a9/src/policies/resilience/circuit-breaker.ts#L77)

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

Defined in: [src/policies/resilience/circuit-breaker.ts:87](https://github.com/HomeGrower-club/stoma/blob/645ca3bfe48534ea194e7433b35f97ff805392a9/src/policies/resilience/circuit-breaker.ts#L87)

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

Defined in: [src/policies/resilience/circuit-breaker.ts:81](https://github.com/HomeGrower-club/stoma/blob/645ca3bfe48534ea194e7433b35f97ff805392a9/src/policies/resilience/circuit-breaker.ts#L81)

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

Defined in: [src/policies/resilience/circuit-breaker.ts:108](https://github.com/HomeGrower-club/stoma/blob/645ca3bfe48534ea194e7433b35f97ff805392a9/src/policies/resilience/circuit-breaker.ts#L108)

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

Defined in: [src/policies/resilience/circuit-breaker.ts:94](https://github.com/HomeGrower-club/stoma/blob/645ca3bfe48534ea194e7433b35f97ff805392a9/src/policies/resilience/circuit-breaker.ts#L94)

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

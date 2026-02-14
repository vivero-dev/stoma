---
editUrl: false
next: false
prev: false
title: "InMemoryCircuitBreakerStore"
---

Defined in: [src/policies/resilience/circuit-breaker.ts:72](https://github.com/HomeGrower-club/stoma/blob/8b84574bca28149f020bbd910337511015437508/src/policies/resilience/circuit-breaker.ts#L72)

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

Defined in: [src/policies/resilience/circuit-breaker.ts:123](https://github.com/HomeGrower-club/stoma/blob/8b84574bca28149f020bbd910337511015437508/src/policies/resilience/circuit-breaker.ts#L123)

Remove all circuits (for testing)

#### Returns

`void`

***

### getState()

> **getState**(`key`): `Promise`\<[`CircuitBreakerSnapshot`](/api/index/interfaces/circuitbreakersnapshot/)\>

Defined in: [src/policies/resilience/circuit-breaker.ts:84](https://github.com/HomeGrower-club/stoma/blob/8b84574bca28149f020bbd910337511015437508/src/policies/resilience/circuit-breaker.ts#L84)

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

Defined in: [src/policies/resilience/circuit-breaker.ts:94](https://github.com/HomeGrower-club/stoma/blob/8b84574bca28149f020bbd910337511015437508/src/policies/resilience/circuit-breaker.ts#L94)

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

Defined in: [src/policies/resilience/circuit-breaker.ts:88](https://github.com/HomeGrower-club/stoma/blob/8b84574bca28149f020bbd910337511015437508/src/policies/resilience/circuit-breaker.ts#L88)

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

Defined in: [src/policies/resilience/circuit-breaker.ts:118](https://github.com/HomeGrower-club/stoma/blob/8b84574bca28149f020bbd910337511015437508/src/policies/resilience/circuit-breaker.ts#L118)

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

Defined in: [src/policies/resilience/circuit-breaker.ts:101](https://github.com/HomeGrower-club/stoma/blob/8b84574bca28149f020bbd910337511015437508/src/policies/resilience/circuit-breaker.ts#L101)

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

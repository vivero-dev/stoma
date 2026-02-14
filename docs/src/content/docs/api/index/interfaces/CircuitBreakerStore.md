---
editUrl: false
next: false
prev: false
title: "CircuitBreakerStore"
---

Defined in: [src/policies/resilience/circuit-breaker.ts:47](https://github.com/HomeGrower-club/stoma/blob/512cbe1c3920cd195327e7c8f58f5202130d56a5/src/policies/resilience/circuit-breaker.ts#L47)

Pluggable storage backend for circuit breaker state.

Implement this interface to store circuit state in Durable Objects,
KV, or any shared datastore for multi-instance deployments.

## Methods

### getState()

> **getState**(`key`): `Promise`\<[`CircuitBreakerSnapshot`](/api/index/interfaces/circuitbreakersnapshot/)\>

Defined in: [src/policies/resilience/circuit-breaker.ts:49](https://github.com/HomeGrower-club/stoma/blob/512cbe1c3920cd195327e7c8f58f5202130d56a5/src/policies/resilience/circuit-breaker.ts#L49)

Read the current snapshot for a circuit key.

#### Parameters

##### key

`string`

#### Returns

`Promise`\<[`CircuitBreakerSnapshot`](/api/index/interfaces/circuitbreakersnapshot/)\>

***

### recordFailure()

> **recordFailure**(`key`): `Promise`\<[`CircuitBreakerSnapshot`](/api/index/interfaces/circuitbreakersnapshot/)\>

Defined in: [src/policies/resilience/circuit-breaker.ts:53](https://github.com/HomeGrower-club/stoma/blob/512cbe1c3920cd195327e7c8f58f5202130d56a5/src/policies/resilience/circuit-breaker.ts#L53)

Record a failed request and return the updated snapshot.

#### Parameters

##### key

`string`

#### Returns

`Promise`\<[`CircuitBreakerSnapshot`](/api/index/interfaces/circuitbreakersnapshot/)\>

***

### recordSuccess()

> **recordSuccess**(`key`): `Promise`\<[`CircuitBreakerSnapshot`](/api/index/interfaces/circuitbreakersnapshot/)\>

Defined in: [src/policies/resilience/circuit-breaker.ts:51](https://github.com/HomeGrower-club/stoma/blob/512cbe1c3920cd195327e7c8f58f5202130d56a5/src/policies/resilience/circuit-breaker.ts#L51)

Record a successful request and return the updated snapshot.

#### Parameters

##### key

`string`

#### Returns

`Promise`\<[`CircuitBreakerSnapshot`](/api/index/interfaces/circuitbreakersnapshot/)\>

***

### reset()

> **reset**(`key`): `Promise`\<`void`\>

Defined in: [src/policies/resilience/circuit-breaker.ts:57](https://github.com/HomeGrower-club/stoma/blob/512cbe1c3920cd195327e7c8f58f5202130d56a5/src/policies/resilience/circuit-breaker.ts#L57)

Fully reset a circuit, removing all state.

#### Parameters

##### key

`string`

#### Returns

`Promise`\<`void`\>

***

### transition()

> **transition**(`key`, `to`): `Promise`\<[`CircuitBreakerSnapshot`](/api/index/interfaces/circuitbreakersnapshot/)\>

Defined in: [src/policies/resilience/circuit-breaker.ts:55](https://github.com/HomeGrower-club/stoma/blob/512cbe1c3920cd195327e7c8f58f5202130d56a5/src/policies/resilience/circuit-breaker.ts#L55)

Transition the circuit to a new state and return the updated snapshot.

#### Parameters

##### key

`string`

##### to

[`CircuitState`](/api/index/type-aliases/circuitstate/)

#### Returns

`Promise`\<[`CircuitBreakerSnapshot`](/api/index/interfaces/circuitbreakersnapshot/)\>

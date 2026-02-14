---
editUrl: false
next: false
prev: false
title: "CircuitBreakerConfig"
---

Defined in: [src/policies/resilience/circuit-breaker.ts:130](https://github.com/HomeGrower-club/stoma/blob/512cbe1c3920cd195327e7c8f58f5202130d56a5/src/policies/resilience/circuit-breaker.ts#L130)

Base configuration shared by all policies

## Extends

- [`PolicyConfig`](/api/index/interfaces/policyconfig/)

## Properties

### failureOn?

> `optional` **failureOn**: `number`[]

Defined in: [src/policies/resilience/circuit-breaker.ts:138](https://github.com/HomeGrower-club/stoma/blob/512cbe1c3920cd195327e7c8f58f5202130d56a5/src/policies/resilience/circuit-breaker.ts#L138)

Status codes considered failures. Default: [500, 502, 503, 504].

***

### failureThreshold?

> `optional` **failureThreshold**: `number`

Defined in: [src/policies/resilience/circuit-breaker.ts:132](https://github.com/HomeGrower-club/stoma/blob/512cbe1c3920cd195327e7c8f58f5202130d56a5/src/policies/resilience/circuit-breaker.ts#L132)

Number of failures before opening the circuit. Default: 5.

***

### halfOpenMax?

> `optional` **halfOpenMax**: `number`

Defined in: [src/policies/resilience/circuit-breaker.ts:136](https://github.com/HomeGrower-club/stoma/blob/512cbe1c3920cd195327e7c8f58f5202130d56a5/src/policies/resilience/circuit-breaker.ts#L136)

Max concurrent probes allowed in half-open state. Default: 1.

***

### key()?

> `optional` **key**: (`c`) => `string`

Defined in: [src/policies/resilience/circuit-breaker.ts:142](https://github.com/HomeGrower-club/stoma/blob/512cbe1c3920cd195327e7c8f58f5202130d56a5/src/policies/resilience/circuit-breaker.ts#L142)

Key extractor. Default: request URL pathname.

#### Parameters

##### c

`Context`

#### Returns

`string`

***

### onStateChange()?

> `optional` **onStateChange**: (`key`, `from`, `to`) => `void` \| `Promise`\<`void`\>

Defined in: [src/policies/resilience/circuit-breaker.ts:155](https://github.com/HomeGrower-club/stoma/blob/512cbe1c3920cd195327e7c8f58f5202130d56a5/src/policies/resilience/circuit-breaker.ts#L155)

Callback invoked on every state transition.

Called via `safeCall` so errors are swallowed — a failing callback
never blocks traffic. Useful for metrics, logging, or alerting.

#### Parameters

##### key

`string`

The circuit key that transitioned.

##### from

[`CircuitState`](/api/index/type-aliases/circuitstate/)

The previous circuit state.

##### to

[`CircuitState`](/api/index/type-aliases/circuitstate/)

The new circuit state.

#### Returns

`void` \| `Promise`\<`void`\>

***

### openStatusCode?

> `optional` **openStatusCode**: `number`

Defined in: [src/policies/resilience/circuit-breaker.ts:144](https://github.com/HomeGrower-club/stoma/blob/512cbe1c3920cd195327e7c8f58f5202130d56a5/src/policies/resilience/circuit-breaker.ts#L144)

HTTP status code when the circuit is open. Default: 503.

***

### resetTimeoutMs?

> `optional` **resetTimeoutMs**: `number`

Defined in: [src/policies/resilience/circuit-breaker.ts:134](https://github.com/HomeGrower-club/stoma/blob/512cbe1c3920cd195327e7c8f58f5202130d56a5/src/policies/resilience/circuit-breaker.ts#L134)

Time in ms before transitioning from open → half-open. Default: 30000.

***

### skip()?

> `optional` **skip**: (`c`) => `boolean` \| `Promise`\<`boolean`\>

Defined in: [src/policies/types.ts:90](https://github.com/HomeGrower-club/stoma/blob/512cbe1c3920cd195327e7c8f58f5202130d56a5/src/policies/types.ts#L90)

Skip this policy when condition returns true

#### Parameters

##### c

`unknown`

#### Returns

`boolean` \| `Promise`\<`boolean`\>

#### Inherited from

[`PolicyConfig`](/api/index/interfaces/policyconfig/).[`skip`](/api/index/interfaces/policyconfig/#skip)

***

### store?

> `optional` **store**: [`CircuitBreakerStore`](/api/index/interfaces/circuitbreakerstore/)

Defined in: [src/policies/resilience/circuit-breaker.ts:140](https://github.com/HomeGrower-club/stoma/blob/512cbe1c3920cd195327e7c8f58f5202130d56a5/src/policies/resilience/circuit-breaker.ts#L140)

Storage backend. Default: InMemoryCircuitBreakerStore.

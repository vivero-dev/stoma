---
editUrl: false
next: false
prev: false
title: "CircuitBreakerConfig"
---

Defined in: [packages/gateway/src/policies/resilience/circuit-breaker.ts:137](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/resilience/circuit-breaker.ts#L137)

Base configuration shared by all policies

## Extends

- [`PolicyConfig`](/api/index/interfaces/policyconfig/)

## Properties

### failureOn?

> `optional` **failureOn**: `number`[]

Defined in: [packages/gateway/src/policies/resilience/circuit-breaker.ts:145](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/resilience/circuit-breaker.ts#L145)

Status codes considered failures. Default: [500, 502, 503, 504].

***

### failureThreshold?

> `optional` **failureThreshold**: `number`

Defined in: [packages/gateway/src/policies/resilience/circuit-breaker.ts:139](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/resilience/circuit-breaker.ts#L139)

Number of failures before opening the circuit. Default: 5.

***

### halfOpenMax?

> `optional` **halfOpenMax**: `number`

Defined in: [packages/gateway/src/policies/resilience/circuit-breaker.ts:143](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/resilience/circuit-breaker.ts#L143)

Max concurrent probes allowed in half-open state. Default: 1.

***

### key()?

> `optional` **key**: (`c`) => `string`

Defined in: [packages/gateway/src/policies/resilience/circuit-breaker.ts:149](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/resilience/circuit-breaker.ts#L149)

Key extractor. Default: request URL pathname.

#### Parameters

##### c

`Context`

#### Returns

`string`

***

### onStateChange()?

> `optional` **onStateChange**: (`key`, `from`, `to`) => `void` \| `Promise`\<`void`\>

Defined in: [packages/gateway/src/policies/resilience/circuit-breaker.ts:162](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/resilience/circuit-breaker.ts#L162)

Callback invoked on every state transition.

Called via `safeCall` so errors are swallowed - a failing callback
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

Defined in: [packages/gateway/src/policies/resilience/circuit-breaker.ts:151](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/resilience/circuit-breaker.ts#L151)

HTTP status code when the circuit is open. Default: 503.

***

### resetTimeoutMs?

> `optional` **resetTimeoutMs**: `number`

Defined in: [packages/gateway/src/policies/resilience/circuit-breaker.ts:141](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/resilience/circuit-breaker.ts#L141)

Time in ms before transitioning from open → half-open. Default: 30000.

***

### skip()?

> `optional` **skip**: (`c`) => `boolean` \| `Promise`\<`boolean`\>

Defined in: [packages/gateway/src/policies/types.ts:90](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/types.ts#L90)

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

Defined in: [packages/gateway/src/policies/resilience/circuit-breaker.ts:147](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/resilience/circuit-breaker.ts#L147)

Storage backend. Default: InMemoryCircuitBreakerStore.

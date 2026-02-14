---
editUrl: false
next: false
prev: false
title: "CircuitBreakerSnapshot"
---

Defined in: [src/policies/resilience/circuit-breaker.ts:28](https://github.com/HomeGrower-club/stoma/blob/8ff27bd832ace97bceae4b05831dd71d1ac6ed6a/src/policies/resilience/circuit-breaker.ts#L28)

Point-in-time snapshot of a circuit's state and counters.

## Properties

### failureCount

> **failureCount**: `number`

Defined in: [src/policies/resilience/circuit-breaker.ts:32](https://github.com/HomeGrower-club/stoma/blob/8ff27bd832ace97bceae4b05831dd71d1ac6ed6a/src/policies/resilience/circuit-breaker.ts#L32)

Number of consecutive failures since last reset.

***

### lastFailureTime

> **lastFailureTime**: `number`

Defined in: [src/policies/resilience/circuit-breaker.ts:36](https://github.com/HomeGrower-club/stoma/blob/8ff27bd832ace97bceae4b05831dd71d1ac6ed6a/src/policies/resilience/circuit-breaker.ts#L36)

Epoch ms of the most recent failure. `0` if no failures recorded.

***

### lastStateChange

> **lastStateChange**: `number`

Defined in: [src/policies/resilience/circuit-breaker.ts:38](https://github.com/HomeGrower-club/stoma/blob/8ff27bd832ace97bceae4b05831dd71d1ac6ed6a/src/policies/resilience/circuit-breaker.ts#L38)

Epoch ms of the most recent state transition.

***

### state

> **state**: [`CircuitState`](/api/index/type-aliases/circuitstate/)

Defined in: [src/policies/resilience/circuit-breaker.ts:30](https://github.com/HomeGrower-club/stoma/blob/8ff27bd832ace97bceae4b05831dd71d1ac6ed6a/src/policies/resilience/circuit-breaker.ts#L30)

Current circuit state.

***

### successCount

> **successCount**: `number`

Defined in: [src/policies/resilience/circuit-breaker.ts:34](https://github.com/HomeGrower-club/stoma/blob/8ff27bd832ace97bceae4b05831dd71d1ac6ed6a/src/policies/resilience/circuit-breaker.ts#L34)

Number of successful probes in half-open state.

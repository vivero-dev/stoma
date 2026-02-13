---
editUrl: false
next: false
prev: false
title: "CircuitBreakerSnapshot"
---

Defined in: [src/policies/resilience/circuit-breaker.ts:21](https://github.com/HomeGrower-club/stoma/blob/645ca3bfe48534ea194e7433b35f97ff805392a9/src/policies/resilience/circuit-breaker.ts#L21)

Point-in-time snapshot of a circuit's state and counters.

## Properties

### failureCount

> **failureCount**: `number`

Defined in: [src/policies/resilience/circuit-breaker.ts:25](https://github.com/HomeGrower-club/stoma/blob/645ca3bfe48534ea194e7433b35f97ff805392a9/src/policies/resilience/circuit-breaker.ts#L25)

Number of consecutive failures since last reset.

***

### lastFailureTime

> **lastFailureTime**: `number`

Defined in: [src/policies/resilience/circuit-breaker.ts:29](https://github.com/HomeGrower-club/stoma/blob/645ca3bfe48534ea194e7433b35f97ff805392a9/src/policies/resilience/circuit-breaker.ts#L29)

Epoch ms of the most recent failure. `0` if no failures recorded.

***

### lastStateChange

> **lastStateChange**: `number`

Defined in: [src/policies/resilience/circuit-breaker.ts:31](https://github.com/HomeGrower-club/stoma/blob/645ca3bfe48534ea194e7433b35f97ff805392a9/src/policies/resilience/circuit-breaker.ts#L31)

Epoch ms of the most recent state transition.

***

### state

> **state**: [`CircuitState`](/api/index/type-aliases/circuitstate/)

Defined in: [src/policies/resilience/circuit-breaker.ts:23](https://github.com/HomeGrower-club/stoma/blob/645ca3bfe48534ea194e7433b35f97ff805392a9/src/policies/resilience/circuit-breaker.ts#L23)

Current circuit state.

***

### successCount

> **successCount**: `number`

Defined in: [src/policies/resilience/circuit-breaker.ts:27](https://github.com/HomeGrower-club/stoma/blob/645ca3bfe48534ea194e7433b35f97ff805392a9/src/policies/resilience/circuit-breaker.ts#L27)

Number of successful probes in half-open state.

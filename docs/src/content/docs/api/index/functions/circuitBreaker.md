---
editUrl: false
next: false
prev: false
title: "circuitBreaker"
---

> **circuitBreaker**(`config?`): [`Policy`](/api/index/interfaces/policy/)

Defined in: [packages/gateway/src/policies/resilience/circuit-breaker.ts:236](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/resilience/circuit-breaker.ts#L236)

Protect upstream services by breaking the circuit on repeated failures.

Implements the three-state circuit breaker pattern:
- **Closed** - requests flow normally; failures are counted.
- **Open** - requests are immediately rejected with 503; a `Retry-After` header is set.
- **Half-open** - a limited number of probe requests are allowed through to test recovery.

State transitions: `closed → open` when failures reach the threshold,
`open → half-open` after the reset timeout, `half-open → closed` on
probe success or `half-open → open` on probe failure.

## Parameters

### config?

[`CircuitBreakerConfig`](/api/policies/interfaces/circuitbreakerconfig/)

Failure threshold, reset timeout, and storage backend.

## Returns

[`Policy`](/api/index/interfaces/policy/)

A [Policy](/api/index/interfaces/policy/) at priority 30.

## Example

```ts
// Open after 5 failures, retry after 30s
circuitBreaker();

// Tighter threshold with custom store
circuitBreaker({
  failureThreshold: 3,
  resetTimeoutMs: 10_000,
  failureOn: [500, 502, 503],
  store: new InMemoryCircuitBreakerStore(),
});

// With state change notifications
circuitBreaker({
  failureThreshold: 5,
  onStateChange: (key, from, to) => {
    console.log(`Circuit ${key}: ${from} -> ${to}`);
  },
});
```

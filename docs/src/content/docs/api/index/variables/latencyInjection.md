---
editUrl: false
next: false
prev: false
title: "latencyInjection"
---

> `const` **latencyInjection**: (`config?`) => [`Policy`](/api/index/interfaces/policy/)

Defined in: [src/policies/resilience/latency-injection.ts:38](https://github.com/HomeGrower-club/stoma/blob/d1b9da31b27a718636c280386dadc9788d6e0044/src/policies/resilience/latency-injection.ts#L38)

Inject artificial latency into the pipeline for chaos/resilience testing.

When active, pauses execution for a configurable duration before calling
`next()`. Supports jitter to vary the delay and a probability setting to
inject latency only a fraction of the time.

## Parameters

### config?

[`LatencyInjectionConfig`](/api/policies/interfaces/latencyinjectionconfig/)

Delay duration, jitter, and injection probability.

## Returns

[`Policy`](/api/index/interfaces/policy/)

A [Policy](/api/index/interfaces/policy/) at priority 5 (early pipeline).

## Example

```ts
// Fixed 100ms delay on every request
latencyInjection({ delayMs: 100 });

// 200ms +/- 50% jitter, injected 30% of the time
latencyInjection({ delayMs: 200, jitter: 0.5, probability: 0.3 });
```

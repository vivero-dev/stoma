---
editUrl: false
next: false
prev: false
title: "LatencyInjectionConfig"
---

Defined in: [src/policies/resilience/latency-injection.ts:9](https://github.com/HomeGrower-club/stoma/blob/645ca3bfe48534ea194e7433b35f97ff805392a9/src/policies/resilience/latency-injection.ts#L9)

Configuration for the latencyInjection policy.

## Extends

- [`PolicyConfig`](/api/index/interfaces/policyconfig/)

## Properties

### delayMs

> **delayMs**: `number`

Defined in: [src/policies/resilience/latency-injection.ts:11](https://github.com/HomeGrower-club/stoma/blob/645ca3bfe48534ea194e7433b35f97ff805392a9/src/policies/resilience/latency-injection.ts#L11)

Base delay in milliseconds. Required.

***

### jitter?

> `optional` **jitter**: `number`

Defined in: [src/policies/resilience/latency-injection.ts:13](https://github.com/HomeGrower-club/stoma/blob/645ca3bfe48534ea194e7433b35f97ff805392a9/src/policies/resilience/latency-injection.ts#L13)

Jitter proportion (0 to 1). Actual delay varies by +/- jitter * delayMs. Default: 0.

***

### probability?

> `optional` **probability**: `number`

Defined in: [src/policies/resilience/latency-injection.ts:15](https://github.com/HomeGrower-club/stoma/blob/645ca3bfe48534ea194e7433b35f97ff805392a9/src/policies/resilience/latency-injection.ts#L15)

Probability of injecting latency (0 to 1). Default: 1 (always).

***

### skip()?

> `optional` **skip**: (`c`) => `boolean` \| `Promise`\<`boolean`\>

Defined in: [src/policies/types.ts:33](https://github.com/HomeGrower-club/stoma/blob/645ca3bfe48534ea194e7433b35f97ff805392a9/src/policies/types.ts#L33)

Skip this policy when condition returns true

#### Parameters

##### c

`unknown`

#### Returns

`boolean` \| `Promise`\<`boolean`\>

#### Inherited from

[`PolicyConfig`](/api/index/interfaces/policyconfig/).[`skip`](/api/index/interfaces/policyconfig/#skip)

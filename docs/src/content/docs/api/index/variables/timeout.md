---
editUrl: false
next: false
prev: false
title: "timeout"
---

> `const` **timeout**: (`config?`) => [`Policy`](/api/index/interfaces/policy/)

Defined in: [src/policies/resilience/timeout.ts:35](https://github.com/HomeGrower-club/stoma/blob/4764d83fea90804e5e2c02d8c0ed4153d64e412b/src/policies/resilience/timeout.ts#L35)

Enforce a time budget for downstream execution.

Races `next()` against a timer. If the timer fires first, throws a
GatewayError (default 504). The timer is always cleaned up, even on
downstream errors.

## Parameters

### config?

[`TimeoutConfig`](/api/policies/interfaces/timeoutconfig/)

Timeout duration and custom error message. Defaults to 30 seconds.

## Returns

[`Policy`](/api/index/interfaces/policy/)

A [Policy](/api/index/interfaces/policy/) at priority 85 (runs late, close to upstream).

## Example

```ts
// 5-second timeout with custom message
timeout({ timeoutMs: 5000, message: "Upstream did not respond in time" });
```

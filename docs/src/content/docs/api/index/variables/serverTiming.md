---
editUrl: false
next: false
prev: false
title: "serverTiming"
---

> `const` **serverTiming**: (`config?`) => [`Policy`](/api/index/interfaces/policy/)

Defined in: [src/policies/observability/server-timing.ts:77](https://github.com/HomeGrower-club/stoma/blob/4764d83fea90804e5e2c02d8c0ed4153d64e412b/src/policies/observability/server-timing.ts#L77)

Emit W3C `Server-Timing` and `X-Response-Time` response headers.

Reads per-policy timing data from the pipeline instrumentation and
formats it as standard headers visible in browser DevTools.

## Parameters

### config?

[`ServerTimingConfig`](/api/index/interfaces/servertimingconfig/)

Optional configuration for headers, precision, and visibility.

## Returns

[`Policy`](/api/index/interfaces/policy/)

A [Policy](/api/index/interfaces/policy/) at priority 1 (METRICS).

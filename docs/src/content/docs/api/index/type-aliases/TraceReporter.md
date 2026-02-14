---
editUrl: false
next: false
prev: false
title: "TraceReporter"
---

> **TraceReporter** = (`action`, `data?`) => `void`

Defined in: [src/policies/sdk/trace.ts:68](https://github.com/HomeGrower-club/stoma/blob/08b5f2db5f15b4e339eff6647be9d231bf97a776/src/policies/sdk/trace.ts#L68)

A trace reporter function. Always callable — no-op when tracing is inactive.

## Parameters

### action

`string`

Human-readable action string (e.g. `"HIT"`, `"allowed"`).

### data?

`Record`\<`string`, `unknown`\>

Optional structured context data.

## Returns

`void`

---
editUrl: false
next: false
prev: false
title: "TraceReporter"
---

> **TraceReporter** = (`action`, `data?`) => `void`

Defined in: [src/policies/sdk/trace.ts:68](https://github.com/HomeGrower-club/stoma/blob/48ef00d6c13071f9fc03cba04228926dc2dd542c/src/policies/sdk/trace.ts#L68)

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

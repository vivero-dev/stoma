---
editUrl: false
next: false
prev: false
title: "TraceReporter"
---

> **TraceReporter** = (`action`, `data?`) => `void`

Defined in: [src/policies/sdk/trace.ts:68](https://github.com/HomeGrower-club/stoma/blob/8b84574bca28149f020bbd910337511015437508/src/policies/sdk/trace.ts#L68)

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

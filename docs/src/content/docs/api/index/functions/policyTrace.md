---
editUrl: false
next: false
prev: false
title: "policyTrace"
---

> **policyTrace**(`c`, `policyName`): [`TraceReporter`](/api/index/type-aliases/tracereporter/)

Defined in: [src/policies/sdk/trace.ts:87](https://github.com/HomeGrower-club/stoma/blob/8b84574bca28149f020bbd910337511015437508/src/policies/sdk/trace.ts#L87)

Get a trace reporter for a specific policy.

When tracing is active (`_stomaTraceRequested` is truthy), returns a
function that stores the detail on the context. When inactive, returns
noopTraceReporter — a no-op with zero overhead.

## Parameters

### c

`Context`

Hono request context.

### policyName

`string`

Policy name used as the Map key.

## Returns

[`TraceReporter`](/api/index/type-aliases/tracereporter/)

A [TraceReporter](/api/index/type-aliases/tracereporter/) — always callable.

---
editUrl: false
next: false
prev: false
title: "policyTrace"
---

> **policyTrace**(`c`, `policyName`): [`TraceReporter`](/api/index/type-aliases/tracereporter/)

Defined in: [src/policies/sdk/trace.ts:87](https://github.com/HomeGrower-club/stoma/blob/64d47b2a9c6564c1291a5dd9d515f24b13c13c53/src/policies/sdk/trace.ts#L87)

Get a trace reporter for a specific policy.

When tracing is active (`_stomaTraceRequested` is truthy), returns a
function that stores the detail on the context. When inactive, returns
[noopTraceReporter](/api/index/variables/nooptracereporter/) - a no-op with zero overhead.

## Parameters

### c

`Context`

Hono request context.

### policyName

`string`

Policy name used as the Map key.

## Returns

[`TraceReporter`](/api/index/type-aliases/tracereporter/)

A [TraceReporter](/api/index/type-aliases/tracereporter/) - always callable.

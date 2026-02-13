---
editUrl: false
next: false
prev: false
title: "policyDebug"
---

> **policyDebug**(`c`, `policyName`): [`DebugLogger`](/api/index/type-aliases/debuglogger/)

Defined in: [src/policies/sdk/helpers.ts:48](https://github.com/HomeGrower-club/stoma/blob/4764d83fea90804e5e2c02d8c0ed4153d64e412b/src/policies/sdk/helpers.ts#L48)

Get a debug logger pre-namespaced to `stoma:policy:{name}`.

Returns noopDebugLogger when there is no gateway context
(e.g. outside a gateway pipeline) or when debug is disabled.
This eliminates the repeated `getGatewayContext(c)?.debug(...)` pattern.

## Parameters

### c

`Context`

Hono request context.

### policyName

`string`

Policy name used in the namespace.

## Returns

[`DebugLogger`](/api/index/type-aliases/debuglogger/)

A [DebugLogger](/api/index/type-aliases/debuglogger/) — always callable, never undefined.

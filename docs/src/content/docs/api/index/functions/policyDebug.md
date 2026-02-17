---
editUrl: false
next: false
prev: false
title: "policyDebug"
---

> **policyDebug**(`c`, `policyName`): [`DebugLogger`](/api/index/type-aliases/debuglogger/)

Defined in: [packages/gateway/src/policies/sdk/helpers.ts:48](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/sdk/helpers.ts#L48)

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

A [DebugLogger](/api/index/type-aliases/debuglogger/) - always callable, never undefined.

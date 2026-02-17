---
editUrl: false
next: false
prev: false
title: "isTraceRequested"
---

> **isTraceRequested**(`c`): `boolean`

Defined in: [packages/gateway/src/policies/sdk/trace.ts:104](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/sdk/trace.ts#L104)

Fast-path check: is tracing requested for this request?

## Parameters

### c

`Context`

Hono request context.

## Returns

`boolean`

`true` when the client requested tracing via `x-stoma-debug: trace`.

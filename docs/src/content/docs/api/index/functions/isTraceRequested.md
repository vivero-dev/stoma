---
editUrl: false
next: false
prev: false
title: "isTraceRequested"
---

> **isTraceRequested**(`c`): `boolean`

Defined in: [src/policies/sdk/trace.ts:104](https://github.com/HomeGrower-club/stoma/blob/7a6bc5c6595d42b4d2edc385006b88a77065ce23/src/policies/sdk/trace.ts#L104)

Fast-path check: is tracing requested for this request?

## Parameters

### c

`Context`

Hono request context.

## Returns

`boolean`

`true` when the client requested tracing via `x-stoma-debug: trace`.

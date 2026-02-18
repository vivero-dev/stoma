---
editUrl: false
next: false
prev: false
title: "getGatewayContext"
---

> **getGatewayContext**(`c`): [`PolicyContext`](/api/index/interfaces/policycontext/) \| `undefined`

Defined in: [packages/gateway/src/core/pipeline.ts:366](https://github.com/HomeGrower-club/stoma/blob/b366835e3781c3a030f80027e784272dddf630da/packages/gateway/src/core/pipeline.ts#L366)

Retrieve the [PolicyContext](/api/index/interfaces/policycontext/) from a Hono context.

Returns `undefined` if called outside the gateway pipeline (e.g. in
a standalone Hono app without context injection).

## Parameters

### c

`Context`

The Hono request context.

## Returns

[`PolicyContext`](/api/index/interfaces/policycontext/) \| `undefined`

The gateway context, or `undefined` if not in a gateway pipeline.

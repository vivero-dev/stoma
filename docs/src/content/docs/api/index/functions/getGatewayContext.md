---
editUrl: false
next: false
prev: false
title: "getGatewayContext"
---

> **getGatewayContext**(`c`): [`PolicyContext`](/api/index/interfaces/policycontext/) \| `undefined`

Defined in: [src/core/pipeline.ts:273](https://github.com/HomeGrower-club/stoma/blob/645ca3bfe48534ea194e7433b35f97ff805392a9/src/core/pipeline.ts#L273)

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

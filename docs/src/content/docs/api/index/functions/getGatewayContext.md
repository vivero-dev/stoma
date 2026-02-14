---
editUrl: false
next: false
prev: false
title: "getGatewayContext"
---

> **getGatewayContext**(`c`): [`PolicyContext`](/api/index/interfaces/policycontext/) \| `undefined`

Defined in: [src/core/pipeline.ts:361](https://github.com/HomeGrower-club/stoma/blob/d1b9da31b27a718636c280386dadc9788d6e0044/src/core/pipeline.ts#L361)

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

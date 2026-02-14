---
editUrl: false
next: false
prev: false
title: "HandlerUpstream"
---

Defined in: [src/core/types.ts:212](https://github.com/HomeGrower-club/stoma/blob/512cbe1c3920cd195327e7c8f58f5202130d56a5/src/core/types.ts#L212)

Invoke a custom handler function directly. Useful for health checks,
mock responses, or routes that don't proxy to an upstream.

## Properties

### handler()

> **handler**: (`c`) => `Response` \| `Promise`\<`Response`\>

Defined in: [src/core/types.ts:215](https://github.com/HomeGrower-club/stoma/blob/512cbe1c3920cd195327e7c8f58f5202130d56a5/src/core/types.ts#L215)

Handler function receiving the Hono context and returning a Response.

#### Parameters

##### c

`Context`

#### Returns

`Response` \| `Promise`\<`Response`\>

***

### type

> **type**: `"handler"`

Defined in: [src/core/types.ts:213](https://github.com/HomeGrower-club/stoma/blob/512cbe1c3920cd195327e7c8f58f5202130d56a5/src/core/types.ts#L213)

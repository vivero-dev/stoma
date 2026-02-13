---
editUrl: false
next: false
prev: false
title: "HandlerUpstream"
---

Defined in: [src/core/types.ts:165](https://github.com/HomeGrower-club/stoma/blob/645ca3bfe48534ea194e7433b35f97ff805392a9/src/core/types.ts#L165)

Invoke a custom handler function directly. Useful for health checks,
mock responses, or routes that don't proxy to an upstream.

## Properties

### handler()

> **handler**: (`c`) => `Response` \| `Promise`\<`Response`\>

Defined in: [src/core/types.ts:168](https://github.com/HomeGrower-club/stoma/blob/645ca3bfe48534ea194e7433b35f97ff805392a9/src/core/types.ts#L168)

Handler function receiving the Hono context and returning a Response.

#### Parameters

##### c

`Context`

#### Returns

`Response` \| `Promise`\<`Response`\>

***

### type

> **type**: `"handler"`

Defined in: [src/core/types.ts:166](https://github.com/HomeGrower-club/stoma/blob/645ca3bfe48534ea194e7433b35f97ff805392a9/src/core/types.ts#L166)

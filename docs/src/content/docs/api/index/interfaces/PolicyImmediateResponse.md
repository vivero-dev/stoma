---
editUrl: false
next: false
prev: false
title: "PolicyImmediateResponse"
---

Defined in: [src/core/protocol.ts:186](https://github.com/HomeGrower-club/stoma/blob/48ef00d6c13071f9fc03cba04228926dc2dd542c/src/core/protocol.ts#L186)

Short-circuit with a complete non-error response.

Used for cache hits, mock responses, redirects — cases where the
policy provides the full response and upstream should not be called.

Equivalent to returning a `Response` without calling `next()` in
HTTP middleware, or ext_proc `ImmediateResponse` with a success status.

## Properties

### action

> **action**: `"immediate-response"`

Defined in: [src/core/protocol.ts:187](https://github.com/HomeGrower-club/stoma/blob/48ef00d6c13071f9fc03cba04228926dc2dd542c/src/core/protocol.ts#L187)

***

### body?

> `optional` **body**: `string` \| `ArrayBuffer`

Defined in: [src/core/protocol.ts:193](https://github.com/HomeGrower-club/stoma/blob/48ef00d6c13071f9fc03cba04228926dc2dd542c/src/core/protocol.ts#L193)

Response body.

***

### headers?

> `optional` **headers**: `Record`\<`string`, `string`\>

Defined in: [src/core/protocol.ts:191](https://github.com/HomeGrower-club/stoma/blob/48ef00d6c13071f9fc03cba04228926dc2dd542c/src/core/protocol.ts#L191)

Response headers.

***

### status

> **status**: `number`

Defined in: [src/core/protocol.ts:189](https://github.com/HomeGrower-club/stoma/blob/48ef00d6c13071f9fc03cba04228926dc2dd542c/src/core/protocol.ts#L189)

HTTP status code for the response.

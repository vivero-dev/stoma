---
editUrl: false
next: false
prev: false
title: "PolicyImmediateResponse"
---

Defined in: [packages/gateway/src/core/protocol.ts:186](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/core/protocol.ts#L186)

Short-circuit with a complete non-error response.

Used for cache hits, mock responses, redirects - cases where the
policy provides the full response and upstream should not be called.

Equivalent to returning a `Response` without calling `next()` in
HTTP middleware, or ext_proc `ImmediateResponse` with a success status.

## Properties

### action

> **action**: `"immediate-response"`

Defined in: [packages/gateway/src/core/protocol.ts:187](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/core/protocol.ts#L187)

***

### body?

> `optional` **body**: `string` \| `ArrayBuffer`

Defined in: [packages/gateway/src/core/protocol.ts:193](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/core/protocol.ts#L193)

Response body.

***

### headers?

> `optional` **headers**: `Record`\<`string`, `string`\>

Defined in: [packages/gateway/src/core/protocol.ts:191](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/core/protocol.ts#L191)

Response headers.

***

### status

> **status**: `number`

Defined in: [packages/gateway/src/core/protocol.ts:189](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/core/protocol.ts#L189)

HTTP status code for the response.

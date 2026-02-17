---
editUrl: false
next: false
prev: false
title: "PolicyInput"
---

Defined in: [packages/gateway/src/core/protocol.ts:69](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/core/protocol.ts#L69)

Protocol-agnostic view of what's being processed.

Constructed by each runtime from its native message type:
- HTTP runtime builds it from Hono's `Context`
- ext_proc runtime builds it from gRPC `ProcessingRequest`
- WebSocket runtime builds it from the upgrade request or message frame

## Properties

### attributes

> **attributes**: `Map`\<`string`, `unknown`\>

Defined in: [packages/gateway/src/core/protocol.ts:127](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/core/protocol.ts#L127)

Cross-policy attribute bag.

Policies read attributes set by upstream policies and set
attributes for downstream policies via [AttributeMutation](/api/index/interfaces/attributemutation/).
Runtime-populated attributes use the `runtime.*` namespace
(e.g. `runtime.matched_route`, `runtime.upstream_name`).

***

### body?

> `optional` **body**: `string` \| `ArrayBuffer`

Defined in: [packages/gateway/src/core/protocol.ts:109](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/core/protocol.ts#L109)

Message body, present only during body phases.

May be the full buffered body or a streaming chunk, depending on
the runtime's buffering mode.

***

### clientIp?

> `optional` **clientIp**: `string`

Defined in: [packages/gateway/src/core/protocol.ts:101](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/core/protocol.ts#L101)

Client IP address, extracted by the runtime from protocol-specific
sources (e.g. `CF-Connecting-IP`, `X-Forwarded-For`, gRPC peer address).

***

### headers

> **headers**: `Headers`

Defined in: [packages/gateway/src/core/protocol.ts:95](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/core/protocol.ts#L95)

Headers (HTTP) or metadata (gRPC).

Treat as read-only - express modifications via
[PolicyResult](/api/index/type-aliases/policyresult/) mutations, not by mutating this object.

***

### method

> **method**: `string`

Defined in: [packages/gateway/src/core/protocol.ts:79](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/core/protocol.ts#L79)

Request method or action.

- HTTP: `"GET"`, `"POST"`, etc.
- gRPC: Full method name, e.g. `"users.UserService/GetUser"`

***

### path

> **path**: `string`

Defined in: [packages/gateway/src/core/protocol.ts:87](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/core/protocol.ts#L87)

Request path or resource identifier.

- HTTP: URL path, e.g. `"/users/123"`
- gRPC: Service path, e.g. `"/users.UserService/GetUser"`

***

### phase

> **phase**: [`ProcessingPhase`](/api/index/type-aliases/processingphase/)

Defined in: [packages/gateway/src/core/protocol.ts:71](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/core/protocol.ts#L71)

Current processing phase.

***

### protocol

> **protocol**: [`ProtocolType`](/api/index/type-aliases/protocoltype/)

Defined in: [packages/gateway/src/core/protocol.ts:130](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/core/protocol.ts#L130)

The protocol runtime that constructed this input.

***

### trailers?

> `optional` **trailers**: `Headers`

Defined in: [packages/gateway/src/core/protocol.ts:117](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/core/protocol.ts#L117)

Trailers, present only during trailer phases.

Relevant for gRPC (which uses trailers for status codes and error
details) and HTTP/2.

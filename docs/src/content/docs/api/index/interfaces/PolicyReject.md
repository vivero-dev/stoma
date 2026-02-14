---
editUrl: false
next: false
prev: false
title: "PolicyReject"
---

Defined in: [src/core/protocol.ts:165](https://github.com/HomeGrower-club/stoma/blob/8ff27bd832ace97bceae4b05831dd71d1ac6ed6a/src/core/protocol.ts#L165)

Reject the request with a structured error.

Equivalent to `throw new GatewayError(...)` in HTTP middleware, or
ext_proc `ImmediateResponse` with an error status code.

## Properties

### action

> **action**: `"reject"`

Defined in: [src/core/protocol.ts:166](https://github.com/HomeGrower-club/stoma/blob/8ff27bd832ace97bceae4b05831dd71d1ac6ed6a/src/core/protocol.ts#L166)

***

### code

> **code**: `string`

Defined in: [src/core/protocol.ts:170](https://github.com/HomeGrower-club/stoma/blob/8ff27bd832ace97bceae4b05831dd71d1ac6ed6a/src/core/protocol.ts#L170)

Machine-readable error code (e.g. `"rate_limited"`, `"unauthorized"`).

***

### headers?

> `optional` **headers**: `Record`\<`string`, `string`\>

Defined in: [src/core/protocol.ts:174](https://github.com/HomeGrower-club/stoma/blob/8ff27bd832ace97bceae4b05831dd71d1ac6ed6a/src/core/protocol.ts#L174)

Additional headers to include on the error response.

***

### message

> **message**: `string`

Defined in: [src/core/protocol.ts:172](https://github.com/HomeGrower-club/stoma/blob/8ff27bd832ace97bceae4b05831dd71d1ac6ed6a/src/core/protocol.ts#L172)

Human-readable error message.

***

### status

> **status**: `number`

Defined in: [src/core/protocol.ts:168](https://github.com/HomeGrower-club/stoma/blob/8ff27bd832ace97bceae4b05831dd71d1ac6ed6a/src/core/protocol.ts#L168)

HTTP status code (or gRPC status equivalent).

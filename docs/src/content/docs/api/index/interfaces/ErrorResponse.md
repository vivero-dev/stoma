---
editUrl: false
next: false
prev: false
title: "ErrorResponse"
---

Defined in: [src/core/errors.ts:43](https://github.com/HomeGrower-club/stoma/blob/645ca3bfe48534ea194e7433b35f97ff805392a9/src/core/errors.ts#L43)

Standard JSON error response shape returned by all gateway errors.

## Properties

### error

> **error**: `string`

Defined in: [src/core/errors.ts:45](https://github.com/HomeGrower-club/stoma/blob/645ca3bfe48534ea194e7433b35f97ff805392a9/src/core/errors.ts#L45)

Machine-readable error code (e.g. `"rate_limited"`, `"unauthorized"`).

***

### message

> **message**: `string`

Defined in: [src/core/errors.ts:47](https://github.com/HomeGrower-club/stoma/blob/645ca3bfe48534ea194e7433b35f97ff805392a9/src/core/errors.ts#L47)

Human-readable error description.

***

### requestId?

> `optional` **requestId**: `string`

Defined in: [src/core/errors.ts:51](https://github.com/HomeGrower-club/stoma/blob/645ca3bfe48534ea194e7433b35f97ff805392a9/src/core/errors.ts#L51)

Request ID for tracing, when available.

***

### statusCode

> **statusCode**: `number`

Defined in: [src/core/errors.ts:49](https://github.com/HomeGrower-club/stoma/blob/645ca3bfe48534ea194e7433b35f97ff805392a9/src/core/errors.ts#L49)

HTTP status code (e.g. 401, 429, 503).

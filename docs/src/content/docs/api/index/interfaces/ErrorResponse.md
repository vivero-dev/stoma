---
editUrl: false
next: false
prev: false
title: "ErrorResponse"
---

Defined in: [src/core/errors.ts:48](https://github.com/HomeGrower-club/stoma/blob/d1b9da31b27a718636c280386dadc9788d6e0044/src/core/errors.ts#L48)

Standard JSON error response shape returned by all gateway errors.

## Properties

### error

> **error**: `string`

Defined in: [src/core/errors.ts:50](https://github.com/HomeGrower-club/stoma/blob/d1b9da31b27a718636c280386dadc9788d6e0044/src/core/errors.ts#L50)

Machine-readable error code (e.g. `"rate_limited"`, `"unauthorized"`).

***

### message

> **message**: `string`

Defined in: [src/core/errors.ts:52](https://github.com/HomeGrower-club/stoma/blob/d1b9da31b27a718636c280386dadc9788d6e0044/src/core/errors.ts#L52)

Human-readable error description.

***

### requestId?

> `optional` **requestId**: `string`

Defined in: [src/core/errors.ts:56](https://github.com/HomeGrower-club/stoma/blob/d1b9da31b27a718636c280386dadc9788d6e0044/src/core/errors.ts#L56)

Request ID for tracing, when available.

***

### statusCode

> **statusCode**: `number`

Defined in: [src/core/errors.ts:54](https://github.com/HomeGrower-club/stoma/blob/d1b9da31b27a718636c280386dadc9788d6e0044/src/core/errors.ts#L54)

HTTP status code (e.g. 401, 429, 503).

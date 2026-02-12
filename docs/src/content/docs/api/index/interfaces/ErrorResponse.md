---
editUrl: false
next: false
prev: false
title: "ErrorResponse"
---

Defined in: src/core/errors.ts:43

Standard JSON error response shape returned by all gateway errors.

## Properties

### error

> **error**: `string`

Defined in: src/core/errors.ts:45

Machine-readable error code (e.g. `"rate_limited"`, `"unauthorized"`).

***

### message

> **message**: `string`

Defined in: src/core/errors.ts:47

Human-readable error description.

***

### requestId?

> `optional` **requestId**: `string`

Defined in: src/core/errors.ts:51

Request ID for tracing, when available.

***

### statusCode

> **statusCode**: `number`

Defined in: src/core/errors.ts:49

HTTP status code (e.g. 401, 429, 503).

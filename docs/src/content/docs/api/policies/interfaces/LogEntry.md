---
editUrl: false
next: false
prev: false
title: "LogEntry"
---

Defined in: src/policies/observability/request-log.ts:29

Structured log entry emitted for each request/response pair.

## Properties

### clientIp

> **clientIp**: `string`

Defined in: src/policies/observability/request-log.ts:43

Client IP from `CF-Connecting-IP` or `X-Forwarded-For`.

***

### durationMs

> **durationMs**: `number`

Defined in: src/policies/observability/request-log.ts:41

End-to-end request duration in milliseconds.

***

### extra?

> `optional` **extra**: `Record`\<`string`, `unknown`\>

Defined in: src/policies/observability/request-log.ts:61

Custom fields from `extractFields` callback.

***

### gatewayName

> **gatewayName**: `string`

Defined in: src/policies/observability/request-log.ts:47

Gateway name from config.

***

### method

> **method**: `string`

Defined in: src/policies/observability/request-log.ts:35

HTTP method (e.g. `"GET"`, `"POST"`).

***

### path

> **path**: `string`

Defined in: src/policies/observability/request-log.ts:37

URL pathname (without query string).

***

### requestBody?

> `optional` **requestBody**: `unknown`

Defined in: src/policies/observability/request-log.ts:57

Captured request body (when `logRequestBody` is enabled).

***

### requestId

> **requestId**: `string`

Defined in: src/policies/observability/request-log.ts:33

Unique request ID for distributed tracing.

***

### responseBody?

> `optional` **responseBody**: `unknown`

Defined in: src/policies/observability/request-log.ts:59

Captured response body (when `logResponseBody` is enabled).

***

### routePath

> **routePath**: `string`

Defined in: src/policies/observability/request-log.ts:49

Matched route path pattern.

***

### spanId?

> `optional` **spanId**: `string`

Defined in: src/policies/observability/request-log.ts:55

W3C Trace Context — 16-hex span ID for this gateway request.

***

### statusCode

> **statusCode**: `number`

Defined in: src/policies/observability/request-log.ts:39

HTTP response status code.

***

### timestamp

> **timestamp**: `string`

Defined in: src/policies/observability/request-log.ts:31

ISO 8601 timestamp when the log was emitted.

***

### traceId?

> `optional` **traceId**: `string`

Defined in: src/policies/observability/request-log.ts:53

W3C Trace Context — 32-hex trace ID.

***

### upstream

> **upstream**: `string`

Defined in: src/policies/observability/request-log.ts:51

Upstream identifier (reserved for future enrichment).

***

### userAgent

> **userAgent**: `string`

Defined in: src/policies/observability/request-log.ts:45

Client User-Agent header value.

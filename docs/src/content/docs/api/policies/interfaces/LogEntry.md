---
editUrl: false
next: false
prev: false
title: "LogEntry"
---

Defined in: [packages/gateway/src/policies/observability/request-log.ts:29](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/observability/request-log.ts#L29)

Structured log entry emitted for each request/response pair.

## Properties

### clientIp

> **clientIp**: `string`

Defined in: [packages/gateway/src/policies/observability/request-log.ts:43](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/observability/request-log.ts#L43)

Client IP from `CF-Connecting-IP` or `X-Forwarded-For`.

***

### durationMs

> **durationMs**: `number`

Defined in: [packages/gateway/src/policies/observability/request-log.ts:41](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/observability/request-log.ts#L41)

End-to-end request duration in milliseconds.

***

### extra?

> `optional` **extra**: `Record`\<`string`, `unknown`\>

Defined in: [packages/gateway/src/policies/observability/request-log.ts:61](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/observability/request-log.ts#L61)

Custom fields from `extractFields` callback.

***

### gatewayName

> **gatewayName**: `string`

Defined in: [packages/gateway/src/policies/observability/request-log.ts:47](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/observability/request-log.ts#L47)

Gateway name from config.

***

### method

> **method**: `string`

Defined in: [packages/gateway/src/policies/observability/request-log.ts:35](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/observability/request-log.ts#L35)

HTTP method (e.g. `"GET"`, `"POST"`).

***

### path

> **path**: `string`

Defined in: [packages/gateway/src/policies/observability/request-log.ts:37](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/observability/request-log.ts#L37)

URL pathname (without query string).

***

### requestBody?

> `optional` **requestBody**: `unknown`

Defined in: [packages/gateway/src/policies/observability/request-log.ts:57](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/observability/request-log.ts#L57)

Captured request body (when `logRequestBody` is enabled).

***

### requestId

> **requestId**: `string`

Defined in: [packages/gateway/src/policies/observability/request-log.ts:33](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/observability/request-log.ts#L33)

Unique request ID for distributed tracing.

***

### responseBody?

> `optional` **responseBody**: `unknown`

Defined in: [packages/gateway/src/policies/observability/request-log.ts:59](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/observability/request-log.ts#L59)

Captured response body (when `logResponseBody` is enabled).

***

### routePath

> **routePath**: `string`

Defined in: [packages/gateway/src/policies/observability/request-log.ts:49](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/observability/request-log.ts#L49)

Matched route path pattern.

***

### spanId?

> `optional` **spanId**: `string`

Defined in: [packages/gateway/src/policies/observability/request-log.ts:55](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/observability/request-log.ts#L55)

W3C Trace Context - 16-hex span ID for this gateway request.

***

### statusCode

> **statusCode**: `number`

Defined in: [packages/gateway/src/policies/observability/request-log.ts:39](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/observability/request-log.ts#L39)

HTTP response status code.

***

### timestamp

> **timestamp**: `string`

Defined in: [packages/gateway/src/policies/observability/request-log.ts:31](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/observability/request-log.ts#L31)

ISO 8601 timestamp when the log was emitted.

***

### traceId?

> `optional` **traceId**: `string`

Defined in: [packages/gateway/src/policies/observability/request-log.ts:53](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/observability/request-log.ts#L53)

W3C Trace Context - 32-hex trace ID.

***

### upstream

> **upstream**: `string`

Defined in: [packages/gateway/src/policies/observability/request-log.ts:51](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/observability/request-log.ts#L51)

Upstream identifier (reserved for future enrichment).

***

### userAgent

> **userAgent**: `string`

Defined in: [packages/gateway/src/policies/observability/request-log.ts:45](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/observability/request-log.ts#L45)

Client User-Agent header value.

---
editUrl: false
next: false
prev: false
title: "SemConv"
---

> `const` **SemConv**: `object`

Defined in: [src/observability/tracing.ts:73](https://github.com/HomeGrower-club/stoma/blob/4764d83fea90804e5e2c02d8c0ed4153d64e412b/src/observability/tracing.ts#L73)

OTel semantic convention attribute keys (HTTP subset).

Uses the stable HTTP semconv names from the OpenTelemetry specification.

## Type Declaration

### HTTP\_METHOD

> `readonly` **HTTP\_METHOD**: `"http.request.method"` = `"http.request.method"`

### HTTP\_ROUTE

> `readonly` **HTTP\_ROUTE**: `"http.route"` = `"http.route"`

### HTTP\_STATUS\_CODE

> `readonly` **HTTP\_STATUS\_CODE**: `"http.response.status_code"` = `"http.response.status_code"`

### SERVER\_ADDRESS

> `readonly` **SERVER\_ADDRESS**: `"server.address"` = `"server.address"`

### URL\_PATH

> `readonly` **URL\_PATH**: `"url.path"` = `"url.path"`

## See

https://opentelemetry.io/docs/specs/semconv/http/

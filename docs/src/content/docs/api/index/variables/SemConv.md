---
editUrl: false
next: false
prev: false
title: "SemConv"
---

> `const` **SemConv**: `object`

Defined in: [src/observability/tracing.ts:73](https://github.com/HomeGrower-club/stoma/blob/512cbe1c3920cd195327e7c8f58f5202130d56a5/src/observability/tracing.ts#L73)

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

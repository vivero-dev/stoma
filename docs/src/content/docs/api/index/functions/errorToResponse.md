---
editUrl: false
next: false
prev: false
title: "errorToResponse"
---

> **errorToResponse**(`error`, `requestId?`): `Response`

Defined in: [packages/gateway/src/core/errors.ts:69](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/core/errors.ts#L69)

Build a JSON Response from a [GatewayError](/api/index/classes/gatewayerror/).

Merges any custom headers from the error (e.g. `Retry-After`) into the
response. Includes the request ID when available for tracing.

## Parameters

### error

[`GatewayError`](/api/index/classes/gatewayerror/)

The gateway error to convert.

### requestId?

`string`

Optional request ID to include in the response body.

## Returns

`Response`

A `Response` with JSON body and appropriate status code.

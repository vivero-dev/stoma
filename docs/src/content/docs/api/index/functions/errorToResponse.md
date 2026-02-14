---
editUrl: false
next: false
prev: false
title: "errorToResponse"
---

> **errorToResponse**(`error`, `requestId?`): `Response`

Defined in: [src/core/errors.ts:69](https://github.com/HomeGrower-club/stoma/blob/7a6bc5c6595d42b4d2edc385006b88a77065ce23/src/core/errors.ts#L69)

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

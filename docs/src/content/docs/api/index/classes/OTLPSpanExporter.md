---
editUrl: false
next: false
prev: false
title: "OTLPSpanExporter"
---

Defined in: [src/observability/tracing.ts:284](https://github.com/HomeGrower-club/stoma/blob/48ef00d6c13071f9fc03cba04228926dc2dd542c/src/observability/tracing.ts#L284)

OTLP/HTTP JSON span exporter.

Ships spans to an OpenTelemetry Collector (or compatible endpoint)
using `fetch()` with the OTLP JSON encoding. Designed for edge
runtimes — no gRPC, no protobuf, no Node.js dependencies.

Export calls should be dispatched via `waitUntil()` so they do not
block the response path.

## Implements

- [`SpanExporter`](/api/index/interfaces/spanexporter/)

## Constructors

### Constructor

> **new OTLPSpanExporter**(`config`): `OTLPSpanExporter`

Defined in: [src/observability/tracing.ts:291](https://github.com/HomeGrower-club/stoma/blob/48ef00d6c13071f9fc03cba04228926dc2dd542c/src/observability/tracing.ts#L291)

#### Parameters

##### config

###### endpoint

`string`

###### headers?

`Record`\<`string`, `string`\>

###### serviceName?

`string`

###### serviceVersion?

`string`

###### timeoutMs?

`number`

#### Returns

`OTLPSpanExporter`

## Methods

### export()

> **export**(`spans`): `Promise`\<`void`\>

Defined in: [src/observability/tracing.ts:305](https://github.com/HomeGrower-club/stoma/blob/48ef00d6c13071f9fc03cba04228926dc2dd542c/src/observability/tracing.ts#L305)

#### Parameters

##### spans

[`ReadableSpan`](/api/index/interfaces/readablespan/)[]

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`SpanExporter`](/api/index/interfaces/spanexporter/).[`export`](/api/index/interfaces/spanexporter/#export)

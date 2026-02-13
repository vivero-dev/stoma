---
editUrl: false
next: false
prev: false
title: "OTLPSpanExporter"
---

Defined in: [src/observability/tracing.ts:284](https://github.com/HomeGrower-club/stoma/blob/4764d83fea90804e5e2c02d8c0ed4153d64e412b/src/observability/tracing.ts#L284)

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

Defined in: [src/observability/tracing.ts:291](https://github.com/HomeGrower-club/stoma/blob/4764d83fea90804e5e2c02d8c0ed4153d64e412b/src/observability/tracing.ts#L291)

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

Defined in: [src/observability/tracing.ts:305](https://github.com/HomeGrower-club/stoma/blob/4764d83fea90804e5e2c02d8c0ed4153d64e412b/src/observability/tracing.ts#L305)

#### Parameters

##### spans

[`ReadableSpan`](/api/index/interfaces/readablespan/)[]

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`SpanExporter`](/api/index/interfaces/spanexporter/).[`export`](/api/index/interfaces/spanexporter/#export)

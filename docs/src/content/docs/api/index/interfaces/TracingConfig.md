---
editUrl: false
next: false
prev: false
title: "TracingConfig"
---

Defined in: [src/observability/tracing.ts:55](https://github.com/HomeGrower-club/stoma/blob/08b5f2db5f15b4e339eff6647be9d231bf97a776/src/observability/tracing.ts#L55)

Configuration for gateway-level tracing.

## Properties

### exporter

> **exporter**: [`SpanExporter`](/api/index/interfaces/spanexporter/)

Defined in: [src/observability/tracing.ts:56](https://github.com/HomeGrower-club/stoma/blob/08b5f2db5f15b4e339eff6647be9d231bf97a776/src/observability/tracing.ts#L56)

***

### sampleRate?

> `optional` **sampleRate**: `number`

Defined in: [src/observability/tracing.ts:60](https://github.com/HomeGrower-club/stoma/blob/08b5f2db5f15b4e339eff6647be9d231bf97a776/src/observability/tracing.ts#L60)

Head-based sampling rate [0.0, 1.0]. Default: 1.0

***

### serviceName?

> `optional` **serviceName**: `string`

Defined in: [src/observability/tracing.ts:57](https://github.com/HomeGrower-club/stoma/blob/08b5f2db5f15b4e339eff6647be9d231bf97a776/src/observability/tracing.ts#L57)

***

### serviceVersion?

> `optional` **serviceVersion**: `string`

Defined in: [src/observability/tracing.ts:58](https://github.com/HomeGrower-club/stoma/blob/08b5f2db5f15b4e339eff6647be9d231bf97a776/src/observability/tracing.ts#L58)

---
editUrl: false
next: false
prev: false
title: "InMemoryMetricsCollector"
---

Defined in: [src/observability/metrics.ts:70](https://github.com/HomeGrower-club/stoma/blob/4764d83fea90804e5e2c02d8c0ed4153d64e412b/src/observability/metrics.ts#L70)

In-memory metrics collector for testing, development, and admin API.

Accumulates counters, histograms, and gauges in plain arrays/maps.
Not intended for high-throughput production use — prefer shipping
metrics to a dedicated backend for production workloads.

## Implements

- [`MetricsCollector`](/api/index/interfaces/metricscollector/)

## Constructors

### Constructor

> **new InMemoryMetricsCollector**(): `InMemoryMetricsCollector`

#### Returns

`InMemoryMetricsCollector`

## Methods

### gauge()

> **gauge**(`name`, `value`, `tags?`): `void`

Defined in: [src/observability/metrics.ts:105](https://github.com/HomeGrower-club/stoma/blob/4764d83fea90804e5e2c02d8c0ed4153d64e412b/src/observability/metrics.ts#L105)

Set a gauge to an absolute value.

#### Parameters

##### name

`string`

##### value

`number`

##### tags?

`Record`\<`string`, `string`\>

#### Returns

`void`

#### Implementation of

[`MetricsCollector`](/api/index/interfaces/metricscollector/).[`gauge`](/api/index/interfaces/metricscollector/#gauge)

***

### histogram()

> **histogram**(`name`, `value`, `tags?`): `void`

Defined in: [src/observability/metrics.ts:90](https://github.com/HomeGrower-club/stoma/blob/4764d83fea90804e5e2c02d8c0ed4153d64e412b/src/observability/metrics.ts#L90)

Record a histogram observation.

#### Parameters

##### name

`string`

##### value

`number`

##### tags?

`Record`\<`string`, `string`\>

#### Returns

`void`

#### Implementation of

[`MetricsCollector`](/api/index/interfaces/metricscollector/).[`histogram`](/api/index/interfaces/metricscollector/#histogram)

***

### increment()

> **increment**(`name`, `value?`, `tags?`): `void`

Defined in: [src/observability/metrics.ts:75](https://github.com/HomeGrower-club/stoma/blob/4764d83fea90804e5e2c02d8c0ed4153d64e412b/src/observability/metrics.ts#L75)

Increment a counter by `value` (default 1).

#### Parameters

##### name

`string`

##### value?

`number` = `1`

##### tags?

`Record`\<`string`, `string`\>

#### Returns

`void`

#### Implementation of

[`MetricsCollector`](/api/index/interfaces/metricscollector/).[`increment`](/api/index/interfaces/metricscollector/#increment)

***

### reset()

> **reset**(): `void`

Defined in: [src/observability/metrics.ts:135](https://github.com/HomeGrower-club/stoma/blob/4764d83fea90804e5e2c02d8c0ed4153d64e412b/src/observability/metrics.ts#L135)

Reset all metrics to zero.

#### Returns

`void`

#### Implementation of

[`MetricsCollector`](/api/index/interfaces/metricscollector/).[`reset`](/api/index/interfaces/metricscollector/#reset)

***

### snapshot()

> **snapshot**(): [`MetricsSnapshot`](/api/index/interfaces/metricssnapshot/)

Defined in: [src/observability/metrics.ts:115](https://github.com/HomeGrower-club/stoma/blob/4764d83fea90804e5e2c02d8c0ed4153d64e412b/src/observability/metrics.ts#L115)

Return a point-in-time snapshot of all metrics.

#### Returns

[`MetricsSnapshot`](/api/index/interfaces/metricssnapshot/)

#### Implementation of

[`MetricsCollector`](/api/index/interfaces/metricscollector/).[`snapshot`](/api/index/interfaces/metricscollector/#snapshot)

---
editUrl: false
next: false
prev: false
title: "MetricsCollector"
---

Defined in: [src/observability/metrics.ts:38](https://github.com/HomeGrower-club/stoma/blob/4764d83fea90804e5e2c02d8c0ed4153d64e412b/src/observability/metrics.ts#L38)

Pluggable metrics collector interface.

Implementations can ship metrics to Prometheus, Datadog, CloudWatch,
or any other backend. The gateway pipeline records request counts,
latencies, and error rates through this interface.

## Methods

### gauge()

> **gauge**(`name`, `value`, `tags?`): `void`

Defined in: [src/observability/metrics.ts:44](https://github.com/HomeGrower-club/stoma/blob/4764d83fea90804e5e2c02d8c0ed4153d64e412b/src/observability/metrics.ts#L44)

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

***

### histogram()

> **histogram**(`name`, `value`, `tags?`): `void`

Defined in: [src/observability/metrics.ts:42](https://github.com/HomeGrower-club/stoma/blob/4764d83fea90804e5e2c02d8c0ed4153d64e412b/src/observability/metrics.ts#L42)

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

***

### increment()

> **increment**(`name`, `value?`, `tags?`): `void`

Defined in: [src/observability/metrics.ts:40](https://github.com/HomeGrower-club/stoma/blob/4764d83fea90804e5e2c02d8c0ed4153d64e412b/src/observability/metrics.ts#L40)

Increment a counter by `value` (default 1).

#### Parameters

##### name

`string`

##### value?

`number`

##### tags?

`Record`\<`string`, `string`\>

#### Returns

`void`

***

### reset()

> **reset**(): `void`

Defined in: [src/observability/metrics.ts:48](https://github.com/HomeGrower-club/stoma/blob/4764d83fea90804e5e2c02d8c0ed4153d64e412b/src/observability/metrics.ts#L48)

Reset all metrics to zero.

#### Returns

`void`

***

### snapshot()

> **snapshot**(): [`MetricsSnapshot`](/api/index/interfaces/metricssnapshot/)

Defined in: [src/observability/metrics.ts:46](https://github.com/HomeGrower-club/stoma/blob/4764d83fea90804e5e2c02d8c0ed4153d64e412b/src/observability/metrics.ts#L46)

Return a point-in-time snapshot of all metrics.

#### Returns

[`MetricsSnapshot`](/api/index/interfaces/metricssnapshot/)

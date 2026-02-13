---
editUrl: false
next: false
prev: false
title: "toPrometheusText"
---

> **toPrometheusText**(`snapshot`): `string`

Defined in: [src/observability/metrics.ts:155](https://github.com/HomeGrower-club/stoma/blob/4764d83fea90804e5e2c02d8c0ed4153d64e412b/src/observability/metrics.ts#L155)

Serialize a metrics snapshot to Prometheus text exposition format.

Produces lines like:
```
gateway_requests_total{method="GET",status="200"} 42
gateway_request_duration_ms_sum{method="GET"} 1234
gateway_request_duration_ms_count{method="GET"} 10
```

## Parameters

### snapshot

[`MetricsSnapshot`](/api/index/interfaces/metricssnapshot/)

The metrics snapshot to serialize.

## Returns

`string`

Prometheus text exposition format string.

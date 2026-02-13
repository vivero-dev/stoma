---
editUrl: false
next: false
prev: false
title: "metricsReporter"
---

> `const` **metricsReporter**: (`config?`) => [`Policy`](/api/index/interfaces/policy/)

Defined in: [src/policies/observability/metrics-reporter.ts:31](https://github.com/HomeGrower-club/stoma/blob/645ca3bfe48534ea194e7433b35f97ff805392a9/src/policies/observability/metrics-reporter.ts#L31)

Record standard gateway metrics for every request.

Metrics recorded:
- `gateway_requests_total` (counter) — total requests, tagged by method/path/status/gateway
- `gateway_request_duration_ms` (histogram) — end-to-end request duration
- `gateway_request_errors_total` (counter) — requests with status >= 400
- `gateway_policy_duration_ms` (histogram) — per-policy timing when available

## Parameters

### config?

[`MetricsReporterConfig`](/api/index/interfaces/metricsreporterconfig/)

Must include a [MetricsCollector](/api/index/interfaces/metricscollector/) instance.

## Returns

[`Policy`](/api/index/interfaces/policy/)

A [Policy](/api/index/interfaces/policy/) at priority 1.

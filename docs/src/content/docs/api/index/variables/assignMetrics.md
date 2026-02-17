---
editUrl: false
next: false
prev: false
title: "assignMetrics"
---

> `const` **assignMetrics**: (`config`) => [`Policy`](/api/index/interfaces/policy/)

Defined in: [packages/gateway/src/policies/observability/assign-metrics.ts:43](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/observability/assign-metrics.ts#L43)

Attach metric tags to the request context for downstream consumers.

Tags are resolved (static or dynamic) and stored as a plain object at
`c.get("_metricsTags")`. The [metricsReporter](/api/index/variables/metricsreporter/) policy (or any custom
observer) can read these tags to enrich collected metrics.

## Parameters

### config

[`AssignMetricsConfig`](/api/policies/interfaces/assignmetricsconfig/)

Must include `tags` - a record of tag names to values or resolver functions.

## Returns

[`Policy`](/api/index/interfaces/policy/)

A [Policy](/api/index/interfaces/policy/) at priority 0 (OBSERVABILITY).

## Example

```ts
import { assignMetrics } from "@homegrower-club/stoma";

assignMetrics({
  tags: {
    service: "users-api",
    region: (c) => c.req.header("cf-ipcountry") ?? "unknown",
  },
});
```

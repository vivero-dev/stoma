---
editUrl: false
next: false
prev: false
title: "MetricsSnapshot"
---

Defined in: [src/observability/metrics.ts:25](https://github.com/HomeGrower-club/stoma/blob/48ef00d6c13071f9fc03cba04228926dc2dd542c/src/observability/metrics.ts#L25)

Point-in-time snapshot of all collected metrics.

## Properties

### counters

> **counters**: `Record`\<`string`, [`TaggedValue`](/api/index/interfaces/taggedvalue/)[]\>

Defined in: [src/observability/metrics.ts:26](https://github.com/HomeGrower-club/stoma/blob/48ef00d6c13071f9fc03cba04228926dc2dd542c/src/observability/metrics.ts#L26)

***

### gauges

> **gauges**: `Record`\<`string`, [`TaggedValue`](/api/index/interfaces/taggedvalue/)[]\>

Defined in: [src/observability/metrics.ts:28](https://github.com/HomeGrower-club/stoma/blob/48ef00d6c13071f9fc03cba04228926dc2dd542c/src/observability/metrics.ts#L28)

***

### histograms

> **histograms**: `Record`\<`string`, [`HistogramEntry`](/api/index/interfaces/histogramentry/)[]\>

Defined in: [src/observability/metrics.ts:27](https://github.com/HomeGrower-club/stoma/blob/48ef00d6c13071f9fc03cba04228926dc2dd542c/src/observability/metrics.ts#L27)

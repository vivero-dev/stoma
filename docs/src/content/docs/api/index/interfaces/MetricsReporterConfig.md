---
editUrl: false
next: false
prev: false
title: "MetricsReporterConfig"
---

Defined in: [src/policies/observability/metrics-reporter.ts:14](https://github.com/HomeGrower-club/stoma/blob/8b84574bca28149f020bbd910337511015437508/src/policies/observability/metrics-reporter.ts#L14)

Configuration for the [metricsReporter](/api/index/variables/metricsreporter/) policy.

## Extends

- [`PolicyConfig`](/api/index/interfaces/policyconfig/)

## Properties

### collector

> **collector**: [`MetricsCollector`](/api/index/interfaces/metricscollector/)

Defined in: [src/policies/observability/metrics-reporter.ts:16](https://github.com/HomeGrower-club/stoma/blob/8b84574bca28149f020bbd910337511015437508/src/policies/observability/metrics-reporter.ts#L16)

The metrics collector to record to.

***

### skip()?

> `optional` **skip**: (`c`) => `boolean` \| `Promise`\<`boolean`\>

Defined in: [src/policies/types.ts:69](https://github.com/HomeGrower-club/stoma/blob/8b84574bca28149f020bbd910337511015437508/src/policies/types.ts#L69)

Skip this policy when condition returns true

#### Parameters

##### c

`unknown`

#### Returns

`boolean` \| `Promise`\<`boolean`\>

#### Inherited from

[`PolicyConfig`](/api/index/interfaces/policyconfig/).[`skip`](/api/index/interfaces/policyconfig/#skip)

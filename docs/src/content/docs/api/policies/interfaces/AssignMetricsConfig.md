---
editUrl: false
next: false
prev: false
title: "AssignMetricsConfig"
---

Defined in: src/policies/observability/assign-metrics.ts:13

Configuration for the assignMetrics policy.

## Extends

- [`PolicyConfig`](/api/index/interfaces/policyconfig/)

## Properties

### skip()?

> `optional` **skip**: (`c`) => `boolean` \| `Promise`\<`boolean`\>

Defined in: src/policies/types.ts:33

Skip this policy when condition returns true

#### Parameters

##### c

`unknown`

#### Returns

`boolean` \| `Promise`\<`boolean`\>

#### Inherited from

[`PolicyConfig`](/api/index/interfaces/policyconfig/).[`skip`](/api/index/interfaces/policyconfig/#skip)

***

### tags

> **tags**: `Record`\<`string`, `string` \| (`c`) => `string` \| `Promise`\<`string`\>\>

Defined in: src/policies/observability/assign-metrics.ts:18

Metric tags to attach to the request.
Values can be static strings or functions that receive the context.

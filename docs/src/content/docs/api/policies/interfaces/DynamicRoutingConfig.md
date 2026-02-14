---
editUrl: false
next: false
prev: false
title: "DynamicRoutingConfig"
---

Defined in: [src/policies/traffic/dynamic-routing.ts:28](https://github.com/HomeGrower-club/stoma/blob/512cbe1c3920cd195327e7c8f58f5202130d56a5/src/policies/traffic/dynamic-routing.ts#L28)

Configuration for the dynamicRouting policy.

## Extends

- [`PolicyConfig`](/api/index/interfaces/policyconfig/)

## Properties

### fallthrough?

> `optional` **fallthrough**: `boolean`

Defined in: [src/policies/traffic/dynamic-routing.ts:32](https://github.com/HomeGrower-club/stoma/blob/512cbe1c3920cd195327e7c8f58f5202130d56a5/src/policies/traffic/dynamic-routing.ts#L32)

If true and no rule matches, call next() normally. If false, throw 404. Default: true.

***

### rules

> **rules**: [`RoutingRule`](/api/policies/interfaces/routingrule/)[]

Defined in: [src/policies/traffic/dynamic-routing.ts:30](https://github.com/HomeGrower-club/stoma/blob/512cbe1c3920cd195327e7c8f58f5202130d56a5/src/policies/traffic/dynamic-routing.ts#L30)

Ordered list of routing rules. First match wins. Required.

***

### skip()?

> `optional` **skip**: (`c`) => `boolean` \| `Promise`\<`boolean`\>

Defined in: [src/policies/types.ts:90](https://github.com/HomeGrower-club/stoma/blob/512cbe1c3920cd195327e7c8f58f5202130d56a5/src/policies/types.ts#L90)

Skip this policy when condition returns true

#### Parameters

##### c

`unknown`

#### Returns

`boolean` \| `Promise`\<`boolean`\>

#### Inherited from

[`PolicyConfig`](/api/index/interfaces/policyconfig/).[`skip`](/api/index/interfaces/policyconfig/#skip)

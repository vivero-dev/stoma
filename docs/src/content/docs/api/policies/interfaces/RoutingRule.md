---
editUrl: false
next: false
prev: false
title: "RoutingRule"
---

Defined in: src/policies/traffic/dynamic-routing.ts:15

Configuration for the dynamicRouting policy.

## Properties

### condition()

> **condition**: (`c`) => `boolean` \| `Promise`\<`boolean`\>

Defined in: src/policies/traffic/dynamic-routing.ts:19

Condition that determines if this rule applies.

#### Parameters

##### c

`Context`

#### Returns

`boolean` \| `Promise`\<`boolean`\>

***

### headers?

> `optional` **headers**: `Record`\<`string`, `string`\>

Defined in: src/policies/traffic/dynamic-routing.ts:25

Optional headers to add to the upstream request.

***

### name?

> `optional` **name**: `string`

Defined in: src/policies/traffic/dynamic-routing.ts:17

Human-readable rule name for debugging.

***

### rewritePath()?

> `optional` **rewritePath**: (`path`) => `string`

Defined in: src/policies/traffic/dynamic-routing.ts:23

Optional path rewrite function.

#### Parameters

##### path

`string`

#### Returns

`string`

***

### target

> **target**: `string`

Defined in: src/policies/traffic/dynamic-routing.ts:21

Target upstream URL to route to.

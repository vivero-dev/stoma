---
editUrl: false
next: false
prev: false
title: "RoutingRule"
---

Defined in: [src/policies/traffic/dynamic-routing.ts:15](https://github.com/HomeGrower-club/stoma/blob/4764d83fea90804e5e2c02d8c0ed4153d64e412b/src/policies/traffic/dynamic-routing.ts#L15)

Configuration for the dynamicRouting policy.

## Properties

### condition()

> **condition**: (`c`) => `boolean` \| `Promise`\<`boolean`\>

Defined in: [src/policies/traffic/dynamic-routing.ts:19](https://github.com/HomeGrower-club/stoma/blob/4764d83fea90804e5e2c02d8c0ed4153d64e412b/src/policies/traffic/dynamic-routing.ts#L19)

Condition that determines if this rule applies.

#### Parameters

##### c

`Context`

#### Returns

`boolean` \| `Promise`\<`boolean`\>

***

### headers?

> `optional` **headers**: `Record`\<`string`, `string`\>

Defined in: [src/policies/traffic/dynamic-routing.ts:25](https://github.com/HomeGrower-club/stoma/blob/4764d83fea90804e5e2c02d8c0ed4153d64e412b/src/policies/traffic/dynamic-routing.ts#L25)

Optional headers to add to the upstream request.

***

### name?

> `optional` **name**: `string`

Defined in: [src/policies/traffic/dynamic-routing.ts:17](https://github.com/HomeGrower-club/stoma/blob/4764d83fea90804e5e2c02d8c0ed4153d64e412b/src/policies/traffic/dynamic-routing.ts#L17)

Human-readable rule name for debugging.

***

### rewritePath()?

> `optional` **rewritePath**: (`path`) => `string`

Defined in: [src/policies/traffic/dynamic-routing.ts:23](https://github.com/HomeGrower-club/stoma/blob/4764d83fea90804e5e2c02d8c0ed4153d64e412b/src/policies/traffic/dynamic-routing.ts#L23)

Optional path rewrite function.

#### Parameters

##### path

`string`

#### Returns

`string`

***

### target

> **target**: `string`

Defined in: [src/policies/traffic/dynamic-routing.ts:21](https://github.com/HomeGrower-club/stoma/blob/4764d83fea90804e5e2c02d8c0ed4153d64e412b/src/policies/traffic/dynamic-routing.ts#L21)

Target upstream URL to route to.

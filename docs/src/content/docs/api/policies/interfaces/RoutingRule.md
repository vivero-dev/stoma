---
editUrl: false
next: false
prev: false
title: "RoutingRule"
---

Defined in: [packages/gateway/src/policies/traffic/dynamic-routing.ts:15](https://github.com/HomeGrower-club/stoma/blob/b366835e3781c3a030f80027e784272dddf630da/packages/gateway/src/policies/traffic/dynamic-routing.ts#L15)

Configuration for the dynamicRouting policy.

## Properties

### condition()

> **condition**: (`c`) => `boolean` \| `Promise`\<`boolean`\>

Defined in: [packages/gateway/src/policies/traffic/dynamic-routing.ts:19](https://github.com/HomeGrower-club/stoma/blob/b366835e3781c3a030f80027e784272dddf630da/packages/gateway/src/policies/traffic/dynamic-routing.ts#L19)

Condition that determines if this rule applies.

#### Parameters

##### c

`Context`

#### Returns

`boolean` \| `Promise`\<`boolean`\>

***

### headers?

> `optional` **headers**: `Record`\<`string`, `string`\>

Defined in: [packages/gateway/src/policies/traffic/dynamic-routing.ts:25](https://github.com/HomeGrower-club/stoma/blob/b366835e3781c3a030f80027e784272dddf630da/packages/gateway/src/policies/traffic/dynamic-routing.ts#L25)

Optional headers to add to the upstream request.

***

### name?

> `optional` **name**: `string`

Defined in: [packages/gateway/src/policies/traffic/dynamic-routing.ts:17](https://github.com/HomeGrower-club/stoma/blob/b366835e3781c3a030f80027e784272dddf630da/packages/gateway/src/policies/traffic/dynamic-routing.ts#L17)

Human-readable rule name for debugging.

***

### rewritePath()?

> `optional` **rewritePath**: (`path`) => `string`

Defined in: [packages/gateway/src/policies/traffic/dynamic-routing.ts:23](https://github.com/HomeGrower-club/stoma/blob/b366835e3781c3a030f80027e784272dddf630da/packages/gateway/src/policies/traffic/dynamic-routing.ts#L23)

Optional path rewrite function.

#### Parameters

##### path

`string`

#### Returns

`string`

***

### target

> **target**: `string`

Defined in: [packages/gateway/src/policies/traffic/dynamic-routing.ts:21](https://github.com/HomeGrower-club/stoma/blob/b366835e3781c3a030f80027e784272dddf630da/packages/gateway/src/policies/traffic/dynamic-routing.ts#L21)

Target upstream URL to route to.

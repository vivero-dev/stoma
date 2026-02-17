---
editUrl: false
next: false
prev: false
title: "TrafficShadowConfig"
---

Defined in: [packages/gateway/src/policies/traffic/traffic-shadow.ts:25](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/traffic/traffic-shadow.ts#L25)

Configuration for the trafficShadow policy.

## Extends

- [`PolicyConfig`](/api/index/interfaces/policyconfig/)

## Properties

### methods?

> `optional` **methods**: `string`[]

Defined in: [packages/gateway/src/policies/traffic/traffic-shadow.ts:31](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/traffic/traffic-shadow.ts#L31)

Only mirror these HTTP methods. Default: `["GET", "POST", "PUT", "PATCH", "DELETE"]`.

***

### mirrorBody?

> `optional` **mirrorBody**: `boolean`

Defined in: [packages/gateway/src/policies/traffic/traffic-shadow.ts:33](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/traffic/traffic-shadow.ts#L33)

Include request body in shadow request. Default: `true`.

***

### onError()?

> `optional` **onError**: (`error`) => `void`

Defined in: [packages/gateway/src/policies/traffic/traffic-shadow.ts:37](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/traffic/traffic-shadow.ts#L37)

Optional error handler for shadow failures. Default: silent.

#### Parameters

##### error

`unknown`

#### Returns

`void`

***

### percentage?

> `optional` **percentage**: `number`

Defined in: [packages/gateway/src/policies/traffic/traffic-shadow.ts:29](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/traffic/traffic-shadow.ts#L29)

Percentage of traffic to mirror, 0-100. Default: `100`.

***

### skip()?

> `optional` **skip**: (`c`) => `boolean` \| `Promise`\<`boolean`\>

Defined in: [packages/gateway/src/policies/types.ts:90](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/types.ts#L90)

Skip this policy when condition returns true

#### Parameters

##### c

`unknown`

#### Returns

`boolean` \| `Promise`\<`boolean`\>

#### Inherited from

[`PolicyConfig`](/api/index/interfaces/policyconfig/).[`skip`](/api/index/interfaces/policyconfig/#skip)

***

### target

> **target**: `string`

Defined in: [packages/gateway/src/policies/traffic/traffic-shadow.ts:27](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/traffic/traffic-shadow.ts#L27)

URL of the shadow upstream (required).

***

### timeout?

> `optional` **timeout**: `number`

Defined in: [packages/gateway/src/policies/traffic/traffic-shadow.ts:35](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/traffic/traffic-shadow.ts#L35)

Timeout for shadow request in ms. Default: `5000`.

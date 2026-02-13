---
editUrl: false
next: false
prev: false
title: "IpFilterConfig"
---

Defined in: [packages/stoma/src/policies/traffic/ip-filter.ts:12](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/traffic/ip-filter.ts#L12)

Configuration for the ipFilter policy.

## Extends

- [`PolicyConfig`](/api/index/interfaces/policyconfig/)

## Properties

### allow?

> `optional` **allow**: `string`[]

Defined in: [packages/stoma/src/policies/traffic/ip-filter.ts:14](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/traffic/ip-filter.ts#L14)

IPs or CIDR ranges to allow (allowlist mode).

***

### deny?

> `optional` **deny**: `string`[]

Defined in: [packages/stoma/src/policies/traffic/ip-filter.ts:16](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/traffic/ip-filter.ts#L16)

IPs or CIDR ranges to deny (denylist mode).

***

### ipHeaders?

> `optional` **ipHeaders**: `string`[]

Defined in: [packages/stoma/src/policies/traffic/ip-filter.ts:20](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/traffic/ip-filter.ts#L20)

Ordered list of headers to inspect for the client IP. Default: `["cf-connecting-ip", "x-forwarded-for"]`.

***

### mode?

> `optional` **mode**: `"allow"` \| `"deny"`

Defined in: [packages/stoma/src/policies/traffic/ip-filter.ts:18](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/traffic/ip-filter.ts#L18)

Filter mode. Default: "deny".

***

### skip()?

> `optional` **skip**: (`c`) => `boolean` \| `Promise`\<`boolean`\>

Defined in: [packages/stoma/src/policies/types.ts:33](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/types.ts#L33)

Skip this policy when condition returns true

#### Parameters

##### c

`unknown`

#### Returns

`boolean` \| `Promise`\<`boolean`\>

#### Inherited from

[`PolicyConfig`](/api/index/interfaces/policyconfig/).[`skip`](/api/index/interfaces/policyconfig/#skip)

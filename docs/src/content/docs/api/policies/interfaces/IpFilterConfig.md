---
editUrl: false
next: false
prev: false
title: "IpFilterConfig"
---

Defined in: [src/policies/traffic/ip-filter.ts:18](https://github.com/HomeGrower-club/stoma/blob/08b5f2db5f15b4e339eff6647be9d231bf97a776/src/policies/traffic/ip-filter.ts#L18)

Configuration for the ipFilter policy.

## Extends

- [`PolicyConfig`](/api/index/interfaces/policyconfig/)

## Properties

### allow?

> `optional` **allow**: `string`[]

Defined in: [src/policies/traffic/ip-filter.ts:20](https://github.com/HomeGrower-club/stoma/blob/08b5f2db5f15b4e339eff6647be9d231bf97a776/src/policies/traffic/ip-filter.ts#L20)

IPs or CIDR ranges to allow (allowlist mode).

***

### deny?

> `optional` **deny**: `string`[]

Defined in: [src/policies/traffic/ip-filter.ts:22](https://github.com/HomeGrower-club/stoma/blob/08b5f2db5f15b4e339eff6647be9d231bf97a776/src/policies/traffic/ip-filter.ts#L22)

IPs or CIDR ranges to deny (denylist mode).

***

### ipHeaders?

> `optional` **ipHeaders**: `string`[]

Defined in: [src/policies/traffic/ip-filter.ts:26](https://github.com/HomeGrower-club/stoma/blob/08b5f2db5f15b4e339eff6647be9d231bf97a776/src/policies/traffic/ip-filter.ts#L26)

Ordered list of headers to inspect for the client IP. Default: `["cf-connecting-ip", "x-forwarded-for"]`.

***

### mode?

> `optional` **mode**: `"allow"` \| `"deny"`

Defined in: [src/policies/traffic/ip-filter.ts:24](https://github.com/HomeGrower-club/stoma/blob/08b5f2db5f15b4e339eff6647be9d231bf97a776/src/policies/traffic/ip-filter.ts#L24)

Filter mode. Default: "deny".

***

### skip()?

> `optional` **skip**: (`c`) => `boolean` \| `Promise`\<`boolean`\>

Defined in: [src/policies/types.ts:90](https://github.com/HomeGrower-club/stoma/blob/08b5f2db5f15b4e339eff6647be9d231bf97a776/src/policies/types.ts#L90)

Skip this policy when condition returns true

#### Parameters

##### c

`unknown`

#### Returns

`boolean` \| `Promise`\<`boolean`\>

#### Inherited from

[`PolicyConfig`](/api/index/interfaces/policyconfig/).[`skip`](/api/index/interfaces/policyconfig/#skip)

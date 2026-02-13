---
editUrl: false
next: false
prev: false
title: "IpFilterConfig"
---

Defined in: [src/policies/traffic/ip-filter.ts:13](https://github.com/HomeGrower-club/stoma/blob/4764d83fea90804e5e2c02d8c0ed4153d64e412b/src/policies/traffic/ip-filter.ts#L13)

Configuration for the ipFilter policy.

## Extends

- [`PolicyConfig`](/api/index/interfaces/policyconfig/)

## Properties

### allow?

> `optional` **allow**: `string`[]

Defined in: [src/policies/traffic/ip-filter.ts:15](https://github.com/HomeGrower-club/stoma/blob/4764d83fea90804e5e2c02d8c0ed4153d64e412b/src/policies/traffic/ip-filter.ts#L15)

IPs or CIDR ranges to allow (allowlist mode).

***

### deny?

> `optional` **deny**: `string`[]

Defined in: [src/policies/traffic/ip-filter.ts:17](https://github.com/HomeGrower-club/stoma/blob/4764d83fea90804e5e2c02d8c0ed4153d64e412b/src/policies/traffic/ip-filter.ts#L17)

IPs or CIDR ranges to deny (denylist mode).

***

### ipHeaders?

> `optional` **ipHeaders**: `string`[]

Defined in: [src/policies/traffic/ip-filter.ts:21](https://github.com/HomeGrower-club/stoma/blob/4764d83fea90804e5e2c02d8c0ed4153d64e412b/src/policies/traffic/ip-filter.ts#L21)

Ordered list of headers to inspect for the client IP. Default: `["cf-connecting-ip", "x-forwarded-for"]`.

***

### mode?

> `optional` **mode**: `"allow"` \| `"deny"`

Defined in: [src/policies/traffic/ip-filter.ts:19](https://github.com/HomeGrower-club/stoma/blob/4764d83fea90804e5e2c02d8c0ed4153d64e412b/src/policies/traffic/ip-filter.ts#L19)

Filter mode. Default: "deny".

***

### skip()?

> `optional` **skip**: (`c`) => `boolean` \| `Promise`\<`boolean`\>

Defined in: [src/policies/types.ts:69](https://github.com/HomeGrower-club/stoma/blob/4764d83fea90804e5e2c02d8c0ed4153d64e412b/src/policies/types.ts#L69)

Skip this policy when condition returns true

#### Parameters

##### c

`unknown`

#### Returns

`boolean` \| `Promise`\<`boolean`\>

#### Inherited from

[`PolicyConfig`](/api/index/interfaces/policyconfig/).[`skip`](/api/index/interfaces/policyconfig/#skip)

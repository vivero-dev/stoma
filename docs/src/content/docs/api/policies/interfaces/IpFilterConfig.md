---
editUrl: false
next: false
prev: false
title: "IpFilterConfig"
---

Defined in: src/policies/traffic/ip-filter.ts:12

Configuration for the ipFilter policy.

## Extends

- [`PolicyConfig`](/api/index/interfaces/policyconfig/)

## Properties

### allow?

> `optional` **allow**: `string`[]

Defined in: src/policies/traffic/ip-filter.ts:14

IPs or CIDR ranges to allow (allowlist mode).

***

### deny?

> `optional` **deny**: `string`[]

Defined in: src/policies/traffic/ip-filter.ts:16

IPs or CIDR ranges to deny (denylist mode).

***

### ipHeaders?

> `optional` **ipHeaders**: `string`[]

Defined in: src/policies/traffic/ip-filter.ts:20

Ordered list of headers to inspect for the client IP. Default: `["cf-connecting-ip", "x-forwarded-for"]`.

***

### mode?

> `optional` **mode**: `"allow"` \| `"deny"`

Defined in: src/policies/traffic/ip-filter.ts:18

Filter mode. Default: "deny".

***

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

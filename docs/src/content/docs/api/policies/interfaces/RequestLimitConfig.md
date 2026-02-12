---
editUrl: false
next: false
prev: false
title: "RequestLimitConfig"
---

Defined in: src/policies/traffic/request-limit.ts:10

Configuration for the requestLimit policy.

## Extends

- [`PolicyConfig`](/api/index/interfaces/policyconfig/)

## Properties

### maxBytes

> **maxBytes**: `number`

Defined in: src/policies/traffic/request-limit.ts:12

Maximum allowed body size in bytes (based on Content-Length).

***

### message?

> `optional` **message**: `string`

Defined in: src/policies/traffic/request-limit.ts:14

Custom error message. Default: "Request body too large".

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

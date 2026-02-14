---
editUrl: false
next: false
prev: false
title: "RequestLimitConfig"
---

Defined in: [src/policies/traffic/request-limit.ts:11](https://github.com/HomeGrower-club/stoma/blob/8b84574bca28149f020bbd910337511015437508/src/policies/traffic/request-limit.ts#L11)

Configuration for the requestLimit policy.

## Extends

- [`PolicyConfig`](/api/index/interfaces/policyconfig/)

## Properties

### maxBytes

> **maxBytes**: `number`

Defined in: [src/policies/traffic/request-limit.ts:13](https://github.com/HomeGrower-club/stoma/blob/8b84574bca28149f020bbd910337511015437508/src/policies/traffic/request-limit.ts#L13)

Maximum allowed body size in bytes (based on Content-Length).

***

### message?

> `optional` **message**: `string`

Defined in: [src/policies/traffic/request-limit.ts:15](https://github.com/HomeGrower-club/stoma/blob/8b84574bca28149f020bbd910337511015437508/src/policies/traffic/request-limit.ts#L15)

Custom error message. Default: "Request body too large".

***

### skip()?

> `optional` **skip**: (`c`) => `boolean` \| `Promise`\<`boolean`\>

Defined in: [src/policies/types.ts:69](https://github.com/HomeGrower-club/stoma/blob/8b84574bca28149f020bbd910337511015437508/src/policies/types.ts#L69)

Skip this policy when condition returns true

#### Parameters

##### c

`unknown`

#### Returns

`boolean` \| `Promise`\<`boolean`\>

#### Inherited from

[`PolicyConfig`](/api/index/interfaces/policyconfig/).[`skip`](/api/index/interfaces/policyconfig/#skip)

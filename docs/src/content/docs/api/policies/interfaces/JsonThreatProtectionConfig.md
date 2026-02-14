---
editUrl: false
next: false
prev: false
title: "JsonThreatProtectionConfig"
---

Defined in: [src/policies/traffic/json-threat-protection.ts:15](https://github.com/HomeGrower-club/stoma/blob/8b84574bca28149f020bbd910337511015437508/src/policies/traffic/json-threat-protection.ts#L15)

Configuration for the jsonThreatProtection policy.

## Extends

- [`PolicyConfig`](/api/index/interfaces/policyconfig/)

## Properties

### contentTypes?

> `optional` **contentTypes**: `string`[]

Defined in: [src/policies/traffic/json-threat-protection.ts:31](https://github.com/HomeGrower-club/stoma/blob/8b84574bca28149f020bbd910337511015437508/src/policies/traffic/json-threat-protection.ts#L31)

Content types to inspect.
Requests with other content types pass through without inspection.
Default: `["application/json"]`.

***

### maxArraySize?

> `optional` **maxArraySize**: `number`

Defined in: [src/policies/traffic/json-threat-protection.ts:23](https://github.com/HomeGrower-club/stoma/blob/8b84574bca28149f020bbd910337511015437508/src/policies/traffic/json-threat-protection.ts#L23)

Maximum array length. Default: `100`.

***

### maxBodySize?

> `optional` **maxBodySize**: `number`

Defined in: [src/policies/traffic/json-threat-protection.ts:25](https://github.com/HomeGrower-club/stoma/blob/8b84574bca28149f020bbd910337511015437508/src/policies/traffic/json-threat-protection.ts#L25)

Maximum raw body size in bytes. Checked BEFORE parsing. Default: `1048576` (1 MB).

***

### maxDepth?

> `optional` **maxDepth**: `number`

Defined in: [src/policies/traffic/json-threat-protection.ts:17](https://github.com/HomeGrower-club/stoma/blob/8b84574bca28149f020bbd910337511015437508/src/policies/traffic/json-threat-protection.ts#L17)

Maximum nesting depth. Default: `20`.

***

### maxKeys?

> `optional` **maxKeys**: `number`

Defined in: [src/policies/traffic/json-threat-protection.ts:19](https://github.com/HomeGrower-club/stoma/blob/8b84574bca28149f020bbd910337511015437508/src/policies/traffic/json-threat-protection.ts#L19)

Maximum number of keys per object. Default: `100`.

***

### maxStringLength?

> `optional` **maxStringLength**: `number`

Defined in: [src/policies/traffic/json-threat-protection.ts:21](https://github.com/HomeGrower-club/stoma/blob/8b84574bca28149f020bbd910337511015437508/src/policies/traffic/json-threat-protection.ts#L21)

Maximum string value length (also applies to object keys). Default: `10000`.

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

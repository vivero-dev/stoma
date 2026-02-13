---
editUrl: false
next: false
prev: false
title: "JsonThreatProtectionConfig"
---

Defined in: [packages/stoma/src/policies/traffic/json-threat-protection.ts:14](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/traffic/json-threat-protection.ts#L14)

Configuration for the jsonThreatProtection policy.

## Extends

- [`PolicyConfig`](/api/index/interfaces/policyconfig/)

## Properties

### contentTypes?

> `optional` **contentTypes**: `string`[]

Defined in: [packages/stoma/src/policies/traffic/json-threat-protection.ts:30](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/traffic/json-threat-protection.ts#L30)

Content types to inspect.
Requests with other content types pass through without inspection.
Default: `["application/json"]`.

***

### maxArraySize?

> `optional` **maxArraySize**: `number`

Defined in: [packages/stoma/src/policies/traffic/json-threat-protection.ts:22](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/traffic/json-threat-protection.ts#L22)

Maximum array length. Default: `100`.

***

### maxBodySize?

> `optional` **maxBodySize**: `number`

Defined in: [packages/stoma/src/policies/traffic/json-threat-protection.ts:24](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/traffic/json-threat-protection.ts#L24)

Maximum raw body size in bytes. Checked BEFORE parsing. Default: `1048576` (1 MB).

***

### maxDepth?

> `optional` **maxDepth**: `number`

Defined in: [packages/stoma/src/policies/traffic/json-threat-protection.ts:16](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/traffic/json-threat-protection.ts#L16)

Maximum nesting depth. Default: `20`.

***

### maxKeys?

> `optional` **maxKeys**: `number`

Defined in: [packages/stoma/src/policies/traffic/json-threat-protection.ts:18](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/traffic/json-threat-protection.ts#L18)

Maximum number of keys per object. Default: `100`.

***

### maxStringLength?

> `optional` **maxStringLength**: `number`

Defined in: [packages/stoma/src/policies/traffic/json-threat-protection.ts:20](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/traffic/json-threat-protection.ts#L20)

Maximum string value length (also applies to object keys). Default: `10000`.

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

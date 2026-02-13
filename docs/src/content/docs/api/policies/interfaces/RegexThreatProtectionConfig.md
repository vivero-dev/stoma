---
editUrl: false
next: false
prev: false
title: "RegexThreatProtectionConfig"
---

Defined in: [packages/stoma/src/policies/traffic/regex-threat-protection.ts:24](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/traffic/regex-threat-protection.ts#L24)

Configuration for the regexThreatProtection policy.

## Extends

- [`PolicyConfig`](/api/index/interfaces/policyconfig/)

## Properties

### contentTypes?

> `optional` **contentTypes**: `string`[]

Defined in: [packages/stoma/src/policies/traffic/regex-threat-protection.ts:30](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/traffic/regex-threat-protection.ts#L30)

Only inspect body for these content types. Default: `["application/json", "text/plain"]`.

***

### flags?

> `optional` **flags**: `string`

Defined in: [packages/stoma/src/policies/traffic/regex-threat-protection.ts:28](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/traffic/regex-threat-protection.ts#L28)

Regex flags applied to all patterns. Default: `"i"` (case-insensitive).

***

### maxBodyScanLength?

> `optional` **maxBodyScanLength**: `number`

Defined in: [packages/stoma/src/policies/traffic/regex-threat-protection.ts:32](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/traffic/regex-threat-protection.ts#L32)

Maximum body bytes to scan. Default: `65536` (64KB).

***

### patterns

> **patterns**: `RegexPatternRule`[]

Defined in: [packages/stoma/src/policies/traffic/regex-threat-protection.ts:26](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/traffic/regex-threat-protection.ts#L26)

Pattern rules to evaluate against request data.

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

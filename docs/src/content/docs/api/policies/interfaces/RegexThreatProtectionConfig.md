---
editUrl: false
next: false
prev: false
title: "RegexThreatProtectionConfig"
---

Defined in: [packages/gateway/src/policies/traffic/regex-threat-protection.ts:25](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/traffic/regex-threat-protection.ts#L25)

Configuration for the regexThreatProtection policy.

## Extends

- [`PolicyConfig`](/api/index/interfaces/policyconfig/)

## Properties

### contentTypes?

> `optional` **contentTypes**: `string`[]

Defined in: [packages/gateway/src/policies/traffic/regex-threat-protection.ts:31](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/traffic/regex-threat-protection.ts#L31)

Only inspect body for these content types. Default: `["application/json", "text/plain"]`.

***

### flags?

> `optional` **flags**: `string`

Defined in: [packages/gateway/src/policies/traffic/regex-threat-protection.ts:29](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/traffic/regex-threat-protection.ts#L29)

Regex flags applied to all patterns. Default: `"i"` (case-insensitive).

***

### maxBodyScanLength?

> `optional` **maxBodyScanLength**: `number`

Defined in: [packages/gateway/src/policies/traffic/regex-threat-protection.ts:33](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/traffic/regex-threat-protection.ts#L33)

Maximum body bytes to scan. Default: `65536` (64KB).

***

### patterns

> **patterns**: `RegexPatternRule`[]

Defined in: [packages/gateway/src/policies/traffic/regex-threat-protection.ts:27](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/traffic/regex-threat-protection.ts#L27)

Pattern rules to evaluate against request data.

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

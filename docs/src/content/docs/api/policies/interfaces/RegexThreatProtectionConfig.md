---
editUrl: false
next: false
prev: false
title: "RegexThreatProtectionConfig"
---

Defined in: src/policies/traffic/regex-threat-protection.ts:24

Configuration for the regexThreatProtection policy.

## Extends

- [`PolicyConfig`](/api/index/interfaces/policyconfig/)

## Properties

### contentTypes?

> `optional` **contentTypes**: `string`[]

Defined in: src/policies/traffic/regex-threat-protection.ts:30

Only inspect body for these content types. Default: `["application/json", "text/plain"]`.

***

### flags?

> `optional` **flags**: `string`

Defined in: src/policies/traffic/regex-threat-protection.ts:28

Regex flags applied to all patterns. Default: `"i"` (case-insensitive).

***

### maxBodyScanLength?

> `optional` **maxBodyScanLength**: `number`

Defined in: src/policies/traffic/regex-threat-protection.ts:32

Maximum body bytes to scan. Default: `65536` (64KB).

***

### patterns

> **patterns**: `RegexPatternRule`[]

Defined in: src/policies/traffic/regex-threat-protection.ts:26

Pattern rules to evaluate against request data.

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

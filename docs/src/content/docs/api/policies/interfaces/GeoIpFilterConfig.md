---
editUrl: false
next: false
prev: false
title: "GeoIpFilterConfig"
---

Defined in: src/policies/traffic/geo-ip-filter.ts:13

Configuration for the geoIpFilter policy.

## Extends

- [`PolicyConfig`](/api/index/interfaces/policyconfig/)

## Properties

### allow?

> `optional` **allow**: `string`[]

Defined in: src/policies/traffic/geo-ip-filter.ts:15

Country codes to allow (e.g. `["US", "CA", "GB"]`). Used in "allow" mode.

***

### countryHeader?

> `optional` **countryHeader**: `string`

Defined in: src/policies/traffic/geo-ip-filter.ts:21

Header name to read the country code from. Default: `"cf-ipcountry"`.

***

### deny?

> `optional` **deny**: `string`[]

Defined in: src/policies/traffic/geo-ip-filter.ts:17

Country codes to deny. Used in "deny" mode.

***

### mode?

> `optional` **mode**: `"allow"` \| `"deny"`

Defined in: src/policies/traffic/geo-ip-filter.ts:19

Filter mode. Default: `"deny"`.

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

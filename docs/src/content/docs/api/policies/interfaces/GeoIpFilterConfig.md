---
editUrl: false
next: false
prev: false
title: "GeoIpFilterConfig"
---

Defined in: [src/policies/traffic/geo-ip-filter.ts:14](https://github.com/HomeGrower-club/stoma/blob/512cbe1c3920cd195327e7c8f58f5202130d56a5/src/policies/traffic/geo-ip-filter.ts#L14)

Configuration for the geoIpFilter policy.

## Extends

- [`PolicyConfig`](/api/index/interfaces/policyconfig/)

## Properties

### allow?

> `optional` **allow**: `string`[]

Defined in: [src/policies/traffic/geo-ip-filter.ts:16](https://github.com/HomeGrower-club/stoma/blob/512cbe1c3920cd195327e7c8f58f5202130d56a5/src/policies/traffic/geo-ip-filter.ts#L16)

Country codes to allow (e.g. `["US", "CA", "GB"]`). Used in "allow" mode.

***

### countryHeader?

> `optional` **countryHeader**: `string`

Defined in: [src/policies/traffic/geo-ip-filter.ts:22](https://github.com/HomeGrower-club/stoma/blob/512cbe1c3920cd195327e7c8f58f5202130d56a5/src/policies/traffic/geo-ip-filter.ts#L22)

Header name to read the country code from. Default: `"cf-ipcountry"`.

***

### deny?

> `optional` **deny**: `string`[]

Defined in: [src/policies/traffic/geo-ip-filter.ts:18](https://github.com/HomeGrower-club/stoma/blob/512cbe1c3920cd195327e7c8f58f5202130d56a5/src/policies/traffic/geo-ip-filter.ts#L18)

Country codes to deny. Used in "deny" mode.

***

### mode?

> `optional` **mode**: `"allow"` \| `"deny"`

Defined in: [src/policies/traffic/geo-ip-filter.ts:20](https://github.com/HomeGrower-club/stoma/blob/512cbe1c3920cd195327e7c8f58f5202130d56a5/src/policies/traffic/geo-ip-filter.ts#L20)

Filter mode. Default: `"deny"`.

***

### skip()?

> `optional` **skip**: (`c`) => `boolean` \| `Promise`\<`boolean`\>

Defined in: [src/policies/types.ts:90](https://github.com/HomeGrower-club/stoma/blob/512cbe1c3920cd195327e7c8f58f5202130d56a5/src/policies/types.ts#L90)

Skip this policy when condition returns true

#### Parameters

##### c

`unknown`

#### Returns

`boolean` \| `Promise`\<`boolean`\>

#### Inherited from

[`PolicyConfig`](/api/index/interfaces/policyconfig/).[`skip`](/api/index/interfaces/policyconfig/#skip)

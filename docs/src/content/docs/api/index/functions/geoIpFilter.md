---
editUrl: false
next: false
prev: false
title: "geoIpFilter"
---

> **geoIpFilter**(`config?`): [`Policy`](/api/index/interfaces/policy/)

Defined in: [packages/stoma/src/policies/traffic/geo-ip-filter.ts:43](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/policies/traffic/geo-ip-filter.ts#L43)

Block or allow requests based on geographic country code.

Reads the country from the configured header (default `cf-ipcountry`,
set by Cloudflare). Supports allowlist and denylist modes. Country
sets are pre-computed once at construction time for efficiency.

## Parameters

### config?

[`GeoIpFilterConfig`](/api/policies/interfaces/geoipfilterconfig/)

Country filter rules and mode selection.

## Returns

[`Policy`](/api/index/interfaces/policy/)

A policy at priority 1 (IP_FILTER).

## Example

```ts
// Allow only US, Canada, and UK
geoIpFilter({ mode: "allow", allow: ["US", "CA", "GB"] });

// Block specific countries
geoIpFilter({ deny: ["CN", "RU"] });
```

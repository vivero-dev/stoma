---
editUrl: false
next: false
prev: false
title: "ipFilter"
---

> **ipFilter**(`config`): [`Policy`](/api/index/interfaces/policy/)

Defined in: [src/policies/traffic/ip-filter.ts:48](https://github.com/HomeGrower-club/stoma/blob/7a6bc5c6595d42b4d2edc385006b88a77065ce23/src/policies/traffic/ip-filter.ts#L48)

Block or allow requests based on client IP address or CIDR range.

Supports both allowlist and denylist modes. Client IP is extracted from
`CF-Connecting-IP` (Cloudflare) or `X-Forwarded-For`. Accepts individual
IPs (`192.168.1.1`) and CIDR notation (`10.0.0.0/8`).

## Parameters

### config

[`IpFilterConfig`](/api/policies/interfaces/ipfilterconfig/)

IP filter rules and mode selection.

## Returns

[`Policy`](/api/index/interfaces/policy/)

A [Policy](/api/index/interfaces/policy/) at priority 1 (runs before everything else).

## Example

```ts
// Allow only internal IPs
ipFilter({ mode: "allow", allow: ["10.0.0.0/8", "172.16.0.0/12"] });

// Block known bad actors
ipFilter({ deny: ["203.0.113.0/24", "198.51.100.42"] });
```

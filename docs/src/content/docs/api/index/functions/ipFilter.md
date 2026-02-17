---
editUrl: false
next: false
prev: false
title: "ipFilter"
---

> **ipFilter**(`config`): [`Policy`](/api/index/interfaces/policy/)

Defined in: [packages/gateway/src/policies/traffic/ip-filter.ts:48](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/traffic/ip-filter.ts#L48)

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

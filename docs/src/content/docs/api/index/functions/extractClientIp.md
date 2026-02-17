---
editUrl: false
next: false
prev: false
title: "extractClientIp"
---

> **extractClientIp**(`headers`, `options?`): `string`

Defined in: [packages/gateway/src/utils/ip.ts:59](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/utils/ip.ts#L59)

Extract the client IP address from request headers.

Iterates through `ipHeaders` in order. For comma-separated headers like
`X-Forwarded-For`, the behavior depends on options:
- By default, returns the first (leftmost) value
- With `useRightmostForwardedIp: true`, returns the last (rightmost) value
- With `trustedProxies`, validates the leftmost IP against trusted ranges

## Parameters

### headers

An object with a `.get(name)` method (e.g. `Headers`, Hono `c.req`).

#### get

### options?

`ExtractClientIpOptions` = `{}`

Configuration options for IP extraction.

## Returns

`string`

The extracted IP address, or `"unknown"` if none found.

## Security

The `X-Forwarded-For` header is trivially spoofable by clients
outside of trusted proxy infrastructure. An attacker can set arbitrary IP
values to bypass IP-based allowlists, rate limits, or geo-restrictions.

To mitigate:
1. Use `cf-connecting-ip` when behind Cloudflare (not spoofable by clients)
2. Configure `trustedProxies` to validate X-Forwarded-For IPs
3. Use `useRightmostForwardedIp: true` when behind a trusted proxy

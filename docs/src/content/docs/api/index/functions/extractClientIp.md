---
editUrl: false
next: false
prev: false
title: "extractClientIp"
---

> **extractClientIp**(`headers`, `ipHeaders?`): `string`

Defined in: [src/utils/ip.ts:32](https://github.com/HomeGrower-club/stoma/blob/512cbe1c3920cd195327e7c8f58f5202130d56a5/src/utils/ip.ts#L32)

Extract the client IP address from request headers.

Iterates through `ipHeaders` in order. For comma-separated headers like
`X-Forwarded-For`, only the first (leftmost) value is returned.

## Parameters

### headers

An object with a `.get(name)` method (e.g. `Headers`, Hono `c.req`).

#### get

### ipHeaders?

readonly `string`[] = `DEFAULT_IP_HEADERS`

Ordered list of headers to inspect. Default: [DEFAULT\_IP\_HEADERS](/api/index/variables/default_ip_headers/).

## Returns

`string`

The extracted IP address, or `"unknown"` if none found.

## Security

The `X-Forwarded-For` header is trivially spoofable by clients
outside of trusted proxy infrastructure. An attacker can set arbitrary IP
values to bypass IP-based allowlists, rate limits, or geo-restrictions.
When deploying behind a load balancer or CDN, configure `ipHeaders` to
match your proxy's trusted header (e.g. `cf-connecting-ip` for Cloudflare,
`x-real-ip` for nginx) and ensure the proxy strips or overwrites any
client-supplied forwarding headers.

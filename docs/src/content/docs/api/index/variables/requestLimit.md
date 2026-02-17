---
editUrl: false
next: false
prev: false
title: "requestLimit"
---

> `const` **requestLimit**: (`config`) => [`Policy`](/api/index/interfaces/policy/)

Defined in: [packages/gateway/src/policies/traffic/request-limit.ts:31](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/traffic/request-limit.ts#L31)

Reject requests whose declared Content-Length exceeds `maxBytes`.

This policy checks only the `Content-Length` header. If the header is
absent or invalid, the request passes through. Notably, requests using
chunked transfer encoding (`Transfer-Encoding: chunked`) do not include
a `Content-Length` header and will bypass this check entirely. For strict
body size enforcement, combine this policy with a body-reading policy
that enforces limits on the actual stream length.

## Parameters

### config

[`RequestLimitConfig`](/api/policies/interfaces/requestlimitconfig/)

Maximum byte limit and optional custom message.

## Returns

[`Policy`](/api/index/interfaces/policy/)

A [Policy](/api/index/interfaces/policy/) at priority 5 (EARLY).

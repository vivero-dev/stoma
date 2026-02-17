---
editUrl: false
next: false
prev: false
title: "proxy"
---

> **proxy**(`config?`): [`Policy`](/api/index/interfaces/policy/)

Defined in: [packages/gateway/src/policies/proxy.ts:57](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/proxy.ts#L57)

Apply additional header manipulation and timeout control to the upstream call.

Use this when you need per-route header injection, header stripping, or
a custom timeout that wraps the upstream dispatch. The core proxy
forwarding (URL, Service Binding, Handler) is handled by the gateway's
upstream handler - this policy layers on top of it.

`preserveHost` applies to URL upstreams, instructing the upstream handler
not to rewrite the Host header to the target host.

Handles Cloudflare Workers' immutable `Request.headers` by cloning the
request when header modifications are needed.

## Parameters

### config?

`ProxyPolicyConfig`

Headers to add/strip, timeout, and host preservation. All fields optional.

## Returns

[`Policy`](/api/index/interfaces/policy/)

A [Policy](/api/index/interfaces/policy/) at priority 95 (runs late, just before the upstream call).

## Example

```ts
import { proxy } from "@homegrower-club/stoma/policies";

// Add an internal auth header and strip cookies for the upstream
proxy({
  headers: { "x-internal-key": "secret-123" },
  stripHeaders: ["cookie", "x-forwarded-for"],
  timeout: 10_000,
});

// Preserve the original Host header for virtual-host routing
proxy({ preserveHost: true });
```

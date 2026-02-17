---
editUrl: false
next: false
prev: false
title: "httpCallout"
---

> `const` **httpCallout**: (`config`) => [`Policy`](/api/index/interfaces/policy/)

Defined in: [packages/gateway/src/policies/traffic/http-callout.ts:66](https://github.com/HomeGrower-club/stoma/blob/277d1a2d27d98b444f074e4ecf0ae8095ef6f133/packages/gateway/src/policies/traffic/http-callout.ts#L66)

Make an external HTTP call mid-pipeline.

Resolves URL, headers, and body (static or dynamic), makes the fetch,
and calls the `onResponse` callback to process the result. Errors are
handled via `onError` or default to a 502 GatewayError.

## Parameters

### config

[`HttpCalloutConfig`](/api/policies/interfaces/httpcalloutconfig/)

Callout target, method, headers, body, and response handler.

## Returns

[`Policy`](/api/index/interfaces/policy/)

A [Policy](/api/index/interfaces/policy/) at priority 50 (REQUEST_TRANSFORM).

## Security

When the `url` parameter is a dynamic function that derives
the callout target from request data (headers, path, query, or body),
this policy is vulnerable to Server-Side Request Forgery (SSRF). An
attacker could manipulate request data to make the worker issue requests
to internal services, metadata endpoints (e.g. cloud provider instance
metadata), or other unintended targets. Hardcode callout URLs whenever
possible. If dynamic URLs are required, validate them against an
explicit allowlist of permitted hosts and schemes.

## Example

```ts
httpCallout({
  url: "https://auth.example.com/validate",
  method: "POST",
  headers: { authorization: (c) => c.req.header("authorization") ?? "" },
  body: (c) => ({ path: c.req.path }),
  onResponse: async (res, c) => {
    const data = await res.json();
    c.set("userId", data.userId);
  },
});
```

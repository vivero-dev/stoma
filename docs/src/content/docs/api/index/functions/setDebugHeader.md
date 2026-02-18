---
editUrl: false
next: false
prev: false
title: "setDebugHeader"
---

> **setDebugHeader**(`c`, `name`, `value`): `void`

Defined in: [packages/gateway/src/policies/sdk/helpers.ts:148](https://github.com/HomeGrower-club/stoma/blob/b366835e3781c3a030f80027e784272dddf630da/packages/gateway/src/policies/sdk/helpers.ts#L148)

Set a debug header value for client-requested debug output.

Policies call this to contribute debug data. The value is only stored
if the client requested it via the `x-stoma-debug` request header AND
the gateway has debug headers enabled. When neither condition is met,
this is a no-op (single Map lookup).

## Parameters

### c

`Context`

Hono request context.

### name

`string`

Header name (e.g. `"x-stoma-cache-key"`).

### value

Header value. Numbers and booleans are stringified.

`string` | `number` | `boolean`

## Returns

`void`

## Example

```ts
setDebugHeader(c, "x-stoma-cache-key", key);
setDebugHeader(c, "x-stoma-cache-ttl", resolved.ttlSeconds);
```

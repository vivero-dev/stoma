---
editUrl: false
next: false
prev: false
title: "GatewayConfig"
---

Defined in: [packages/stoma/src/core/types.ts:17](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/core/types.ts#L17)

Top-level gateway configuration

## Properties

### adapter?

> `optional` **adapter**: [`GatewayAdapter`](/api/index/interfaces/gatewayadapter/)

Defined in: [packages/stoma/src/core/types.ts:65](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/core/types.ts#L65)

Runtime adapter providing store implementations and runtime-specific capabilities
(e.g. `waitUntil`, `dispatchBinding`). Created via adapter factories like
`cloudflareAdapter()`, `memoryAdapter()`, etc.

***

### admin?

> `optional` **admin**: `boolean` \| [`AdminConfig`](/api/index/interfaces/adminconfig/)

Defined in: [packages/stoma/src/core/types.ts:73](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/core/types.ts#L73)

Admin introspection API. Exposes `___gateway/*` routes for operational visibility.

- `true` — enable with defaults (no auth)
- `AdminConfig` object — full customization
- `false` / `undefined` — disabled (default)

***

### basePath?

> `optional` **basePath**: `string`

Defined in: [packages/stoma/src/core/types.ts:21](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/core/types.ts#L21)

Base path prefix for all routes (e.g. "/api")

***

### debug?

> `optional` **debug**: `string` \| `boolean`

Defined in: [packages/stoma/src/core/types.ts:48](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/core/types.ts#L48)

Enable internal debug logging for gateway operators.

- `true` — log all namespaces
- `false` / `undefined` — disabled (default, zero overhead)
- `string` — comma-separated glob patterns to filter namespaces

Namespaces: `stoma:gateway`, `stoma:pipeline`, `stoma:upstream`,
`stoma:policy:*` (e.g. `stoma:policy:cache`, `stoma:policy:jwt-auth`)

Output goes to `console.debug()` which is captured by `wrangler tail`
and Cloudflare Workers Logs.

#### Example

```ts
createGateway({ debug: true, ... })                         // everything
createGateway({ debug: "stoma:gateway,stoma:upstream", ... }) // core only
createGateway({ debug: "stoma:policy:*", ... })              // policies only
```

***

### debugHeaders?

> `optional` **debugHeaders**: `boolean` \| [`DebugHeadersConfig`](/api/index/interfaces/debugheadersconfig/)

Defined in: [packages/stoma/src/core/types.ts:97](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/core/types.ts#L97)

Enable client-requested debug headers.

When enabled, clients can send an `x-stoma-debug` request header listing
the debug values they want returned as response headers. Policies contribute
debug data via [setDebugHeader](/api/index/functions/setdebugheader/) from the SDK — only requested values
are included in the response.

- `true` — enable with defaults
- `DebugHeadersConfig` — full customization (request header name, allowlist)
- `false` / `undefined` — disabled (default, zero overhead)

#### Example

```
// Client request:
GET /api/users
x-stoma-debug: x-stoma-cache-key, x-stoma-cache-ttl

// Response includes:
x-stoma-cache-key: GET:http://example.com/api/users
x-stoma-cache-ttl: 300
```

***

### defaultErrorMessage?

> `optional` **defaultErrorMessage**: `string`

Defined in: [packages/stoma/src/core/types.ts:57](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/core/types.ts#L57)

Default error message for unexpected (non-GatewayError) errors. Default: `"An unexpected error occurred"`.

***

### defaultMethods?

> `optional` **defaultMethods**: [`HttpMethod`](/api/index/type-aliases/httpmethod/)[]

Defined in: [packages/stoma/src/core/types.ts:55](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/core/types.ts#L55)

Default HTTP methods for routes that don't specify `methods`.
Default: `["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]`.

***

### defaultPolicyPriority?

> `optional` **defaultPolicyPriority**: `number`

Defined in: [packages/stoma/src/core/types.ts:59](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/core/types.ts#L59)

Default priority for policies that don't specify one. Default: `100`.

***

### name?

> `optional` **name**: `string`

Defined in: [packages/stoma/src/core/types.ts:19](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/core/types.ts#L19)

Gateway name, used in logs and metrics

***

### onError()?

> `optional` **onError**: (`error`, `c`) => `Response` \| `Promise`\<`Response`\>

Defined in: [packages/stoma/src/core/types.ts:27](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/core/types.ts#L27)

Global error handler

#### Parameters

##### error

`Error`

##### c

`unknown`

#### Returns

`Response` \| `Promise`\<`Response`\>

***

### policies?

> `optional` **policies**: [`Policy`](/api/index/interfaces/policy/)[]

Defined in: [packages/stoma/src/core/types.ts:25](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/core/types.ts#L25)

Global policies applied to all routes

***

### requestIdHeader?

> `optional` **requestIdHeader**: `string`

Defined in: [packages/stoma/src/core/types.ts:50](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/core/types.ts#L50)

Response header name for the request ID. Default: `"x-request-id"`.

***

### routes

> **routes**: [`RouteConfig`](/api/index/interfaces/routeconfig/)[]

Defined in: [packages/stoma/src/core/types.ts:23](https://github.com/HomeGrower-club/stoma/blob/bb4d04ff85c8c133b10c323d92695cf11b944552/src/core/types.ts#L23)

Route definitions
